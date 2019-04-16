import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { sendAmount, getTMBalance, addTransaction, generateWireguardKeys } from '../Actions/tendermint.action';
import { payVPNSession, getSessionInfo } from './../Actions/tmvpn.action';
import { payVPNTM, setVpnStatus, setActiveVpn, isConnectionEstablishing } from '../Actions/vpnlist.action';
import { connectVPN, checkVPNDependencies } from './../Actions/connectOVPN';
import { connectWireguard } from './../Actions/connectWG';
import CustomTextField from './customTextfield';
import { Button, Snackbar } from '@material-ui/core';
import { createAccountStyle } from '../Assets/createtm.styles';
import { accountStyles } from '../Assets/tmaccount.styles';
import { withStyles } from '@material-ui/core/styles';
import { compose } from 'recompose';
import OpenvpnAlert from './OpenvpnAlert';
import { setCurrentTab } from '../Actions/sidebar.action';
import lang from '../Constants/language';
import SimpleMenuTM from './SharedComponents/SimpleMenuTM';
import CustomTooltips from './SharedComponents/customTooltip';


const electron = window.require('electron');
const remote = electron.remote;
let tmCurrentBalance = 0;


const Customstyles = theme => ({
    button: {
        margin: theme.spacing.unit,
    },
    enableButton: {
        "&:hover": {
            backgroundColor: '#2f3245'
        },
        backgroundColor: '#2f3245',
        // height: '45px',
    },
    disableButton: {
        backgroundColor: '#BDBDBD',
        // height: '45px',
    }
});

class TMTransfer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            toAddress: '',
            keyPassword: '',
            amount: '',
            openSnack: false,
            snackMessage: '',
            isTextDisabled: false,
            sending: false,
            openvpnAlert: false,
            token: 'SENT',
            equalAmountOfType: 'GB',
            nodePrice: 0,
            amountToLock: 100,  // Amount of Tokens to be locked in a session
            country: '',     // node country
            totalData: '1',   // total data that user get for amount of SENT he spends
            gotVPN: false
        }
    }

    componentDidMount = () => {
        if (this.props.vpnPayment.isPayment && !this.state.gotVPN) {
            this.setState({
                toAddress: this.props.vpnPayment.data.vpn_addr,
                nodePrice: this.props.vpnPayment.data.price_per_GB,
                country: this.props.vpnPayment.data.country,
            })
            if (!this.state.gotVPN) {
                this.setState({
                    amount: this.props.vpnPayment.data.price_per_GB, isTextDisabled: true,
                    amountToLock: this.props.vpnPayment.data.price_per_GB,
                    totalData: 1,
                    equalAmountOfType: 'GB',
                    token: 'SENT',
                    gotVPN: true
                })
            }
        }
        else {
            this.setState({ isTextDisabled: false, gotVPN: false })
        }
    }
    componentWillReceiveProps = (nextProps) => {
        if (nextProps.vpnPayment.isPayment) {
            this.setState({
                toAddress: nextProps.vpnPayment.data.vpn_addr,
                nodePrice: nextProps.vpnPayment.data.price_per_GB,
                country: nextProps.vpnPayment.data.country,
            });
            if (!this.state.gotVPN) {
                this.setState({
                    amount: nextProps.vpnPayment.data.price_per_GB, isTextDisabled: true,
                    amountToLock: nextProps.vpnPayment.data.price_per_GB,
                    totalData: 1,
                    equalAmountOfType: 'GB',
                    token: 'SENT',
                    gotVPN: true
                })
            }
        }
        else {
            this.setState({ isTextDisabled: false, gotVPN: false })
        }
    }

    handleDialogClose = () => {
        this.setState({ openvpnAlert: false });
    }

    sendTransaction = () => {
        this.setState({ sending: true });
        let transAmount = this.props.vpnPayment.isPayment ? this.state.amountToLock : this.state.amount;
        if (parseFloat(tmCurrentBalance) < parseFloat(transAmount)) {
            this.setState({
                sending: false, openSnack: true, snackMessage: lang[this.props.language].LessBalance
            })
        }
        else if (this.props.vpnPayment.isPayment) {
            checkVPNDependencies(remote.process.platform, (otherErr, winErr) => {
                if (otherErr) {
                    let regError = otherErr.message.replace(/\s/g, "");
                    this.setState({
                        sending: false, openSnack: true,
                        snackMessage: lang[this.props.language][regError] ?
                            lang[this.props.language][regError] : otherErr.message
                    });
                }
                else if (winErr) {
                    this.setState({ sending: false, openvpnAlert: true })
                }
                else {
                    let data = {
                        "amount": Math.ceil(parseFloat(this.state.amountToLock) * (10 ** 8)).toString() + 'sut',
                        "name": this.props.account.name,
                        "password": this.state.keyPassword,
                        "gas": 200000,
                        "vaddress": this.state.toAddress,
                        "sig_name": Math.random().toString(36).substring(4),
                        "sig_password": Math.random().toString(36).substring(2)
                    }
                    this.props.payVPNSession(data).then(response => {
                        if (response.error) {
                            console.log("Pay VPN Error...", response);
                            if (response.error.data === 'Ciphertext decryption failed')
                                this.setState({ sending: false, openSnack: true, snackMessage: lang[this.props.language].IncorrectPwd });
                            else
                                this.setState({ sending: false, openSnack: true, snackMessage: lang[this.props.language].TxFailed });
                        }
                        else {
                            localStorage.setItem('SIGNAME', data.sig_name)
                            localStorage.setItem('SIGPWD', data.sig_password)
                            addTransaction({
                                fromAccountAddress: this.props.account.address,
                                toAccountAddress: 'VPN_PAYMENT',
                                txHash: response.payload.hash
                            })
                            this.props.getSessionInfo(response.payload.hash).then(sesRes => {
                                if (sesRes.error) {
                                    console.log("Ses..Error", sesRes.error);
                                    this.setState({
                                        sending: false, openSnack: true,
                                        snackMessage: lang[this.props.language].WentWrong
                                    });
                                }
                                else {
                                    let data = sesRes.payload;
                                    let vpn_data = this.props.vpnPayment.data;
                                    let session_data = sesRes.payload;
                                    let availableData = 'maxUsage' in session_data ? session_data.maxUsage.download : 0;
                                    localStorage.setItem('availableData', availableData);
                                    if (this.props.vpnType === 'wireguard') {
                                        generateWireguardKeys(); // Generate WG Keys
                                        connectWireguard(this.props.account.address, vpn_data, remote.process.platform, session_data, (err, platformErr, res) => {
                                            // console.log("Wireguard Response...", err, platformErr, res);
                                            if (err) {
                                                let regError = err.message.replace(/\s/g, "");
                                                this.setState({
                                                    sending: false, openSnack: true,
                                                    snackMessage: lang[this.props.language][regError] ?
                                                        lang[this.props.language][regError] : err.message
                                                });
                                            }
                                            else {
                                                this.props.isConnectionEstablishing(true)
                                                this.props.setActiveVpn(vpn_data);
                                                localStorage.setItem('lockedAmount', parseFloat(transAmount));
                                                //as there is a delay for establishing WG connection in Server we have to wait here
                                                setTimeout(() => {
                                                    this.props.setVpnStatus(true);
                                                    this.props.isConnectionEstablishing(false)

                                                }, 10000);
                                                this.setState({
                                                    sending: false, toAddress: '', keyPassword: '', amount: '',
                                                    openSnack: true, snackMessage: lang[this.props.language].VpnConnected,
                                                    gotVPN: false
                                                });
                                                this.props.setCurrentTab('receive');
                                            }
                                        })
                                    }
                                    else {
                                        connectVPN(this.props.account.address, vpn_data, remote.process.platform, session_data, (err, platformErr, res) => {
                                            if (err) {
                                                // console.log("Connect VPN Err...", err, platformErr, res);
                                                let regError = err.message.replace(/\s/g, "");
                                                this.setState({
                                                    sending: false, openSnack: true,
                                                    snackMessage: lang[this.props.language][regError] ?
                                                        lang[this.props.language][regError] : err.message
                                                });
                                            }
                                            else {

                                                this.props.setActiveVpn(vpn_data);
                                                localStorage.setItem('lockedAmount', parseFloat(transAmount));
                                                this.props.setVpnStatus(true);
                                                this.setState({
                                                    sending: false, toAddress: '', keyPassword: '', amount: '',
                                                    openSnack: true, snackMessage: lang[this.props.language].VpnConnected,
                                                    gotVPN: false
                                                });
                                                this.props.setCurrentTab('receive');
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    })
                }
            })
        }
        else {
            let data = {
                "amount": Math.ceil(parseFloat(this.state.amount) * (10 ** 8)).toString() + 'sut',
                "name": this.props.account.name,
                "password": this.state.keyPassword,
                "gas": 200000,
                "to": this.state.toAddress
            }
            this.props.sendAmount(data, this.state.toAddress).then(response => {
                if (response.error) {
                    if (response.error.data === 'Ciphertext decryption failed')
                        this.setState({ sending: false, openSnack: true, snackMessage: lang[this.props.language].IncorrectPwd });
                    else
                        this.setState({ sending: false, openSnack: true, snackMessage: lang[this.props.language].TxFailed });
                }
                else {
                    addTransaction({
                        fromAccountAddress: this.props.account.address,
                        toAccountAddress: this.state.toAddress,
                        txHash: response.payload.hash
                    })
                    this.setState({
                        sending: false, openSnack: true, snackMessage: lang[this.props.language].TxSuccess,
                        toAddress: '', keyPassword: '', amount: '',
                    });
                    setTimeout(() => {
                        this.props.setCurrentTab('history');
                    }, 3000);
                  
                    setTimeout(() => {
                        this.props.getTMBalance(this.props.account.address);
                    }, 7000);
                }
            });
        }
    }

    setToken = (token) => {
        let value;
        this.setState({ token })
        if (token === 'SENT') {
            this.setState({ equalAmountOfType: 'GB', amount: '0', amountToLock: '0', totalData: '0' })
        }
        else {
            this.setState({ equalAmountOfType: 'SENT', amount: '0', amountToLock: '0', totalData: '0' })

        }
    };

    setTotalValue = (e) => {
        this.setState({ amount: e.target.value })
        let calculate;
        let inputValue = e.target.value;

        if (this.state.token === 'SENT') {
            calculate = (inputValue / this.state.nodePrice).toFixed(2);
            this.setState({
                amountToLock: inputValue,
                totalData: calculate
            })
        }
        else {
            calculate = (inputValue * this.state.nodePrice).toFixed(2);
            this.setState({
                amountToLock: calculate,
                totalData: inputValue
            })

        }

    }

    handleClose = (event, reason) => {
        this.setState({ openSnack: false });
    };

    render() {
        let { classes, language, balance } = this.props;
        let balValue = (typeof balance === 'object' && balance !== null) ? ('value' in balance ? balance.value : {}) : {};
        let coins = (typeof balValue === 'object' && balValue !== null) ? ('coins' in balValue ? balValue.coins : []) : [];
        let token = coins && coins.length !== 0 ? coins.find(o => o.denom === 'sut') : {};
        tmCurrentBalance = token && 'denom' in token ? (parseInt(token.amount) / (10 ** 8)).toFixed(8) : 0;
        let isDisabled = (this.state.sending || this.state.keyPassword === '' ||
            this.state.toAddress === '' || this.state.amount === '') ? true : false
        return (
            <div style={accountStyles.sendFormStyle}>
                <div style={createAccountStyle.secondDivStyle}
                    onKeyPress={(ev) => { if (ev.key === 'Enter' && !isDisabled) this.sendTransaction() }}>
                    <div style={createAccountStyle.tooltipDiv}>
                        <p style={createAccountStyle.headingStyle}>{this.props.vpnPayment.isPayment ? lang[language].AddressToLockTokens : lang[language].AddressToSend}</p>
                        <span style={createAccountStyle.questionMarkDiv}>
                            <CustomTooltips title={lang[language].TMAddressToSendHelp} />
                        </span>
                    </div>
                    <CustomTextField type={'text'} placeholder={`${lang[language].Example}: cosmosaccaddr1ycyynt2hht7gmcqudd2jf08d22k5ekllsqgs3u`}
                        disabled={this.state.isTextDisabled}
                        multi={false}
                        value={this.state.toAddress} onChange={(e) => { this.setState({ toAddress: e.target.value }) }}
                    />
                    {
                        this.props.vpnPayment.isPayment ?
                            <div>
                                <div style={createAccountStyle.tooltipDiv}>
                                    <p style={createAccountStyle.headingStyle}>{this.state.token === 'SENT' ? lang[language].TokensToLock : lang[language].TotalDataRequired} </p>
                                    <span style={createAccountStyle.questionMarkDiv}>
                                        <CustomTooltips title={this.state.token === 'SENT' ? lang[language].TMTokensToLockHelp : lang[language].TMTotalDataRequiredHelp} />
                                    </span>
                                </div>
                                <div div style={{ display: 'inline-flex' }}>
                                    <div style={{ width: '435px', }}>
                                        <CustomTextField type={'number'} placeholder={''}
                                            //  disabled={this.state.isTextDisabled}
                                            value={this.state.amount}
                                            multi={false}
                                            onChange={(e) => {
                                                this.setTotalValue(e)
                                            }}
                                        />
                                    </div>
                                    <div style={{ width: '130px', marginTop: 15 }}>
                                        <SimpleMenuTM token={this.setToken} isSend={true}
                                        />
                                    </div>
                                </div>
                                <div style={createAccountStyle.userNote}>
                                    {this.state.token === 'SENT' ?
                                        <span style={createAccountStyle.equalAmountStyle}>
                                            {lang[language].InExchange} <span style={createAccountStyle.datavalue}> {this.state.totalData} GB </span>
                                            {lang[language].DataBy} <span style={createAccountStyle.datavalue}>{this.state.country}</span></span>
                                        :
                                        <span style={createAccountStyle.equalAmountStyle}>
                                            {/* {lang[language].GetData}
                                            <span style={createAccountStyle.datavalue}> {this.state.totalData} GB </span>  */}
                                            {lang[language].FromUser} <span style={createAccountStyle.datavalue}>{this.state.country}</span>, {lang[language].DataInExchange} <span style={createAccountStyle.datavalue}> {this.state.amountToLock} TSENT</span></span>
                                    }
                                </div>
                            </div>

                            :
                            <div>
                                <div style={createAccountStyle.tooltipDiv}>
                                    <p style={createAccountStyle.headingStyle}>{lang[language].AmountTo}</p>
                                    <span style={createAccountStyle.questionMarkDiv}>
                                        <CustomTooltips title={lang[language].TMAmountToHelp} />
                                    </span>
                                </div>
                                <CustomTextField type={'number'} placeholder={''} disabled={this.state.isTextDisabled}
                                    value={this.state.amount}
                                    multi={false}
                                    onChange={(e) => {
                                        if (e.target.value.match("^[0-9]([0-9]+)?([0-9]*\.[0-9]+)?$"))
                                            this.setState({ amount: e.target.value })
                                        else
                                            this.setState({ amount: '' })
                                    }}
                                />
                            </div>
                    }
                    <div style={createAccountStyle.tooltipDiv}>
                        <p style={createAccountStyle.headingStyle}>{lang[language].Password}</p>
                        <span style={createAccountStyle.questionMarkDiv}>
                            <CustomTooltips title={lang[language].TMPasswordHelp} />
                        </span>
                    </div>
                    <CustomTextField type={'password'} placeholder={''} disabled={false}
                        multi={false}
                        value={this.state.keyPassword} onChange={(e) => { this.setState({ keyPassword: e.target.value }) }}
                    />
                    <Button
                        variant="outlined"
                        disabled={isDisabled}
                        onClick={() => { this.sendTransaction() }}
                        // className={classes.button} 
                        className={!isDisabled ? classes.enableButton : classes.disableButton}
                        style={createAccountStyle.buttonStyle}>
                        {this.state.sending ? lang[language].Sending : lang[language].Send}
                    </Button>
                </div>

                <Snackbar
                    open={this.state.openSnack}
                    autoHideDuration={4000}
                    onClose={this.handleClose}
                    message={this.state.snackMessage}
                />
                <OpenvpnAlert
                    open={this.state.openvpnAlert}
                    onClose={this.handleDialogClose}
                />
            </div>
        )
    }
}

TMTransfer.propTypes = {
    classes: PropTypes.object.isRequired,
};


function mapStateToProps(state) {
    return {
        language: state.setLanguage,
        isTest: state.setTestNet,
        account: state.setTMAccount,
        vpnPayment: state.payVPNTM,
        balance: state.tmBalance,
        wireguardData: state.generateWireguardKeys,
        vpnType: state.vpnType,

    }
}

function mapDispatchToActions(dispatch) {
    return bindActionCreators({
        sendAmount,
        getTMBalance,
        payVPNTM,
        payVPNSession,
        getSessionInfo,
        setVpnStatus,
        setActiveVpn,
        setCurrentTab,
        isConnectionEstablishing,
    }, dispatch)
}

export default compose(withStyles(Customstyles), connect(mapStateToProps, mapDispatchToActions))(TMTransfer);
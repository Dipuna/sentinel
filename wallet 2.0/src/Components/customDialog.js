import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { DialogContent, DialogContentText, DialogActions, Snackbar } from '@material-ui/core';
import OpenvpnAlert from './OpenvpnAlert';
import { Row, Col } from 'react-flexbox-grid';
import {
    withStyles, Button, List,
    DialogTitle, Dialog,
} from '@material-ui/core';
import green from '@material-ui/core/colors/green';
import CheckIcon from '@material-ui/icons/Check';
import ConnectIcon from '@material-ui/icons/SwapVerticalCircle';
import blue from '@material-ui/core/colors/blue';
import { connectVPN } from '../Actions/connectOVPN'
import { connectSocks } from '../Actions/connectSOCKS';
import { setVpnStatus, payVPNTM, setActiveVpn, setVpnType } from '../Actions/vpnlist.action';
import { setCurrentTab } from '../Actions/sidebar.action';
import { initPaymentAction } from '../Actions/initPayment';
import { getVPNUsageData } from "../Utils/utils";
import lang from '../Constants/language';
import { calculateUsage, socksVpnUsage } from '../Actions/calculateUsage';
import { createAccountStyle } from '../Assets/createtm.styles';
import '../Assets/footerStyle.css';
import { Tooltip } from '@material-ui/core';

const electron = window.require('electron');
const { exec } = window.require('child_process');
const remote = electron.remote;
let UsageInterval = null;
let type = '';
let session = null;
const styles = theme => ({
    avatar: {
        backgroundColor: blue[100],
        color: blue[600],
    },
    container: {
        width: 400,
        padding: '25px 35px',
        overflowX: 'hidden',

    },
    container2: {
        width: 400,
        padding: '0 35px 0 33px',
        overflowX: 'hidden',

    },
    dialogLabel: {
        fontSize: 14,
        fontFamily: 'Montserrat',
        fontWeight: 'bold',
        textAlign: 'right',

    },
    dialogValue: {
        fontSize: 13,
        fontFamily: 'Montserrat',
    },
    fabProgress: {
        margin: theme.spacing.unit * 2,
        height: '1em',
        width: '1em'
    },
    root: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    buttonSuccess: {
        backgroundColor: green[500],
        '&:hover': {
            backgroundColor: green[700],
        },
    },
    listRoot: {
        display: 'flex',
        backgroundColor: theme.palette.background.paper,
        justifyContent: 'center',
    },
    wrapper: {
        margin: theme.spacing.unit,
        position: 'relative',
    },
    button: {
        margin: theme.spacing.unit,
        outline: 'none',
        marginBottom: 0
    },
    extendedIcon: {
        marginRight: theme.spacing.unit,
    },

    enableButton: {
        "&:hover": {
            backgroundColor: '#2f3245'
        },
        backgroundColor: '#2f3245',
    },
    disableButton: {
        backgroundColor: '#BDBDBD',
    }

});



class SimpleDialog extends React.Component {

    state = {
        pendingInitPayment: null,
    };

    handleClose = () => {
        this.props.onClose();

    };

    render() {
        const { classes, language, ...other } = this.props;
        return (
            <Dialog
                open={this.props.open}
                onClose={this.handleClose}
                aria-labelledby="simple-dialog-title"
                {...other} className={{ classes: { paper: classes.container } }}
            >
                <DialogTitle className={classes.container} id="simple-dialog-title">{lang[language].ConnectTodVPN}</DialogTitle>
                <div className={classes.container2} >


                    <Row>
                        <Col xs={5}>  <label style={{ fontSize: 14, fontFamily: 'Roboto' }}>{lang[language].City}</label> </Col>
                        <Col xs={1}>   <label style={styles.dialogLabel}>:</label> </Col>
                        <Col xs={6}>  <label
                            style={{ fontWeight: '500', color: '#3d425c', fontFamily: 'Roboto', }}
                        >{this.props.data.city}</label> </Col>

                    </Row>
                    <Row>
                        <Col xs={5}>  <label style={{ fontSize: 14, fontFamily: 'Roboto' }}>{lang[language].Country}</label> </Col>
                        <Col xs={1}>   <label style={styles.dialogLabel}>:</label> </Col>
                        <Col xs={6}>  <label style={{ fontWeight: '500', color: '#3d425c', fontFamily: 'Roboto', }}>{this.props.data.country}</label> </Col>

                    </Row>

                    <Row>
                        <Col xs={5}>  <label style={{ fontSize: 14, fontFamily: 'Roboto' }}>{lang[language].Bandwidth}</label> </Col>
                        <Col xs={1}>   <label style={styles.dialogLabel}>:</label> </Col>
                        <Col xs={6}>  <label style={{ fontWeight: '500', color: '#3d425c', fontFamily: 'Roboto', }}>{(this.props.data.speed / (1024 * 1024)).toFixed(2) + lang[language].Mbps}</label> </Col>
                    </Row>

                    <Row>
                        <Col xs={5}>  <label style={{ fontSize: 14, fontFamily: 'Roboto' }}>{lang[language].Cost}</label> </Col>
                        <Col xs={1}>   <label style={styles.dialogLabel}>:</label> </Col>
                        <Col xs={6}>  <label style={{ fontWeight: '500', color: '#3d425c', fontFamily: 'Roboto', }}>{this.props.data.price_per_GB + lang[language].SentPerGb}</label> </Col>
                    </Row>
                    <Row>
                        <Col xs={5}>  <label style={{ fontSize: 14, fontFamily: 'Roboto' }}>{lang[language].Latency}</label> </Col>
                        <Col xs={1}>   <label style={styles.dialogLabel}>:</label> </Col>
                        <Col xs={6}>  <label style={{ fontWeight: '500', color: '#3d425c', fontFamily: 'Roboto', }}>{this.props.data.latency ? `${this.props.data.latency} ${lang[language].MS}` : 'None'}</label> </Col>
                    </Row>

                    <Row>
                        <Col xs={5}>  <label style={{ fontSize: 14, fontFamily: 'Roboto' }}>{lang[language].Protocol}</label> </Col>
                        <Col xs={1}>   <label style={styles.dialogLabel}>:</label> </Col>
                        <Col xs={6}>  <label style={{ fontWeight: '500', color: '#3d425c', fontFamily: 'Roboto', }}>{this.props.data.node_type ? this.props.data.node_type : 'None'}</label> </Col>
                    </Row>

                    {
                        this.props.isTm ? 
                    <Row>
                        <Col xs={5}>  <label style={{ fontSize: 14, fontFamily: 'Roboto' }}>{lang[language].Moniker}</label> </Col>
                        <Col xs={1}>   <label style={styles.dialogLabel}>:</label> </Col>
                        <Col xs={6}>  <label style={{ fontWeight: '500', color: '#3d425c', fontFamily: 'Roboto', }}>
                            <Tooltip title={this.props.data.moniker ? this.props.data.moniker : 'None'}>
                                <div className="dialog_moniker_value">{this.props.data.moniker ? this.props.data.moniker : 'None'}</div>
                            </Tooltip></label> </Col>
                    </Row>
                    :
                    ''
                    }

                    <Row>
                        <Col xs={5}>  <label style={{ fontSize: 14, fontFamily: 'Roboto' }}>{lang[language].Version}</label> </Col>
                        <Col xs={1}>   <label style={styles.dialogLabel}>:</label> </Col>
                        <Col xs={6}>  <label style={{ fontWeight: '500', color: '#3d425c', fontFamily: 'Roboto', }}>{this.props.data.version ? this.props.data.version : 'None'}</label> </Col>
                    </Row>

                    <List style={{ paddingBottom: 5 }}>


                        <div className={classes.listRoot}>
                            <Button disabled={this.props.isLoading || this.props.vpnStatus} variant="contained" aria-label={this.props.isLoading || this.props.vpnStatus ? lang[language].ConnectingdVPN : lang[language].Connect}
                                onClick={() => this.props.onClicked(this.props.data.vpn_addr)}
                                className={classes.enableButton}
                                style={createAccountStyle.buttonStyle}
                            >
                                {!this.props.isLoading && this.props.success ? <CheckIcon
                                    className={classes.extendedIcon} /> :
                                    null
                                }
                                {this.props.isLoading ? lang[language].ConnectingdVPN : (this.props.success ? lang[language].Connected : lang[language].Connect)}
                            </Button>
                        </div>
                    </List>

                </div>
            </Dialog>
        );
    }
}

SimpleDialog.propTypes = {
    classes: PropTypes.object.isRequired,
    onClose: PropTypes.func,
    selectedValue: PropTypes.string,
};

const SimpleDialogWrapped = withStyles(styles)(SimpleDialog);


class AlertDialog extends React.Component {

    componentWillReceiveProps(nextProps) {
        this.setState({ open: nextProps.open, op: nextProps.op });
    }

    state = {
        open: false,
        op: false
    };

    handleClickOpen = () => {
        this.setState({ open: true });
    };

    handleClose = () => {
        this.setState({ open: false, isLoading: false, op: false });
    };

    makeInitPayment = () => {
        let data = {
            account_addr: this.props.paymentAddr,
            amount: 100,
            id: -1
        };
        this.props.initPaymentAction(data);
        this.props.setCurrentTab('send')
    };

    render() {
        let regError = (this.props.message).replace(/\s/g, "")
        let message = lang[this.props.language][regError] ?
            lang[this.props.language][regError] : this.props.message;
        return (
            <Dialog
                open={this.props.open}
                onClose={this.props.onClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{lang[this.props.language].InitialPaymentAlert}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {`${message} ${lang[this.props.language].PleaseClickPay}`}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose} color="primary">
                        {lang[this.props.language].Cancel}
                    </Button>
                    <Button onClick={this.makeInitPayment} color="primary" autoFocus>
                        {lang[this.props.language].Pay}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}


class SimpleDialogDemo extends React.Component {

    componentWillReceiveProps(nextProps) {
        this.setState({ open: nextProps.open })
    }

    state = {
        open: false,
        pendingInitPayment: null,
        isPending: false,
        paymentAddr: '',
        isLoading: false,
        session: false,
        snackOpen: false,
        snackMessage: '',
        openvpnAlert: false,
        isSocksRes: false
    };

    handleClickOpen = () => {
        this.setState({
            open: true,
        });
    };

    handleClose = () => {
        this.setState({ open: false });
        this.props.onUpdate(false);
    };
    handleAlertClose = () => {
        this.setState({ isPending: false })
    };

    handleDialogClose = () => {
        this.setState({ openvpnAlert: false });
    }

    handleListItemClick = (vpn_addr) => {

        let node_type=this.props.data.node_type.toLocaleLowerCase();

        this.props.setVpnType(node_type)
        if (this.props.isTm) {
            this.props.payVPNTM({ 'isPayment': true, 'data': this.props.data });
            this.props.setCurrentTab('send');
        }
        else {
            this.setState({ isLoading: true });
            if (node_type === 'openvpn') {
                connectVPN(this.props.getAccount, vpn_addr, remote.process.platform, null, (err, platformErr, res) => {
                    // console.log("VPn..res..", err, platformErr, res);
                    if (platformErr) {
                        this.setState({ open: false, isLoading: false, openvpnAlert: true })
                    }
                    else if (err) {
                        if ('account_addr' in err)
                            this.setState({
                                pendingInitPayment: err.message, open: false, isPending: true,
                                paymentAddr: err.account_addr, isLoading: false
                            })
                        else {
                            if (err.message.includes('You have due amount')) {
                                this.setState({
                                    open: false, isLoading: false,
                                    snackMessage: lang[this.props.language].YouHaveDue,
                                    snackOpen: true
                                })
                            } else {
                                let regError = (err.message).replace(/\s/g, "")
                                this.setState({
                                    open: false, isLoading: false,
                                    snackMessage: lang[this.props.language][regError] ?
                                        lang[this.props.language][regError] : err.message,
                                    snackOpen: true
                                })
                            }
                        }
                    } else if (res) {
                        let regError = res.replace(/\s/g, "")
                        this.setState({
                            open: false, isLoading: false, isPending: false,
                            snackMessage: lang[this.props.language][regError] ?
                                lang[this.props.language][regError] : res,
                            snackOpen: true
                        });
                        this.props.setActiveVpn(this.props.data);
                        this.props.setVpnStatus(true)
                    } else {
                        this.setState({ open: false, isLoading: false })
                    }

                })
            } else {
                this.setState({ isSocksRes: false });
                connectSocks(this.props.getAccount, vpn_addr, remote.process.platform, (err, res) => {
                    if (this.state.isSocksRes) {
                    } else {
                        // console.log("Socks..res..", err, res);
                        if (err) {
                            if ('account_addr' in err)
                                this.setState({
                                    pendingInitPayment: err.message, open: false, isPending: true,
                                    paymentAddr: err.account_addr, isLoading: false, isSocksRes: true
                                })
                            else {
                                if (err.message.includes('You have due amount')) {
                                    this.setState({
                                        open: false, isLoading: false,
                                        snackMessage: lang[this.props.language].YouHaveDue,
                                        snackOpen: true, isSocksRes: true
                                    })
                                } else {
                                    let regError = (err.message).replace(/\s/g, "")
                                    this.setState({
                                        open: false, isLoading: false,
                                        snackMessage: lang[this.props.language][regError] ?
                                            lang[this.props.language][regError] : err.message,
                                        snackOpen: true, isSocksRes: true
                                    })
                                }
                            }
                        } else if (res) {
                            // console.log("Socks...", res);
                            if (remote.process.platform === 'win32') {
                                exec('start iexplore "https://www.bing.com/search?q=my+ip&form=EDGHPT&qs=HS&cvid=f47c42614ae947668454bf39d279d717&cc=IN&setlang=en-GB"', function (stderr, stdout, error) {
                                    // console.log('browser opened');
                                });
                            }
                            this.setState({
                                isLoading: false, isPending: false, open: false,
                                snackMessage: lang[this.props.language].ConnectedSocks, snackOpen: true, isSocksRes: true
                            });
                            this.props.setActiveVpn(this.props.data);
                            this.props.setVpnStatus(true);
                            calculateUsage(this.props.getAccount, true, (usage) => {
                                this.props.socksVpnUsage(usage);
                            });
                        } else {
                            this.setState({ open: false, isLoading: false, isSocksRes: true })
                        }
                    }
                });
            }
        }
    };

    handleSnackClose = (event, reason) => {
        this.setState({ snackOpen: false });
    };

    execIT = () => {
        calculateUsage(this.props.getAccount, this.props.data.vpn_addr, false)
    };

    render() {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }} >
                {!this.state.isPending ?
                    <SimpleDialogWrapped
                        open={this.state.open}
                        data={this.props.data}
                        onClose={this.handleClose}
                        onClicked={this.handleListItemClick}
                        isLoading={this.state.isLoading}
                        success={this.props.vpnStatus}
                        execIT={this.execIT}
                        language={this.props.language}
                        vpnStatus={this.props.vpnStatus}
                        isTm = {this.props.isTm}
                    />
                    :
                    <AlertDialog
                        open={this.state.isPending}
                        onClose={this.handleAlertClose}
                        language={this.props.language}
                        message={this.state.pendingInitPayment}
                        paymentAddr={this.state.paymentAddr}
                        initPaymentAction={this.props.initPaymentAction}
                        setCurrentTab={this.props.setCurrentTab}
                    />
                }
                <Snackbar
                    open={this.state.snackOpen}
                    autoHideDuration={4000}
                    onClose={this.handleSnackClose}
                    message={this.state.snackMessage}
                />
                <OpenvpnAlert
                    open={this.state.openvpnAlert}
                    onClose={this.handleDialogClose}
                />
            </div>
        );
    }
}

function mapDispatchToProps(dispatch) {

    return bindActionCreators({
        setCurrentTab, initPaymentAction, getVPNUsageData,
        setVpnStatus, connectVPN, connectSocks, payVPNTM, setActiveVpn, socksVpnUsage, setVpnType
    }, dispatch)
}

function mapStateToProps({ connecVPNReducer, getAccount, vpnType, setLanguage, setVpnStatus, getCurrentVpn, setTendermint, setTMAccount }) {
    return {
        connecVPNReducer, getAccount, vpnType, data: getCurrentVpn, language: setLanguage,
        vpnStatus: setVpnStatus, isTm: setTendermint, account: setTMAccount
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SimpleDialogDemo);

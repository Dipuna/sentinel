import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import {
    withStyles, Button, List, ListItem, ListItemText,
    DialogTitle, Dialog,
} from '@material-ui/core';
import green from '@material-ui/core/colors/green';
import CheckIcon from '@material-ui/icons/Check';
import ConnectIcon from '@material-ui/icons/SwapVerticalCircle';
import blue from '@material-ui/core/colors/blue';
import { connectVPN } from '../Actions/connectOVPN'
import { connectSocks } from '../Actions/connectSOCKS';
import { setVpnStatus, payVPNTM, setActiveVpn } from '../Actions/vpnlist.action';
import { setCurrentTab } from '../Actions/sidebar.action';
import { initPaymentAction } from '../Actions/initPayment';
import { getVPNUsageData } from "../Utils/utils";
import { calculateUsage, socksVpnUsage } from '../Actions/calculateUsage';

const electron = window.require('electron');
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
        width: 280,
        overflow: 'none'
    },
    dialogLabel: {
        fontSize: 14,
        fontFamily: 'Montserrat',
        fontWeight: 'bold',
        textAlign: 'right'
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
    },
    extendedIcon: {
        marginRight: theme.spacing.unit,
    },

});

// function Transition (props) {
//     return <Slide direction="up" {...props} />;
// }

class SimpleDialog extends React.Component {

    state = {
        pendingInitPayment: null,
    };

    handleClose = () => {
        this.props.onClose();

    };

    render() {
        const { classes, ...other } = this.props;

        return (
            <Dialog onClose={this.handleClose}
                aria-labelledby="simple-dialog-title"
                {...other} className={{ classes: { paper: classes.container } }}
            >
                <DialogTitle className={classes.container} id="simple-dialog-title">Connect to dVPN</DialogTitle>
                <div>
                    <List>
                        <ListItem>
                            <ListItemText>
                                <label style={styles.dialogLabel}>City:&nbsp;</label>
                                <span style={styles.dialogValue}>{this.props.data.city}</span>
                            </ListItemText>
                        </ListItem>

                        <ListItem>
                            <ListItemText>
                                <label style={styles.dialogLabel}>Country:&nbsp;</label>
                                <span style={styles.dialogValue}>{this.props.data.country}</span>
                            </ListItemText>
                        </ListItem>

                        <ListItem>
                            {/*<ListItemText primary={`Bandwidth: ${this.props.data.speed}`} />*/}
                            <label style={styles.dialogLabel}>Bandwidth:&nbsp;</label>
                            <span style={styles.dialogValue}>{(this.props.data.speed / (1024 * 1024)).toFixed(2)}</span>
                        </ListItem>

                        <ListItem>
                            <ListItemText>
                                <label style={styles.dialogLabel}>Price:&nbsp;</label><span
                                    style={styles.dialogValue}>{this.props.data.price_per_GB}</span>
                            </ListItemText>
                        </ListItem>
                        <ListItem>
                            <ListItemText> <label style={styles.dialogLabel}>Latency:&nbsp;</label>
                                <span style={styles.dialogValue}> {this.props.data.latency}</span>
                            </ListItemText>
                        </ListItem>

                        <div className={classes.listRoot}>
                            <Button disabled={this.props.isLoading} variant="extendedFab" aria-label="Connect"
                                onClick={() => this.props.onClicked(this.props.data.vpn_addr)}
                                className={classes.button}>
                                {!this.props.isLoading && this.props.success ? <CheckIcon
                                    className={classes.extendedIcon} /> : <ConnectIcon className={classes.extendedIcon} />}
                                {!this.props.isLoading && this.props.success ? 'Connected' : 'Connect'}
                            </Button>
                            <Button onClick={this.props.execIT} >Refresh</Button>
                        </div>
                    </List>
                    {/*: ''*/}
                    {/*}*/}
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
            amount: 10000000000,
            id: -1
        };
        this.props.initPaymentAction(data);
        this.props.setCurrentTab('send')
    };

    render() {
        return (
            <Dialog
                // open={this.state.open}
                // keepMounted
                open={this.props.op}
                onClose={this.props.onClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Initial Payment Alert"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {`${this.props.message} Please click on pay button to make the initial payment`}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose} color="primary">
                        Cancel
                        </Button>
                    <Button onClick={this.makeInitPayment} color="primary" autoFocus>
                        Pay
                        </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

// export default AlertDialog;


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

    handleListItemClick = async (vpn_addr) => {
        if (this.props.isTm) {
            this.props.payVPNTM({ 'isPayment': true, 'data': this.props.data });
            this.props.setCurrentTab('tmint');
        }
        else {
            this.setState({ isLoading: true });
            if (this.props.vpnType === 'openvpn') {
                await connectVPN(this.props.getAccount, vpn_addr, remote.process.platform, null, (err, platformErr, res) => {
                    if (platformErr) {
                        console.log("Platform err...", platformErr)
                    }
                    else if (err && 'account_addr' in err) {
                        this.setState({
                            pendingInitPayment: err.message, open: false, isPending: true,
                            paymentAddr: err.account_addr, isLoading: false
                        })
                    } else if (res) {
                        this.setState({ isLoading: false, isPending: false, open: true });
                        this.props.setActiveVpn(this.props.data);
                        this.props.setVpnStatus(true)
                    } else {
                        this.setState({ open: false, isLoading: false })
                    }

                })
            } else {
                await connectSocks(this.props.getAccount, vpn_addr, remote.process.platform, (err, res) => {
                    console.log("Socks..res..", err, res);
                    if (err && 'account_addr' in err) {
                        this.setState({
                            pendingInitPayment: err.message, open: false, isPending: true,
                            paymentAddr: err.account_addr, isLoading: false
                        })
                    } else if (res) {
                        console.log("Socks...", res);
                        this.setState({ isLoading: false, isPending: false, open: true });
                        this.props.setActiveVpn(this.props.data);
                        this.props.setVpnStatus(true);
                        calculateUsage(this.props.getAccount, true, (usage) => {
                            this.props.socksVpnUsage(usage);
                        });
                    } else {
                        this.setState({ open: false, isLoading: false })
                    }
                });
            }
        }
    };

    execIT = () => {
        calculateUsage(this.props.getAccount, this.props.data.vpn_addr, false)
    };

    render() {
        // console.log("Status...", this.props.vpnStatus);
        // if (this.props.vpnStatus && !UsageInterval) {
        //     UsageInterval = setInterval(() => {
        //         if (this.state.session && type === 'SOCKS5') {
        //             calculateUsage(this.props.getAccount, this.props.data.vpn_addr, false)
        //         } else {
        //             this.props.getVPNUsageData(this.props.isTm ? this.props.account.address : this.props.getAccount);
        //         }
        //     }, 3000);
        // }

        // if (!this.props.vpnStatus) {
        //     if (UsageInterval) {
        //         clearInterval(UsageInterval);
        //         UsageInterval = null;
        //     }
        // }

        // if (!UsageInterval && this.props.status) {
        //     UsageInterval = setInterval(function () {
        //         session = localStorage.getItem('SESSION_NAME');
        //         type = localStorage.getItem('VPN_TYPE');
        //         if (this.state.isSock)
        //             that.calculateUsage(false);
        //         else
        //
        //     }, 5000);
        // }
        return (
            <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }} >
                {!this.state.isPending ?
                    <SimpleDialogWrapped
                        // selectedValue={this.state.selectedValue}
                        open={this.state.open}
                        data={this.props.data}
                        onClose={this.handleClose}
                        onClicked={this.handleListItemClick}
                        isLoading={this.state.isLoading}
                        success={this.props.vpnStatus}
                        execIT={this.execIT}
                    />
                    :
                    <AlertDialog
                        op={this.state.isPending}
                        // open={this.state.isPending}
                        onClose={this.handleAlertClose}
                        message={this.state.pendingInitPayment}
                        paymentAddr={this.state.paymentAddr}
                        initPaymentAction={this.props.initPaymentAction}
                        setCurrentTab={this.props.setCurrentTab}
                    />
                }
            </div>
        );
    }
}

function mapDispatchToProps(dispatch) {

    return bindActionCreators({
        setCurrentTab, initPaymentAction, getVPNUsageData,
        setVpnStatus, connectVPN, connectSocks, payVPNTM, setActiveVpn, socksVpnUsage
    }, dispatch)
}

function mapStateToProps({ connecVPNReducer, getAccount, vpnType, setVpnStatus, getCurrentVpn, setTendermint, setTMAccount }) {
    return {
        connecVPNReducer, getAccount, vpnType, data: getCurrentVpn,
        vpnStatus: setVpnStatus, isTm: setTendermint, account: setTMAccount
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SimpleDialogDemo);

let axios = require('axios');
let async = require('async');
let sessionDbo = require('../dbos/session.dbo');
let cosmos = require('../../cosmos');


let generateToken = () => {
  let ALPHA_NUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
  let token = '';
  for (let i = 0; i < 24; ++i)
    token += ALPHA_NUM.charAt(Math.floor(Math.random() * ALPHA_NUM.length));
  return token;
};

let getPaymentDetails = (txHash, cb) => {
  cosmos.call('verifyHash', {
    hash: txHash
  }, (error, result) => {
    if (error) cb(error);
    else {
      let data = Buffer.from(result.result.data, 'base64');
      let sessionId = Buffer.from(result.result.tags[1].value, 'base64');
      let lockedAmount = Buffer.from(result.result.tags[2].value, 'base64');
      data = JSON.parse(data.toString()).value;
      sessionId = sessionId.toString();
      lockedAmount = parseInt(lockedAmount.toString()) / Math.pow(10, 8);
      result = {
        from: data.From,
        to: data.Vpnaddr,
        sessionId,
        lockedAmount
      };
      cb(null, result);
    }
  });
};

let sendUserDetails = (url, details, cb) => {
  axios.post(url, details)
    .then((response) => {
      if (response.status === 200) {
        let { data } = response;
        if (data.success) cb(null);
        else cb({
          code: 2,
          message: 'Response data success is false.'
        });
      } else cb({
        code: 1,
        message: 'Response status code is not 200.'
      });
    })
    .catch((error) => {
      cb(error.response);
    });
};

let updateSessionUsage = (nodeAccountAddress, sessionId, usage, cb) => {
  sessionDbo.updateSession({
    sessionId,
    nodeAccountAddress,
    'startedOn': {
      $exists: true
    },
    'endedOn': {
      $exists: false
    }
  }, {
      usage,
      'updatedOn': new Date()
    }, (error, result) => {
      if (error) cb({
        code: 3,
        message: 'Error occurred while updating session usage.'
      });
      else cb(null);
    });
};

let updateSessionsUsage = (nodeAccountAddress, sessions, cb) => {
  async.forEach(sessions,
    (session, next) => {
      let {
        sessionId,
        usage
      } = session;
      updateSessionUsage(nodeAccountAddress, sessionId, usage,
        (error) => {
          next(error);
        });
    }, (error) => {
      cb(error);
    });
};

module.exports = {
  generateToken,
  getPaymentDetails,
  sendUserDetails,
  updateSessionsUsage
};
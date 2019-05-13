let mongoose = require('mongoose');
let { GB } = require('../../config/vars');


let sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  clientAccountAddress: {
    type: String,
    required: true
  },
  nodeAccountAddress: {
    type: String,
    required: true
  },
  maxUsage: {
    download: {
      type: Number,
      required: true,
      default: GB
    },
    upload: {
      type: Number,
      required: true,
      default: GB
    }
  },
  usage: {
    download: {
      type: Number,
      required: true,
      default: 0
    },
    upload: {
      type: Number,
      required: true,
      default: 0
    }
  },
  amount: {
    type: String,
    default: null
  },
  startedOn: {
    type: Date,
    default: Date.now
  },
  endedOn: {
    type: Date
  },
  addedOn: {
    type: Date,
    default: Date.now
  },
  updatedOn: {
    type: Date,
    default: Date.now
  }
}, {
    strict: true,
    versionKey: false
  });

module.exports = mongoose.model('Session', sessionSchema);
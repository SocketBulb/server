const db = require('../bin/conndb');
var model = require('seraph-model');

// define model

const Email = model(db, 'user');

// specify timestamp property names

Email.useTimestamps('createdAt', 'lastUpdated');

// specify schema

Email.schema = {
  email         : { type: String, required: true },
  primary       : { type: Boolean, default: false },
  confirmed     : { type: Boolean, default: false },
  confirmToken  : { type: String },
  confirmedAt   : { type: Date }
}

module.exports = Email;

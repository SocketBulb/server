const db = require('../bin/conndb');
var model = require('seraph-model');

// define model

const User = model(db, 'user');

// specify timestamp property names

User.useTimestamps('createdAt', 'lastUpdated');

// specify schema

User.schema = {
  email       : { type: String, required: true },
  password    : { type: String, required: true }
}

User.compose(require('./email.js'), 'emails', 'has_email');
User.compose(require('./profile.js'), 'profile', 'has_profile');

module.exports = User;

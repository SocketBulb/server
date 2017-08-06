const db = require('../bin/conndb');
var model = require('seraph-model');

// define model

const Profile = model(db, 'user');

// specify timestamp property names

Profile.useTimestamps('createdAt', 'lastUpdated');

// specify schema

Profile.schema = {
  firstName   : { type: String, default: null },
  lastName    : { type: String, default: null },
  gender      : { type: String, enum: ['Male', 'Female', 'Other'], default: null }
}

module.exports = Profile;

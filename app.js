const path = require('path');
const http = require('http');

const express = require('express');

const logger = require('morgan');

const bodyParser = require('body-parser');
const expressValidator = require('express-validator');

const passport = require('passport');
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const models = require('./models');

const app = express();

//////////////////////////////////// CONFIG ////////////////////////////////////

// LOGGER
app.use(logger('dev'));

// VIEWS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// REQUSET PARSING
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());

// STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// PASSPORT AUTHENTICATION

// jwts
const opts = {
  jwtFromRequest : ExtractJwt.fromAuthHeader(),
  secretOrKey : process.env.SECRET
}

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
  models.User.read(jwt_payload.id, (err, user) => {
    if (err || !user) return done(err, false);
    if (user) return done(null, user);
    return done(null, false);
  });
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  models.User.read(id, (err, user) => done(err, user));
});

app.use(passport.initialize());

//////////////////////////////////// ROUTES ////////////////////////////////////

// app.use((req, res, next) => {
//   if (req.get('Authorization')) console.log("Authorization: ", req.get('Authorization'));
//   next();
// })

app.use('/v1/auth', require('./routes/auth')(passport));

// auth wall
app.use(passport.authenticate('jwt', { session: false }));

app.get('/v1/secret', (req, res) => res.json({ ok: 'ayyy' }));

// app.use('/', require('./routes/index'));
// app.use('/users', require('./routes/users'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// ERROR HANDLERS
if (app.get('env') === 'development') {
  // development
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err });
  });
} else {
  // production
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: {} });
  });
}

module.exports = { app, http };

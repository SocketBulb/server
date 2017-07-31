var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

//////////////////////////////////// CONFIG ////////////////////////////////////

// LOGGER
app.use(logger('dev'));

// VIEWS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// REQUSET PARSING
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

//////////////////////////////////// ROUTES ////////////////////////////////////

var routes = require('./routes/index');
var users = require('./routes/users');

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// ERROR HANDLERS
if (app.get('env') === 'development') {
  // development
  app.use((err, req, res, next) => {
    res.json({
      ok: false,
      message: err.message,
      error: err
    }, err.status || 500);
  });
}

// production
app.use((err, req, res, next) => {
  res.json({
    ok: false,
    message: err.message,
    error: {}
  }, err.status || 500);
});

module.exports = app;

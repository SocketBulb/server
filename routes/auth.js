const models = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
var router = require('express').Router();

module.exports = (passport) => {
  
  /*
  POST `/auth/register`
  Creates a user.
  
  @pre    `email` must be a non-empty, valid-email string
  @pre    `password` must be a non-empty string
  
  @req.body   String    email     The desired email for the user
  @req.body   String    password  The desired password for the user
  
  @returns    Object    
    .user   The user object
    .token  The log-in token
  */
  router.post('/register', (req, res, next) => {
    // validate data
    
    req.checkBody('email').notEmpty().isEmail();
    req.checkBody('password').notEmpty();
    
    req.getValidationResult().then(result => {
      var errors = result.array();
      
      if (!result.isEmpty()) {
        return res.status(400).json({
          error: result.useFirstErrorOnly().mapped()
        });
      }
      
      // check that email does not exist
      models.Email.where({ email: req.body.email }, (err, emails) => {
        if (emails.length > 0) {
          // CASE: email exists
          return res.status(400).json({
            error: { message: `Email already exists.` }
          });
        }
        
        // create user if all is aight
        models.User.save({
          password: bcrypt.hashSync(req.body.password, 16),
          email: req.body.email,
          emails : [{
            email: req.body.email,
            primary: true,
            confirmToken: jwt.sign(req.body.email, process.env.SECRET)
          }],
          profile: {}
        }, (modelErr, user) => {
          console.log(modelErr);
          // CASE: database read error
          if (modelErr) return res.status(500).json({ error: modelErr });
          
          return req.login(user, loginErr => {
            // CASE: passport login error
            if (loginErr) return res.status(500).json({ error: loginErr });
            
            const payload = {
              id : user.id
            };
            const token = jwt.sign(payload, process.env.SECRET);
            return res.json({ user, token });
          });
        });
        
        
      })
      
    });

  });
  
  /*
  POST `/auth/login`
  Logs a user into the application.
  
  @req.body   String    email     The email of the user logging in
  @req.body   String    password  The password of the user logging in
  
  @returns    Object    
    .user   The user object
    .token  The log-in token
  */
  router.post('/login', (req, res) => {
    
    req.checkBody('email').notEmpty().isEmail();
    req.checkBody('password').notEmpty();
    
    req.getValidationResult().then(result => {
      var errors = result.array()
      
      // CASE: email/password validation errors
      if (!result.isEmpty()) {
        return res.status(400).json({
          error: errors.useFirstErrorOnly().mapped()
        });
      }
      
      // fetch user
      models.User.where({
        email: req.body.email
      }, (modelErr, users) => {
        // CASE: database read error
        if (modelErr) return res.status(500).json({ error: modelErr });
        
        // CASE: no users with submitted primary email
        if (users.length === 0) {
          return res.status(400).json({ error: { message: 'Error logging in.' } });
        }
        
        // check password of user
        // FIXME: Load from (users.length - 1) bc Email objects are also fetched
        var user = users[users.length - 1];
        bcrypt
          .compare(req.body.password, user.password)
          .then(theSame => {
            if (!theSame) {
              // CASE: incorrect password
              return res.status(400).json({
                error: { message: 'Error logging in.' }
              });
            }
            return req.login(user, loginErr => {
              // CASE: passport login error
              if (loginErr) return res.status(500).json({ error: loginErr });
              
              const payload = {
                id : user.id
              };
              const token = jwt.sign(payload, process.env.SECRET);
              return res.json({ user, token });
            });
          })
          .catch(err => {
            // CASE: bcrypt comparison error
            console.error(err);
            return res.status(500).json({
              error: { message: 'Error comparing passwords.' }
            });
          });
        
      });
      
    });
    
  });
  
  /*
  GET `/auth/loggedIn`
  Checks whether a user is logged in or not.
  
  @returns    Object
    .loggedIn Whether or not the user is logged in
  */
  router.get('/loggedIn', (req, res) => {
    return res.json({ loggedIn: !!req.user });
  });
  
  /*
  GET `/auth/logout`
  Logs out a user from the applcation.
  
  @returns    Object    
    .ok       Whether the operation completed successfully or not
    [.error]  The error object if 
  */
  router.get('/logout', passport.authenticate('jwt', { session : false }), (req, res) => {
    req.logout();
    return res.json({ ok: true });
  });
  
  /*
  TODO: POST `/auth/email`
  Creates a new email for a user.
  */
  router.post('/email', passport.authenticate('jwt', { session : false }), (req, res) => {
    req.checkBody('email').notEmpty().isEmail();
    
    req.getValidationResult().then(result => {
      var errors = result.array();
      
      if (errors.length > 0) {
        return res.status(400).json({
          error : {
            message : result.useFirstErrorOnly().mapped()
          }
        })
      }
      
      return res.json({ ok: true });
    })
  });
  
  /*
  TODO: PUT `/auth/email`
  Switches a user's primary email from one to another.
  */
  router.put('/email', passport.authenticate('jwt', { session : false }), (req, res) => {
    return res.json({ ok: true });
  });
  
  /*
  TODO: PUT `/auth/password`
  Updates a user's password.
  */
  router.post('/password', passport.authenticate('jwt', { session : false }), (req, res) => {
    return res.json({ ok: true });
  });
  
  return router;
};

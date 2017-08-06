const models = require('../models');
const jwt = require('jsonwebtoken');
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
      var errors = result.array()
      console.log(errors);
      
      if (!result.isEmpty()) {
        return res.status(400).json({
          error: errors.useFirstErrorOnly().mapped()
        });
      }
      
      // create user if all is aight
      models.User.save({
        email: req.body.email,
        password: req.body.password
      }, (modelErr, user) => {
        
        if (modelErr) return res.status(500).json({ error: modelErr });
        
        return req.login(user, loginErr => {
          console.error(loginErr);
          if (loginErr) return res.status(500).json({ error: loginErr });
          
          return res.json({
            user,
            token: 'thisShouldBeAJWT'
          });
        });
      });
      
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
      
      if (!result.isEmpty()) {
        return res.status(400).json({
          error: errors.useFirstErrorOnly().mapped()
        });
      }
      
      // fetch user
      models.User.where({
        email: req.body.email
      }, (modelErr, users) => {
        if (modelErr) return res.status(500).json({ error: modelErr });
        if (users.length === 0) {
          return res.status(400).json({ error: { message: 'Error logging in.' } });
        }
        
        // check password of user
        var user = users[0];
        if (user.password !== req.body.password) {
          return res.status(400).json({ error: { message: 'Error logging in.' } });
        }
        
        return req.login(user, loginErr => {
          if (loginErr) return res.status(500).json({ error: loginErr });
          
          const payload = {
            id : user.id
          };
          const token = jwt.sign(payload, process.env.SECRET);
          return res.json({ user, token });
        });
      });
      
    });
    
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
  GET `/auth/loggedIn`
  Checks whether a user is logged in or not.
  
  @returns    Object
    .loggedIn Whether or not the user is logged in
  */
  router.get('/loggedIn', (req, res) => {
    return res.json({ loggedIn: !!req.user });
  });
  
  return router;
};

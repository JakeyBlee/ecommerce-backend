const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('../db/index');
const bcrypt = require('bcrypt');

const { registerUser } = require('../util/helpers');

router.use(passport.initialize());
router.use(passport.session());
router.use(express.json());

passport.use(new LocalStrategy(
    function(username, password, done){
        db.query(`SELECT * FROM users WHERE username = $1`, [username], async (err, user) => {
            if(err) return done(err);
            if(user.rowCount===0) return done(null, false, { message: 'Incorrect username or password.' });
            let passwordMatch = await bcrypt.compare(password, user.rows[0].password);
            if(!passwordMatch) return done(null, false, { message: 'Incorrect username or password.' });
            return done(null, user);
        })
    }
));

passport.serializeUser((user, done) => {
  done(null, user.rows[0].id);
});
passport.deserializeUser((id, done) => {
  db.query(`SELECT * FROM users WHERE id = $1`, [id], (err, user) => {
  if(err) return done(err);
  done(null, user);
  })
});

router.post('/register', async (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    try {
        await registerUser(username, password, firstName, lastName);
        res.status(201).json({message: 'Account created successfully'});
        console.log('User registered successfully.');
    } catch(err) {
        console.log(err)
        res.status(400).json({message: err.message});
    }
});
router.post('/login', passport.authenticate('local', {failureRedirect: "/login"}),
    (req, res, next) => {
        req.session.authenticated = true;
        res.status(200).json({username: req.body.username, userID: req.session.passport.user});
        console.log('Login success.');
    }
);
router.post('/logout', (req, res, next) => {
    req.logout(function(err) {
        if(err) return next(err);
        res.status(200).json({message: 'Logged Out'});
        console.log('Logout Success.');
    })
});

module.exports = router, passport;
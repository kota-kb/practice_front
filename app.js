var express = require("express");

const axiosBase = require('axios');
const axios = axiosBase.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  responseType: 'json'  
});

var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(
    "local-login",
    new LocalStrategy({
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
    }, function (request, username, password, done) {
        process.nextTick(() => {

            if (username === "scott" && password === "tiger") {
                return done(null, username)
            } else {
                console.log("login error")
                return done(null, false, { message: 'パスワードが正しくありません。' })
            }

        });
    })
);

var app = express();
app.set('view engine', 'ejs');
const layouts = require('express-ejs-layouts');
app.use(layouts);
app.use(express.static('assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
 
app.use(session({ secret: "some salt", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

var indexRouter = require('./routers/index.js');
app.use('/', indexRouter)

app.listen(5000, () => console.log('app listening on port 5000!'))

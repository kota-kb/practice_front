var commons = require('./commons');
var router = require('express').Router();
var passport = require('passport'); 

router.get('/', commons.authorize('t'), function(req, res){
    const message = 'Hello World!';
    res.render('pages/index', {message: message});
});

router.get('/login', function(req, res) {
    res.render('pages/login');
});

router.post('/login', function(req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.redirect('/login'); }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                res.cookie('user', user, {httpOnly:false});

                return res.redirect('/');
            });
      })(req, res, next);
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});

module.exports = router;

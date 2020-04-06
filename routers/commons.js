exports.authorize = function () {
    return function (request, response, next) {
        if (request.isAuthenticated()) {
            return next();
        }
        response.redirect("/login");
    };
};
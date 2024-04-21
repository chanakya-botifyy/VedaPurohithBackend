const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    try {
        let token = req.header('x-token');
        if (!token) {
            return res.status(400).send("Token Not Found");
        }
        let decode = jwt.verify(token, 'secret_ecom');
        req.user = decode.user;
        next();
    }
    catch (err) {
        console.log(err);
        res.status(400).send('Invalid Token');
    }
}
const jwt = require('jsonwebtoken');

// JWT Secret Key
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware to check for authentication
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (token == null) return res.redirect('/login');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
};


module.exports = authenticateToken;

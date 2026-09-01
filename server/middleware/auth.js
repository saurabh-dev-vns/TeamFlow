const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { COOKIE_NAME } = require('../utils/generateToken');

// Verifies the JWT and attaches the authenticated user to req.user.
// Reads the token from the httpOnly cookie first (the primary path for the
// web client), falling back to the Authorization header (for API clients /
// tools that can't use cookies).
const protect = async (req, res, next) => {
  let token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    // If the token predates the user's current tokenVersion (e.g. password
    // was changed since this token was issued), reject it even though the
    // JWT signature itself is still valid.
    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session expired, please log in again' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired, please log in again' });
    }
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

// Restricts a route to specific roles, e.g. authorize('admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

module.exports = { protect, authorize };

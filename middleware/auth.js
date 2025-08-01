const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // Import asyncHandler
const User = require('../models/User'); // Adjust path to your User model

// Middleware to authenticate JWT token
exports.authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('--- AUTHENTICATE MIDDLEWARE ---');
      console.log('1. Token extracted:', token ? 'Token found' : 'No token');

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('2. Token decoded payload (id, role, iat, exp):', decoded); // Should show { id: '...', role: '...', iat: ..., exp: ... }

      // 3. Find user by ID from decoded token and attach to request
      // Select '-password' to exclude password hash from req.user
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.error('3. User not found in DB for decoded ID:', decoded.id);
        res.status(401); // Unauthorized
        throw new Error('Not authorized, user not found');
      }
      console.log('3. User attached to req.user: Email:', req.user.email, 'Role:', req.user.role);
      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error('AUTHENTICATE MIDDLEWARE ERROR: Token verification failed:', error.message);
      // Specific messages for common JWT errors
      if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Not authorized, token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        res.status(401);
        throw new Error('Not authorized, invalid token');
      }
      res.status(401); // Default to 401 for other token-related errors
      throw new Error('Not authorized, token failed');
    }
  } else { // If no Authorization header or not Bearer
    console.warn('AUTHENTICATE MIDDLEWARE WARNING: No Bearer token in Authorization header.');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Middleware to authorize user roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('--- AUTHORIZE MIDDLEWARE ---');
    console.log('1. Required roles for this route:', roles);
    console.log('2. User role from req.user (from authenticate):', req.user ? req.user.role : 'req.user is undefined (authenticate failed)');

    // Ensure req.user exists and has a role, and that the role is among the allowed roles
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      console.warn('3. AUTHORIZE MIDDLEWARE WARNING: User role not authorized. User:', req.user ? req.user.email : 'N/A', 'Role:', req.user ? req.user.role : 'N/A');
      return res.status(403).json({ message: `Forbidden: User with role ${req.user ? req.user.role : 'N/A'} is not authorized to access this resource.` });
    }
    console.log('3. AUTHORIZE MIDDLEWARE SUCCESS: User authorized.');
    next(); // User has the required role, proceed
  };
};

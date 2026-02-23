/**
 * JWT Authentication Middleware
 *
 * Validates the Bearer token in the Authorization header.
 * On success, attaches the decoded user payload to req.user.
 * On failure, returns 401 Unauthorized.
 *
 * Usage: router.get('/protected', authenticate, handler)
 */

const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

/**
 * authenticate — verifies JWT and attaches req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data to ensure the account is still active
    const result = await query(
      'SELECT id, name, email, role, status, client_id, avatar_url FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (user.status === 'inactive') {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * requireRole — role-based access control middleware factory.
 * Pass one or more allowed roles.
 * Usage: requireRole('super_admin', 'manager')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, requireRole };

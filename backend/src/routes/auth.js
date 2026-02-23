/**
 * Auth Routes — /api/v1/auth
 *
 * Handles:
 *  - Email/password login
 *  - Google OAuth 2.0 (Passport.js)
 *  - Forgot password / reset password
 *  - User invitation flow
 *  - Current user profile (/me)
 */

const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const passport = require('passport');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { sendInviteEmail, sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

// ─── Helper: sign a JWT ───────────────────────────────────────────────────────
function signToken(user) {
  const expiresIn = user.role === 'client' ? '24h' : '8h';
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.status === 'inactive') {
      return res.status(401).json({ error: 'Account is inactive. Contact your administrator.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please use the Google button.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Activate invited users on first password login
    if (user.status === 'invited') {
      await query(
        "UPDATE users SET status = 'active', updated_at = NOW() WHERE id = $1",
        [user.id]
      );
      user.status = 'active';
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        client_id: user.client_id,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── GET /auth/google ─────────────────────────────────────────────────────────
// Initiates Google OAuth flow
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// ─── GET /auth/google/callback ────────────────────────────────────────────────
// Google redirects here after consent
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
  (req, res) => {
    const user = req.user;
    const token = signToken(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    // Redirect to frontend with token in query param — frontend stores it in localStorage
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
);

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    // Always respond with success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      'UPDATE users SET reset_token = $1, reset_expires = $2, updated_at = NOW() WHERE id = $3',
      [tokenHash, expires, user.id]
    );

    try {
      await sendPasswordResetEmail(user.email, user.name, token);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr.message);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];
    const hash = await bcrypt.hash(password, 12);

    await query(
      `UPDATE users
       SET password_hash = $1, reset_token = NULL, reset_expires = NULL,
           status = 'active', updated_at = NOW()
       WHERE id = $2`,
      [hash, user.id]
    );

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ─── POST /auth/invite (Super Admin only) ─────────────────────────────────────
router.post('/invite', authenticate, async (req, res) => {
  try {
    if (!['super_admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only Admins and Managers can invite users' });
    }

    const { name, email, role, client_id } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    const validRoles = ['super_admin', 'manager', 'worker', 'client'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    const result = await query(
      `INSERT INTO users (name, email, role, status, client_id, invite_token, invite_expires)
       VALUES ($1, $2, $3, 'invited', $4, $5, $6)
       RETURNING id, name, email, role, status`,
      [name, email.toLowerCase(), role, client_id || null, tokenHash, expires]
    );

    // Build the invite link — return it in the response so admin can share it manually
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;

    // Try to send email but don't fail if email is not configured
    try {
      await sendInviteEmail(email, name, token, role);
    } catch (emailErr) {
      console.error('Email not configured — invite link generated instead:', emailErr.message);
    }

    res.status(201).json({
      message: 'Invitation created',
      user: result.rows[0],
      inviteLink,
      inviteToken: token,
    });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// ─── POST /auth/accept-invite ─────────────────────────────────────────────────
router.post('/accept-invite', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await query(
      "SELECT * FROM users WHERE invite_token = $1 AND invite_expires > NOW() AND status = 'invited'",
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation link' });
    }

    const user = result.rows[0];
    const hash = await bcrypt.hash(password, 12);

    const updated = await query(
      `UPDATE users
       SET password_hash = $1, invite_token = NULL, invite_expires = NULL,
           status = 'active', updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, status, client_id, avatar_url`,
      [hash, user.id]
    );

    const updatedUser = updated.rows[0];
    const jwtToken = signToken(updatedUser);

    res.json({
      message: 'Account activated successfully',
      token: jwtToken,
      user: updatedUser,
    });
  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.client_id, u.avatar_url,
              c.name AS client_name
       FROM users u
       LEFT JOIN clients c ON u.client_id = c.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
// JWT is stateless — logout is handled client-side by removing the token.
// This endpoint exists for API completeness.
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

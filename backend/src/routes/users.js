/**
 * Users Routes — /api/v1/users
 *
 * Super Admin: full CRUD on all users
 * Worker: GET /users/me/time-entries (own entries only)
 */

const express = require('express');
const bcrypt  = require('bcrypt');
const { query } = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─── GET /users — List all users (Super Admin) ────────────────────────────────
router.get('/', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.avatar_url, u.created_at,
              c.name AS client_name
       FROM users u
       LEFT JOIN clients c ON u.client_id = c.id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── POST /users — Create user (Super Admin) ──────────────────────────────────
router.post('/', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { name, email, password, role, client_id } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    let hash = null;
    if (password) {
      hash = await bcrypt.hash(password, 12);
    }

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, status, client_id)
       VALUES ($1, $2, $3, $4, 'active', $5)
       RETURNING id, name, email, role, status, client_id, avatar_url, created_at`,
      [name, email.toLowerCase(), hash, role, client_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ─── GET /users/:id — Get user by ID (Super Admin) ───────────────────────────
router.get('/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.avatar_url, u.client_id,
              u.created_at, c.name AS client_name
       FROM users u
       LEFT JOIN clients c ON u.client_id = c.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─── PUT /users/:id — Update user (Super Admin) ───────────────────────────────
router.put('/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { name, email, role, client_id, password } = req.body;

    let hash;
    if (password) {
      hash = await bcrypt.hash(password, 12);
    }

    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           client_id = $4,
           ${hash ? 'password_hash = $5,' : ''}
           updated_at = NOW()
       WHERE id = ${hash ? '$6' : '$5'}
       RETURNING id, name, email, role, status, client_id, avatar_url`,
      hash
        ? [name, email?.toLowerCase(), role, client_id || null, hash, req.params.id]
        : [name, email?.toLowerCase(), role, client_id || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ─── PATCH /users/:id/status — Activate/deactivate user (Super Admin) ─────────
router.patch('/:id/status', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive' });
    }

    const result = await query(
      "UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, status",
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// ─── GET /users/me/time-entries — Worker's own time entries ───────────────────
router.get('/me/time-entries', authenticate, async (req, res) => {
  try {
    const { start_date, end_date, campaign_id } = req.query;
    let sql = `
      SELECT te.*, c.name AS campaign_name, cl.name AS client_name, w.name AS website_name
      FROM time_entries te
      JOIN campaigns c ON te.campaign_id = c.id
      JOIN clients cl ON te.client_id = cl.id
      JOIN websites w ON te.website_id = w.id
      WHERE te.user_id = $1
    `;
    const params = [req.user.id];
    let idx = 2;

    if (start_date) { sql += ` AND te.date >= $${idx++}`; params.push(start_date); }
    if (end_date)   { sql += ` AND te.date <= $${idx++}`; params.push(end_date); }
    if (campaign_id){ sql += ` AND te.campaign_id = $${idx++}`; params.push(campaign_id); }

    sql += ' ORDER BY te.date DESC, te.created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

module.exports = router;

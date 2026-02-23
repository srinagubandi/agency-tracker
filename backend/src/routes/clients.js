/**
 * Clients Routes — /api/v1/clients
 *
 * Super Admin: full CRUD on all clients
 * Manager: read-only on assigned clients
 */

const express = require('express');
const { query } = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');
const { createNotifications, getSuperAdminIds } = require('../utils/notifications');

const router = express.Router();

// ─── GET /clients — List clients ──────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    let sql, params = [];

    if (req.user.role === 'super_admin') {
      sql = `
        SELECT c.*, 
               COUNT(DISTINCT a.id) AS account_count,
               COUNT(DISTINCT w.id) AS website_count,
               COUNT(DISTINCT camp.id) AS campaign_count
        FROM clients c
        LEFT JOIN accounts a ON a.client_id = c.id
        LEFT JOIN websites w ON w.client_id = c.id
        LEFT JOIN campaigns camp ON camp.client_id = c.id
        GROUP BY c.id
        ORDER BY c.name ASC
      `;
    } else if (req.user.role === 'manager') {
      sql = `
        SELECT c.*,
               COUNT(DISTINCT a.id) AS account_count,
               COUNT(DISTINCT w.id) AS website_count,
               COUNT(DISTINCT camp.id) AS campaign_count
        FROM clients c
        JOIN client_managers cm ON cm.client_id = c.id AND cm.user_id = $1
        LEFT JOIN accounts a ON a.client_id = c.id
        LEFT JOIN websites w ON w.client_id = c.id
        LEFT JOIN campaigns camp ON camp.client_id = c.id
        GROUP BY c.id
        ORDER BY c.name ASC
      `;
      params = [req.user.id];
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// ─── POST /clients — Create client (Super Admin) ──────────────────────────────
router.post('/', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { name, slug, status, notes } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const result = await query(
      `INSERT INTO clients (name, slug, status, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'), status || 'active', notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A client with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// ─── GET /clients/:id — Get client detail ─────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Check access
    if (req.user.role === 'manager') {
      const access = await query(
        'SELECT 1 FROM client_managers WHERE client_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Fetch assigned managers
    const managers = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url
       FROM users u
       JOIN client_managers cm ON cm.user_id = u.id
       WHERE cm.client_id = $1`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], managers: managers.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// ─── PUT /clients/:id — Update client (Super Admin) ───────────────────────────
router.put('/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { name, slug, status, notes } = req.body;

    const result = await query(
      `UPDATE clients
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           status = COALESCE($3, status),
           notes = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, slug, status, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// ─── POST /clients/:id/assign-manager — Assign manager to client ──────────────
router.post('/:id/assign-manager', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    // Verify the user is a manager
    const userResult = await query(
      "SELECT id, name FROM users WHERE id = $1 AND role = 'manager'",
      [user_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'User not found or is not a manager' });
    }

    await query(
      'INSERT INTO client_managers (client_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, user_id]
    );

    // Notify the manager
    const clientResult = await query('SELECT name FROM clients WHERE id = $1', [req.params.id]);
    const clientName = clientResult.rows[0]?.name || 'a client';
    await createNotifications(
      [user_id],
      'manager_assigned',
      `You've been assigned to manage ${clientName}`,
      'client',
      req.params.id
    );

    res.json({ message: 'Manager assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign manager' });
  }
});

// ─── DELETE /clients/:id/remove-manager — Remove manager from client ──────────
router.delete('/:id/remove-manager/:userId', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    await query(
      'DELETE FROM client_managers WHERE client_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Manager removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove manager' });
  }
});

// ─── GET /clients/:clientId/accounts — List accounts for a client ─────────────
router.get('/:clientId/accounts', authenticate, async (req, res) => {
  try {
    // Access check
    if (req.user.role === 'manager') {
      const access = await query(
        'SELECT 1 FROM client_managers WHERE client_id = $1 AND user_id = $2',
        [req.params.clientId, req.user.id]
      );
      if (access.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
    } else if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      'SELECT * FROM accounts WHERE client_id = $1 ORDER BY name ASC',
      [req.params.clientId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// ─── POST /clients/:clientId/accounts — Create account ───────────────────────
router.post('/:clientId/accounts', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    const { name, type, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Account name is required' });

    const result = await query(
      'INSERT INTO accounts (client_id, name, type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.clientId, name, type || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
});

module.exports = router;

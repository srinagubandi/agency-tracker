/**
 * Change Log Routes — /api/v1/change-log
 */

const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { createNotifications, getClientManagerIds, getSuperAdminIds } = require('../utils/notifications');

const router = express.Router();

// ─── GET /change-log — List change log entries (scoped by role) ───────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { entity_type, client_id, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT cle.*,
             u.name AS author_name, u.avatar_url AS author_avatar,
             c.name AS client_name
      FROM change_log_entries cle
      LEFT JOIN users u ON cle.user_id = u.id
      JOIN clients c ON cle.client_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (req.user.role === 'manager') {
      sql += ` AND cle.client_id IN (
        SELECT client_id FROM client_managers WHERE user_id = $${idx++}
      )`;
      params.push(req.user.id);
    } else if (req.user.role === 'worker') {
      sql += ` AND (
        (cle.entity_type = 'campaign' AND cle.entity_id IN (
          SELECT campaign_id FROM campaign_workers WHERE user_id = $${idx++}
        )) OR
        (cle.entity_type = 'website' AND cle.entity_id IN (
          SELECT camp.website_id FROM campaigns camp
          JOIN campaign_workers cw ON cw.campaign_id = camp.id
          WHERE cw.user_id = $${idx++}
        ))
      )`;
      params.push(req.user.id, req.user.id);
    } else if (req.user.role === 'client') {
      sql += ` AND cle.client_id = $${idx++}`;
      params.push(req.user.client_id);
    }

    if (entity_type) { sql += ` AND cle.entity_type = $${idx++}`; params.push(entity_type); }
    if (client_id && req.user.role === 'super_admin') {
      sql += ` AND cle.client_id = $${idx++}`;
      params.push(client_id);
    }

    sql += ` ORDER BY cle.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Change log fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch change log' });
  }
});

// ─── POST /change-log — Add manual entry ──────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'client') {
      return res.status(403).json({ error: 'Clients cannot create change log entries' });
    }

    const { entity_type, entity_id, client_id, title, body } = req.body;
    if (!entity_type || !entity_id || !client_id || !title || !body) {
      return res.status(400).json({ error: 'entity_type, entity_id, client_id, title, and body are required' });
    }

    const result = await query(
      `INSERT INTO change_log_entries
         (entity_type, entity_id, client_id, user_id, entry_type, title, body)
       VALUES ($1, $2, $3, $4, 'manual', $5, $6)
       RETURNING *`,
      [entity_type, entity_id, client_id, req.user.id, title, body]
    );

    // Notify managers, super admins, and client portal users
    const managerIds = await getClientManagerIds(client_id);
    const adminIds   = await getSuperAdminIds();

    // Get client portal user for this client
    const clientUsers = await query(
      "SELECT id FROM users WHERE client_id = $1 AND role = 'client' AND status = 'active'",
      [client_id]
    );
    const clientUserIds = clientUsers.rows.map(r => r.id);

    const notifyIds = [...new Set([...managerIds, ...adminIds, ...clientUserIds])]
      .filter(id => id !== req.user.id);

    // Get entity name for notification
    let entityName = entity_id;
    if (entity_type === 'website') {
      const w = await query('SELECT name FROM websites WHERE id = $1', [entity_id]);
      entityName = w.rows[0]?.name || entity_id;
    } else if (entity_type === 'campaign') {
      const c = await query('SELECT name FROM campaigns WHERE id = $1', [entity_id]);
      entityName = c.rows[0]?.name || entity_id;
    }

    await createNotifications(
      notifyIds,
      'change_log_added',
      `New update on ${entityName} — added by ${req.user.name}`,
      entity_type,
      entity_id
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create change log entry' });
  }
});

// ─── GET /change-log/website/:websiteId ───────────────────────────────────────
router.get('/website/:websiteId', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT cle.*, u.name AS author_name, u.avatar_url AS author_avatar
       FROM change_log_entries cle
       LEFT JOIN users u ON cle.user_id = u.id
       WHERE cle.entity_type = 'website' AND cle.entity_id = $1
       ORDER BY cle.created_at DESC`,
      [req.params.websiteId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch change log' });
  }
});

// ─── GET /change-log/campaign/:campaignId ─────────────────────────────────────
router.get('/campaign/:campaignId', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT cle.*, u.name AS author_name, u.avatar_url AS author_avatar
       FROM change_log_entries cle
       LEFT JOIN users u ON cle.user_id = u.id
       WHERE cle.entity_type = 'campaign' AND cle.entity_id = $1
       ORDER BY cle.created_at DESC`,
      [req.params.campaignId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch change log' });
  }
});

module.exports = router;

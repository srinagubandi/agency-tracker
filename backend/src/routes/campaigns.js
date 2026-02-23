/**
 * Campaigns Routes — /api/v1/campaigns
 */

const express = require('express');
const { query } = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');
const { createSystemEntry } = require('../utils/changeLog');
const { createNotifications, getClientManagerIds, getSuperAdminIds, getCampaignWorkerIds } = require('../utils/notifications');

const router = express.Router();

// GET /campaigns/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT camp.*, w.name AS website_name, w.url AS website_url, c.name AS client_name
       FROM campaigns camp
       JOIN websites w ON camp.website_id = w.id
       JOIN clients c ON camp.client_id = c.id
       WHERE camp.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });

    // Access check for workers
    if (req.user.role === 'worker') {
      const access = await query(
        'SELECT 1 FROM campaign_workers WHERE campaign_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      if (access.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch assigned workers
    const workers = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url
       FROM users u
       JOIN campaign_workers cw ON cw.user_id = u.id
       WHERE cw.campaign_id = $1`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], workers: workers.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// PUT /campaigns/:id
router.put('/:id', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    const { name, channel_category, channel_platform, status, start_date, end_date, notes } = req.body;

    // Get old status for change log
    const old = await query('SELECT status, name, client_id FROM campaigns WHERE id = $1', [req.params.id]);
    if (old.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });

    const result = await query(
      `UPDATE campaigns
       SET name = COALESCE($1, name),
           channel_category = COALESCE($2, channel_category),
           channel_platform = COALESCE($3, channel_platform),
           status = COALESCE($4, status),
           start_date = COALESCE($5, start_date),
           end_date = $6,
           notes = $7,
           updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [name, channel_category, channel_platform, status, start_date, end_date, notes, req.params.id]
    );

    // If status changed, create system change log entry and notify
    if (status && status !== old.rows[0].status) {
      const camp = result.rows[0];
      await createSystemEntry('campaign', camp.id, camp.client_id,
        `Campaign status changed`,
        `Campaign status changed from ${old.rows[0].status} to ${status}.`
      );

      // Notify workers, managers, and super admins
      const workerIds  = await getCampaignWorkerIds(camp.id);
      const managerIds = await getClientManagerIds(camp.client_id);
      const adminIds   = await getSuperAdminIds();
      const notifyIds  = [...new Set([...workerIds, ...managerIds, ...adminIds])];

      await createNotifications(
        notifyIds,
        'campaign_status_changed',
        `Campaign '${camp.name}' is now ${status}`,
        'campaign',
        camp.id
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// POST /campaigns/:id/assign-worker
router.post('/:id/assign-worker', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const userResult = await query(
      "SELECT id, name FROM users WHERE id = $1 AND role = 'worker'",
      [user_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'User not found or is not a worker' });
    }

    await query(
      'INSERT INTO campaign_workers (campaign_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, user_id]
    );

    // System change log
    const campResult = await query('SELECT name, client_id FROM campaigns WHERE id = $1', [req.params.id]);
    if (campResult.rows.length > 0) {
      const camp = campResult.rows[0];
      await createSystemEntry('campaign', req.params.id, camp.client_id,
        `${userResult.rows[0].name} was assigned to this campaign`,
        `Worker ${userResult.rows[0].name} was assigned to campaign '${camp.name}'.`
      );

      // Notify the worker
      await createNotifications(
        [user_id],
        'worker_assigned',
        `You've been assigned to campaign '${camp.name}'`,
        'campaign',
        req.params.id
      );
    }

    res.json({ message: 'Worker assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign worker' });
  }
});

// DELETE /campaigns/:id/remove-worker/:userId
router.delete('/:id/remove-worker/:userId', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    await query(
      'DELETE FROM campaign_workers WHERE campaign_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Worker removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove worker' });
  }
});

// GET /campaigns — list all campaigns (for worker's assigned campaigns)
router.get('/', authenticate, async (req, res) => {
  try {
    let sql, params = [];

    if (req.user.role === 'worker') {
      sql = `
        SELECT camp.*, w.name AS website_name, c.name AS client_name
        FROM campaigns camp
        JOIN campaign_workers cw ON cw.campaign_id = camp.id AND cw.user_id = $1
        JOIN websites w ON camp.website_id = w.id
        JOIN clients c ON camp.client_id = c.id
        ORDER BY camp.name ASC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'super_admin') {
      sql = `
        SELECT camp.*, w.name AS website_name, c.name AS client_name
        FROM campaigns camp
        JOIN websites w ON camp.website_id = w.id
        JOIN clients c ON camp.client_id = c.id
        ORDER BY c.name ASC, camp.name ASC
      `;
    } else if (req.user.role === 'manager') {
      sql = `
        SELECT camp.*, w.name AS website_name, c.name AS client_name
        FROM campaigns camp
        JOIN websites w ON camp.website_id = w.id
        JOIN clients c ON camp.client_id = c.id
        JOIN client_managers cm ON cm.client_id = c.id AND cm.user_id = $1
        ORDER BY c.name ASC, camp.name ASC
      `;
      params = [req.user.id];
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

module.exports = router;

/**
 * Websites Routes — /api/v1/websites
 */

const express = require('express');
const { query } = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /websites/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT w.*, a.name AS account_name, c.name AS client_name
       FROM websites w
       JOIN accounts a ON w.account_id = a.id
       JOIN clients c ON w.client_id = c.id
       WHERE w.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Website not found' });

    // Access check for workers
    if (req.user.role === 'worker') {
      const access = await query(
        `SELECT 1 FROM campaign_workers cw
         JOIN campaigns camp ON cw.campaign_id = camp.id
         WHERE cw.user_id = $1 AND camp.website_id = $2`,
        [req.user.id, req.params.id]
      );
      if (access.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch website' });
  }
});

// PUT /websites/:id
router.put('/:id', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    const { name, url, platform, status } = req.body;
    const result = await query(
      `UPDATE websites
       SET name = COALESCE($1, name), url = COALESCE($2, url),
           platform = COALESCE($3, platform), status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, url, platform, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Website not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update website' });
  }
});

// GET /websites/:websiteId/campaigns
router.get('/:websiteId/campaigns', authenticate, async (req, res) => {
  try {
    let sql = `
      SELECT camp.*, c.name AS client_name
      FROM campaigns camp
      JOIN clients c ON camp.client_id = c.id
      WHERE camp.website_id = $1
    `;
    const params = [req.params.websiteId];

    if (req.user.role === 'worker') {
      sql += ` AND camp.id IN (
        SELECT campaign_id FROM campaign_workers WHERE user_id = $2
      )`;
      params.push(req.user.id);
    }

    sql += ' ORDER BY camp.name ASC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// POST /websites/:websiteId/campaigns
router.post('/:websiteId/campaigns', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    const { name, channel_category, channel_platform, status, start_date, end_date, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Campaign name is required' });

    const websiteResult = await query('SELECT client_id FROM websites WHERE id = $1', [req.params.websiteId]);
    if (websiteResult.rows.length === 0) return res.status(404).json({ error: 'Website not found' });
    const clientId = websiteResult.rows[0].client_id;

    const result = await query(
      `INSERT INTO campaigns
         (website_id, client_id, name, channel_category, channel_platform, status, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.params.websiteId, clientId, name, channel_category, channel_platform,
       status || 'active', start_date || null, end_date || null, notes || null]
    );

    const { createSystemEntry } = require('../utils/changeLog');
    await createSystemEntry('campaign', result.rows[0].id, clientId,
      `Campaign '${name}' was created`,
      `Campaign '${name}' (${channel_category || 'Unknown channel'}) was created.`
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

module.exports = router;

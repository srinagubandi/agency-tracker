/**
 * Settings Routes — /api/v1/settings
 */

const express = require('express');
const { query } = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /settings — Get agency settings
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM agency_settings LIMIT 1');
    const baseUrl = process.env.UPLOADS_BASE_URL || '';
    const settings = result.rows[0] || {};
    res.json({
      ...settings,
      logo_full_url: settings.logo_url ? `${baseUrl}${settings.logo_url}` : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /settings — Update agency settings (Super Admin)
router.put('/', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { agency_name } = req.body;
    const result = await query(
      'UPDATE agency_settings SET agency_name = COALESCE($1, agency_name), updated_at = NOW() RETURNING *',
      [agency_name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;

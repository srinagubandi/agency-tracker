/**
 * Upload Routes — /api/v1/upload
 *
 * Handles image uploads for agency logo, client logos, and user avatars.
 * Uses multer (memory storage) + sharp for processing before writing to Railway Volume.
 */

const express = require('express');
const { query } = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');
const { upload, processAndSaveImage, deleteImage } = require('../utils/upload');

const router = express.Router();

// ─── POST /upload/agency-logo ─────────────────────────────────────────────────
router.post('/agency-logo', authenticate, requireRole('super_admin'),
  upload.single('image'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No image file provided' });

      // Delete old logo if exists
      const current = await query('SELECT logo_url FROM agency_settings LIMIT 1');
      if (current.rows[0]?.logo_url) deleteImage(current.rows[0].logo_url);

      const relativeUrl = await processAndSaveImage(req.file.buffer, 'agency', 'logo', 'agency');

      await query('UPDATE agency_settings SET logo_url = $1, updated_at = NOW()', [relativeUrl]);

      const baseUrl = process.env.UPLOADS_BASE_URL || '';
      res.json({ logo_url: relativeUrl, full_url: `${baseUrl}${relativeUrl}` });
    } catch (err) {
      console.error('Agency logo upload error:', err);
      res.status(500).json({ error: 'Failed to upload agency logo' });
    }
  }
);

// ─── DELETE /upload/agency-logo ───────────────────────────────────────────────
router.delete('/agency-logo', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const current = await query('SELECT logo_url FROM agency_settings LIMIT 1');
    if (current.rows[0]?.logo_url) deleteImage(current.rows[0].logo_url);
    await query('UPDATE agency_settings SET logo_url = NULL, updated_at = NOW()');
    res.json({ message: 'Agency logo removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove agency logo' });
  }
});

// ─── POST /upload/client-logo/:clientId ───────────────────────────────────────
router.post('/client-logo/:clientId', authenticate, requireRole('super_admin'),
  upload.single('image'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No image file provided' });

      const current = await query('SELECT logo_url FROM clients WHERE id = $1', [req.params.clientId]);
      if (!current.rows.length) return res.status(404).json({ error: 'Client not found' });
      if (current.rows[0]?.logo_url) deleteImage(current.rows[0].logo_url);

      const relativeUrl = await processAndSaveImage(req.file.buffer, 'clients', req.params.clientId, 'client');
      await query('UPDATE clients SET logo_url = $1, updated_at = NOW() WHERE id = $2', [relativeUrl, req.params.clientId]);

      const baseUrl = process.env.UPLOADS_BASE_URL || '';
      res.json({ logo_url: relativeUrl, full_url: `${baseUrl}${relativeUrl}` });
    } catch (err) {
      res.status(500).json({ error: 'Failed to upload client logo' });
    }
  }
);

// ─── DELETE /upload/client-logo/:clientId ─────────────────────────────────────
router.delete('/client-logo/:clientId', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const current = await query('SELECT logo_url FROM clients WHERE id = $1', [req.params.clientId]);
    if (current.rows[0]?.logo_url) deleteImage(current.rows[0].logo_url);
    await query('UPDATE clients SET logo_url = NULL, updated_at = NOW() WHERE id = $1', [req.params.clientId]);
    res.json({ message: 'Client logo removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove client logo' });
  }
});

// ─── POST /upload/avatar — Upload own profile photo ──────────────────────────
router.post('/avatar', authenticate,
  upload.single('image'), async (req, res) => {
    try {
      if (req.user.role === 'client') {
        return res.status(403).json({ error: 'Clients cannot upload avatars' });
      }
      if (!req.file) return res.status(400).json({ error: 'No image file provided' });

      const current = await query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
      if (current.rows[0]?.avatar_url) deleteImage(current.rows[0].avatar_url);

      const relativeUrl = await processAndSaveImage(req.file.buffer, 'avatars', req.user.id, 'avatar');
      await query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [relativeUrl, req.user.id]);

      const baseUrl = process.env.UPLOADS_BASE_URL || '';
      res.json({ avatar_url: relativeUrl, full_url: `${baseUrl}${relativeUrl}` });
    } catch (err) {
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }
);

// ─── DELETE /upload/avatar ────────────────────────────────────────────────────
router.delete('/avatar', authenticate, async (req, res) => {
  try {
    const current = await query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
    if (current.rows[0]?.avatar_url) deleteImage(current.rows[0].avatar_url);
    await query('UPDATE users SET avatar_url = NULL, updated_at = NOW() WHERE id = $1', [req.user.id]);
    res.json({ message: 'Avatar removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

module.exports = router;

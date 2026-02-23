/**
 * Accounts Routes — /api/v1/accounts
 */

const express = require('express');
const { query } = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /accounts/:accountId/websites
router.get('/:accountId/websites', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM websites WHERE account_id = $1 ORDER BY name ASC',
      [req.params.accountId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch websites' });
  }
});

// POST /accounts/:accountId/websites
router.post('/:accountId/websites', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    const { name, url, platform, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Website name is required' });

    // Get client_id from account
    const accountResult = await query('SELECT client_id FROM accounts WHERE id = $1', [req.params.accountId]);
    if (accountResult.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
    const clientId = accountResult.rows[0].client_id;

    const result = await query(
      `INSERT INTO websites (account_id, client_id, name, url, platform, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.accountId, clientId, name, url || null, platform || null, status || 'active']
    );

    const { createSystemEntry } = require('../utils/changeLog');
    await createSystemEntry('website', result.rows[0].id, clientId,
      `Website '${name}' was added`,
      `Website '${url || name}' was added to the account.`
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create website' });
  }
});

// GET /accounts/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM accounts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// PUT /accounts/:id
router.put('/:id', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    const { name, type, notes } = req.body;
    const result = await query(
      `UPDATE accounts SET name = COALESCE($1, name), type = COALESCE($2, type),
       notes = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [name, type, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update account' });
  }
});

module.exports = router;

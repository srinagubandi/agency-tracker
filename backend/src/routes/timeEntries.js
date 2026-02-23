/**
 * Time Entries Routes — /api/v1/time-entries
 *
 * Workers log hours here. Super Admins see all entries.
 * Managers see entries for their assigned clients.
 */

const express = require('express');
const { query } = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');
const { createSystemEntry } = require('../utils/changeLog');
const { createNotifications, getClientManagerIds, getSuperAdminIds } = require('../utils/notifications');

const router = express.Router();

// ─── GET /time-entries — List time entries (filtered by role) ─────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { start_date, end_date, client_id, campaign_id, user_id } = req.query;

    let sql = `
      SELECT te.*,
             u.name AS worker_name, u.avatar_url AS worker_avatar,
             c.name AS client_name,
             camp.name AS campaign_name,
             w.name AS website_name
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      JOIN clients c ON te.client_id = c.id
      JOIN campaigns camp ON te.campaign_id = camp.id
      JOIN websites w ON te.website_id = w.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    // Role-based scoping
    if (req.user.role === 'worker') {
      sql += ` AND te.user_id = $${idx++}`;
      params.push(req.user.id);
    } else if (req.user.role === 'manager') {
      sql += ` AND te.client_id IN (
        SELECT client_id FROM client_managers WHERE user_id = $${idx++}
      )`;
      params.push(req.user.id);
    }
    // super_admin sees all

    if (start_date) { sql += ` AND te.date >= $${idx++}`; params.push(start_date); }
    if (end_date)   { sql += ` AND te.date <= $${idx++}`; params.push(end_date); }
    if (client_id)  { sql += ` AND te.client_id = $${idx++}`; params.push(client_id); }
    if (campaign_id){ sql += ` AND te.campaign_id = $${idx++}`; params.push(campaign_id); }
    if (user_id && req.user.role !== 'worker') {
      sql += ` AND te.user_id = $${idx++}`;
      params.push(user_id);
    }

    sql += ' ORDER BY te.date DESC, te.created_at DESC';

    const result = await query(sql, params);

    // Calculate total hours for the filtered result
    const totalHours = result.rows.reduce((sum, row) => sum + parseFloat(row.hours), 0);

    res.json({ entries: result.rows, total_hours: Math.round(totalHours * 100) / 100 });
  } catch (err) {
    console.error('Fetch time entries error:', err);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// ─── POST /time-entries — Log new time entry (Worker) ─────────────────────────
router.post('/', authenticate, requireRole('worker', 'super_admin', 'manager'), async (req, res) => {
  try {
    const { campaign_id, date, hours, description } = req.body;

    if (!campaign_id || !date || !hours || !description) {
      return res.status(400).json({ error: 'campaign_id, date, hours, and description are required' });
    }

    // Validation
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum < 0.25 || hoursNum > 24) {
      return res.status(400).json({ error: 'Hours must be between 0.25 and 24.00' });
    }
    if (description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }
    const entryDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (entryDate > today) {
      return res.status(400).json({ error: 'Date cannot be in the future' });
    }

    // Get campaign details (includes client_id and website_id)
    const campResult = await query(
      'SELECT * FROM campaigns WHERE id = $1',
      [campaign_id]
    );
    if (campResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    const campaign = campResult.rows[0];

    if (campaign.status === 'completed') {
      return res.status(400).json({ error: 'Cannot log hours against a completed campaign' });
    }

    const result = await query(
      `INSERT INTO time_entries
         (user_id, campaign_id, client_id, website_id, date, hours, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, campaign_id, campaign.client_id, campaign.website_id,
       date, hoursNum, description.trim()]
    );

    const entry = result.rows[0];

    // System change log
    await createSystemEntry('campaign', campaign_id, campaign.client_id,
      `${hoursNum} hours logged by ${req.user.name}`,
      `${hoursNum} hours logged by ${req.user.name} on ${date}: ${description.trim()}`
    );

    // Notify managers and super admins
    const managerIds = await getClientManagerIds(campaign.client_id);
    const adminIds   = await getSuperAdminIds();
    const notifyIds  = [...new Set([...managerIds, ...adminIds])].filter(id => id !== req.user.id);

    await createNotifications(
      notifyIds,
      'time_entry_logged',
      `${req.user.name} logged ${hoursNum} hrs on ${campaign.name}`,
      'campaign',
      campaign_id
    );

    res.status(201).json(entry);
  } catch (err) {
    console.error('Create time entry error:', err);
    res.status(500).json({ error: 'Failed to log time entry' });
  }
});

// ─── PUT /time-entries/:id — Edit time entry ──────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const entryResult = await query('SELECT * FROM time_entries WHERE id = $1', [req.params.id]);
    if (entryResult.rows.length === 0) return res.status(404).json({ error: 'Time entry not found' });

    const entry = entryResult.rows[0];

    // Workers can only edit entries logged today
    if (req.user.role === 'worker') {
      if (entry.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your own time entries' });
      }
      const entryDate = new Date(entry.date).toDateString();
      const today = new Date().toDateString();
      if (entryDate !== today) {
        return res.status(403).json({ error: 'You can only edit time entries logged today' });
      }
    } else if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { hours, description, date } = req.body;

    if (hours) {
      const hoursNum = parseFloat(hours);
      if (isNaN(hoursNum) || hoursNum < 0.25 || hoursNum > 24) {
        return res.status(400).json({ error: 'Hours must be between 0.25 and 24.00' });
      }
    }

    const result = await query(
      `UPDATE time_entries
       SET hours = COALESCE($1, hours),
           description = COALESCE($2, description),
           date = COALESCE($3, date),
           updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [hours ? parseFloat(hours) : null, description, date, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// ─── DELETE /time-entries/:id — Delete time entry (Super Admin only) ──────────
router.delete('/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM time_entries WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Time entry not found' });
    res.json({ message: 'Time entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

module.exports = router;

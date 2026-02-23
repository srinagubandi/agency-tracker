/**
 * Reports Routes — /api/v1/reports
 *
 * All reports include a date range filter (default: current month).
 * Reports are view-only — no export at launch.
 */

const express = require('express');
const { query } = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper: get default date range (current month)
function getDateRange(req) {
  const now = new Date();
  const start = req.query.start_date ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const end = req.query.end_date ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
  return { start, end };
}

// ─── GET /reports/hours-by-employee ───────────────────────────────────────────
router.get('/hours-by-employee', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    let sql, params;

    if (req.user.role === 'super_admin') {
      sql = `
        SELECT u.id, u.name, u.email, u.avatar_url,
               SUM(te.hours) AS total_hours,
               json_agg(json_build_object(
                 'client_id', c.id,
                 'client_name', c.name,
                 'hours', te.hours
               )) AS client_breakdown
        FROM time_entries te
        JOIN users u ON te.user_id = u.id
        JOIN clients c ON te.client_id = c.id
        WHERE te.date BETWEEN $1 AND $2
        GROUP BY u.id, u.name, u.email, u.avatar_url
        ORDER BY total_hours DESC
      `;
      params = [start, end];
    } else {
      sql = `
        SELECT u.id, u.name, u.email, u.avatar_url,
               SUM(te.hours) AS total_hours,
               json_agg(json_build_object(
                 'client_id', c.id,
                 'client_name', c.name,
                 'hours', te.hours
               )) AS client_breakdown
        FROM time_entries te
        JOIN users u ON te.user_id = u.id
        JOIN clients c ON te.client_id = c.id
        JOIN client_managers cm ON cm.client_id = te.client_id AND cm.user_id = $3
        WHERE te.date BETWEEN $1 AND $2
        GROUP BY u.id, u.name, u.email, u.avatar_url
        ORDER BY total_hours DESC
      `;
      params = [start, end, req.user.id];
    }

    const result = await query(sql, params);
    res.json({ start_date: start, end_date: end, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ─── GET /reports/hours-by-client ─────────────────────────────────────────────
router.get('/hours-by-client', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    let sql, params;

    if (req.user.role === 'super_admin') {
      sql = `
        SELECT c.id, c.name, c.logo_url,
               SUM(te.hours) AS total_hours,
               json_agg(DISTINCT json_build_object(
                 'campaign_id', camp.id,
                 'campaign_name', camp.name,
                 'hours', te.hours
               )) AS campaign_breakdown
        FROM time_entries te
        JOIN clients c ON te.client_id = c.id
        JOIN campaigns camp ON te.campaign_id = camp.id
        WHERE te.date BETWEEN $1 AND $2
        GROUP BY c.id, c.name, c.logo_url
        ORDER BY total_hours DESC
      `;
      params = [start, end];
    } else {
      sql = `
        SELECT c.id, c.name, c.logo_url,
               SUM(te.hours) AS total_hours,
               json_agg(DISTINCT json_build_object(
                 'campaign_id', camp.id,
                 'campaign_name', camp.name,
                 'hours', te.hours
               )) AS campaign_breakdown
        FROM time_entries te
        JOIN clients c ON te.client_id = c.id
        JOIN campaigns camp ON te.campaign_id = camp.id
        JOIN client_managers cm ON cm.client_id = te.client_id AND cm.user_id = $3
        WHERE te.date BETWEEN $1 AND $2
        GROUP BY c.id, c.name, c.logo_url
        ORDER BY total_hours DESC
      `;
      params = [start, end, req.user.id];
    }

    const result = await query(sql, params);
    res.json({ start_date: start, end_date: end, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ─── GET /reports/hours-by-campaign ───────────────────────────────────────────
router.get('/hours-by-campaign', authenticate, requireRole('super_admin', 'manager'), async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    let sql, params;

    if (req.user.role === 'super_admin') {
      sql = `
        SELECT camp.id, camp.name, camp.channel_category, camp.channel_platform, camp.status,
               c.name AS client_name,
               SUM(te.hours) AS total_hours
        FROM time_entries te
        JOIN campaigns camp ON te.campaign_id = camp.id
        JOIN clients c ON te.client_id = c.id
        WHERE te.date BETWEEN $1 AND $2
        GROUP BY camp.id, camp.name, camp.channel_category, camp.channel_platform, camp.status, c.name
        ORDER BY total_hours DESC
      `;
      params = [start, end];
    } else {
      sql = `
        SELECT camp.id, camp.name, camp.channel_category, camp.channel_platform, camp.status,
               c.name AS client_name,
               SUM(te.hours) AS total_hours
        FROM time_entries te
        JOIN campaigns camp ON te.campaign_id = camp.id
        JOIN clients c ON te.client_id = c.id
        JOIN client_managers cm ON cm.client_id = te.client_id AND cm.user_id = $3
        WHERE te.date BETWEEN $1 AND $2
        GROUP BY camp.id, camp.name, camp.channel_category, camp.channel_platform, camp.status, c.name
        ORDER BY total_hours DESC
      `;
      params = [start, end, req.user.id];
    }

    const result = await query(sql, params);
    res.json({ start_date: start, end_date: end, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ─── GET /reports/my-hours — Worker's own hours ───────────────────────────────
router.get('/my-hours', authenticate, requireRole('worker'), async (req, res) => {
  try {
    const { start, end } = getDateRange(req);

    const result = await query(
      `SELECT te.date, te.hours, te.description,
              c.name AS client_name, camp.name AS campaign_name
       FROM time_entries te
       JOIN clients c ON te.client_id = c.id
       JOIN campaigns camp ON te.campaign_id = camp.id
       WHERE te.user_id = $1 AND te.date BETWEEN $2 AND $3
       ORDER BY te.date DESC`,
      [req.user.id, start, end]
    );

    const totalHours = result.rows.reduce((sum, r) => sum + parseFloat(r.hours), 0);

    res.json({
      start_date: start,
      end_date: end,
      total_hours: Math.round(totalHours * 100) / 100,
      entries: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ─── GET /reports/client-summary/:clientId — Client portal report ─────────────
router.get('/client-summary/:clientId', authenticate, async (req, res) => {
  try {
    // Clients can only see their own data
    if (req.user.role === 'client' && req.user.client_id !== req.params.clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!['super_admin', 'manager', 'client'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { start, end } = getDateRange(req);

    // Total hours this month
    const hoursResult = await query(
      `SELECT SUM(hours) AS total_hours FROM time_entries
       WHERE client_id = $1 AND date BETWEEN $2 AND $3`,
      [req.params.clientId, start, end]
    );

    // Hours by campaign
    const campaignHours = await query(
      `SELECT camp.id, camp.name, camp.status, camp.channel_category,
              SUM(te.hours) AS total_hours
       FROM time_entries te
       JOIN campaigns camp ON te.campaign_id = camp.id
       WHERE te.client_id = $1 AND te.date BETWEEN $2 AND $3
       GROUP BY camp.id, camp.name, camp.status, camp.channel_category
       ORDER BY total_hours DESC`,
      [req.params.clientId, start, end]
    );

    // Active campaigns
    const activeCampaigns = await query(
      `SELECT camp.id, camp.name, camp.status, camp.channel_category, camp.channel_platform,
              camp.start_date, camp.end_date
       FROM campaigns camp
       WHERE camp.client_id = $1 AND camp.status != 'completed'
       ORDER BY camp.name ASC`,
      [req.params.clientId]
    );

    // Team members
    const team = await query(
      `SELECT DISTINCT u.id, u.name, u.role, u.avatar_url
       FROM users u
       JOIN campaign_workers cw ON cw.user_id = u.id
       JOIN campaigns camp ON cw.campaign_id = camp.id
       WHERE camp.client_id = $1 AND u.status = 'active'
       ORDER BY u.name ASC`,
      [req.params.clientId]
    );

    res.json({
      start_date: start,
      end_date: end,
      total_hours: parseFloat(hoursResult.rows[0]?.total_hours || 0),
      hours_by_campaign: campaignHours.rows,
      active_campaigns: activeCampaigns.rows,
      team: team.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate client report' });
  }
});

module.exports = router;

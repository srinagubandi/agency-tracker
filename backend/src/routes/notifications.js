/**
 * Notifications Routes — /api/v1/notifications
 */

const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /notifications — Get current user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );

    const unreadCount = result.rows.filter(n => !n.read).length;
    res.json({ notifications: result.rows, unread_count: unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /notifications/:id/read — Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PATCH /notifications/read-all — Mark all as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;

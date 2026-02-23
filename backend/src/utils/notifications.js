/**
 * Notification Service
 *
 * Creates in-app notifications for various trigger events.
 * Notifications are stored in the notifications table and surfaced
 * via the bell icon in the navbar.
 *
 * Max 100 notifications per user — older ones are auto-pruned.
 */

const { query } = require('../db/pool');

/**
 * Create a notification for one or more users.
 * @param {string[]} userIds    - Array of user UUIDs to notify
 * @param {string}   type       - Notification type key (e.g. 'time_entry_logged')
 * @param {string}   message    - Human-readable notification message
 * @param {string}   entityType - 'campaign', 'website', 'user', etc.
 * @param {string}   entityId   - UUID of the related entity
 */
async function createNotifications(userIds, type, message, entityType, entityId) {
  if (!userIds || userIds.length === 0) return;

  for (const userId of userIds) {
    try {
      await query(
        `INSERT INTO notifications (user_id, type, message, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, type, message, entityType, entityId]
      );

      // Prune: keep only the 100 most recent notifications for this user
      await query(
        `DELETE FROM notifications
         WHERE user_id = $1
           AND id NOT IN (
             SELECT id FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 100
           )`,
        [userId]
      );
    } catch (err) {
      // Non-fatal — log but don't fail the main request
      console.error(`Failed to create notification for user ${userId}:`, err.message);
    }
  }
}

/**
 * Get all managers assigned to a client.
 * Used to notify managers when events happen on their clients.
 */
async function getClientManagerIds(clientId) {
  const result = await query(
    'SELECT user_id FROM client_managers WHERE client_id = $1',
    [clientId]
  );
  return result.rows.map(r => r.user_id);
}

/**
 * Get all super admins.
 */
async function getSuperAdminIds() {
  const result = await query(
    "SELECT id FROM users WHERE role = 'super_admin' AND status = 'active'"
  );
  return result.rows.map(r => r.id);
}

/**
 * Get all workers assigned to a campaign.
 */
async function getCampaignWorkerIds(campaignId) {
  const result = await query(
    'SELECT user_id FROM campaign_workers WHERE campaign_id = $1',
    [campaignId]
  );
  return result.rows.map(r => r.user_id);
}

module.exports = {
  createNotifications,
  getClientManagerIds,
  getSuperAdminIds,
  getCampaignWorkerIds,
};

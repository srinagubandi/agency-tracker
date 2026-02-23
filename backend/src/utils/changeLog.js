/**
 * Change Log Service
 *
 * Creates system-generated change log entries automatically when key events occur.
 * Manual entries are created via the change log API route.
 */

const { query } = require('../db/pool');

/**
 * Create a system change log entry.
 * @param {string} entityType - 'website' or 'campaign'
 * @param {string} entityId   - UUID of the website or campaign
 * @param {string} clientId   - UUID of the client (denormalized for access control)
 * @param {string} title      - Short summary (max 200 chars)
 * @param {string} body       - Full description
 */
async function createSystemEntry(entityType, entityId, clientId, title, body) {
  try {
    await query(
      `INSERT INTO change_log_entries
         (entity_type, entity_id, client_id, user_id, entry_type, title, body)
       VALUES ($1, $2, $3, NULL, 'system', $4, $5)`,
      [entityType, entityId, clientId, title, body]
    );
  } catch (err) {
    // Non-fatal — log but don't fail the main request
    console.error('Failed to create system change log entry:', err.message);
  }
}

module.exports = { createSystemEntry };

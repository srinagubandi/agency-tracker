/**
 * PostgreSQL Connection Pool
 *
 * Uses the 'pg' library's Pool for connection management.
 * DATABASE_URL is automatically provided by Railway's PostgreSQL service.
 * For local development, set DATABASE_URL in your .env file.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway PostgreSQL requires SSL in production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,              // maximum number of connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection errors to prevent unhandled promise rejections
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Helper: run a single query with optional parameters.
 * Usage: const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };

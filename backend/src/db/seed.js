/**
 * Database Seed Script
 *
 * Creates the initial Super Admin user so you can log in on first deploy.
 * Run with: node src/db/seed.js
 *
 * Default credentials (change immediately after first login):
 *   Email:    admin@agency.com
 *   Password: Admin@123456
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
      ? { rejectUnauthorized: false }
      : false,
  });

  const client = await pool.connect();
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@agency.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
    const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

    // Check if a super_admin already exists
    const existing = await client.query(
      "SELECT id FROM users WHERE role = 'super_admin' LIMIT 1"
    );
    if (existing.rows.length > 0) {
      console.log('Super Admin already exists — skipping seed.');
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'super_admin', 'active')`,
      [name, email, hash]
    );
    console.log(`Super Admin created: ${email}`);
    console.log('IMPORTANT: Change the default password immediately after first login!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

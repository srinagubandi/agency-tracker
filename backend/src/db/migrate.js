/**
 * Database Migration Script
 *
 * Creates all tables in the correct dependency order.
 * Run with: node src/db/migrate.js
 *
 * This script is idempotent — it uses CREATE TABLE IF NOT EXISTS so it can be
 * run multiple times safely (e.g. on every Railway deploy via the start command).
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const migrations = `
  -- Enable UUID generation
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- ─── AGENCY SETTINGS ──────────────────────────────────────────────────────
  -- Single-row table holding agency-wide configuration
  CREATE TABLE IF NOT EXISTS agency_settings (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_name  VARCHAR(100) NOT NULL DEFAULT 'My Agency',
    logo_url     VARCHAR(500),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- Insert the single agency settings row if it does not exist
  INSERT INTO agency_settings (agency_name)
  SELECT 'My Agency'
  WHERE NOT EXISTS (SELECT 1 FROM agency_settings);

  -- ─── CLIENTS ──────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS clients (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    logo_url    VARCHAR(500),
    notes       TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- ─── USERS ────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('super_admin','manager','worker','client')),
    status        VARCHAR(20) NOT NULL DEFAULT 'invited' CHECK (status IN ('active','invited','inactive')),
    client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
    avatar_url    VARCHAR(500),
    google_id     VARCHAR(100),
    invite_token  TEXT,
    invite_expires TIMESTAMP,
    reset_token   TEXT,
    reset_expires  TIMESTAMP,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- ─── CLIENT MANAGERS (join table) ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS client_managers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(client_id, user_id)
  );

  -- ─── ACCOUNTS ─────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS accounts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    type       VARCHAR(50),
    notes      TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- ─── WEBSITES ─────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS websites (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    url        VARCHAR(255),
    platform   VARCHAR(50),
    status     VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- ─── CAMPAIGNS ────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS campaigns (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id       UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name             VARCHAR(100) NOT NULL,
    channel_category VARCHAR(100),
    channel_platform VARCHAR(100),
    status           VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
    start_date       DATE,
    end_date         DATE,
    notes            TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- ─── CAMPAIGN WORKERS (join table) ────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS campaign_workers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, user_id)
  );

  -- ─── TIME ENTRIES ─────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS time_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    website_id  UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    hours       DECIMAL(4,2) NOT NULL CHECK (hours >= 0.25 AND hours <= 24.00),
    description TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- ─── CHANGE LOG ENTRIES ───────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS change_log_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('website','campaign')),
    entity_id   UUID NOT NULL,
    client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    entry_type  VARCHAR(20) NOT NULL CHECK (entry_type IN ('manual','system')),
    title       VARCHAR(200) NOT NULL,
    body        TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    message     TEXT NOT NULL,
    read        BOOLEAN NOT NULL DEFAULT FALSE,
    entity_type VARCHAR(50),
    entity_id   UUID,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
  );

  -- ─── INDEXES for common query patterns ────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_time_entries_user_id     ON time_entries(user_id);
  CREATE INDEX IF NOT EXISTS idx_time_entries_client_id   ON time_entries(client_id);
  CREATE INDEX IF NOT EXISTS idx_time_entries_campaign_id ON time_entries(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_time_entries_date        ON time_entries(date);
  CREATE INDEX IF NOT EXISTS idx_change_log_entity        ON change_log_entries(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_change_log_client        ON change_log_entries(client_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user       ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_campaigns_client         ON campaigns(client_id);
  CREATE INDEX IF NOT EXISTS idx_websites_client          ON websites(client_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running database migrations...');
    await client.query(migrations);
    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

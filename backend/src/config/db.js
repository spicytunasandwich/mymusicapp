const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isNeonOrSsl = process.env.DATABASE_URL?.includes('neon.tech') ||
  process.env.DATABASE_URL?.includes('sslmode=require') ||
  process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/audira_db',
  ssl: isNeonOrSsl ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Auto-migrate database tables, columns, and indexes safely
async function initDbColumns() {
  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`,
    `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_attempts INT DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_last_sent_at TIMESTAMPTZ`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMPTZ`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_attempts INT DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_last_sent_at TIMESTAMPTZ`,
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS gradient_top VARCHAR(16) DEFAULT '#1A2E22'`,
    `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS gradient_bottom VARCHAR(16) DEFAULT '#121212'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name_font VARCHAR(64) DEFAULT 'Plus Jakarta Sans'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS presence_status VARCHAR(16) DEFAULT 'offline'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_track_json JSONB`,
    `ALTER TABLE playlists ADD COLUMN IF NOT EXISTS privacy VARCHAR(16) DEFAULT 'public'`,
    `ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_id VARCHAR(64)`,
    `ALTER TABLE tracks ADD COLUMN IF NOT EXISTS preview_url TEXT`,
    `ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT`,
    `ALTER TABLE users ALTER COLUMN banner_url TYPE TEXT`,
    `CREATE TABLE IF NOT EXISTS media_uploads (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS user_badges (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_key VARCHAR(64) NOT NULL,
      badge_name VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      icon VARCHAR(50) NOT NULL,
      category VARCHAR(50) DEFAULT 'activity',
      earned_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, badge_key)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`
  ];

  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.warn(`DB migration notice [${sql.slice(0, 32)}...]:`, err.message);
    }
  }
  console.log('✅ DB tables and columns verified.');
}

initDbColumns();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};


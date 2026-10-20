const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/audira_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Auto-migrate 6-digit verification, reset code, and Google OAuth columns
async function initDbColumns() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_attempts INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_last_sent_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_attempts INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_last_sent_at TIMESTAMPTZ;
      ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS gradient_top VARCHAR(16) DEFAULT '#1A102E';
      ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS gradient_bottom VARCHAR(16) DEFAULT '#08090E';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name_font VARCHAR(64) DEFAULT 'Plus Jakarta Sans';
    `);
    console.log('✅ DB auth columns verified (6-digit verification, reset codes, google_id).');
  } catch (err) {
    console.warn('DB column initialization note:', err.message);
  }
}

initDbColumns();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};


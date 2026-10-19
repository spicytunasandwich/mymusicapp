const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrate() {
  console.log('🔄 Running database migrations...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('✅ Database schema migrated successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

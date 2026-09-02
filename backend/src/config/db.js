const { Pool } = require('pg');

// =========================================================
// PostgreSQL ulanishi — Supabase Connection Pooler (port 6543)
// Transaction mode: prepared statements o'chirilgan
// =========================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool xatosi:', err.message);
});

// =========================================================
// Asosiy jadval yaratish
// =========================================================
async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gym_data (
      key         TEXT PRIMARY KEY,
      data        JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✅ PostgreSQL jadvali tayyor (gym_data)');
}

module.exports = { pool, createTables };

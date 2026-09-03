const { Pool } = require('pg');

// =========================================================
// PostgreSQL ulanishi — Supabase Connection Pooler (port 6543)
// Keep-Alive va uzilishlarni oldini olish sozlamalari bilan
// =========================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('⚠️ PostgreSQL pool xatosi (avtomatik qayta ulanadi):', err.message);
});

// Xatoliklarda (uzilishlarda) qayta urinish funksiyasi
async function queryWithRetry(text, params = [], maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      attempt++;
      console.warn(`⚠️ DB Query urinish ${attempt}/${maxRetries} xatosi: ${err.message}`);
      if (attempt >= maxRetries) throw err;
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
}

// =========================================================
// Asosiy Relational Jadvallarni Yaratish
// Foydalanuvchi Supabase boshqaruv panelida (Table Editor)
// har bir jadval va qatorni to'g'ridan-to'g'ri ko'rishi uchun
// =========================================================
async function createTables() {
  // 1. Zaxira va umumiy kolleksiyalar uchun gym_data jadvali
  await queryWithRetry(`
    CREATE TABLE IF NOT EXISTS gym_data (
      key         TEXT PRIMARY KEY,
      data        JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 2. Mustaqil Relational MEMBERS jadvali (Supabase Table Editor uchun)
  await queryWithRetry(`
    CREATE TABLE IF NOT EXISTS members (
      id                VARCHAR PRIMARY KEY,
      full_name         TEXT NOT NULL,
      phone             TEXT,
      telegram_id       TEXT,
      gender            TEXT DEFAULT 'Erkak',
      subscription_id   TEXT,
      subscription_name TEXT,
      start_date        DATE,
      end_date          DATE,
      remaining_visits  INT DEFAULT 0,
      status            TEXT DEFAULT 'Active',
      total_paid        NUMERIC DEFAULT 0,
      debt              NUMERIC DEFAULT 0,
      payment_method    TEXT DEFAULT 'Naqd',
      payment_history   JSONB DEFAULT '[]'::jsonb,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 3. Mustaqil Relational POS_PRODUCTS jadvali
  await queryWithRetry(`
    CREATE TABLE IF NOT EXISTS pos_products (
      id          VARCHAR PRIMARY KEY,
      name        TEXT NOT NULL,
      category    TEXT DEFAULT 'Boshqa',
      price       NUMERIC DEFAULT 0,
      stock       INT DEFAULT 0,
      unit        TEXT DEFAULT 'dona',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 4. Mustaqil Relational POS_SALES jadvali
  await queryWithRetry(`
    CREATE TABLE IF NOT EXISTS pos_sales (
      id              VARCHAR PRIMARY KEY,
      member_id       TEXT,
      member_name     TEXT,
      items           JSONB NOT NULL DEFAULT '[]'::jsonb,
      total_amount    NUMERIC DEFAULT 0,
      payment_method  TEXT DEFAULT 'Naqd',
      date            TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 5. Mustaqil Relational ATTENDANCE jadvali
  await queryWithRetry(`
    CREATE TABLE IF NOT EXISTS attendance (
      id              VARCHAR PRIMARY KEY,
      member_id       TEXT,
      member_name     TEXT,
      phone           TEXT,
      locker_number   TEXT,
      check_in_time   TIMESTAMPTZ DEFAULT NOW(),
      check_out_time  TIMESTAMPTZ,
      status          TEXT DEFAULT 'Zalda'
    )
  `);

  console.log('✅ PostgreSQL jadvallari tayyor (members, pos_products, pos_sales, attendance, gym_data)');
}

module.exports = { pool, createTables, queryWithRetry };

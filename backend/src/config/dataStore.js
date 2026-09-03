const fs = require('fs');
const path = require('path');
const { pool, createTables, queryWithRetry } = require('./db');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Lokal fayldan o'qish yordamchisi
function readLocalJson(key) {
  try {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (raw && raw.trim()) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn(`Lokal faylni o'qishda ogohlantirish (${key}):`, e.message);
  }
  return null;
}

// Lokal faylga zaxira saqlash (Offline / Redundancy backup)
function writeLocalJson(key, data) {
  try {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`Lokal faylga yozishda ogohlantirish (${key}):`, e.message);
  }
}

const initialData = {
  settings: {
    gymName: "CHAMPION GYM & FITNESS",
    gymLogo: "",
    currency: "SO'M",
    googleSheetsId: "",
    googleCredentialsJSON: "",
    telegramBotToken: "",
    autoTelegramCheckIn: true,
    autoTelegramExpiryWarning: true,
    expiryWarningDays: 3,
    lastSheetsSync: null
  },
  subscriptions: [
    { id: "sub_1", name: "Standart (1 Oylik)", durationDays: 30, price: 300000, visitsCount: 30, description: "Haftada 6 kun, soat 08:00 dan 22:00 gacha zalga kirish" },
    { id: "sub_2", name: "VIP (1 Oylik + Murabbiy)", durationDays: 30, price: 500000, visitsCount: 30, description: "Shaxsiy murabbiy, dush, sauna va cheksiz zal" },
    { id: "sub_3", name: "Talaba / O'quvchi (1 Oylik)", durationDays: 30, price: 220000, visitsCount: 30, description: "Soat 12:00 dan 17:00 gacha talabalar uchun maxsus tarif" },
    { id: "sub_4", name: "Kunlik Kirish (1 Marta)", durationDays: 1, price: 30000, visitsCount: 1, description: "Bir martalik mashg'ulot uchun" },
    { id: "sub_5", name: "Yillik Cheksiz (1 Yil)", durationDays: 365, price: 2800000, visitsCount: 999, description: "1 yil davomida VIP imtiyozlar" }
  ],
  members:     [],
  attendance:  [],
  lockers: {
    male:   Array.from({ length: 30 }, (_, i) => ({ number: `M-${i + 1}`, status: "Free", assignedTo: null })),
    female: Array.from({ length: 20 }, (_, i) => ({ number: `F-${i + 1}`, status: "Free", assignedTo: null }))
  },
  posProducts: [],
  posSales:    [],
  expenses:    [],
  trainers:    []
};

// =========================================================
// Supabase DataStore Boshlang'ich Sozlash & Migratsiya
// =========================================================
async function initDataStore() {
  await createTables();

  // 1. gym_data jadvaliga boshlang'ich default ma'lumotlar
  const result = await queryWithRetry('SELECT key FROM gym_data');
  const existingKeys = new Set(result.rows.map(r => r.key));

  for (const [key, value] of Object.entries(initialData)) {
    if (!existingKeys.has(key)) {
      // Agar lokal JSON faylda ma'lumot bo'lsa, avval uni olamiz!
      const localData = readLocalJson(key);
      const dataToSave = localData || value;
      await queryWithRetry(
        `INSERT INTO gym_data (key, data) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(dataToSave)]
      );
    }
  }

  // 2. Relational MEMBERS jadvalini sinxronlash (Supabase Table Editor uchun)
  await syncMembersRelational();

  // 3. Relational POS_PRODUCTS jadvalini sinxronlash
  await syncPosProductsRelational();

  // 4. Relational POS_SALES jadvalini sinxronlash
  await syncPosSalesRelational();

  console.log(`✅ DataStore to'liq tayyor (Supabase relational + JSON zaxira).`);
}

// Asl mijozlar ro'yxatini Supabase `members` jadvaliga ko'chirish / sinxronlash
async function syncMembersRelational() {
  try {
    const dbCountRes = await queryWithRetry('SELECT COUNT(*) FROM members');
    const dbCount = parseInt(dbCountRes.rows[0].count, 10);

    // Agar relational jadvalda mijozlar kam bo'lsa, gym_data va local members.json dan birlashtirib yuklaymiz
    let membersList = [];
    const gymDataRes = await queryWithRetry("SELECT data FROM gym_data WHERE key = 'members'");
    if (gymDataRes.rows.length > 0 && Array.isArray(gymDataRes.rows[0].data)) {
      membersList = gymDataRes.rows[0].data;
    }

    const localMembers = readLocalJson('members');
    if (Array.isArray(localMembers) && localMembers.length > 0) {
      // ID bo'yicha birlashtirish
      const idMap = new Map();
      localMembers.forEach(m => idMap.set(m.id, m));
      membersList.forEach(m => idMap.set(m.id, m)); // gym_data yangiroq bo'lishi mumkin
      membersList = Array.from(idMap.values());
    }

    if (dbCount === 0 && membersList.length > 0) {
      console.log(`🔄 ${membersList.length} ta mijoz Supabase 'members' jadvaliga ko'chirilmoqda...`);
      for (const m of membersList) {
        await upsertMemberDirect(m);
      }
      console.log(`✅ Mijozlar Supabase 'members' jadvaliga muvaffaqiyatli saqlandi!`);
    }
  } catch (err) {
    console.error("Mijozlarni sinxronlashda xatolik:", err.message);
  }
}

// POS mahsulotlarni Supabase `pos_products` jadvaliga sinxronlash
async function syncPosProductsRelational() {
  try {
    const countRes = await queryWithRetry('SELECT COUNT(*) FROM pos_products');
    const count = parseInt(countRes.rows[0].count, 10);

    let products = [];
    const gymDataRes = await queryWithRetry("SELECT data FROM gym_data WHERE key = 'posProducts'");
    if (gymDataRes.rows.length > 0 && Array.isArray(gymDataRes.rows[0].data)) {
      products = gymDataRes.rows[0].data;
    }

    const localProds = readLocalJson('posProducts');
    if (Array.isArray(localProds) && localProds.length > 0) {
      const idMap = new Map();
      localProds.forEach(p => idMap.set(p.id, p));
      products.forEach(p => idMap.set(p.id, p));
      products = Array.from(idMap.values());
    }

    if (count === 0 && products.length > 0) {
      console.log(`🔄 ${products.length} ta mahsulot Supabase 'pos_products' jadvaliga ko'chirilmoqda...`);
      for (const p of products) {
        await queryWithRetry(
          `INSERT INTO pos_products (id, name, category, price, stock, unit, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (id) DO UPDATE SET name = $2, category = $3, price = $4, stock = $5, unit = $6`,
          [p.id, p.name, p.category || 'Boshqa', p.price || 0, p.stock || 0, p.unit || 'dona']
        );
      }
      console.log(`✅ POS mahsulotlar Supabase 'pos_products' jadvaliga saqlandi!`);
    }
  } catch (err) {
    console.error("POS mahsulotlarni sinxronlashda xatolik:", err.message);
  }
}

// POS savdolarni Supabase `pos_sales` jadvaliga sinxronlash
async function syncPosSalesRelational() {
  try {
    const countRes = await queryWithRetry('SELECT COUNT(*) FROM pos_sales');
    const count = parseInt(countRes.rows[0].count, 10);

    let sales = [];
    const gymDataRes = await queryWithRetry("SELECT data FROM gym_data WHERE key = 'posSales'");
    if (gymDataRes.rows.length > 0 && Array.isArray(gymDataRes.rows[0].data)) {
      sales = gymDataRes.rows[0].data;
    }

    const localSales = readLocalJson('posSales');
    if (Array.isArray(localSales) && localSales.length > 0) {
      const idMap = new Map();
      localSales.forEach(s => idMap.set(s.id, s));
      sales.forEach(s => idMap.set(s.id, s));
      sales = Array.from(idMap.values());
    }

    if (count === 0 && sales.length > 0) {
      console.log(`🔄 ${sales.length} ta savdo Supabase 'pos_sales' jadvaliga ko'chirilmoqda...`);
      for (const s of sales) {
        await queryWithRetry(
          `INSERT INTO pos_sales (id, member_id, member_name, items, total_amount, payment_method, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [s.id, s.memberId || null, s.memberName || 'Oddiy Xaridor', JSON.stringify(s.items || []), s.totalAmount || 0, s.paymentMethod || 'Naqd', s.date || new Date().toISOString()]
        );
      }
      console.log(`✅ POS savdolar Supabase 'pos_sales' jadvaliga saqlandi!`);
    }
  } catch (err) {
    console.error("POS savdolarni sinxronlashda xatolik:", err.message);
  }
}

// Alohida a'zoni to'g'ridan-to'g'ri Supabase `members` jadvaliga yozish
async function upsertMemberDirect(m) {
  await queryWithRetry(
    `INSERT INTO members (
      id, full_name, phone, telegram_id, gender,
      subscription_id, subscription_name, start_date, end_date,
      remaining_visits, status, total_paid, debt, payment_method,
      payment_history, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, $11, $12, $13, $14,
      $15, $16, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = $2, phone = $3, telegram_id = $4, gender = $5,
      subscription_id = $6, subscription_name = $7, start_date = $8, end_date = $9,
      remaining_visits = $10, status = $11, total_paid = $12, debt = $13,
      payment_method = $14, payment_history = $15, updated_at = NOW()`,
    [
      m.id,
      m.fullName || m.full_name || 'Ismsiz Mijoz',
      m.phone || '',
      m.telegramId || m.telegram_id || '',
      m.gender || 'Erkak',
      m.subscriptionId || m.subscription_id || 'sub_1',
      m.subscriptionName || m.subscription_name || 'Standart (1 Oylik)',
      m.startDate || m.start_date || new Date().toISOString().split('T')[0],
      m.endDate || m.end_date || new Date().toISOString().split('T')[0],
      m.remainingVisits !== undefined ? m.remainingVisits : (m.remaining_visits || 0),
      m.status || 'Active',
      m.totalPaid !== undefined ? m.totalPaid : (m.total_paid || 0),
      m.debt !== undefined ? m.debt : 0,
      m.paymentMethod || m.payment_method || 'Naqd',
      JSON.stringify(m.paymentHistory || m.payment_history || []),
      m.createdAt || m.created_at || new Date().toISOString()
    ]
  );
}

// =========================================================
// Asosiy Kolleksiyalarni O'qish (Load)
// =========================================================
async function loadCollection(key) {
  try {
    // 1. Agar 'members' so'ralsa — Supabase `members` relational jadvalidan olamiz!
    if (key === 'members') {
      const res = await queryWithRetry(`
        SELECT 
          id, full_name as "fullName", phone, telegram_id as "telegramId",
          gender, subscription_id as "subscriptionId", subscription_name as "subscriptionName",
          start_date as "startDate", end_date as "endDate", remaining_visits as "remainingVisits",
          status, total_paid as "totalPaid", debt, payment_method as "paymentMethod",
          payment_history as "paymentHistory", created_at as "createdAt"
        FROM members
        ORDER BY created_at DESC
      `);
      if (res.rows.length > 0) {
        // Lokal zaxirani ham yangilab qo'yamiz
        writeLocalJson('members', res.rows);
        return res.rows;
      }
    }

    // 2. Agar 'posProducts' so'ralsa — Supabase `pos_products` relational jadvalidan olamiz!
    if (key === 'posProducts') {
      const res = await queryWithRetry(`
        SELECT id, name, category, price, stock, unit
        FROM pos_products
        ORDER BY created_at DESC
      `);
      if (res.rows.length > 0) {
        writeLocalJson('posProducts', res.rows);
        return res.rows;
      }
    }

    // 3. Agar 'posSales' so'ralsa — Supabase `pos_sales` relational jadvalidan olamiz!
    if (key === 'posSales') {
      const res = await queryWithRetry(`
        SELECT id, member_id as "memberId", member_name as "memberName", items, total_amount as "totalAmount", payment_method as "paymentMethod", date
        FROM pos_sales
        ORDER BY date DESC
      `);
      if (res.rows.length > 0) {
        writeLocalJson('posSales', res.rows);
        return res.rows;
      }
    }

    // 4. Boshqa barcha kolleksiyalar uchun `gym_data` dan olamiz
    const result = await queryWithRetry('SELECT data FROM gym_data WHERE key = $1', [key]);
    if (result.rows.length > 0 && result.rows[0].data !== null && result.rows[0].data !== undefined) {
      const dbData = result.rows[0].data;
      writeLocalJson(key, dbData);
      return dbData;
    }

    // 5. Fallback: Lokal JSON fayldan o'qish
    const local = readLocalJson(key);
    if (local !== null) return local;

    return JSON.parse(JSON.stringify(initialData[key] || []));
  } catch (err) {
    console.error(`❌ DB load ogohlantirish [${key}]:`, err.message);
    // Offline / uzilish bo'lsa lokal fayldan tiklash
    const local = readLocalJson(key);
    if (local !== null) return local;
    return JSON.parse(JSON.stringify(initialData[key] || []));
  }
}

// =========================================================
// Asosiy Kolleksiyalarni Saqlash (Save)
// =========================================================
async function saveCollection(key, data) {
  try {
    // Har doim lokal zaxiraga yozish (server o'chib yonsa ham yo'qolmaydi)
    writeLocalJson(key, data);

    // 1. gym_data ga yozish
    await queryWithRetry(
      `INSERT INTO gym_data (key, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key)
       DO UPDATE SET data = $2, updated_at = NOW()`,
      [key, JSON.stringify(data)]
    );

    // 2. Agar 'members' bo'lsa — Supabase `members` jadvaliga ham har birini qator qilib yozish!
    if (key === 'members' && Array.isArray(data)) {
      for (const m of data) {
        await upsertMemberDirect(m);
      }
    }

    // 3. Agar 'posProducts' bo'lsa — Supabase `pos_products` ga ham yozish!
    if (key === 'posProducts' && Array.isArray(data)) {
      for (const p of data) {
        await queryWithRetry(
          `INSERT INTO pos_products (id, name, category, price, stock, unit, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (id) DO UPDATE SET name = $2, category = $3, price = $4, stock = $5, unit = $6`,
          [p.id, p.name, p.category || 'Boshqa', p.price || 0, p.stock || 0, p.unit || 'dona']
        );
      }
    }

    // 4. Agar 'posSales' bo'lsa — Supabase `pos_sales` ga ham yozish!
    if (key === 'posSales' && Array.isArray(data)) {
      for (const s of data) {
        await queryWithRetry(
          `INSERT INTO pos_sales (id, member_id, member_name, items, total_amount, payment_method, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [s.id, s.memberId || null, s.memberName || 'Oddiy Xaridor', JSON.stringify(s.items || []), s.totalAmount || 0, s.paymentMethod || 'Naqd', s.date || new Date().toISOString()]
        );
      }
    }
  } catch (err) {
    console.error(`❌ DB save xatosi [${key}]:`, err.message);
    // Lokal zaxiraga yozilgan bo'lgani uchun ma'lumot baribir yo'qolmaydi!
  }
}

async function getAllCacheKeys() {
  const result = await queryWithRetry('SELECT key FROM gym_data');
  return result.rows.map(r => r.key);
}

module.exports = {
  loadCollection,
  saveCollection,
  initDataStore,
  getAllCacheKeys,
  upsertMemberDirect
};

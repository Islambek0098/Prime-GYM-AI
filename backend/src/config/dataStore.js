const { pool, createTables } = require('./db');


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

async function initDataStore() {
  await createTables();

  const result = await pool.query('SELECT key FROM gym_data');
  const existingKeys = new Set(result.rows.map(r => r.key));

  const insertPromises = Object.entries(initialData)
    .filter(([key]) => !existingKeys.has(key))
    .map(async ([key, value]) => {
      const defaultVal = JSON.parse(JSON.stringify(value));
      await pool.query(
        `INSERT INTO gym_data (key, data) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(defaultVal)]
      );
    });

  await Promise.all(insertPromises);
  console.log(`✅ DataStore tayyor.`);
}

async function loadCollection(key) {
  try {
    const result = await pool.query('SELECT data FROM gym_data WHERE key = $1', [key]);
    if (result.rows.length > 0) {
      return result.rows[0].data;
    }
    return JSON.parse(JSON.stringify(initialData[key] || []));
  } catch (err) {
    console.error(`❌ DB load xatosi [${key}]:`, err.message);
    throw new Error(`Ma'lumotlarni o'qishda xatolik: ${err.message}`);
  }
}

async function saveCollection(key, data) {
  try {
    await pool.query(
      `INSERT INTO gym_data (key, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key)
       DO UPDATE SET data = $2, updated_at = NOW()`,
      [key, JSON.stringify(data)]
    );
  } catch (err) {
    console.error(`❌ DB save xatosi [${key}]:`, err.message);
    throw new Error(`Ma'lumotlarni saqlashda xatolik: ${err.message}`);
  }
}

async function getAllCacheKeys() {
  const result = await pool.query('SELECT key FROM gym_data');
  return result.rows.map(r => r.key);
}

module.exports = { loadCollection, saveCollection, initDataStore, getAllCacheKeys };

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default data for GYM
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
  members: [],
  attendance: [],
  lockers: {
    male: Array.from({ length: 30 }, (_, i) => ({ number: `M-${i + 1}`, status: "Free", assignedTo: null })),
    female: Array.from({ length: 20 }, (_, i) => ({ number: `F-${i + 1}`, status: "Free", assignedTo: null }))
  },
  posProducts: [],
  posSales: [],
  expenses: [],
  trainers: []
};

// ==========================================
// IN-MEMORY CACHE — har safar diskdan o'qimasdan, 
// xotiradagi nusxani qaytaradi. Faqat saqlashda diskga yozadi.
// Bu race condition muammosini to'liq hal qiladi.
// ==========================================
const cache = {};

function getFilePath(key) {
  return path.join(DATA_DIR, `${key}.json`);
}

function loadCollection(key) {
  // Agar cache'da bo'lsa, DOIM cache'dan qaytarish
  // Bu race condition'ni oldini oladi — barcha route'lar bitta nusxani ko'radi
  if (cache[key] !== undefined) {
    return cache[key];
  }

  const filePath = getFilePath(key);
  const backupPath = `${filePath}.bak`;

  if (!fs.existsSync(filePath)) {
    if (fs.existsSync(backupPath)) {
      try {
        const rawBak = fs.readFileSync(backupPath, 'utf-8');
        const parsedBak = JSON.parse(rawBak);
        fs.writeFileSync(filePath, rawBak, 'utf-8');
        cache[key] = parsedBak;
        return cache[key];
      } catch (e) {}
    }
    const defaultVal = initialData[key] || [];
    // Deep clone to prevent mutation of defaults
    const clonedDefault = JSON.parse(JSON.stringify(defaultVal));
    fs.writeFileSync(filePath, JSON.stringify(clonedDefault, null, 2), 'utf-8');
    cache[key] = clonedDefault;
    return cache[key];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) throw new Error("Empty JSON file content");
    cache[key] = JSON.parse(raw);
    return cache[key];
  } catch (err) {
    console.error(`Error loading ${key}, attempting backup recovery:`, err.message);
    if (fs.existsSync(backupPath)) {
      try {
        const rawBak = fs.readFileSync(backupPath, 'utf-8');
        const parsedBak = JSON.parse(rawBak);
        fs.writeFileSync(filePath, rawBak, 'utf-8');
        console.log(`✅ ${key} ma'lumotlari zaxira faylidan tiklandi!`);
        cache[key] = parsedBak;
        return cache[key];
      } catch (bakErr) {
        console.error(`Backup recovery failed for ${key}:`, bakErr.message);
      }
    }
    const fallback = JSON.parse(JSON.stringify(initialData[key] || []));
    cache[key] = fallback;
    return cache[key];
  }
}

function saveCollection(key, data) {
  // AVVAL cache'ni yangilash — boshqa route'lar darhol yangi ma'lumotni ko'radi
  cache[key] = data;

  const filePath = getFilePath(key);
  const tempPath = `${filePath}.tmp`;
  const backupPath = `${filePath}.bak`;

  try {
    // 1. Write to temporary file
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');

    // 2. Backup current valid file if exists
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch (e) {}
    }

    // 3. Atomically rename temp file to main file
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error saving ${key}:`, err.message);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (directErr) {
      console.error(`Direct write failed for ${key}:`, directErr.message);
    }
  }
}

module.exports = {
  loadCollection,
  saveCollection
};

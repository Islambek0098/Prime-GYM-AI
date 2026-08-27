const { loadCollection, saveCollection } = require('../config/dataStore');

function extractSheetsId(input) {
  if (!input) return "";
  const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input.trim();
}

function formatDate(isoString) {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return isoString;
  }
}

function formatItems(items) {
  if (!Array.isArray(items)) return "";
  return items.map(i => `${i.name || 'Mahsulot'} x ${i.qty || 1} ${i.unit || 'dona'} (${(i.price * (i.qty || 1)).toLocaleString()} so'm)`).join('; ');
}

function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function formatPhoneForCSV(phone) {
  if (!phone) return "-";
  const str = String(phone).trim();
  if (!str || str === '-') return "-";
  // Force Excel to format as plain text formula so scientific notation (e.g. 9.98E+11) is avoided
  return `="${str}"`;
}

function exportToCSV(collectionName) {
  const data = loadCollection(collectionName);
  
  let columns = [];
  let rowMapper = (item) => [];

  if (collectionName === 'members') {
    columns = [
      "Mijoz ID", "F.I.SH. (Ismi Familiyasi)", "Telefon", "Telegram Chat ID", 
      "Jinsi", "Obuna Turi", "Boshlanish Sanasi", "Tugash Sanasi", 
      "Qolgan Tashriflar/Kunlar", "Holati", "To'langan Summa (so'm)", "Qarzdorlik (so'm)", "Ro'yxatga Olingan Vaqt"
    ];
    rowMapper = (item) => [
      item.id,
      item.fullName,
      formatPhoneForCSV(item.phone),
      formatPhoneForCSV(item.telegramId),
      item.gender,
      item.subscriptionName,
      item.startDate,
      item.endDate,
      item.remainingVisits,
      item.status === 'Active' ? 'Faol' : (item.status === 'Expired' ? 'Tugagan' : item.status),
      item.totalPaid,
      item.debt,
      formatDate(item.createdAt)
    ];
  } else if (collectionName === 'attendance') {
    columns = [
      "Tashrif ID", "Mijoz ID", "Mijoz Ismi", "Telefon", 
      "Shkaf Raqami", "Kirgan Vaqti", "Chiqgan Vaqti", "Holati"
    ];
    rowMapper = (item) => [
      item.id,
      item.memberId,
      item.memberName,
      formatPhoneForCSV(item.phone),
      item.lockerNumber || "Ajratilmadi",
      formatDate(item.checkInTime),
      formatDate(item.checkOutTime),
      item.status
    ];
  } else if (collectionName === 'posSales') {
    columns = [
      "Sotuv ID", "Mijoz ID", "Xaridor Ismi", "Sotib Olingan Mahsulotlar", 
      "Jami Summa (so'm)", "To'lov Turi", "Sotuv Vaqti"
    ];
    rowMapper = (item) => [
      item.id,
      item.memberId || "-",
      item.memberName,
      formatItems(item.items),
      item.totalAmount,
      item.paymentMethod,
      formatDate(item.date)
    ];
  } else if (collectionName === 'posProducts') {
    columns = [
      "Mahsulot ID", "Mahsulot Nomi", "Kategoriya", "Narxi (so'm)", "Qoldiq", "O'lchov Birligi"
    ];
    rowMapper = (item) => [
      item.id,
      item.name,
      item.category,
      item.price,
      item.stock,
      item.unit
    ];
  } else if (collectionName === 'subscriptions') {
    columns = [
      "Obuna ID", "Obuna Nomi", "Amal Qilish Muddati (kun)", "Narxi (so'm)", "Tashriflar Soni", "Tavsifi"
    ];
    rowMapper = (item) => [
      item.id,
      item.name,
      item.durationDays,
      item.price,
      item.visitsCount,
      item.description
    ];
  } else {
    if (!Array.isArray(data) || data.length === 0) return '';
    columns = Object.keys(data[0]);
    rowMapper = (item) => columns.map(col => item[col] ?? '');
  }

  // Use semicolon ';' as column separator for CIS/Excel locale, plus 'sep=;\r\n' directive at the top
  const headerRow = columns.map(c => escapeCSV(c)).join(';');
  const sepDirective = "sep=;";
  
  if (!Array.isArray(data) || data.length === 0) {
    return '\uFEFF' + sepDirective + '\r\n' + headerRow;
  }

  const rows = data.map(item => rowMapper(item).map(val => escapeCSV(val)).join(';'));
  
  // \uFEFF UTF-8 BOM + sep=; ensures Excel automatically separates into distinct columns
  return '\uFEFF' + sepDirective + '\r\n' + [headerRow, ...rows].join('\r\n');
}

async function syncWithGoogleSheets(rawSheetsId, credentialsJSON) {
  try {
    const settings = loadCollection('settings');
    const cleanId = extractSheetsId(rawSheetsId);
    
    settings.googleSheetsId = cleanId || settings.googleSheetsId;
    if (credentialsJSON) settings.googleCredentialsJSON = credentialsJSON;
    settings.lastSheetsSync = new Date().toISOString();
    saveCollection('settings', settings);

    if (!cleanId) {
      return {
        success: false,
        error: "Google Sheets ID kiritilmagan. Iltimos Google Sheet havolasi yoki ID-sini kiriting."
      };
    }

    const creds = credentialsJSON || settings.googleCredentialsJSON;
    if (creds) {
      try {
        const { GoogleSpreadsheet } = require('google-spreadsheet');
        const { JWT } = require('google-auth-library');
        const parsedCreds = typeof creds === 'string' ? JSON.parse(creds) : creds;

        const serviceAccountAuth = new JWT({
          email: parsedCreds.client_email,
          key: parsedCreds.private_key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(cleanId, serviceAccountAuth);
        await doc.loadInfo();

        return {
          success: true,
          message: `Google Sheets ga muvaffaqiyatli ulandi! Hujjat nomi: "${doc.title}"`,
          lastSync: settings.lastSheetsSync,
          sheetTitle: doc.title
        };
      } catch (apiErr) {
        console.error("Google Sheets API Live Error:", apiErr.message);
        return {
          success: false,
          error: `Google Sheets API ulanishda xatolik: ${apiErr.message}. Google Sheet-ni Service Account emailiga ("client_email") access berganingizni tekshiring.`
        };
      }
    }

    return {
      success: true,
      message: `Google Sheet ID (${cleanId}) saqlandi. Excel (CSV) eksport jadvali tayyor! Avtomatik Google Sheets yozilishi uchun Service Account JSON kerak.`,
      lastSync: settings.lastSheetsSync
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  extractSheetsId,
  syncWithGoogleSheets,
  exportToCSV
};

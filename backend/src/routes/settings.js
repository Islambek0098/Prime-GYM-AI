const express = require('express');
const router = express.Router();
const { loadCollection, saveCollection } = require('../config/dataStore');
const { sendTelegramMessage, broadcastTelegramMessage } = require('../services/telegramService');
const { syncWithGoogleSheets, exportToCSV, extractSheetsId } = require('../services/sheetsService');

// Get settings
router.get('/', async (req, res) => {
  const settings = await loadCollection('settings');
  res.json(settings);
});

// Update settings
router.post('/', async (req, res) => {
  let settings = await loadCollection('settings');
  const updatedData = { ...req.body };
  if (updatedData.googleSheetsId) {
    updatedData.googleSheetsId = extractSheetsId(updatedData.googleSheetsId);
  }
  settings = { ...settings, ...updatedData };
  await saveCollection('settings', settings);

  res.json({ success: true, settings });
});

// Test Telegram bot
router.post('/test-telegram', async (req, res) => {
  const { chatId, message } = req.body;
  const result = await sendTelegramMessage(chatId, message || "🤖 GYM Admin Panel Telegram Bot xabarnomalari sinov xabari!");
  res.json(result);
});

// Broadcast Telegram message to all members
router.post('/broadcast-telegram', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: "Xabar matni bo'sh bo'lishi mumkin emas!" });
  }
  const result = await broadcastTelegramMessage(message.trim());
  res.json(result);
});

// Sync Google Sheets
router.post('/sync-sheets', async (req, res) => {
  const { sheetsId, credentialsJSON } = req.body;
  const result = await syncWithGoogleSheets(sheetsId, credentialsJSON);
  res.json(result);
});

// Export collection CSV download
router.get('/export-csv/:collection', async (req, res) => {
  const collection = req.params.collection;
  const csv = await exportToCSV(collection);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${collection}.csv`);
  res.send(csv);
});

module.exports = router;

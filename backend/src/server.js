const express = require('express');
const cors = require('cors');
require('dotenv').config();

const membersRoutes = require('./routes/members');
const subscriptionsRoutes = require('./routes/subscriptions');
const { router: attendanceRoutes, autoCheckoutMidnight } = require('./routes/attendance');
const posRoutes = require('./routes/pos');
const settingsRoutes = require('./routes/settings');
const expensesRoutes = require('./routes/expenses');
const trainersRoutes = require('./routes/trainers');
const analyticsRoutes = require('./routes/analytics');
const { checkAndSendExpiringReminders } = require('./services/telegramService');
const { initDataStore } = require('./config/dataStore');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/members', membersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/trainers', trainersRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    service: "GYM Management API",
    database: "PostgreSQL (Supabase)",
    time: new Date().toISOString()
  });
});

async function startServer() {
  try {
    await initDataStore();
    console.log('✅ PostgreSQL (Supabase) ulanishi muvaffaqiyatli');

    app.listen(PORT, () => {
      console.log(`🚀 GYM Admin Backend server running on http://localhost:${PORT}`);
    });

    autoCheckoutMidnight();
    setInterval(autoCheckoutMidnight, 60000);

    setInterval(() => {
      checkAndSendExpiringReminders().catch(err =>
        console.error("Telegram reminders error:", err)
      );
    }, 6 * 60 * 60 * 1000);

  } catch (err) {
    console.error('❌ Server ishga tushishda xatolik:', err.message);
    console.error('📋 DATABASE_URL ni .env faylida togri sozlang!');
    process.exit(1);
  }
}

startServer();

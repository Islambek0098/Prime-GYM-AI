const express = require('express');
const cors = require('cors');
require('dotenv').config();

const membersRoutes = require('./routes/members');
const subscriptionsRoutes = require('./routes/subscriptions');
const { router: attendanceRoutes, autoCheckoutMidnight } = require('./routes/attendance');
const posRoutes = require('./routes/pos');
const settingsRoutes = require('./routes/settings');
const expensesRoutes = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Run 00:00 midnight auto checkout check every 1 minute
autoCheckoutMidnight();
setInterval(autoCheckoutMidnight, 60000);

// Routes
app.use('/api/members', membersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/expenses', expensesRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    service: "GYM Management API",
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GYM Admin Backend server running on http://localhost:${PORT}`);
});

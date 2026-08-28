const express = require('express');
const router = express.Router();
const { loadCollection } = require('../config/dataStore');

// GET /api/analytics/churn-risk
router.get('/churn-risk', (req, res) => {
  const members = loadCollection('members');
  const attendance = loadCollection('attendance');

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStr = now.toISOString().split('T')[0];

  const riskMembers = members.filter(m => {
    // Member's last check-in
    const memberAtt = attendance.filter(a => a.memberId === m.id || a.phone === m.phone);
    const lastAtt = memberAtt.length > 0 ? memberAtt[0].checkInTime : null;

    const noRecentVisits = !lastAtt || lastAtt < sevenDaysAgo;
    const subExpiringSoon = m.endDate && m.endDate <= new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lowVisits = m.remainingVisits <= 2;

    return (noRecentVisits || subExpiringSoon || lowVisits) && m.status !== 'Expired';
  }).map(m => {
    const memberAtt = attendance.filter(a => a.memberId === m.id || a.phone === m.phone);
    const lastAtt = memberAtt.length > 0 ? memberAtt[0].checkInTime : null;
    let riskLevel = 'O'rtacha';
    let riskReason = "7 kundan beri kelmagan";

    if (m.remainingVisits <= 1 && m.endDate <= todayStr) {
      riskLevel = 'Yuqori';
      riskReason = "Obunasi tugagan va tashriflar qolmagan";
    } else if (!lastAtt) {
      riskLevel = 'Yuqori';
      riskReason = "Biror marta ham zalga kelmagan";
    }

    return {
      id: m.id,
      fullName: m.fullName,
      phone: m.phone,
      gender: m.gender,
      remainingVisits: m.remainingVisits,
      endDate: m.endDate,
      lastCheckIn: lastAtt ? lastAtt.split('T')[0] : 'Kelmagan',
      riskLevel,
      riskReason
    };
  });

  res.json({
    count: riskMembers.length,
    riskMembers: riskMembers.slice(0, 10) // Top 10 high-risk members
  });
});

// GET /api/analytics/peak-hours
router.get('/peak-hours', (req, res) => {
  const attendance = loadCollection('attendance');
  
  // Initialize hourly slots from 06:00 to 22:00
  const slots = {
    '06:00-08:00': 0,
    '08:00-10:00': 0,
    '10:00-12:00': 0,
    '12:00-14:00': 0,
    '14:00-16:00': 0,
    '16:00-18:00': 0,
    '18:00-20:00': 0,
    '20:00-22:00': 0
  };

  attendance.forEach(att => {
    if (!att.checkInTime) return;
    const date = new Date(att.checkInTime);
    const hour = date.getHours();

    if (hour >= 6 && hour < 8) slots['06:00-08:00']++;
    else if (hour >= 8 && hour < 10) slots['08:00-10:00']++;
    else if (hour >= 10 && hour < 12) slots['10:00-12:00']++;
    else if (hour >= 12 && hour < 14) slots['12:00-14:00']++;
    else if (hour >= 14 && hour < 16) slots['14:00-16:00']++;
    else if (hour >= 16 && hour < 18) slots['16:00-18:00']++;
    else if (hour >= 18 && hour < 20) slots['18:00-20:00']++;
    else if (hour >= 20 && hour < 22) slots['20:00-22:00']++;
  });

  const formattedSlots = Object.keys(slots).map(slot => ({
    timeSlot: slot,
    visitsCount: slots[slot]
  }));

  res.json(formattedSlots);
});

// GET /api/analytics/forecast
router.get('/forecast', (req, res) => {
  const members = loadCollection('members');
  const subscriptions = loadCollection('subscriptions');
  const posSales = loadCollection('posSales') || [];

  const activeMembersCount = members.filter(m => m.status === 'Active').length;
  const avgSubPrice = subscriptions.length > 0 
    ? Math.round(subscriptions.reduce((sum, s) => sum + (s.price || 0), 0) / subscriptions.length)
    : 300000;

  const estimatedRenewals = Math.round(activeMembersCount * 0.85); // 85% expected renewal
  const projectedSubRevenue = estimatedRenewals * avgSubPrice;
  const avgMonthlyPosRevenue = posSales.length > 0
    ? Math.round(posSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0))
    : 500000;

  const totalForecast = projectedSubRevenue + avgMonthlyPosRevenue;

  res.json({
    activeMembersCount,
    estimatedRenewals,
    avgSubPrice,
    projectedSubRevenue,
    avgMonthlyPosRevenue,
    totalForecast
  });
});

module.exports = router;

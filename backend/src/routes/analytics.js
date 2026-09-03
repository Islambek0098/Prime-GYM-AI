const express = require('express');
const router = express.Router();
const { loadCollection } = require('../config/dataStore');

// GET /api/analytics/churn-risk — Yo'qolish xavfidagi mijozlar tahlili
router.get('/churn-risk', async (req, res) => {
  const members = await loadCollection('members');
  const attendance = await loadCollection('attendance');

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStr = now.toISOString().split('T')[0];

  const riskMembers = members.filter(m => {
    const memberAtt = attendance.filter(a => a.memberId === m.id || a.phone === m.phone);
    const lastAtt = memberAtt.length > 0 ? memberAtt[0].checkInTime : null;

    const noRecentVisits = !lastAtt || lastAtt < sevenDaysAgo;
    const subExpiringSoon = m.endDate && m.endDate <= new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lowVisits = m.remainingVisits <= 2;

    return (noRecentVisits || subExpiringSoon || lowVisits) && m.status !== 'Expired';
  }).map(m => {
    const memberAtt = attendance.filter(a => a.memberId === m.id || a.phone === m.phone);
    const lastAtt = memberAtt.length > 0 ? memberAtt[0].checkInTime : null;
    let riskLevel = "O'rtacha";
    let riskReason = "7 kundan beri kelmagan";
    let actionTip = "Mijoz bilan bog'lanib zalga taklif qilish kerak";

    if (m.remainingVisits <= 1 && m.endDate <= todayStr) {
      riskLevel = 'Yuqori';
      riskReason = "Obunasi tugagan va tashriflar qolmagan";
      actionTip = "Obunani yangilash uchun maxsus chegirma taklif eting";
    } else if (!lastAtt) {
      riskLevel = 'Yuqori';
      riskReason = "Biror marta ham zalga kelmagan";
      actionTip = "Birinchi kirish mashg'uloti va yo'l-yo'riq uchun eslatma yuboring";
    } else if (m.remainingVisits <= 2) {
      riskLevel = "O'rtacha";
      riskReason = `Faqat ${m.remainingVisits} ta tashrif qoldi`;
      actionTip = "Yangi tarif xarid qilishni tavsiya qiling";
    }

    const cleanEndDate = m.endDate ? (typeof m.endDate === 'string' ? m.endDate.split('T')[0] : new Date(m.endDate).toISOString().split('T')[0]) : '';
    const cleanLastAtt = lastAtt ? (typeof lastAtt === 'string' ? lastAtt.split('T')[0] : new Date(lastAtt).toISOString().split('T')[0]) : 'Kelmagan';

    return {
      id: m.id,
      fullName: m.fullName,
      phone: m.phone,
      telegramId: m.telegramId || '',
      gender: m.gender,
      remainingVisits: m.remainingVisits,
      endDate: cleanEndDate,
      lastCheckIn: cleanLastAtt,
      riskLevel,
      riskReason,
      actionTip
    };
  });

  const highRiskCount = riskMembers.filter(r => r.riskLevel === 'Yuqori').length;
  const mediumRiskCount = riskMembers.filter(r => r.riskLevel === "O'rtacha").length;

  res.json({
    count: riskMembers.length,
    highRiskCount,
    mediumRiskCount,
    riskMembers
  });
});

// GET /api/analytics/peak-hours — Zalning tig'iz va tinch soatlari
router.get('/peak-hours', async (req, res) => {
  const attendance = await loadCollection('attendance');
  
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

  let maxSlot = '18:00-20:00';
  let minSlot = '12:00-14:00';
  let maxCount = -1;
  let minCount = 999999;

  const formattedSlots = Object.keys(slots).map(slot => {
    const visits = slots[slot];
    if (visits > maxCount) {
      maxCount = visits;
      maxSlot = slot;
    }
    if (visits < minCount) {
      minCount = visits;
      minSlot = slot;
    }
    return {
      timeSlot: slot,
      visitsCount: visits
    };
  });

  res.json({
    slots: formattedSlots,
    peakSlot: maxSlot,
    quietSlot: minSlot,
    totalVisits: attendance.length
  });
});

// GET /api/analytics/forecast — Daromad va oylik tushum prognozi
router.get('/forecast', async (req, res) => {
  const members = await loadCollection('members');
  const subscriptions = await loadCollection('subscriptions');
  const posSales = await loadCollection('posSales') || [];

  const activeMembers = members.filter(m => m.status === 'Active');
  const activeMembersCount = activeMembers.length;
  
  const avgSubPrice = subscriptions.length > 0 
    ? Math.round(subscriptions.reduce((sum, s) => sum + (s.price || 0), 0) / subscriptions.length)
    : 300000;

  const estimatedRenewals = Math.round(activeMembersCount * 0.85); // 85% kutilayotgan davom etish
  const projectedSubRevenue = estimatedRenewals * avgSubPrice;
  
  const totalPosSum = posSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const avgMonthlyPosRevenue = totalPosSum > 0 ? totalPosSum : 250000;

  const totalForecast = projectedSubRevenue + avgMonthlyPosRevenue;
  const currentTotalDebt = members.reduce((sum, m) => sum + (Number(m.debt) || 0), 0);

  res.json({
    activeMembersCount,
    estimatedRenewals,
    avgSubPrice,
    projectedSubRevenue,
    avgMonthlyPosRevenue,
    totalForecast,
    currentTotalDebt,
    renewalRatePercent: 85
  });
});

// GET /api/analytics/attendance-habits — Hafta kunlari va qatnash chastotasi
router.get('/attendance-habits', async (req, res) => {
  const attendance = await loadCollection('attendance');
  const members = await loadCollection('members');

  const daysMap = {
    1: { day: 'Dushanba', visits: 0 },
    2: { day: 'Seshanba', visits: 0 },
    3: { day: 'Chorshanba', visits: 0 },
    4: { day: 'Payshanba', visits: 0 },
    5: { day: 'Juma', visits: 0 },
    6: { day: 'Shanba', visits: 0 },
    0: { day: 'Yakshanba', visits: 0 }
  };

  let maleCount = 0;
  let femaleCount = 0;

  attendance.forEach(att => {
    if (!att.checkInTime) return;
    const d = new Date(att.checkInTime);
    const dayNum = d.getDay();
    if (daysMap[dayNum]) {
      daysMap[dayNum].visits++;
    }

    const m = members.find(mem => mem.id === att.memberId || mem.phone === att.phone);
    if (m && m.gender === 'Ayol') femaleCount++;
    else maleCount++;
  });

  const weeklyTrends = [
    daysMap[1], daysMap[2], daysMap[3], daysMap[4], daysMap[5], daysMap[6], daysMap[0]
  ];

  res.json({
    weeklyTrends,
    genderRatio: {
      male: maleCount,
      female: femaleCount,
      malePercent: (maleCount + femaleCount) > 0 ? Math.round((maleCount / (maleCount + femaleCount)) * 100) : 70,
      femalePercent: (maleCount + femaleCount) > 0 ? Math.round((femaleCount / (maleCount + femaleCount)) * 100) : 30
    }
  });
});

module.exports = router;

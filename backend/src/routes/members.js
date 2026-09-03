const express = require('express');
const router = express.Router();
const { loadCollection, saveCollection } = require('../config/dataStore');
const { notifyExpiryWarning } = require('../services/telegramService');

// Get all members
router.get('/', async (req, res) => {
  const members = await loadCollection('members');
  res.json(members);
});

// Create new member
router.post('/', async (req, res) => {
  const members = await loadCollection('members');
  const subscriptions = await loadCollection('subscriptions');
  
  const { fullName, phone, telegramId, gender, subscriptionId, totalPaid, debt, paymentMethod } = req.body;
  
  const selectedSub = subscriptions.find(s => s.id === subscriptionId) || subscriptions[0];
  const now = new Date();
  const endDate = new Date(now.getTime() + (selectedSub ? selectedSub.durationDays : 30) * 24 * 60 * 60 * 1000);

  const newId = `M-${1000 + members.length + 1}`;
  const initialPaid = Number(totalPaid) !== undefined ? Number(totalPaid) : (selectedSub ? selectedSub.price : 0);
  const initialDebt = Number(debt) !== undefined ? Number(debt) : 0;
  const payMethod = paymentMethod || "Naqd";

  const initialHistory = initialPaid > 0 ? [{
    id: `PAY-1`,
    date: now.toISOString(),
    amount: initialPaid,
    paymentMethod: payMethod,
    note: "Boshlang'ich a'zolik to'lovi"
  }] : [];
  
  const newMember = {
    id: newId,
    fullName: fullName || "Ismsiz Mijoz",
    phone: phone || "",
    telegramId: telegramId || "",
    gender: gender || "Erkak",
    subscriptionId: selectedSub ? selectedSub.id : "sub_1",
    subscriptionName: selectedSub ? selectedSub.name : "Standart (1 Oylik)",
    startDate: now.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    remainingVisits: selectedSub ? selectedSub.visitsCount : 30,
    status: "Active",
    totalPaid: initialPaid,
    debt: initialDebt,
    paymentMethod: payMethod,
    paymentHistory: initialHistory,
    createdAt: now.toISOString()
  };

  members.unshift(newMember);
  await saveCollection('members', members);

  res.status(201).json(newMember);
});

// Update member or add additional payment / payoff debt
router.put('/:id', async (req, res) => {
  let members = await loadCollection('members');
  const index = members.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Mijoz topilmadi" });
  }

  const existing = members[index];
  const { additionalPayment, paymentMethod, ...otherUpdates } = req.body;

  let history = existing.paymentHistory || [];

  if (additionalPayment && Number(additionalPayment) > 0) {
    const addAmt = Number(additionalPayment);
    const payMethod = paymentMethod || existing.paymentMethod || "Naqd";
    
    history = [
      ...history,
      {
        id: `PAY-${history.length + 1}`,
        date: new Date().toISOString(),
        amount: addAmt,
        paymentMethod: payMethod,
        note: "Qarzni so'ndirish / Qo'shimcha to'lov"
      }
    ];

    const newTotalPaid = (existing.totalPaid || 0) + addAmt;
    const newDebt = Math.max(0, (existing.debt || 0) - addAmt);

    otherUpdates.totalPaid = newTotalPaid;
    otherUpdates.debt = newDebt;
    otherUpdates.paymentMethod = payMethod;
  }

  members[index] = {
    ...existing,
    ...otherUpdates,
    paymentHistory: history
  };

  await saveCollection('members', members);
  res.json(members[index]);
});

// Delete member
router.delete('/:id', async (req, res) => {
  let members = await loadCollection('members');
  members = members.filter(m => m.id !== req.params.id);
  await saveCollection('members', members);

  try {
    const { queryWithRetry } = require('../config/db');
    await queryWithRetry('DELETE FROM members WHERE id = $1', [req.params.id]);
  } catch (err) {
    console.error("Relational members delete xatosi:", err.message);
  }

  res.json({ success: true, id: req.params.id });
});

// Renew / Extend Subscription
router.post('/:id/renew', async (req, res) => {
  let members = await loadCollection('members');
  const subscriptions = await loadCollection('subscriptions');
  
  const member = members.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: "Mijoz topilmadi" });

  const { subscriptionId, paidAmount, paymentMethod } = req.body;
  const sub = subscriptions.find(s => s.id === subscriptionId) || subscriptions[0];

  const now = new Date();
  const newEndDate = new Date(now.getTime() + sub.durationDays * 24 * 60 * 60 * 1000);
  const renewAmount = Number(paidAmount) || sub.price;
  const payMethod = paymentMethod || "Naqd";

  const history = member.paymentHistory || [];
  history.push({
    id: `PAY-${history.length + 1}`,
    date: now.toISOString(),
    amount: renewAmount,
    paymentMethod: payMethod,
    note: `Obunasi uzaytirildi: ${sub.name}`
  });

  member.subscriptionId = sub.id;
  member.subscriptionName = sub.name;
  member.startDate = now.toISOString().split('T')[0];
  member.endDate = newEndDate.toISOString().split('T')[0];
  member.remainingVisits = sub.visitsCount;
  member.status = "Active";
  member.totalPaid = (member.totalPaid || 0) + renewAmount;
  member.paymentMethod = payMethod;
  member.paymentHistory = history;

  await saveCollection('members', members);
  res.json(member);
});

// Send manual telegram notification
router.post('/:id/notify', async (req, res) => {
  const members = await loadCollection('members');
  const member = members.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: "Mijoz topilmadi" });

  const result = await notifyExpiryWarning(member, 3);
  res.json({ success: true, result });
});

module.exports = router;

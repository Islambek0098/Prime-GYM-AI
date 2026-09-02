const express = require('express');
const router = express.Router();
const { loadCollection, saveCollection } = require('../config/dataStore');

// Get all trainers
router.get('/', async (req, res) => {
  const trainers = await loadCollection('trainers');
  res.json(trainers);
});

// Add new trainer
router.post('/', async (req, res) => {
  try {
    const { fullName, phone, specialty, commissionRate } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: "Murabbiy ismi kiritilishi shart" });
    }

    const trainers = await loadCollection('trainers');
    const newTrainer = {
      id: `tr_${Date.now()}`,
      fullName,
      phone: phone || '',
      specialty: specialty || 'Fitnes murabbiyi',
      commissionRate: Number(commissionRate) || 30,
      assignedMembers: [],
      createdDate: new Date().toISOString().split('T')[0]
    };

    trainers.unshift(newTrainer);
    await saveCollection('trainers', trainers);

    res.status(201).json({ success: true, trainer: newTrainer });
  } catch (err) {
    console.error("Murabbiy qo'shishda xatolik:", err);
    res.status(500).json({ error: "Murabbiy qo'shishda server xatoligi yuz berdi" });
  }
});

// Update trainer
router.put('/:id', async (req, res) => {
  const { fullName, phone, specialty, commissionRate } = req.body;
  let trainers = await loadCollection('trainers');

  const index = trainers.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Murabbiy topilmadi" });
  }

  trainers[index] = {
    ...trainers[index],
    fullName: fullName || trainers[index].fullName,
    phone: phone !== undefined ? phone : trainers[index].phone,
    specialty: specialty || trainers[index].specialty,
    commissionRate: commissionRate !== undefined ? Number(commissionRate) : trainers[index].commissionRate
  };

  await saveCollection('trainers', trainers);
  res.json({ success: true, trainer: trainers[index] });
});

// Delete trainer
router.delete('/:id', async (req, res) => {
  let trainers = await loadCollection('trainers');
  const filtered = trainers.filter(t => t.id !== req.params.id);

  if (trainers.length === filtered.length) {
    return res.status(404).json({ error: "Murabbiy topilmadi" });
  }

  await saveCollection('trainers', filtered);
  res.json({ success: true, message: "Murabbiy o'chirildi" });
});

// Assign PT sessions to member under a trainer
router.post('/assign-member', async (req, res) => {
  const { trainerId, memberId, memberName, totalSessions } = req.body;

  if (!trainerId || !memberId) {
    return res.status(400).json({ error: "Murabbiy va Mijoz tanlanishi kerak" });
  }

  let trainers = await loadCollection('trainers');
  const trainer = trainers.find(t => t.id === trainerId);

  if (!trainer) {
    return res.status(404).json({ error: "Murabbiy topilmadi" });
  }

  trainer.assignedMembers = trainer.assignedMembers || [];
  const existingIndex = trainer.assignedMembers.findIndex(m => m.memberId === memberId);

  const sessionsCount = Number(totalSessions) || 10;

  if (existingIndex >= 0) {
    trainer.assignedMembers[existingIndex].remainingSessions += sessionsCount;
  } else {
    trainer.assignedMembers.push({
      memberId,
      memberName,
      remainingSessions: sessionsCount,
      assignedDate: new Date().toISOString().split('T')[0]
    });
  }

  await saveCollection('trainers', trainers);
  res.json({ success: true, trainer });
});

// Deduct 1 PT session from member
router.post('/deduct-session', async (req, res) => {
  const { trainerId, memberId } = req.body;
  let trainers = await loadCollection('trainers');

  const trainer = trainers.find(t => t.id === trainerId);
  if (!trainer || !trainer.assignedMembers) {
    return res.status(404).json({ error: "Murabbiy yoki biriktirilgan mijoz topilmadi" });
  }

  const assigned = trainer.assignedMembers.find(m => m.memberId === memberId);
  if (!assigned) {
    return res.status(404).json({ error: "Mijoz bu murabbiyga biriktirilmagan" });
  }

  if (assigned.remainingSessions <= 0) {
    return res.status(400).json({ error: "Mijozning PT mashg'ulotlari qolmagan!" });
  }

  assigned.remainingSessions -= 1;
  await saveCollection('trainers', trainers);

  res.json({ success: true, remainingSessions: assigned.remainingSessions, trainer });
});

module.exports = router;

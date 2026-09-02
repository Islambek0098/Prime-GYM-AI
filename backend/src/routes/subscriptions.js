const express = require('express');
const router = express.Router();
const { loadCollection, saveCollection } = require('../config/dataStore');

router.get('/', async (req, res) => {
  const subs = await loadCollection('subscriptions');
  res.json(subs);
});

router.post('/', async (req, res) => {
  const subs = await loadCollection('subscriptions');
  const { name, durationDays, price, visitsCount, description } = req.body;

  const newSub = {
    id: `sub_${Date.now()}`,
    name: name || "Yangi Tarif",
    durationDays: Number(durationDays) || 30,
    price: Number(price) || 0,
    visitsCount: Number(visitsCount) || 30,
    description: description || ""
  };

  subs.push(newSub);
  await saveCollection('subscriptions', subs);

  res.status(201).json(newSub);
});

router.put('/:id', async (req, res) => {
  let subs = await loadCollection('subscriptions');
  const idx = subs.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Tarif topilmadi" });

  subs[idx] = { ...subs[idx], ...req.body };
  await saveCollection('subscriptions', subs);

  res.json(subs[idx]);
});

router.delete('/:id', async (req, res) => {
  let subs = await loadCollection('subscriptions');
  subs = subs.filter(s => s.id !== req.params.id);
  await saveCollection('subscriptions', subs);

  res.json({ success: true, id: req.params.id });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { loadCollection, saveCollection } = require('../config/dataStore');

// Get all expenses
router.get('/', (req, res) => {
  const expenses = loadCollection('expenses');
  res.json(expenses);
});

// Add new expense
router.post('/', (req, res) => {
  const expenses = loadCollection('expenses');
  const { title, category, amount, paymentMethod, date, note } = req.body;

  if (!title || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: "Harajat nomi va miqdori to'g'ri kiritilishi shart!" });
  }

  const newExpense = {
    id: `exp_${Date.now()}`,
    title: title.trim(),
    category: category || "Boshqa",
    amount: Number(amount),
    paymentMethod: paymentMethod || "Naqd",
    date: date || new Date().toISOString(),
    note: note || "",
    createdAt: new Date().toISOString()
  };

  expenses.unshift(newExpense);
  saveCollection('expenses', expenses);

  res.status(201).json(newExpense);
});

// Delete an expense
router.delete('/:id', (req, res) => {
  let expenses = loadCollection('expenses');
  const initialLength = expenses.length;
  expenses = expenses.filter(e => e.id !== req.params.id);

  if (expenses.length === initialLength) {
    return res.status(404).json({ error: "Harajat topilmadi" });
  }

  saveCollection('expenses', expenses);
  res.json({ success: true, id: req.params.id });
});

module.exports = router;

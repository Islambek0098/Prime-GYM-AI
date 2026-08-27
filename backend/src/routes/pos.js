const express = require('express');
const router = express.Router();
const { loadCollection, saveCollection } = require('../config/dataStore');

// Get POS products & sales history
router.get('/', (req, res) => {
  const products = loadCollection('posProducts');
  const sales = loadCollection('posSales');
  res.json({ products, sales });
});

// Add new product
router.post('/products', (req, res) => {
  const products = loadCollection('posProducts');
  const { name, category, price, stock, unit } = req.body;

  if (!name || !price || stock === undefined || stock === null || stock === '') {
    return res.status(400).json({ error: "Mahsulot nomi, narxi va soni to'liq to'ldirilishi shart!" });
  }

  const newProd = {
    id: `prod_${Date.now()}`,
    name: name.trim(),
    category: category || "Boshqa",
    price: Number(price) || 0,
    stock: Number(stock) || 0,
    unit: unit || "dona"
  };

  products.push(newProd);
  saveCollection('posProducts', products);

  res.status(201).json(newProd);
});

// Update product
router.put('/products/:id', (req, res) => {
  let products = loadCollection('posProducts');
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Mahsulot topilmadi" });

  products[idx] = { ...products[idx], ...req.body };
  saveCollection('posProducts', products);

  res.json(products[idx]);
});

// Delete product
router.delete('/products/:id', (req, res) => {
  let products = loadCollection('posProducts');
  const initialLength = products.length;
  products = products.filter(p => p.id !== req.params.id);

  if (products.length === initialLength) {
    return res.status(404).json({ error: "Mahsulot topilmadi" });
  }

  saveCollection('posProducts', products);
  res.json({ success: true, message: "Mahsulot muvaffaqiyatli o'chirildi", id: req.params.id });
});

// Record a POS Sale
router.post('/sell', (req, res) => {
  let products = loadCollection('posProducts');
  let sales = loadCollection('posSales');
  const { memberId, memberName, items, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Savat bo'sh!" });
  }

  // Verify member is currently in the gym ("Zalda") if memberId is provided
  if (memberId) {
    const attendance = loadCollection('attendance');
    const activeRecord = attendance.find(a => a.memberId === memberId && a.status === 'Zalda');
    if (!activeRecord) {
      return res.status(400).json({ error: "Bu mijoz zalda emas" });
    }
  }

  let totalAmount = 0;

  // Deduct stock
  items.forEach(item => {
    const prod = products.find(p => p.id === item.id);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.qty);
      totalAmount += prod.price * item.qty;
    }
  });

  const newSale = {
    id: `sale_${Date.now()}`,
    memberId: memberId || null,
    memberName: memberName || "Noma'lum Xaridor",
    items,
    totalAmount,
    paymentMethod: paymentMethod || "Naqd",
    date: new Date().toISOString()
  };

  sales.unshift(newSale);
  saveCollection('posProducts', products);
  saveCollection('posSales', sales);

  res.status(201).json({ success: true, sale: newSale });
});

module.exports = router;

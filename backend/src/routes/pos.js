const express = require('express');
const router = express.Router();
const { loadCollection, saveCollection } = require('../config/dataStore');

// Get POS products & sales history
router.get('/', async (req, res) => {
  const products = await loadCollection('posProducts');
  const sales = await loadCollection('posSales');
  res.json({ products, sales });
});

// Add new product
router.post('/products', async (req, res) => {
  const products = await loadCollection('posProducts');
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
  await saveCollection('posProducts', products);

  res.status(201).json(newProd);
});

// Update product
router.put('/products/:id', async (req, res) => {
  let products = await loadCollection('posProducts');
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Mahsulot topilmadi" });

  products[idx] = { ...products[idx], ...req.body };
  await saveCollection('posProducts', products);

  res.json(products[idx]);
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  let products = await loadCollection('posProducts');
  const initialLength = products.length;
  products = products.filter(p => p.id !== req.params.id);

  if (products.length === initialLength) {
    return res.status(404).json({ error: "Mahsulot topilmadi" });
  }

  await saveCollection('posProducts', products);

  try {
    const { queryWithRetry } = require('../config/db');
    await queryWithRetry('DELETE FROM pos_products WHERE id = $1', [req.params.id]);
  } catch (err) {
    console.error("Relational pos_products delete xatosi:", err.message);
  }

  res.json({ success: true, message: "Mahsulot muvaffaqiyatli o'chirildi", id: req.params.id });
});

// Record a POS Sale
router.post('/sell', async (req, res) => {
  let products = await loadCollection('posProducts');
  let sales = await loadCollection('posSales');
  const { memberId, memberName, items, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Savat bo'sh!" });
  }

  // Verify member is currently in the gym ("Zalda") if memberId is provided
  if (memberId) {
    const attendance = await loadCollection('attendance');
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
  await saveCollection('posProducts', products);
  await saveCollection('posSales', sales);

  res.status(201).json({ success: true, sale: newSale });
});

module.exports = router;

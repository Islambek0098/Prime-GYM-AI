import React, { useState } from 'react';
import { ShoppingBag, Plus, ShoppingCart, Trash2, CheckCircle2, Search, Package, AlertCircle, DollarSign, CreditCard, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE_URL } from '../config';

export default function PosBar({ posData, members = [], attendance = [], onRefresh, showToast }) {
  const products = posData.products || [];
  const sales = posData.sales || [];

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All'); // 'All' | 'Naqd' | 'Karta / Click'
  const [cart, setCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Naqd');
  const [loading, setLoading] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const [posMobileTab, setPosMobileTab] = useState('catalog'); // 'catalog' | 'cart'

  // Filtered customer list for real-time POS customer search (in-gym members prioritized first)
  const cleanCustQuery = customerSearch.toLowerCase().trim().replace(/\s+/g, '');
  const filteredCustomerList = members.filter(m => {
    if (!customerSearch.trim()) return true;
    const qLower = customerSearch.toLowerCase().trim();
    const nameMatch = m.fullName.toLowerCase().includes(qLower);
    const idMatch = m.id.toLowerCase().includes(qLower);
    const phoneMatch = m.phone ? m.phone.replace(/\s+/g, '').includes(cleanCustQuery) : false;
    return nameMatch || idMatch || phoneMatch;
  }).sort((a, b) => {
    const aInGym = attendance.some(att => att.memberId === a.id && att.status === 'Zalda');
    const bInGym = attendance.some(att => att.memberId === b.id && att.status === 'Zalda');
    if (aInGym && !bInGym) return -1;
    if (!aInGym && bInGym) return 1;
    return 0;
  });

  // New product form & error states
  const [newProd, setNewProd] = useState({ name: '', category: 'Ichimlik', price: '', stock: 20, unit: 'dona' });
  const [errors, setErrors] = useState({});

  const categories = ['All', 'Ichimlik', 'Energetik', 'Qo\'shimcha', 'Snek'];

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort products by STOCK ASCENDING (lowest stock running out appears FIRST)
  const sortedProducts = [...filteredProducts].sort((a, b) => (a.stock || 0) - (b.stock || 0));

  // Filter sales history by payment method
  const filteredSales = sales.filter(s => {
    if (paymentFilter === 'All') return true;
    if (paymentFilter === 'Naqd') return s.paymentMethod === 'Naqd' || !s.paymentMethod;
    return s.paymentMethod === 'Karta / Click';
  });

  const cashSalesTotal = sales
    .filter(s => s.paymentMethod === 'Naqd' || !s.paymentMethod)
    .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

  const cardSalesTotal = sales
    .filter(s => s.paymentMethod === 'Karta / Click')
    .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckoutSale = async () => {
    if (cart.length === 0) return;

    if (selectedMemberId) {
      const isInGym = attendance.some(a => a.memberId === selectedMemberId && a.status === 'Zalda');
      if (!isInGym) {
        if (showToast) showToast("Bu mijoz zalda emas", "error");
        else alert("Bu mijoz zalda emas");
        return;
      }
    }

    setLoading(true);

    const selectedMember = members.find(m => m.id === selectedMemberId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId || null,
          memberName: selectedMember ? selectedMember.fullName : "Oddiy Xaridor",
          items: cart,
          paymentMethod
        })
      });

      if (res.ok) {
        confetti({ particleCount: 70, spread: 50 });
        setCart([]);
        setSelectedMemberId('');
        if (showToast) showToast("Sotuv muvaffaqiyatli amalga oshirildi!");
        onRefresh();
      } else {
        const data = await res.json();
        if (showToast) showToast(data.error || "Bu mijoz zalda emas", "error");
        else alert(data.error || "Bu mijoz zalda emas");
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Server bilan bog'lanishda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (e, productId, productName) => {
    e.stopPropagation(); // prevent adding to cart on card click
    if (!window.confirm(`"${productName}" mahsulotini o'chirmoqchimisiz?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/products/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (showToast) showToast("Mahsulot o'chirildi", "info");
        onRefresh();
      } else {
        alert("Mahsulotni o'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      alert("Server bilan bog'lanishda xatolik");
    }
  };

  const validateProductForm = () => {
    const errs = {};
    if (!newProd.name || !newProd.name.trim()) {
      errs.name = "Mahsulot nomini kiritish shart!";
    }
    if (!newProd.price || Number(newProd.price) <= 0) {
      errs.price = "Narxini to'g'ri kiriting!";
    }
    if (newProd.stock === '' || newProd.stock === null || Number(newProd.stock) < 0) {
      errs.stock = "Ombordagi sonini kiriting!";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!validateProductForm()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/pos/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      if (res.ok) {
        setShowAddProductModal(false);
        setNewProd({ name: '', category: 'Ichimlik', price: '', stock: 20, unit: 'dona' });
        setErrors({});
        if (showToast) showToast("Muvaffaqiyatli qo'shildi!");
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      alert("Server xatoligi");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-full overflow-hidden">
      
      {/* Header & Sales Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <span>Fitnes Bar (POS Tizimi)</span>
          </h2>
          <p className="text-xs text-slate-400">Kam qolgan mahsulotlar eng tepada, Naqd va Karta sotuvlari tahlili</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Payment Totals Badge */}
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              💵 Naqd: {cashSalesTotal.toLocaleString()} so'm
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-purple-400 font-bold flex items-center gap-1">
              💳 Karta: {cardSalesTotal.toLocaleString()} so'm
            </span>
          </div>

          <button
            onClick={() => {
              setErrors({});
              setNewProd({ name: '', category: 'Ichimlik', price: '', stock: 20, unit: 'dona' });
              setShowAddProductModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Yangi Mahsulot Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Mobile View Switcher Tab */}
      <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 lg:hidden text-xs font-bold">
        <button
          onClick={() => setPosMobileTab('catalog')}
          className={`flex-1 py-2.5 rounded-lg text-center transition ${
            posMobileTab === 'catalog' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400'
          }`}
        >
          📦 Mahsulotlar Katalogi
        </button>
        <button
          onClick={() => setPosMobileTab('cart')}
          className={`flex-1 py-2.5 rounded-lg text-center transition flex items-center justify-center gap-1.5 ${
            posMobileTab === 'cart' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400'
          }`}
        >
          🛒 Savat ({cart.length})
        </button>
      </div>

      {/* Main Grid: Left Catalog, Right Shopping Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left 8 Cols: Product Catalog */}
        <div className={`lg:col-span-8 space-y-6 ${posMobileTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
          
          {/* Filters & Search */}
          <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Mahsulot nomini qidirish..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto w-full md:w-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    selectedCategory === cat ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'All' ? 'Barchasi' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid (Sorted by stock ascending: <10 RED, 10-15 ORANGE, >15 GREEN) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sortedProducts.map(prod => (
              <div
                key={prod.id}
                onClick={() => addToCart(prod)}
                className={`glass-card p-5 rounded-2xl border cursor-pointer transition transform hover:-translate-y-1 relative overflow-hidden group ${
                  prod.stock < 10 
                    ? 'border-rose-500/50 bg-rose-500/5' 
                    : prod.stock <= 15 
                      ? 'border-amber-500/50 bg-amber-500/5' 
                      : 'border-slate-800/80 hover:border-amber-500/40'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-400">
                    {prod.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {prod.stock < 10 ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                        🔴 {prod.stock} {prod.unit}
                      </span>
                    ) : prod.stock <= 15 ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        🟠 {prod.stock} {prod.unit}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                        🟢 {prod.stock} {prod.unit}
                      </span>
                    )}

                    <button
                      onClick={(e) => handleDeleteProduct(e, prod.id, prod.name)}
                      title="Mahsulotni o'chirish"
                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-white text-sm group-hover:text-amber-400 transition">{prod.name}</h4>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-amber-400 font-extrabold text-base">
                    {prod.price.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">so'm</span>
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right 4 Cols: Shopping Cart & Checkout */}
        <div className={`lg:col-span-4 space-y-4 ${posMobileTab === 'cart' ? 'block' : 'hidden lg:block'}`}>
          <div className="glass-card p-6 rounded-2xl space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <span>Savat ({cart.length})</span>
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-rose-400 font-semibold hover:underline">
                  Tozalash
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Savat bo'sh. Chap tomondagi mahsulotlarni tanlang.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-white">{item.name}</h4>
                      <span className="text-[11px] text-amber-400 font-semibold">{item.price.toLocaleString()} so'm</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQty(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-white text-xs">{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Customer & Payment Selection */}
            {cart.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Xaridor Mijoz (Ixtiyoriy)</label>
                  {selectedMemberId ? (
                    (() => {
                      const selectedM = members.find(m => m.id === selectedMemberId);
                      const isInGym = attendance.some(a => a.memberId === selectedMemberId && a.status === 'Zalda');
                      return (
                        <div className="p-2.5 bg-slate-950 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{isInGym ? '🟢' : '🔴'}</span>
                            <div>
                              <span className="font-bold text-white block">{selectedM ? selectedM.fullName : 'Tanlangan Mijoz'}</span>
                              <span className="text-[10px] text-slate-400">{selectedM?.phone} ({selectedMemberId})</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMemberId('');
                              setCustomerSearch('');
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 transition"
                            title="Mijozni bekor qilish"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={e => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDropdown(true);
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          placeholder="Mijoz ismi, telefon yoki ID izlang..."
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Customer Autocomplete Dropdown */}
                      {showCustomerDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800/80 max-h-56 overflow-y-auto">
                          <div
                            onClick={() => {
                              setSelectedMemberId('');
                              setShowCustomerDropdown(false);
                              setCustomerSearch('');
                            }}
                            className="p-2.5 hover:bg-slate-800/80 cursor-pointer transition text-xs font-semibold text-slate-400"
                          >
                            -- Oddiy Xaridor (Mijozsiz) --
                          </div>
                          {filteredCustomerList.slice(0, 10).map(m => {
                            const isInGym = attendance.some(a => a.memberId === m.id && a.status === 'Zalda');
                            return (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setSelectedMemberId(m.id);
                                  setShowCustomerDropdown(false);
                                  setCustomerSearch('');
                                }}
                                className={`p-2.5 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between text-xs ${
                                  isInGym ? 'bg-emerald-500/5' : ''
                                }`}
                              >
                                <div>
                                  <span className="font-bold text-white block">
                                    {isInGym ? '🟢 ' : '🔴 '} {m.fullName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{m.phone} • <span className="text-cyan-400 font-semibold">{m.id}</span></span>
                                </div>
                                <div>
                                  {isInGym ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                      [ZALDA]
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                                      [Zalda emas]
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">To'lov Usuli</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Naqd')}
                      className={`py-2 rounded-xl border transition ${
                        paymentMethod === 'Naqd' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      💵 Naqd
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Karta / Click')}
                      className={`py-2 rounded-xl border transition ${
                        paymentMethod === 'Karta / Click' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      💳 Karta / Payme
                    </button>
                  </div>
                </div>

                {/* Total & Checkout */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-slate-400 font-semibold">Umumiy Summa:</span>
                    <span className="text-xl font-extrabold text-amber-400">{totalCartPrice.toLocaleString()} SO'M</span>
                  </div>

                  <button
                    onClick={handleCheckoutSale}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{loading ? "Sotilmoqda..." : "Sotuvni Qayd Etish"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Yangi Bar Mahsuloti Qo'shish</h3>
            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mahsulot Nomi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: RedBull 0.25L"
                  value={newProd.name}
                  onChange={e => {
                    setNewProd({ ...newProd, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-white transition focus:outline-none ${
                    errors.name
                      ? 'bg-rose-500/10 border-2 border-rose-500 placeholder-rose-300/50'
                      : 'bg-slate-950 border border-slate-700 focus:border-amber-500'
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] font-semibold text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategoriya</label>
                  <select
                    value={newProd.category}
                    onChange={e => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Ichimlik">Ichimlik</option>
                    <option value="Energetik">Energetik</option>
                    <option value="Qo'shimcha">Qo'shimcha</option>
                    <option value="Snek">Snek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">O'lchov Birligi</label>
                  <input
                    type="text"
                    value={newProd.unit}
                    onChange={e => setNewProd({ ...newProd, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Narxi (So'm) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="15000"
                    value={newProd.price}
                    onChange={e => {
                      setNewProd({ ...newProd, price: e.target.value });
                      if (errors.price) setErrors({ ...errors, price: null });
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-white transition focus:outline-none ${
                      errors.price
                        ? 'bg-rose-500/10 border-2 border-rose-500 placeholder-rose-300/50'
                        : 'bg-slate-950 border border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  {errors.price && (
                    <p className="text-[11px] font-semibold text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.price}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Soni (Ombor) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={newProd.stock}
                    onChange={e => {
                      setNewProd({ ...newProd, stock: e.target.value });
                      if (errors.stock) setErrors({ ...errors, stock: null });
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-white transition focus:outline-none ${
                      errors.stock
                        ? 'bg-rose-500/10 border-2 border-rose-500 placeholder-rose-300/50'
                        : 'bg-slate-950 border border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  {errors.stock && (
                    <p className="text-[11px] font-semibold text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.stock}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold shadow-lg shadow-amber-500/20"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

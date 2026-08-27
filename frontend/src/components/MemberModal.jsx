import React, { useState, useEffect } from 'react';
import { X, User, Phone, Send, CreditCard, DollarSign, AlertCircle, PlusCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function MemberModal({ isOpen, onClose, onSave, subscriptions, memberToEdit, showToast }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    telegramId: '',
    gender: 'Erkak',
    subscriptionId: '',
    totalPaid: '',
    debt: 0,
    paymentMethod: 'Naqd'
  });

  const [additionalPayment, setAdditionalPayment] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data only when modal opens or memberToEdit changes
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setAdditionalPayment('');
      if (memberToEdit) {
        setFormData({
          fullName: memberToEdit.fullName || '',
          phone: memberToEdit.phone || '',
          telegramId: memberToEdit.telegramId || '',
          gender: memberToEdit.gender || 'Erkak',
          subscriptionId: memberToEdit.subscriptionId || subscriptions[0]?.id || '',
          totalPaid: memberToEdit.totalPaid !== undefined ? memberToEdit.totalPaid : '',
          debt: memberToEdit.debt || 0,
          paymentMethod: memberToEdit.paymentMethod || 'Naqd'
        });
      } else {
        const defaultSub = subscriptions[0];
        const initialPrice = defaultSub ? defaultSub.price : 0;
        setFormData({
          fullName: '',
          phone: '',
          telegramId: '',
          gender: 'Erkak',
          subscriptionId: defaultSub?.id || '',
          totalPaid: initialPrice,
          debt: 0,
          paymentMethod: 'Naqd'
        });
      }
    }
  }, [isOpen, memberToEdit]);

  if (!isOpen) return null;

  const selectedSub = subscriptions.find(s => s.id === formData.subscriptionId) || subscriptions[0];
  const subPrice = selectedSub ? selectedSub.price : 0;

  // Debt calculations
  const isEditing = !!memberToEdit;
  const existingPaid = isEditing ? Number(memberToEdit.totalPaid || 0) : 0;
  const addAmt = Number(additionalPayment) || 0;

  // Total paid calculation
  const calculatedTotalPaid = isEditing ? (existingPaid + addAmt) : (Number(formData.totalPaid) || 0);
  const currentDebt = Math.max(0, subPrice - calculatedTotalPaid);

  const handleSubChange = (e) => {
    const subId = e.target.value;
    const sub = subscriptions.find(s => s.id === subId);
    const price = sub ? sub.price : 0;
    setFormData(prev => ({
      ...prev,
      subscriptionId: subId,
      totalPaid: price,
      debt: 0
    }));
  };

  const handleTotalPaidChange = (e) => {
    const paidVal = e.target.value;
    const paidNum = Number(paidVal) || 0;
    const debtVal = Math.max(0, subPrice - paidNum);
    setFormData(prev => ({
      ...prev,
      totalPaid: paidVal,
      debt: debtVal
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName || !formData.fullName.trim()) {
      errs.fullName = "Familiya va ismni kiriting!";
    }
    
    // Phone validation (digits, spaces, hyphens, optional + prefix, min 9 digits)
    const rawPhone = (formData.phone || '').trim();
    const cleanPhoneDigits = rawPhone.replace(/[^\d]/g, '');
    const phoneRegex = /^\+?[0-9\s\-]{9,18}$/;
    if (!rawPhone) {
      errs.phone = "Telefon raqamini kiriting!";
    } else if (!phoneRegex.test(rawPhone) || cleanPhoneDigits.length < 9) {
      errs.phone = "Telefon raqami noto'g'ri! Faqat raqamlardan iborat bo'lishi kerak (masalan: +998901234567)";
    }

    // Telegram Chat ID validation (if provided, must be numeric digits)
    const rawTelegramId = (formData.telegramId || '').trim();
    if (rawTelegramId) {
      const telegramRegex = /^-?\d+$/;
      if (!telegramRegex.test(rawTelegramId)) {
        errs.telegramId = "Telegram Chat ID faqat raqamlardan iborat bo'lishi kerak (masalan: 123456789)";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = isEditing ? {
      ...formData,
      additionalPayment: addAmt,
      totalPaid: calculatedTotalPaid,
      debt: currentDebt
    } : {
      ...formData,
      totalPaid: calculatedTotalPaid,
      debt: currentDebt
    };

    try {
      const url = memberToEdit 
        ? `${API_BASE_URL}/api/members/${memberToEdit.id}`
        : `${API_BASE_URL}/api/members`;
      
      const method = memberToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (showToast) {
          if (memberToEdit) {
            showToast("Mijoz ma'lumotlari yangilandi!", "update");
          } else {
            showToast("Yangi mijoz ro'yxatga olindi!", "success");
          }
        }
        onSave && onSave();
        onClose();
      } else {
        const errData = await res.json();
        if (showToast) {
          showToast(errData.error || "Mijozni saqlashda xatolik!", "error");
        } else {
          alert(errData.error || "Xatolik yuz berdi");
        }
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Server bilan bog'lanishda xatolik!", "error");
      else alert("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>{memberToEdit ? "Mijoz To'lovini Boshqarish / Tahrirlash" : "Yangi Mijoz Qo'shish"}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Familiyasi va Ismi <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Masalan: Jasur Alimov"
              value={formData.fullName}
              onChange={e => {
                setFormData({ ...formData, fullName: e.target.value });
                if (errors.fullName) setErrors({ ...errors, fullName: null });
              }}
              className={`w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none transition ${
                errors.fullName 
                  ? 'bg-rose-500/10 border-2 border-rose-500 placeholder-rose-300/50' 
                  : 'bg-slate-950 border border-slate-700 focus:border-cyan-500'
              }`}
            />
            {errors.fullName && (
              <p className="text-[11px] font-semibold text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telefon Raqami <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="+998 90 123 45 67"
                value={formData.phone}
                onChange={e => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: null });
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none transition ${
                  errors.phone 
                    ? 'bg-rose-500/10 border-2 border-rose-500 placeholder-rose-300/50' 
                    : 'bg-slate-950 border border-slate-700 focus:border-cyan-500'
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] font-semibold text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram Chat ID (Ixtiyoriy)</label>
              <input
                type="text"
                placeholder="123456789"
                value={formData.telegramId}
                onChange={e => {
                  setFormData({ ...formData, telegramId: e.target.value });
                  if (errors.telegramId) setErrors({ ...errors, telegramId: null });
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none transition ${
                  errors.telegramId 
                    ? 'bg-rose-500/10 border-2 border-rose-500 placeholder-rose-300/50' 
                    : 'bg-slate-950 border border-slate-700 focus:border-cyan-500'
                }`}
              />
              {errors.telegramId && (
                <p className="text-[11px] font-semibold text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.telegramId}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jinsi</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="Erkak">Erkak</option>
                <option value="Ayol">Ayol</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tarif Tanlash</label>
              <select
                value={formData.subscriptionId}
                onChange={handleSubChange}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 font-semibold"
              >
                {subscriptions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.price.toLocaleString()} so'm)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>To'lov va Qarz So'ndirish:</span>
              </span>
              <span className="text-[11px] text-slate-400">Tarif: <strong>{subPrice.toLocaleString()} SO'M</strong></span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">To'lov Usuli</label>
                <select
                  value={formData.paymentMethod}
                  onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold"
                >
                  <option value="Naqd">💵 Naqd</option>
                  <option value="Karta / Click">💳 Karta / Click</option>
                </select>
              </div>

              {isEditing ? (
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Qo'shimcha To'lov Summasi</span>
                  </label>
                  <input
                    type="number"
                    value={additionalPayment}
                    onChange={e => setAdditionalPayment(e.target.value)}
                    placeholder="Qarz so'ndirish summasi..."
                    className="w-full px-3 py-2 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-bold focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Boshlang'ich To'langan</label>
                  <input
                    type="number"
                    value={formData.totalPaid}
                    onChange={handleTotalPaidChange}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold"
                  />
                </div>
              )}
            </div>

            {/* Calculations Summary Row */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 block">Jami To'langan:</span>
                <span className="font-extrabold text-emerald-400 text-sm">{calculatedTotalPaid.toLocaleString()} SO'M</span>
                {isEditing && existingPaid > 0 && (
                  <span className="text-[10px] text-slate-500 block">(Oldingi: {existingPaid.toLocaleString()} so'm)</span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Qarz Qoldig'i:</span>
                <span className={`font-extrabold text-sm ${currentDebt > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {currentDebt > 0 ? `${currentDebt.toLocaleString()} SO'M` : "🟢 Qarzsiz"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/20"
            >
              {loading ? "Saqlanmoqda..." : (memberToEdit ? "Yangilash" : "Saqlash")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

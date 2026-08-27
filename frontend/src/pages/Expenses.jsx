import React, { useState } from 'react';
import { Wallet, Plus, Trash2, Calendar, Tag, DollarSign, AlertCircle, TrendingDown } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Expenses({ expenses = [], onRefresh, showToast }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'KOMMUNAL',
    amount: '',
    paymentMethod: 'Naqd',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [errors, setErrors] = useState({});

  const categories = ['IJARA', 'KOMMUNAL', 'OYLIK', 'JIHOZLAR', 'REKLAMA', 'BOSHQA'];

  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const cashExpense = expenses.filter(e => e.paymentMethod === 'Naqd').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const cardExpense = expenses.filter(e => e.paymentMethod === 'Karta / Click').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const validate = () => {
    const errs = {};
    if (!form.title || !form.title.trim()) {
      errs.title = "Harajat nomini kiriting!";
    }
    if (!form.amount || Number(form.amount) <= 0) {
      errs.amount = "Summani to'g'ri kiriting!";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount)
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setForm({
          title: '',
          category: 'KOMMUNAL',
          amount: '',
          paymentMethod: 'Naqd',
          date: new Date().toISOString().split('T')[0],
          note: ''
        });
        setErrors({});
        if (showToast) showToast("Yangi harajat muvaffaqiyatli saqlandi!", "success");
        onRefresh();
      } else {
        const data = await res.json();
        if (showToast) showToast(data.error || "Xatolik yuz berdi", "error");
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Server bilan bog'lanishda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id, title) => {
    if (!window.confirm(`"${title}" harajatini o'chirmoqchimisiz?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (showToast) showToast("Harajat yozuvi o'chirildi", "info");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-rose-400" />
            <span>Harajatlar Boshqaruvi</span>
          </h2>
          <p className="text-xs text-slate-400">Sport zali operatsion va qo'shimcha barcha harajatlari hisobi</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-bold shadow-lg shadow-rose-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Harajat Qo'shish</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Jami Harajatlar</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {totalExpense.toLocaleString()} <span className="text-xs text-slate-400 font-medium">SO'M</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">{expenses.length} ta qayd etilgan harajat</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">💵 Naqd Harajatlar</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              💵
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {cashExpense.toLocaleString()} <span className="text-xs text-slate-400 font-medium">SO'M</span>
            </h3>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">💳 Karta / Click Harajatlar</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              💳
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {cardExpense.toLocaleString()} <span className="text-xs text-slate-400 font-medium">SO'M</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-rose-400" />
          <span>Barcha Harajatlar Ro'yxati ({expenses.length})</span>
        </h3>

        {expenses.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Hozircha hech qanday harajat yozuvi kiritilmagan. Yuqoridagi tugma orqali qo'shishingiz mumkin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="custom-table text-xs">
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Harajat Maqsadi / Nomi</th>
                  <th>Kategoriya</th>
                  <th>To'lov Usuli</th>
                  <th>Summa</th>
                  <th className="text-right">O'chirish</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="text-slate-400">
                      {new Date(exp.date).toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </td>
                    <td>
                      <span className="font-bold text-white block">{exp.title}</span>
                      {exp.note && <span className="text-[10px] text-slate-400">{exp.note}</span>}
                    </td>
                    <td>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        exp.paymentMethod === 'Karta / Click' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {exp.paymentMethod === 'Karta / Click' ? '💳 Karta' : '💵 Naqd'}
                      </span>
                    </td>
                    <td className="font-extrabold text-rose-400 text-sm">
                      -{(Number(exp.amount) || 0).toLocaleString()} so'm
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.title)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition ml-auto"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Yangi Harajat Qo'shish</h3>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Harajat Maqsadi / Nomi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Elektr energiyasi to'lovi"
                  value={form.title}
                  onChange={e => {
                    setForm({ ...form, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: null });
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-white transition focus:outline-none ${
                    errors.title
                      ? 'bg-rose-500/10 border-2 border-rose-500 placeholder-rose-300/50'
                      : 'bg-slate-950 border border-slate-700 focus:border-rose-500'
                  }`}
                />
                {errors.title && (
                  <p className="text-[11px] font-semibold text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.title}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategoriya</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">To'lov Usuli</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Naqd">💵 Naqd</option>
                    <option value="Karta / Click">💳 Karta / Click</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Summasi (SO'M) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="150000"
                    value={form.amount}
                    onChange={e => {
                      setForm({ ...form, amount: e.target.value });
                      if (errors.amount) setErrors({ ...errors, amount: null });
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-white transition focus:outline-none ${
                      errors.amount
                        ? 'bg-rose-500/10 border-2 border-rose-500 placeholder-rose-300/50'
                        : 'bg-slate-950 border border-slate-700 focus:border-rose-500'
                    }`}
                  />
                  {errors.amount && (
                    <p className="text-[11px] font-semibold text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.amount}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sana</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Izoh (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Qo'shimcha tafsilotlar..."
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold shadow-lg shadow-rose-500/20"
                >
                  {loading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

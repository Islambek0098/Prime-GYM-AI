import React, { useState, useMemo } from 'react';
import { Wallet, Plus, Trash2, Calendar, Tag, DollarSign, AlertCircle, TrendingDown, BarChart3, PieChart, Filter } from 'lucide-react';
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
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'today' | 'week'

  const categories = ['IJARA', 'KOMMUNAL', 'OYLIK', 'JIHOZLAR', 'REKLAMA', 'BOSHQA'];
  const categoryColors = {
    'IJARA': { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/25', bar: '#3b82f6' },
    'KOMMUNAL': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/25', bar: '#f59e0b' },
    'OYLIK': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25', bar: '#10b981' },
    'JIHOZLAR': { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/25', bar: '#a855f7' },
    'REKLAMA': { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/25', bar: '#06b6d4' },
    'BOSHQA': { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/25', bar: '#64748b' }
  };

  // Date helpers
  const today = new Date().toISOString().split('T')[0];
  const getStartOfWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    return start.toISOString().split('T')[0];
  };
  const weekStart = getStartOfWeek();

  // Filtered expenses based on time filter
  const filteredExpenses = useMemo(() => {
    if (timeFilter === 'today') {
      return expenses.filter(e => (e.date || '').split('T')[0] === today);
    }
    if (timeFilter === 'week') {
      return expenses.filter(e => {
        const eDate = (e.date || '').split('T')[0];
        return eDate >= weekStart && eDate <= today;
      });
    }
    return expenses;
  }, [expenses, timeFilter, today, weekStart]);

  // KPI calculations
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const cashExpense = filteredExpenses.filter(e => e.paymentMethod === 'Naqd').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const cardExpense = filteredExpenses.filter(e => e.paymentMethod === 'Karta / Click').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Today / This week totals (always calculated, regardless of filter)
  const todayTotal = useMemo(() => {
    return expenses.filter(e => (e.date || '').split('T')[0] === today)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, today]);

  const weekTotal = useMemo(() => {
    return expenses.filter(e => {
      const eDate = (e.date || '').split('T')[0];
      return eDate >= weekStart && eDate <= today;
    }).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, weekStart, today]);

  // Last 7 days bar chart data
  const last7DaysData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayExpenses = expenses.filter(e => (e.date || '').split('T')[0] === dateStr);
      const total = dayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      days.push({
        date: dateStr,
        dayName: d.toLocaleDateString('uz-UZ', { weekday: 'short' }),
        dayNum: d.getDate(),
        total
      });
    }
    return days;
  }, [expenses]);

  const maxDayTotal = Math.max(...last7DaysData.map(d => d.total), 1);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'BOSHQA';
      breakdown[cat] = (breakdown[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(breakdown)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpense]);

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

  const filterLabel = timeFilter === 'today' ? 'Bugungi' : timeFilter === 'week' ? 'Shu Haftalik' : 'Barcha';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-full overflow-hidden">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-rose-400" />
            <span>Harajatlar Boshqaruvi</span>
          </h2>
          <p className="text-xs text-slate-400">Sport zali operatsion va qo'shimcha barcha harajatlari hisobi</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Filter Buttons */}
          <div className="flex items-center bg-slate-900/80 rounded-xl border border-slate-800 p-0.5">
            {[
              { key: 'all', label: '📋 Barchasi' },
              { key: 'today', label: '📅 Bugun' },
              { key: 'week', label: '📆 Hafta' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setTimeFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
                  timeFilter === f.key
                    ? 'bg-rose-500/20 text-rose-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-bold shadow-lg shadow-rose-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Harajat Qo'shish</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid — 5 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Jami */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">{filterLabel} Jami</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {totalExpense.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">SO'M</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{filteredExpenses.length} ta harajat</p>
          </div>
        </div>

        {/* Bugungi */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">📅 Bugungi</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {todayTotal.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">SO'M</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{today}</p>
          </div>
        </div>

        {/* Haftalik */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">📆 Shu Hafta</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {weekTotal.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">SO'M</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{weekStart} ~ {today}</p>
          </div>
        </div>

        {/* Naqd */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">💵 Naqd</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              💵
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {cashExpense.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">SO'M</span>
            </h3>
          </div>
        </div>

        {/* Karta */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">💳 Karta</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm">
              💳
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {cardExpense.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">SO'M</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Row — Bar Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* 7-Day Bar Chart */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-400" />
            <span>Oxirgi 7 Kunlik Harajatlar</span>
          </h3>
          
          <div className="flex items-end justify-between gap-1.5 h-40 sm:h-48 pt-2">
            {last7DaysData.map((day, idx) => {
              const height = maxDayTotal > 0 ? Math.max((day.total / maxDayTotal) * 100, day.total > 0 ? 8 : 2) : 2;
              const isToday = day.date === today;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group" title={`${day.date}: ${day.total.toLocaleString()} so'm`}>
                  {/* Amount label on hover */}
                  <div className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.total > 0 ? `${(day.total / 1000).toFixed(0)}k` : '0'}
                  </div>
                  {/* Bar */}
                  <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                    <div 
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out ${
                        isToday 
                          ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-lg shadow-rose-500/30' 
                          : day.total > 0 
                            ? 'bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-rose-600/60 group-hover:to-rose-400/60' 
                            : 'bg-slate-800/50'
                      }`}
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                  </div>
                  {/* Day label */}
                  <div className={`text-[10px] font-bold ${isToday ? 'text-rose-400' : 'text-slate-500'}`}>
                    {day.dayName}
                  </div>
                  <div className={`text-[9px] ${isToday ? 'text-rose-400 font-bold' : 'text-slate-600'}`}>
                    {day.dayNum}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily Average */}
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800">
            <span className="text-slate-400">Kunlik O'rtacha:</span>
            <span className="font-bold text-white">
              {Math.round(last7DaysData.reduce((s, d) => s + d.total, 0) / 7).toLocaleString()} so'm
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            <span>Kategoriya Bo'yicha Taqsimot</span>
          </h3>
          
          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Hozircha harajat yozuvi yo'q
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((item) => {
                const colors = categoryColors[item.category] || categoryColors['BOSHQA'];
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: colors.bar }} />
                        <span className={`font-bold ${colors.text}`}>{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-[11px]">{item.amount.toLocaleString()} so'm</span>
                        <span className={`text-[10px] font-bold ${colors.text} px-1.5 py-0.5 rounded ${colors.bg}`}>
                          {item.percent}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ 
                          width: `${item.percent}%`, 
                          backgroundColor: colors.bar,
                          minWidth: item.percent > 0 ? '8px' : '0'
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Total row */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                <span className="text-slate-400 font-semibold">Jami ({filterLabel}):</span>
                <span className="font-extrabold text-rose-400 text-sm">-{totalExpense.toLocaleString()} so'm</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-rose-400" />
          <span>{filterLabel} Harajatlar Ro'yxati ({filteredExpenses.length})</span>
        </h3>

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            {timeFilter === 'all' 
              ? "Hozircha hech qanday harajat yozuvi kiritilmagan. Yuqoridagi tugma orqali qo'shishingiz mumkin."
              : `${filterLabel} davr uchun harajat yozuvi topilmadi.`
            }
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
                {filteredExpenses.map((exp) => {
                  const colors = categoryColors[exp.category] || categoryColors['BOSHQA'];
                  return (
                    <tr key={exp.id}>
                      <td className="text-slate-400">
                        {new Date(exp.date).toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </td>
                      <td>
                        <span className="font-bold text-white block">{exp.title}</span>
                        {exp.note && <span className="text-[10px] text-slate-400">{exp.note}</span>}
                      </td>
                      <td>
                        <span className={`px-2.5 py-1 rounded-lg ${colors.bg} ${colors.text} font-bold ${colors.border} border text-[10px]`}>
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
                  );
                })}
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

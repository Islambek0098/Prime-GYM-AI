import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  CreditCard, 
  Calendar, 
  Layers, 
  PieChart as PieChartIcon,
  CheckCircle2,
  Wallet
} from 'lucide-react';

export default function Finance({ members = [], posSales = [], expenses = [], subscriptions = [] }) {
  const [period, setPeriod] = useState('month'); // 'today' | 'week' | 'month' | 'all' | 'custom'
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentFilter, setPaymentFilter] = useState('All'); // 'All' | 'Naqd' | 'Karta / Click'

  // Extract all subscription & debt payments
  const allSubPayments = members.flatMap(m => {
    if (Array.isArray(m.paymentHistory) && m.paymentHistory.length > 0) {
      return m.paymentHistory.map(p => ({
        ...p,
        type: 'subscription',
        memberName: m.fullName,
        subscriptionName: m.subscriptionName
      }));
    } else if ((Number(m.totalPaid) || 0) > 0) {
      return [{
        id: `legacy_${m.id}`,
        type: 'subscription',
        date: m.createdAt || new Date().toISOString(),
        amount: Number(m.totalPaid) || 0,
        paymentMethod: m.paymentMethod || "Naqd",
        note: "A'zolik to'lovi",
        memberName: m.fullName,
        subscriptionName: m.subscriptionName
      }];
    }
    return [];
  });

  const isWithinPeriod = (dateIso) => {
    if (!dateIso) return false;
    const itemDate = new Date(dateIso);
    const now = new Date();

    if (period === 'today') {
      return itemDate.toDateString() === now.toDateString();
    }
    if (period === 'week') {
      const diffTime = Math.abs(now - itemDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (period === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (period === 'custom' && customDate) {
      const itemStr = itemDate.toISOString().split('T')[0];
      return itemStr === customDate;
    }
    return true; // 'all'
  };

  const matchesPayment = (method) => {
    if (paymentFilter === 'All') return true;
    if (paymentFilter === 'Naqd') return method === 'Naqd' || !method;
    return method === 'Karta / Click';
  };

  // Filtered Payments
  const periodSubPayments = allSubPayments.filter(p => isWithinPeriod(p.date) && matchesPayment(p.paymentMethod));
  const periodPosSales = posSales.filter(s => isWithinPeriod(s.date) && matchesPayment(s.paymentMethod));
  const periodExpenses = expenses.filter(e => isWithinPeriod(e.date) && matchesPayment(e.paymentMethod));

  const subRevenue = periodSubPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const posRevenue = periodPosSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const totalRevenue = subRevenue + posRevenue;
  const totalExpenseAmount = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenseAmount;

  // Breakdown by Cash vs Card
  const cashIncome = periodSubPayments.filter(p => p.paymentMethod === 'Naqd' || !p.paymentMethod).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
                     periodPosSales.filter(s => s.paymentMethod === 'Naqd' || !s.paymentMethod).reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  
  const cardIncome = periodSubPayments.filter(p => p.paymentMethod === 'Karta / Click').reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
                     periodPosSales.filter(s => s.paymentMethod === 'Karta / Click').reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

  return (
    <div className="p-8 space-y-8">
      
      {/* Header & Period Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>Finans & Moliyaviy Tahlil</span>
          </h2>
          <p className="text-xs text-slate-400">Jami tushumlar, Fitbar daromadi, harajatlar va Sof Foyda hisoboti</p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {[
              { id: 'today', label: 'Bugun' },
              { id: 'week', label: 'Shu Hafta' },
              { id: 'month', label: 'Shu Oy' },
              { id: 'all', label: 'Barchasi' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  period === tab.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setPaymentFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition ${
                paymentFilter === 'All' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setPaymentFilter('Naqd')}
              className={`px-3 py-1.5 rounded-lg transition ${
                paymentFilter === 'Naqd' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              💵 Naqd
            </button>
            <button
              onClick={() => setPaymentFilter('Karta / Click')}
              className={`px-3 py-1.5 rounded-lg transition ${
                paymentFilter === 'Karta / Click' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              💳 Karta
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Jami Tushum */}
        <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Jami Tushum (Daromad)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {totalRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-medium">SO'M</span>
            </h3>
            <p className="text-xs text-emerald-400 font-semibold mt-1">Abonement + Bar tushumi</p>
          </div>
        </div>

        {/* Card 2: Fitbar (POS) Tushumi */}
        <div className="glass-card p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Fitnes Bar (POS) Tushumi</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {posRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-medium">SO'M</span>
            </h3>
            <p className="text-xs text-amber-400 font-semibold mt-1">{periodPosSales.length} ta sotuv tranzaksiyasi</p>
          </div>
        </div>

        {/* Card 3: Harajatlar */}
        <div className="glass-card p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Jami Harajatlar</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {totalExpenseAmount.toLocaleString()} <span className="text-xs text-slate-400 font-medium">SO'M</span>
            </h3>
            <p className="text-xs text-rose-400 font-semibold mt-1">{periodExpenses.length} ta harajat yozuvi</p>
          </div>
        </div>

        {/* Card 4: Sof Foyda */}
        <div className={`glass-card p-6 rounded-2xl border ${
          netProfit >= 0 ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-rose-500/30 bg-rose-500/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${netProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              Sof Foyda (Net Profit)
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              netProfit >= 0 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-extrabold tracking-tight ${netProfit >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {netProfit.toLocaleString()} <span className="text-xs text-slate-400 font-medium">SO'M</span>
            </h3>
            <p className={`text-xs font-semibold mt-1 ${netProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? "🟢 Ijobiy ko'rsatkich" : "🔴 Ziyon / Salbiy"}
            </p>
          </div>
        </div>

      </div>

      {/* Revenue Breakdown by Source & Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Box: Daromad Manbalari */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-cyan-400" />
            <span>Daromad Manbalari Bo'yicha Tahlil</span>
          </h3>

          <div className="space-y-4 pt-2">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-cyan-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>Abonement va Obuna Tushumi</span>
                </span>
                <span className="text-white text-sm">{subRevenue.toLocaleString()} SO'M</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalRevenue > 0 ? (subRevenue / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{periodSubPayments.length} ta to'lov tranzaksiyasi</span>
                <span className="font-bold text-cyan-400">{totalRevenue > 0 ? Math.round((subRevenue / totalRevenue) * 100) : 0}% ulush</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Fitnes Bar (POS) Sotuv Tushumi</span>
                </span>
                <span className="text-white text-sm">{posRevenue.toLocaleString()} SO'M</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalRevenue > 0 ? (posRevenue / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{periodPosSales.length} ta sotuv kassa cheki</span>
                <span className="font-bold text-amber-400">{totalRevenue > 0 ? Math.round((posRevenue / totalRevenue) * 100) : 0}% ulush</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Box: To'lov Usullari Tahlili */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>To'lov Usullari Tahlili (Naqd va Karta)</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
              <span className="text-xs font-bold text-amber-400 block">💵 Naqd Tushum</span>
              <h4 className="text-xl font-extrabold text-white">{cashIncome.toLocaleString()} SO'M</h4>
              <p className="text-[11px] text-amber-400/80 font-semibold">
                Jami tushumning {totalRevenue > 0 ? Math.round((cashIncome / totalRevenue) * 100) : 0}% qismi
              </p>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
              <span className="text-xs font-bold text-purple-400 block">💳 Karta / Click Tushum</span>
              <h4 className="text-xl font-extrabold text-white">{cardIncome.toLocaleString()} SO'M</h4>
              <p className="text-[11px] text-purple-400/80 font-semibold">
                Jami tushumning {totalRevenue > 0 ? Math.round((cardIncome / totalRevenue) * 100) : 0}% qismi
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

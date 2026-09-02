import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { 
  Users, 
  CreditCard, 
  CalendarCheck2, 
  ShoppingBag, 
  TrendingUp, 
  AlertTriangle, 
  UserCheck, 
  ArrowUpRight,
  Send,
  Dumbbell,
  DollarSign,
  X,
  Calendar,
  Layers,
  CheckCircle2,
  Brain,
  Clock,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard({ members, attendance, posSales, subscriptions, onOpenCheckIn, onOpenAddMember, isLoading = false, isConnected = true, onRetry }) {
  const [showPosModal, setShowPosModal] = useState(false);
  const [posPeriod, setPosPeriod] = useState('today'); // 'today' | 'week' | 'month' | 'custom'
  const [posCustomDate, setPosCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [posPaymentFilter, setPosPaymentFilter] = useState('All'); // 'All' | 'Naqd' | 'Karta / Click'

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState('today'); // 'today' | 'week' | 'month' | 'custom'
  const [revenueCustomDate, setRevenueCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenuePaymentFilter, setRevenuePaymentFilter] = useState('All'); // 'All' | 'Naqd' | 'Karta / Click'

  // AI Smart Analytics state
  const [churnData, setChurnData] = useState(null);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/analytics/churn-risk`).then(r => r.json()).then(d => setChurnData(d)).catch(() => {});
    fetch(`${API_BASE_URL}/api/analytics/peak-hours`).then(r => r.json()).then(d => setPeakHoursData(d)).catch(() => {});
    fetch(`${API_BASE_URL}/api/analytics/forecast`).then(r => r.json()).then(d => setForecastData(d)).catch(() => {});
  }, []);

  const activeMembers = members.filter(m => m.status === 'Active');
  const expiredMembers = members.filter(m => m.status === 'Expired');
  
  // Expiry in 3 days
  const today = new Date();
  const expiringMembers = activeMembers.filter(m => {
    const end = new Date(m.endDate);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  });

  const totalMembersCount = members.length;
  const activeVisitors = attendance.filter(a => a.status === 'Zalda');

  // Extract all individual payment transactions across all members (including debt payoffs and extensions)
  const allPayments = members.flatMap(m => {
    if (Array.isArray(m.paymentHistory) && m.paymentHistory.length > 0) {
      return m.paymentHistory.map(p => ({
        ...p,
        memberId: m.id,
        memberName: m.fullName,
        subscriptionId: m.subscriptionId,
        subscriptionName: m.subscriptionName
      }));
    } else if ((Number(m.totalPaid) || 0) > 0) {
      return [{
        id: `legacy_${m.id}`,
        date: m.createdAt || new Date().toISOString(),
        amount: Number(m.totalPaid) || 0,
        paymentMethod: m.paymentMethod || "Naqd",
        note: "A'zolik to'lovi",
        memberId: m.id,
        memberName: m.fullName,
        subscriptionId: m.subscriptionId,
        subscriptionName: m.subscriptionName
      }];
    }
    return [];
  });

  // Total overall revenue calculations (Number() cast to prevent string concatenation bugs)
  const totalSubRevenue = members.reduce((sum, m) => sum + (Number(m.totalPaid) || 0), 0);
  const totalPosRevenue = posSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const grandTotalRevenue = totalSubRevenue + totalPosRevenue;

  // Dynamic Weekly Revenue Chart Data (Monday to Sunday)
  const daysOfWeek = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak'];
  const chartData = daysOfWeek.map((dayName, dayIdx) => {
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
    const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
    
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - mondayOffset + dayIdx);
    const dateStr = dayDate.toISOString().split('T')[0];

    // Total payments on this day
    const daySubRev = allPayments
      .filter(p => p.date && p.date.split('T')[0] === dateStr)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const dayPosRev = posSales
      .filter(s => s.date && s.date.split('T')[0] === dateStr)
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

    return {
      name: dayName,
      subRevenue: daySubRev,
      posRevenue: dayPosRev,
      total: daySubRev + dayPosRev
    };
  });

  // Period filter helper for modals
  const isWithinPeriod = (dateStr, period, customDateStr) => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    const now = new Date();
    
    if (period === 'today') {
      return itemDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
    }
    if (period === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= sevenDaysAgo && itemDate <= now;
    }
    if (period === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (period === 'custom' && customDateStr) {
      const itemStr = itemDate.toISOString().split('T')[0];
      return itemStr === customDateStr;
    }
    return true;
  };

  // Filtered POS sales for POS Detail Modal
  const periodPosSales = posSales.filter(s => isWithinPeriod(s.date, posPeriod, posCustomDate));
  const finalPosSales = periodPosSales.filter(s => {
    if (posPaymentFilter === 'All') return true;
    if (posPaymentFilter === 'Naqd') return s.paymentMethod === 'Naqd' || !s.paymentMethod;
    return s.paymentMethod === 'Karta / Click';
  });
  const periodPosTotal = finalPosSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

  // Filtered Subscription & POS revenue for Revenue Detail Modal
  const periodPayments = allPayments.filter(p => isWithinPeriod(p.date, revenuePeriod, revenueCustomDate));
  const finalPayments = periodPayments.filter(p => {
    if (revenuePaymentFilter === 'All') return true;
    if (revenuePaymentFilter === 'Naqd') return p.paymentMethod === 'Naqd' || !p.paymentMethod;
    return p.paymentMethod === 'Karta / Click';
  });

  const periodPosSalesForRev = posSales.filter(s => isWithinPeriod(s.date, revenuePeriod, revenueCustomDate));
  const finalPosSalesForRev = periodPosSalesForRev.filter(s => {
    if (revenuePaymentFilter === 'All') return true;
    if (revenuePaymentFilter === 'Naqd') return s.paymentMethod === 'Naqd' || !s.paymentMethod;
    return s.paymentMethod === 'Karta / Click';
  });

  const periodSubTotal = finalPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const periodPosTotalForRev = finalPosSalesForRev.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const periodGrandTotal = periodSubTotal + periodPosTotalForRev;

  // Group subscription revenue by tariff name
  const tariffBreakdown = subscriptions.map(sub => {
    const matchingPayments = finalPayments.filter(p => p.subscriptionId === sub.id || p.subscriptionName === sub.name);
    const count = matchingPayments.length;
    const revenue = matchingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return {
      id: sub.id,
      name: sub.name,
      price: sub.price,
      count,
      revenue
    };
  });

  const handleNotifyTelegram = async (memberId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/members/${memberId}/notify`, { method: 'POST' });
      if (res.ok) {
        alert("Telegram xabarnomasi yuborildi!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-full overflow-hidden">
      
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Jami Tushum (Clickable to open Revenue Modal) */}
        <div 
          onClick={() => setShowRevenueModal(true)}
          className="glass-card glass-card-interactive p-6 rounded-2xl relative overflow-hidden cursor-pointer group transition transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-400 transition">
              Jami Tushum (Daromad) 🔍
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <div className="h-8 w-36 bg-slate-700/50 rounded-lg animate-pulse my-1"></div>
            ) : (
              <h3 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-emerald-300 transition">
                {grandTotalRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-medium">SO'M</span>
              </h3>
            )}
            <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Batafsil tahlilni ko'rish (Bosing)</span>
            </p>
          </div>
        </div>

        {/* Card 2: Faol Mijozlar */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faol Mijozlar</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <div className="h-8 w-24 bg-slate-700/50 rounded-lg animate-pulse my-1"></div>
            ) : (
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {activeMembers.length} <span className="text-xs text-slate-400 font-medium">/ {totalMembersCount} kishi</span>
              </h3>
            )}
            <p className="text-xs text-cyan-400 font-semibold mt-1">
              {isLoading ? '...' : `${expiredMembers.length} ta Obunasi tugagan`}
            </p>
          </div>
        </div>

        {/* Card 3: Hozir Zalda */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hozir Zalda</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-700/50 rounded-lg animate-pulse my-1"></div>
            ) : (
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {activeVisitors.length} <span className="text-xs text-slate-400 font-medium">kishi</span>
              </h3>
            )}
            <p className="text-xs text-purple-400 font-semibold mt-1">
              Shkaflar bandligi aktiv
            </p>
          </div>
        </div>

        {/* Card 4: Fitnes Bar Sotuvi (Clickable to open POS Sales Modal) */}
        <div 
          onClick={() => setShowPosModal(true)}
          className="glass-card glass-card-interactive p-6 rounded-2xl relative overflow-hidden cursor-pointer group transition transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-400 transition">
              Fitnes Bar Tushumi 🔍
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <div className="h-8 w-28 bg-slate-700/50 rounded-lg animate-pulse my-1"></div>
            ) : (
              <h3 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-amber-300 transition">
                {totalPosRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-medium">SO'M</span>
              </h3>
            )}
            <p className="text-xs text-amber-400 font-semibold mt-1">
              {isLoading ? '...' : `${posSales.length} ta sotuv tranzaksiyasi (Bosing)`}
            </p>
          </div>
        </div>

      </div>

      {/* AI Smart Analytics Section */}
      <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-indigo-500/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>AI Smart Analytics & Tahlil</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Sun'iy Intellekt
                </span>
              </h3>
              <p className="text-xs text-slate-400">Churn Risk (Yo'qolish xavfidagi mijozlar), Zal Gavjumligi va Tushum Prognozi</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Churn Risk */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Riskdagi Mijozlar (Churn Risk)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-bold">
                {churnData ? churnData.count : 0} kishi
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              7 kundan buyon kelmagan yoki obunasi tugab borayotgan mijozlar.
            </p>
            {churnData && churnData.riskMembers && churnData.riskMembers.length > 0 ? (
              <div className="space-y-2 pt-1 max-h-36 overflow-y-auto pr-1">
                {churnData.riskMembers.slice(0, 3).map(m => (
                  <div key={m.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-white block truncate max-w-[120px]">{m.fullName}</span>
                      <span className="text-slate-400 text-[10px]">{m.riskReason}</span>
                    </div>
                    <button 
                      onClick={() => handleNotifyTelegram(m.id)}
                      className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-[10px] transition"
                    >
                      Eslatish 📲
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-emerald-400 font-semibold">
                ✅ Risk ostida mijozlar yo'q!
              </div>
            )}
          </div>

          {/* Card 2: Peak Hours */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-cyan-400 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Zal Gavjumlik Soatlari (Peak Hours)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Zalga mijozlar eng ko'p tashrif buyuradigan tig'iz soatlar.
            </p>
            <div className="h-28 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData}>
                  <XAxis dataKey="timeSlot" stroke="#64748b" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                  <Bar dataKey="visitsCount" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: Revenue Forecast */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Kelasi Oy Daromad Prognozi
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                AI Forecast
              </span>
            </div>
            {forecastData ? (
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Kutilayotgan Jami Tushum:</span>
                  <span className="text-lg font-black text-emerald-400">
                    {(forecastData.totalForecast || 0).toLocaleString()} SO'M
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span>Obunalar: </span>
                    <strong className="text-cyan-400">{(forecastData.projectedSubRevenue || 0).toLocaleString()}</strong>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span>Fitnes Bar: </span>
                    <strong className="text-amber-400">{(forecastData.avgMonthlyPosRevenue || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">Hisoblanmoqda...</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Revenue Chart & Recent Attendance */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Revenue Chart */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Haftalik Daromad Analitikasi</h3>
                <p className="text-xs text-slate-400">Joriy haftadagi abonementlar va POS fitnes bar sotuvlari</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Abonement
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> POS Bar
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="subs" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pos" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-emerald-400" />
                <span>Oxirgi Kirishlar (Davomat)</span>
              </h3>
              <button onClick={onOpenCheckIn} className="text-xs text-cyan-400 font-bold hover:underline">
                + Yangi Check-In
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="custom-table text-xs">
                <thead>
                  <tr>
                    <th>Mijoz</th>
                    <th>Telefon</th>
                    <th>Shkaf</th>
                    <th>Vaqti</th>
                    <th>Holati</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.slice(0, 5).map((att) => (
                    <tr key={att.id}>
                      <td className="font-bold text-white">{att.memberName}</td>
                      <td className="text-slate-400">{att.phone}</td>
                      <td>
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                          #{att.lockerNumber}
                        </span>
                      </td>
                      <td className="text-slate-400">
                        {new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          att.status === 'Zalda' ? 'badge-active' : 'badge-cyan'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Subscriptions Expiring & Telegram Automation */}
        <div className="space-y-8">
          
          {/* Expiring Soon Card */}
          <div className="glass-card p-6 rounded-2xl border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Obunasi Tugayotganlar</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-extrabold">
                {expiringMembers.length} ta
              </span>
            </div>

            {expiringMembers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Yaqin 3 kun ichida obunasi tugaydiganlar yo'q 👍</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {expiringMembers.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-white">{m.fullName}</h4>
                      <p className="text-[11px] text-slate-400">{m.phone}</p>
                      <span className="text-[10px] text-amber-400 font-semibold">Tugash sanasi: {m.endDate}</span>
                    </div>
                    <button
                      onClick={() => handleNotifyTelegram(m.id)}
                      title="Telegram bot orqali ogohlantirish yuborish"
                      className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tezkor Harakatlar</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={onOpenCheckIn}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 font-bold text-xs flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Tezkor Check-In Bajarish</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenAddMember}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 font-bold text-xs flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Yangi Mijoz Yaratish</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 1. FITNES BAR SALES ANALYTICS DETAIL MODAL */}
      {showPosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Fitnes Bar Sotuvlari Tahlili</h3>
                  <p className="text-xs text-slate-400">Kalendardan istalgan o'tgan kunni tanlab tahlil qiling</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPosModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Time & Payment Filter Tabs + Custom Calendar Date Picker */}
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Period & Payment Filter Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setPosPeriod('today')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        posPeriod === 'today' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📅 Bugun
                    </button>
                    <button
                      onClick={() => setPosPeriod('week')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        posPeriod === 'week' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📊 Haftalik
                    </button>
                    <button
                      onClick={() => setPosPeriod('month')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        posPeriod === 'month' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🗓 Oylik
                    </button>
                    <button
                      onClick={() => setPosPeriod('custom')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        posPeriod === 'custom' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📆 Sana Tanlash
                    </button>
                  </div>

                  {/* Date Selector Input when Custom Period is active */}
                  {posPeriod === 'custom' && (
                    <div 
                      onClick={() => {
                        const el = document.getElementById('pos-custom-date-picker');
                        if (el) {
                          if (typeof el.showPicker === 'function') el.showPicker();
                          else el.focus();
                        }
                      }}
                      className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-amber-500 hover:border-amber-400 cursor-pointer transition shadow-lg shadow-amber-500/10 group"
                      title="Kalendardan sana tanlash uchun bosing"
                    >
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition" />
                      <input
                        id="pos-custom-date-picker"
                        type="date"
                        value={posCustomDate}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof e.target.showPicker === 'function') e.target.showPicker();
                        }}
                        onChange={e => setPosCustomDate(e.target.value)}
                        className="bg-transparent text-amber-400 font-bold text-xs focus:outline-none cursor-pointer [color-scheme:dark]"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setPosPaymentFilter('All')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        posPaymentFilter === 'All' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Barchasi
                    </button>
                    <button
                      onClick={() => setPosPaymentFilter('Naqd')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        posPaymentFilter === 'Naqd' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      💵 Naqd
                    </button>
                    <button
                      onClick={() => setPosPaymentFilter('Karta / Click')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        posPaymentFilter === 'Karta / Click' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      💳 Karta
                    </button>
                  </div>
                </div>

                {/* Period Summary KPI */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-right">
                  <span className="text-[11px] text-slate-400 font-semibold block">Tanlangan Tushum:</span>
                  <span className="text-xl font-extrabold text-amber-400">{periodPosTotal.toLocaleString()} SO'M</span>
                </div>
              </div>

              {/* Sales History Table */}
              <div className="glass-card rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="custom-table text-xs">
                  <thead>
                    <tr>
                      <th>Xaridor</th>
                      <th>Sotib Olingan Mahsulotlar</th>
                      <th>To'lov Turi</th>
                      <th>Sotuv Vaqti</th>
                      <th className="text-right">Jami Summa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalPosSales.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-500">
                          Ushbu tanlangan sana va parametrlar bo'yicha bar sotuvlari topilmadi.
                        </td>
                      </tr>
                    ) : (
                      finalPosSales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="font-bold text-white">{sale.memberName || "Oddiy Xaridor"}</td>
                          <td className="text-slate-300">
                            {Array.isArray(sale.items) ? (
                              sale.items.map(i => `${i.name || 'Mahsulot'} x ${i.qty || 1}`).join(', ')
                            ) : '-'}
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                              sale.paymentMethod === 'Karta / Click' 
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {sale.paymentMethod === 'Karta / Click' ? '💳 Karta' : '💵 Naqd'}
                            </span>
                          </td>
                          <td className="text-slate-400">
                            {new Date(sale.date).toLocaleString('uz-UZ', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="text-right font-extrabold text-amber-400">
                            {(Number(sale.totalAmount) || 0).toLocaleString()} so'm
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REVENUE BY TARIFF ANALYTICS DETAIL MODAL */}
      {showRevenueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Jami Daromad va Tariflar Tahlili</h3>
                  <p className="text-xs text-slate-400">Kalendardan istalgan o'tgan sanadagi tushumlarni tahlil qiling</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRevenueModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Time & Payment Filter Tabs + Custom Calendar Date Picker */}
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Period & Payment Filter Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setRevenuePeriod('today')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        revenuePeriod === 'today' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📅 Bugun
                    </button>
                    <button
                      onClick={() => setRevenuePeriod('week')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        revenuePeriod === 'week' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📊 Haftalik
                    </button>
                    <button
                      onClick={() => setRevenuePeriod('month')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        revenuePeriod === 'month' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🗓 Oylik
                    </button>
                    <button
                      onClick={() => setRevenuePeriod('custom')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        revenuePeriod === 'custom' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📆 Sana Tanlash
                    </button>
                  </div>

                  {/* Date Selector Input when Custom Period is active */}
                  {revenuePeriod === 'custom' && (
                    <div 
                      onClick={() => {
                        const el = document.getElementById('revenue-custom-date-picker');
                        if (el) {
                          if (typeof el.showPicker === 'function') el.showPicker();
                          else el.focus();
                        }
                      }}
                      className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-emerald-500 hover:border-emerald-400 cursor-pointer transition shadow-lg shadow-emerald-500/10 group"
                      title="Kalendardan sana tanlash uchun bosing"
                    >
                      <Calendar className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition" />
                      <input
                        id="revenue-custom-date-picker"
                        type="date"
                        value={revenueCustomDate}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof e.target.showPicker === 'function') e.target.showPicker();
                        }}
                        onChange={e => setRevenueCustomDate(e.target.value)}
                        className="bg-transparent text-emerald-400 font-bold text-xs focus:outline-none cursor-pointer [color-scheme:dark]"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setRevenuePaymentFilter('All')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        revenuePaymentFilter === 'All' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Barchasi
                    </button>
                    <button
                      onClick={() => setRevenuePaymentFilter('Naqd')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        revenuePaymentFilter === 'Naqd' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      💵 Naqd
                    </button>
                    <button
                      onClick={() => setRevenuePaymentFilter('Karta / Click')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        revenuePaymentFilter === 'Karta / Click' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      💳 Karta
                    </button>
                  </div>
                </div>

                {/* Period Grand Summary */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-right">
                  <span className="text-[11px] text-slate-400 font-semibold block">Jami Tushum:</span>
                  <span className="text-xl font-extrabold text-emerald-400">{periodGrandTotal.toLocaleString()} SO'M</span>
                </div>
              </div>

              {/* Revenue Breakdown KPI Row */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-semibold block">Abonementlar Tushumi</span>
                    <span className="text-lg font-bold text-cyan-400">{periodSubTotal.toLocaleString()} SO'M</span>
                  </div>
                  <span className="text-xs text-slate-500">{finalPayments.length} ta to'lov</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-semibold block">Fitnes Bar Tushumi</span>
                    <span className="text-lg font-bold text-amber-400">{periodPosTotalForRev.toLocaleString()} SO'M</span>
                  </div>
                  <span className="text-xs text-slate-500">{finalPosSalesForRev.length} ta sotuv</span>
                </div>
              </div>

              {/* Tariff Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Tariflar Kesimida Daromad Tahlili:</h4>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <table className="custom-table text-xs">
                    <thead>
                      <tr>
                        <th>Tarif Rejasi Nomi</th>
                        <th>Bir Martalik Narxi</th>
                        <th>Sotilgan Soni</th>
                        <th className="text-right">Jami Tushgan Summa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tariffBreakdown.map((t) => (
                        <tr key={t.id}>
                          <td className="font-bold text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cyan-400" />
                            <span>{t.name}</span>
                          </td>
                          <td className="text-slate-400">{(Number(t.price) || 0).toLocaleString()} so'm</td>
                          <td>
                            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                              {t.count} ta mijoz
                            </span>
                          </td>
                          <td className="text-right font-extrabold text-emerald-400">
                            {t.revenue.toLocaleString()} so'm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

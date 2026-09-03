import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
  Send,
  Users,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  Search,
  Filter,
  DollarSign,
  Flame,
  Moon,
  Sun
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';

export default function AIAnalytics({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [churnData, setChurnData] = useState(null);
  const [peakData, setPeakData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [habitsData, setHabitsData] = useState(null);

  // Filters for Churn Risk row
  const [churnFilter, setChurnFilter] = useState('All'); // 'All' | 'Yuqori' | "O'rtacha"
  const [searchQuery, setSearchQuery] = useState('');
  const [notifyingId, setNotifyingId] = useState(null);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [churnRes, peakRes, forecastRes, habitsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/churn-risk`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/api/analytics/peak-hours`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/api/analytics/forecast`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/api/analytics/attendance-habits`).then(r => r.json()).catch(() => null)
      ]);

      setChurnData(churnRes);
      setPeakData(peakRes);
      setForecastData(forecastRes);
      setHabitsData(habitsRes);
    } catch (err) {
      console.error("AI Analytics fetch error:", err);
      if (showToast) showToast("Tahlillarni yuklashda xatolik yuz berdi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const handleSendReminder = async (memberId, memberName) => {
    setNotifyingId(memberId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/members/${memberId}/notify`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (showToast) showToast(`${memberName} ga Telegram eslatmasi yuborildi! 📲`, "success");
      } else {
        if (showToast) showToast(data.error || "Telegram xabarnoma yuborilmadi", "error");
      }
    } catch (err) {
      if (showToast) showToast("Xabarnoma yuborishda xatolik", "error");
    } finally {
      setNotifyingId(null);
    }
  };

  // Date formatter to human-friendly DD.MM.YYYY
  const formatUzDate = (dateStr) => {
    if (!dateStr || dateStr === 'Kelmagan') return 'Kelmagan';
    try {
      const cleanStr = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateStr;
    }
  };

  // Filter churn risk members
  const allRiskMembers = churnData?.riskMembers || [];
  const filteredRiskMembers = allRiskMembers.filter(m => {
    const matchesFilter = churnFilter === 'All' || m.riskLevel === churnFilter;
    const matchesSearch = !searchQuery ||
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.phone && m.phone.includes(searchQuery));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-3 sm:p-5 lg:p-7 space-y-6 sm:space-y-8 max-w-7xl mx-auto">

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Brain className="w-8 h-8 animate-pulse text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                AI Smart Tahlillar & Biznes Prognoz
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Intellektual Tizim
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Sun'iy intellekt orqali mijozlar qatnovi, yo'qolish xavflari, zal gavjumligi va kelajakdagi daromadlar tahlili.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAllAnalytics}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 hover:text-white font-bold text-xs flex items-center gap-2 transition self-start md:self-auto shrink-0 shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{loading ? "Tahlil qilinmoqda..." : "Tahlillarni Yangilash"}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1-QATOR: MIJOZLAR YO'QOLISH XAVFI (CHURN RISK & RETENTION)                */}
      {/* ========================================================================= */}
      <section className="glass-card p-5 sm:p-6 rounded-2xl border border-rose-500/20 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  1. Mijozlar Yo'qolish Xavfi Tahlili (AI Churn Risk)
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
                  {churnData?.count || 0} nafar xavf ostida
                </span>
              </div>
              <p className="text-xs text-slate-400">
                7 kundan buyon zalga kelmagan yoki obunasi tugab borayotgan mijozlar ro'yxati va ularni qaytarish choralari.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setChurnFilter('All')}
                className={`px-3 py-1.5 rounded-lg transition ${churnFilter === 'All' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Barchasi ({churnData?.count || 0})
              </button>
              <button
                onClick={() => setChurnFilter('Yuqori')}
                className={`px-3 py-1.5 rounded-lg transition ${churnFilter === 'Yuqori' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-rose-400 hover:text-rose-300'}`}
              >
                🔴 Yuqori Xavf ({churnData?.highRiskCount || 0})
              </button>
              <button
                onClick={() => setChurnFilter("O'rtacha")}
                className={`px-3 py-1.5 rounded-lg transition ${churnFilter === "O'rtacha" ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-amber-400 hover:text-amber-300'}`}
              >
                🟡 O'rtacha ({churnData?.mediumRiskCount || 0})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Mijoz ismi yoki tel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition w-44"
              />
            </div>
          </div>
        </div>

        {/* Churn Risk Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60 max-h-96 overflow-y-auto">
          <table className="custom-table text-xs">
            <thead>
              <tr>
                <th>Mijoz</th>
                <th>Telefon</th>
                <th>Oxirgi Kelgan Sanasi</th>
                <th>Obuna Tugashi</th>
                <th>Qolgan Darslar</th>
                <th>Xavf Darajasi</th>
                <th>Xavf Sababi & AI Maslahati</th>
                <th className="text-right">Harakat</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiskMembers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <span>Hozirda tanlangan parametrlar bo'yicha xavf ostidagi mijozlar topilmadi! Barcha mijozlar faol.</span>
                  </td>
                </tr>
              ) : (
                filteredRiskMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/80 transition">
                    <td>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.fullName}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{m.gender}</span>
                    </td>
                    <td className="text-slate-300">{m.phone || '-'}</td>
                    <td className="whitespace-nowrap">
                      <span className={`font-semibold ${m.lastCheckIn === 'Kelmagan' ? 'text-rose-400' : 'text-slate-200'}`}>
                        {formatUzDate(m.lastCheckIn)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap font-semibold text-slate-200 font-mono">
                      {formatUzDate(m.endDate)}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-bold ${m.remainingVisits <= 1 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                        {m.remainingVisits} ta
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-[11px] whitespace-nowrap shadow-sm ${m.riskLevel === 'Yuqori'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}>
                        {m.riskLevel === 'Yuqori' ? '🔴 Yuqori Xavf' : "🟡 O'rtacha"}
                      </span>
                    </td>
                    <td className="max-w-xs">
                      <span className="font-bold text-slate-200 block text-[11px]">{m.riskReason}</span>
                      <span className="text-[10px] text-cyan-400/90 italic block mt-0.5">💡 {m.actionTip}</span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleSendReminder(m.id, m.fullName)}
                        disabled={notifyingId === m.id}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 hover:text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition border border-indigo-500/30"
                        title="Telegram orqali eslatma va taklif yuborish"
                      >
                        <Send className={`w-3.5 h-3.5 ${notifyingId === m.id ? 'animate-spin' : ''}`} />
                        <span>{notifyingId === m.id ? "Yuborilmoqda..." : "Eslatish 📲"}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2-QATOR: ZAL GAVJUMLIGI VA TIG'IZ SOATLAR (PEAK & QUIET HOURS)             */}
      {/* ========================================================================= */}
      <section className="glass-card p-5 sm:p-6 rounded-2xl border border-cyan-500/20 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                2. Zal Gavjumligi va tig'iz soatlar tahlili (Peak Hours & Density)
              </h3>
              <p className="text-xs text-slate-400">
                Kun davomida zalga eng ko'p va eng kam tashrif buyuriladigan soatlar monitoringi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Eng Tig'iz Soat:</span>
                <span className="text-xs font-extrabold text-rose-400">{peakData?.peakSlot || '18:00 - 20:00'}</span>
              </div>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
              <Sun className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Eng Bo'sh Soat:</span>
                <span className="text-xs font-extrabold text-emerald-400">{peakData?.quietSlot || '12:00 - 14:00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Peak Hours Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          <div className="lg:col-span-3 h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakData?.slots || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="timeSlot" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => [`${val} nafar mijoz`, "Tashriflar"]}
                />
                <Bar dataKey="visitsCount" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Recommendation Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              AI Biznes Tavsiyasi
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Zal odatda <strong>{peakData?.peakSlot || '18:00 - 20:00'}</strong> oralig'ida eng yuqori gavjumlikka erishadi.
            </p>
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 leading-normal">
              💡 <strong>Taklif:</strong> Soat 12:00 dan 16:00 gacha bo'lgan bo'sh vaqtlarga talabalar va o'quvchilar uchun arzonlashtirilgan "Kunduzgi Tarif" aksiyasini yo'lga qo'yish orqali qo'shimcha daromad olish mumkin.
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3-QATOR: MOLIYAVIY PROGNOZ VA KUTILAYOTGAN TUSHUM (FINANCIAL FORECAST)    */}
      {/* ========================================================================= */}
      <section className="glass-card p-5 sm:p-6 rounded-2xl border border-emerald-500/20 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                3. Daromad va Moliyaviy Prognoz (AI Financial Forecast)
              </h3>
              <p className="text-xs text-slate-400">
                Kelgusi oy uchun abonement yangilanishlari (85% ehtimollik) va bar savdolari asosidagi prognoz.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-right">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Kelasi Oy Kutilayotgan Jami Tushum:</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">
              {(forecastData?.totalForecast || 0).toLocaleString()} SO'M
            </span>
          </div>
        </div>

        {/* Forecast Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Faol Mijozlar Soni:</span>
            <h4 className="text-xl font-black text-white">{forecastData?.activeMembersCount || 0} nafar</h4>
            <p className="text-[10px] text-cyan-400">85% a'zolikni uzaytiradi deb hisoblandi</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Abonementlardan Kutilayotgan:</span>
            <h4 className="text-xl font-black text-cyan-400">
              {(forecastData?.projectedSubRevenue || 0).toLocaleString()} SO'M
            </h4>
            <p className="text-[10px] text-slate-400">O'rtacha tarif: {(forecastData?.avgSubPrice || 0).toLocaleString()} so'm</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Fitnes Bar Oylik Savdosi:</span>
            <h4 className="text-xl font-black text-amber-400">
              {(forecastData?.avgMonthlyPosRevenue || 0).toLocaleString()} SO'M
            </h4>
            <p className="text-[10px] text-slate-400">Ichimliklar va qo'shimcha mahsulotlar</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Undirilishi Kerak Bo'lgan Qarzlar:</span>
            <h4 className="text-xl font-black text-rose-400">
              {(forecastData?.currentTotalDebt || 0).toLocaleString()} SO'M
            </h4>
            <p className="text-[10px] text-rose-300">Qarzlarni so'ndirish orqali naqd pul oqimi oshadi</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4-QATOR: HAFTA KUNLARI VA MIJOZLAR QATNASH ODATLARI (ATTENDANCE HABITS)    */}
      {/* ========================================================================= */}
      <section className="glass-card p-5 sm:p-6 rounded-2xl border border-purple-500/20 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                4. Hafta Kunlari Bo'yicha Qatnash Odatlari (Attendance Habits)
              </h3>
              <p className="text-xs text-slate-400">
                Mijozlarning haftaning qaysi kunlari zalga ko'proq kelishi va jinslar nisbati.
              </p>
            </div>
          </div>

          {habitsData && habitsData.genderRatio && (
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Erkaklar: {habitsData.genderRatio.malePercent}%
              </span>
              <span className="px-3 py-1 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                Ayollar: {habitsData.genderRatio.femalePercent}%
              </span>
            </div>
          )}
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={habitsData?.weeklyTrends || []}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                formatter={(val) => [`${val} nafar tashrif`, "Kelganlar"]}
              />
              <Area type="monotone" dataKey="visits" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  );
}

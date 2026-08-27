import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Send, 
  RefreshCw, 
  Trash2, 
  Edit, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Download,
  CreditCard,
  DollarSign,
  History,
  Clock
} from 'lucide-react';
import MemberPaymentHistoryModal from '../components/MemberPaymentHistoryModal';

export default function Members({ members, subscriptions, onRefresh, onOpenAddMember, onEditMember, showToast }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All'); // 'All' | 'Naqd' | 'Karta / Click'
  
  const [selectedMemberForRenew, setSelectedMemberForRenew] = useState(null);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState(null);
  
  const [renewSubId, setRenewSubId] = useState(subscriptions[0]?.id || '');
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('Naqd');
  const [loading, setLoading] = useState(false);

  // Filter members by search, status, and payment method
  const filtered = members.filter(m => {
    const matchesSearch = 
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      m.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'All' ? true :
      statusFilter === 'Active' ? m.status === 'Active' :
      m.status === 'Expired';

    const matchesPayment = 
      paymentFilter === 'All' ? true :
      paymentFilter === 'Naqd' ? (m.paymentMethod === 'Naqd' || !m.paymentMethod) :
      m.paymentMethod === 'Karta / Click';

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Sort members by debt DESCENDING (highest debt first)
  const sortedMembers = [...filtered].sort((a, b) => (b.debt || 0) - (a.debt || 0));

  const handleDelete = async (id) => {
    if (!window.confirm("Rostdan ham ushbu mijozni o'chirmoqchimisiz?")) return;
    try {
      await fetch(`http://localhost:5000/api/members/${id}`, { method: 'DELETE' });
      if (showToast) showToast("Mijoz o'chirildi", "info");
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTelegram = async (memberId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/members/${memberId}/notify`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast("Telegram xabarnomasi yuborildi!", "info");
        else alert("Telegram xabarnomasi yuborildi!");
      } else {
        if (showToast) showToast(data.error || "Xabarnoma yuborishda xatolik", "error");
        else alert(data.error || "Xabarnoma yuborishda xatolik");
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Server bilan bog'lanishda xatolik", "error");
    }
  };

  const handleRenewSubscription = async (e) => {
    e.preventDefault();
    if (!selectedMemberForRenew) return;

    setLoading(true);
    try {
      const sub = subscriptions.find(s => s.id === renewSubId);
      const res = await fetch(`http://localhost:5000/api/members/${selectedMemberForRenew.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: renewSubId, 
          paidAmount: sub ? sub.price : 0,
          paymentMethod: renewPaymentMethod 
        })
      });

      if (res.ok) {
        setSelectedMemberForRenew(null);
        if (showToast) showToast("Obuna muddati muvaffaqiyatli uzaytirildi!", "update");
        onRefresh();
      } else {
        const data = await res.json();
        if (showToast) showToast(data.error || "Obunani uzaytirishda xatolik!", "error");
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Server bilan bog'lanishda xatolik", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    window.open('http://localhost:5000/api/settings/export-csv/members', '_blank');
  };

  return (
    <div className="p-8 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Mijozlar Bazasi ({members.length})</span>
          </h2>
          <p className="text-xs text-slate-400">To'lovlar tarixini ko'rish uchun mijoz ustiga bosing</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Excel (CSV) Yuklab Olish</span>
          </button>

          <button
            onClick={onOpenAddMember}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Mijoz Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ismi, Telefon yoki ID kodi..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'All' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Barchasi ({members.length})
            </button>
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Faol ({members.filter(m => m.status === 'Active').length})
            </button>
            <button
              onClick={() => setStatusFilter('Expired')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'Expired' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tugagan ({members.filter(m => m.status === 'Expired').length})
            </button>
          </div>

          {/* Payment Method Filters */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setPaymentFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition ${
                paymentFilter === 'All' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Barcha To'lovlar
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
              💳 Karta / Click
            </button>
          </div>
        </div>
      </div>

      {/* Members Table (Sorted by Debt Descending) */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="custom-table text-xs">
            <thead>
              <tr>
                <th>ID / Mijoz</th>
                <th>Telefon</th>
                <th>Telegram</th>
                <th>Tarif</th>
                <th>To'lov Turi</th>
                <th>Qarz Qoldig'i</th>
                <th>Tashriflar</th>
                <th>Holat</th>
                <th className="text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    Siz kiritgan filtr bo'yicha mijozlar topilmadi.
                  </td>
                </tr>
              ) : (
                sortedMembers.map((m) => (
                  <tr 
                    key={m.id} 
                    onClick={() => setSelectedMemberForHistory(m)}
                    className={`cursor-pointer transition hover:bg-cyan-500/5 ${
                      m.debt > 100000 ? 'bg-rose-500/5' : (m.debt > 0 ? 'bg-amber-500/5' : '')
                    }`}
                  >
                    <td>
                      <div>
                        <span className="font-extrabold text-cyan-400 text-[11px] block">{m.id}</span>
                        <span className="font-bold text-white text-sm hover:underline">{m.fullName} 🔍</span>
                        <span className="text-[10px] text-slate-500 block">{m.gender}</span>
                      </div>
                    </td>
                    <td className="text-slate-300 font-medium">{m.phone}</td>
                    <td>
                      {m.telegramId ? (
                        <span className="inline-flex items-center gap-1 text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                          <Send className="w-3 h-3" />
                          <span>Ulangan</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Ulanmagan</span>
                      )}
                    </td>
                    <td className="font-semibold text-slate-200">{m.subscriptionName}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        m.paymentMethod === 'Karta / Click' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {m.paymentMethod === 'Karta / Click' ? '💳 Karta' : '💵 Naqd'}
                      </span>
                    </td>
                    <td>
                      {m.debt > 100000 ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                          🔴 {m.debt.toLocaleString()} so'm
                        </span>
                      ) : m.debt > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          🟠 {m.debt.toLocaleString()} so'm
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                          🟢 Qarzsiz
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="font-bold text-cyan-400">{m.remainingVisits} ta</span>
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        m.status === 'Active' ? 'badge-active' : 'badge-expired'
                      }`}>
                        {m.status === 'Active' ? 'Faol' : 'Tugagan'}
                      </span>
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedMemberForHistory(m)}
                          title="To'lovlar Tarixini Ko'rish"
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedMemberForRenew(m)}
                          title="Obunani uzaytirish"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Uzaytirish</span>
                        </button>

                        <button
                          onClick={() => handleSendTelegram(m.id)}
                          title="Telegram xabarnoma yuborish"
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditMember(m)}
                          title="Tahrirlash / Qarz To'lash"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(m.id)}
                          title="O'chirish"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Payment History Modal */}
      <MemberPaymentHistoryModal 
        isOpen={!!selectedMemberForHistory}
        onClose={() => setSelectedMemberForHistory(null)}
        member={selectedMemberForHistory}
      />

      {/* Renew Modal */}
      {selectedMemberForRenew && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              <span>Obunani Uzaytirish</span>
            </h3>
            <p className="text-xs text-slate-400">
              Mijoz: <strong className="text-white">{selectedMemberForRenew.fullName}</strong>
            </p>

            <form onSubmit={handleRenewSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Yangi Tarif Tanlang</label>
                <select
                  value={renewSubId}
                  onChange={(e) => setRenewSubId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                >
                  {subscriptions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.price.toLocaleString()} so'm ({s.durationDays} kun)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">To'lov Usuli</label>
                <select
                  value={renewPaymentMethod}
                  onChange={(e) => setRenewPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="Naqd">💵 Naqd</option>
                  <option value="Karta / Click">💳 Karta / Click</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForRenew(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  {loading ? "Bajarilmoqda..." : "Obunani Yangilash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

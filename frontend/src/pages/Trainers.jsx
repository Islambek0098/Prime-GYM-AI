import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Users, 
  Phone, 
  Percent, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  UserCheck,
  Award,
  MinusCircle
} from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Trainers({ members, showToast }) {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('Bodibilding');
  const [commissionRate, setCommissionRate] = useState('30');

  // Assign member states
  const [assignMemberId, setAssignMemberId] = useState('');
  const [assignSessions, setAssignSessions] = useState('10');

  const parseJsonResponse = async (res) => {
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      // Ba'zi hollarda content-type bo'lmasligi mumkin, JSON parse qilib ko'ramiz
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(`Server javob bermadi (Status ${res.status}). Iltimos, backend server (node server.js) qayta ishga tushirilganini tekshiring.`);
      }
    } catch (err) {
      if (err.message.includes('Server javob bermadi')) throw err;
      throw new Error(`Server bilan bog'lanishda xatolik: ${err.message}`);
    }
  };

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/trainers`);
      if (res.ok) {
        const data = await parseJsonResponse(res);
        setTrainers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching trainers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleAddTrainer = async (e) => {
    e.preventDefault();
    if (!fullName) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/trainers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, specialty, commissionRate })
      });
      const data = await parseJsonResponse(res);

      if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");

      showToast(`${fullName} murabbiy sifatiga qo'shildi!`, "success");
      setIsAddModalOpen(false);
      setFullName('');
      setPhone('');
      fetchTrainers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteTrainer = async (id, name) => {
    if (!window.confirm(`${name} murabbiyini o'chirishga ishonchingiz komilmi?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/trainers/${id}`, { method: 'DELETE' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "O'chirishda xatolik yuz berdi");

      showToast(`${name} o'chirildi`, "success");
      fetchTrainers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAssignMember = async (e) => {
    e.preventDefault();
    if (!selectedTrainer || !assignMemberId) return;

    const memberObj = members.find(m => m.id === assignMemberId || m.fullName === assignMemberId);
    const memberName = memberObj ? memberObj.fullName : assignMemberId;
    const memberId = memberObj ? memberObj.id : `mem_${Date.now()}`;

    try {
      const res = await fetch(`${API_BASE_URL}/api/trainers/assign-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: selectedTrainer.id,
          memberId,
          memberName,
          totalSessions: assignSessions
        })
      });
      const data = await parseJsonResponse(res);

      if (!res.ok) throw new Error(data.error || "Biriktirishda xatolik");

      showToast(`${memberName} murabbiy ${selectedTrainer.fullName}ga biriktirildi!`, "success");
      setIsAssignModalOpen(false);
      setAssignMemberId('');
      fetchTrainers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeductSession = async (trainerId, memberId, memberName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/trainers/deduct-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId, memberId })
      });
      const data = await parseJsonResponse(res);

      if (!res.ok) throw new Error(data.error || "Mashg'ulot ayirishda xatolik");

      showToast(`${memberName} uchun 1 ta PT mashg'ulot o'tkazildi! (Qolgan: ${data.remainingSessions} ta)`, "success");
      fetchTrainers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const totalAssignedMembers = trainers.reduce((sum, t) => sum + (t.assignedMembers ? t.assignedMembers.length : 0), 0);
  const totalSessionsRemaining = trainers.reduce((sum, t) => {
    return sum + (t.assignedMembers ? t.assignedMembers.reduce((acc, m) => acc + (m.remainingSessions || 0), 0) : 0);
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Dumbbell className="w-7 h-7 text-cyan-400" />
            <span>Murabbiylar & PT Boshqaruvi</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fitnes murabbiylari, Ulush (Komissiya) stavkalari va Shaxsiy PT darslarini boshqarish.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Murabbiy Qo'shish</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Jami Murabbiylar</span>
            <span className="text-xl font-black text-white">{trainers.length} nafar</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">PT Biriktirilgan Mijozlar</span>
            <span className="text-xl font-black text-white">{totalAssignedMembers} kishi</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Jami Qolgan PT Darslar</span>
            <span className="text-xl font-black text-emerald-400">{totalSessionsRemaining} ta mashg'ulot</span>
          </div>
        </div>
      </div>

      {/* Trainers Cards List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Yuklanmoqda...</div>
      ) : trainers.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
          Hozircha murabbiylar kiritilmagan. Yuqoridagi tugma orqali birinchi murabbiyingizni qo'shing.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {trainers.map(t => (
            <div key={t.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-cyan-500/20">
                    {t.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{t.fullName}</h3>
                    <p className="text-xs text-cyan-400 font-medium">{t.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTrainer(t);
                      setIsAssignModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Mijoz Biriktirish</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTrainer(t.id, t.fullName)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-300 font-medium truncate">{t.phone || 'Tel ko\'rsatilmadi'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-300 font-medium">Ulush: <strong className="text-amber-400">{t.commissionRate}%</strong></span>
                </div>
              </div>

              {/* Assigned Members List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Biriktirilgan PT Mijozlar:</span>
                  <span className="text-cyan-400 font-semibold">{t.assignedMembers ? t.assignedMembers.length : 0} kishi</span>
                </h4>

                {!t.assignedMembers || t.assignedMembers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Ushbu murabbiyga hali shaxsiy mijozlar biriktirilmagan.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {t.assignedMembers.map(m => (
                      <div key={m.memberId} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white block">{m.memberName}</span>
                          <span className="text-[11px] text-slate-400">Qolgan darslar: <strong className="text-cyan-400">{m.remainingSessions} ta</strong></span>
                        </div>
                        <button
                          onClick={() => handleDeductSession(t.id, m.memberId, m.memberName)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 font-bold text-[11px] transition flex items-center gap-1"
                          title="1 ta PT mashg'ulot ayirish"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                          <span>-1 Dars</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Add Trainer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-cyan-400" />
              <span>Yangi Murabbiy Qo'shish</span>
            </h3>

            <form onSubmit={handleAddTrainer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Murabbiy Ismi va Familiyasi *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masalan: Jasur Rahimov"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telefon Raqami</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mutaxassisligi</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Bodibilding">Bodibilding</option>
                    <option value="Fitnes & Aerobika">Fitnes & Aerobika</option>
                    <option value="Krossfit">Krossfit</option>
                    <option value="Ozish Dasturi">Ozish Dasturi</option>
                    <option value="Reabilitatsiya">Reabilitatsiya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ulush (Komissiya %)</label>
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="30"
                    min="0"
                    max="100"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Member to Trainer */}
      {isAssignModalOpen && selectedTrainer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>Mijozni Murabbiyga Biriktirish</span>
            </h3>

            <p className="text-xs text-slate-400">
              Murabbiy: <strong className="text-white">{selectedTrainer.fullName}</strong>
            </p>

            <form onSubmit={handleAssignMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mijozni Tanlang *</label>
                <select
                  value={assignMemberId}
                  onChange={(e) => setAssignMemberId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                >
                  <option value="">-- Mijozni tanlang --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.phone || m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PT Mashg'ulotlar Soni *</label>
                <input
                  type="number"
                  value={assignSessions}
                  onChange={(e) => setAssignSessions(e.target.value)}
                  min="1"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                >
                  Biriktirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

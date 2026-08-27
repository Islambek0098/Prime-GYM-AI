import React, { useState } from 'react';
import { X, UserCheck, Key, AlertCircle, CheckCircle2, Search, Send, Dumbbell } from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE_URL } from '../config';

export default function CheckInModal({ isOpen, onClose, onCheckInSuccess, members, lockers, showToast }) {
  const [query, setQuery] = useState('');
  const [lockerNumber, setLockerNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLockerSuggestions, setShowLockerSuggestions] = useState(false);

  const cleanQuery = query.toLowerCase().trim().replace(/\s+/g, '');
  const suggestions = (query.trim().length >= 1 && members) ? members.filter(m => {
    const qLower = query.toLowerCase().trim();
    const nameMatch = m.fullName.toLowerCase().includes(qLower);
    const idMatch = m.id.toLowerCase().includes(qLower);
    const phoneMatch = m.phone ? m.phone.replace(/\s+/g, '').includes(cleanQuery) : false;
    return nameMatch || idMatch || phoneMatch;
  }).slice(0, 6) : [];

  // Filter only Free lockers
  const maleFree = (lockers?.male || []).filter(l => l.status === 'Free');
  const femaleFree = (lockers?.female || []).filter(l => l.status === 'Free');
  const allFreeLockers = [...maleFree, ...femaleFree];
  const filteredFreeLockers = allFreeLockers.filter(l => {
    if (!lockerNumber.trim()) return true;
    return l.number.toLowerCase().includes(lockerNumber.toLowerCase().trim());
  });

  if (!isOpen) return null;

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError('');
    setSuccessResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lockerNumber })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Check-in qilishda xatolik yuz berdi');
      }

      setSuccessResult(data);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      if (showToast) showToast(`${data.member.fullName} zalga kirdi! (Shkaf #${data.attendance.lockerNumber})`, "success");
      onCheckInSuccess && onCheckInSuccess();
    } catch (err) {
      setError(err.message);
      if (showToast) showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setLockerNumber('');
    setError('');
    setSuccessResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Tezkor Check-In</h3>
              <p className="text-xs text-slate-400">Mijoz zalga kirishini belgilash</p>
            </div>
          </div>
          <button 
            onClick={() => { handleReset(); onClose(); }} 
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {successResult ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">{successResult.member.fullName}</h4>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  ✅ Zalga kirish muvaffaqiyatli qayd etildi!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-left text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Shkaf raqami</span>
                  <span className="font-bold text-white text-base">#{successResult.attendance.lockerNumber}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Qolgan tashriflar</span>
                  <span className="font-bold text-cyan-400 text-base">{successResult.member.remainingVisits} ta</span>
                </div>
              </div>

              {successResult.member.telegramId && (
                <div className="flex items-center justify-center gap-2 text-xs text-blue-400 pt-2">
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram bot xabarnomasi yuborildi</span>
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition"
              >
                Yana Check-In qilish
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckIn} className="space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mijoz Telefon raqami, ID kodi yoki Ismi:
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Masalan: +998 90 123 45 67 yoki M-1001"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                    autoFocus
                    required
                  />

                  {/* Real-time Autocomplete Search Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800/80 max-h-60 overflow-y-auto">
                      {suggestions.map(m => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setQuery(m.fullName);
                            setShowSuggestions(false);
                          }}
                          className="p-3 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{m.fullName}</span>
                            <span className="text-[11px] text-slate-400">{m.phone} • <span className="text-cyan-400 font-semibold">{m.id}</span></span>
                          </div>
                          <div>
                            {m.status === 'Active' ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                🟢 Faol
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                                🔴 Tugagan
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Shkaf (Locker) raqami (Faqat bo'sh shkaflar):</span>
                  <span className="text-[10px] text-cyan-400 font-bold">
                    {allFreeLockers.length} ta bo'sh shkaf bor
                  </span>
                </label>
                <div className="relative">
                  <Key className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={lockerNumber}
                    onChange={(e) => {
                      setLockerNumber(e.target.value);
                      setShowLockerSuggestions(true);
                    }}
                    onFocus={() => setShowLockerSuggestions(true)}
                    placeholder="Masalan: M-14 yoki F-05 (bo'sh qoldirilsa avto biriktiradi)"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                  />

                  {/* Real-time Free Lockers Dropdown */}
                  {showLockerSuggestions && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden p-2 max-h-52 overflow-y-auto">
                      <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                        Faqat Bo'sh Shkaflar Ro'yxati:
                      </div>
                      {filteredFreeLockers.length === 0 ? (
                        <div className="p-3 text-center text-xs text-rose-400 font-semibold">
                          Bunday bo'sh shkaf topilmadi yoki barcha shkaflar band.
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {filteredFreeLockers.map(l => (
                            <button
                              key={l.number}
                              type="button"
                              onClick={() => {
                                setLockerNumber(l.number);
                                setShowLockerSuggestions(false);
                              }}
                              className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-between ${
                                lockerNumber === l.number 
                                  ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/20' 
                                  : 'bg-slate-950 hover:bg-slate-800 text-emerald-400 border-slate-800'
                              }`}
                            >
                              <span>#{l.number}</span>
                              <span className="text-[9px] opacity-80">🟢</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Tekshirilmoqda...</span>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      <span>Zalga Kirishni Tasdiqlash</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

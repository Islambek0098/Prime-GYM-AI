import React, { useState } from 'react';
import { CalendarCheck2, UserCheck, Key, LogOut, Dumbbell, User, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Attendance({ attendance, lockers, onRefresh, onOpenCheckIn, showToast }) {
  const [activeGenderTab, setActiveGenderTab] = useState('male'); // 'male' or 'female'

  const activeVisitors = attendance.filter(a => a.status === 'Zalda');

  const handleCheckout = async (attendanceId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/checkout/${attendanceId}`, { method: 'POST' });
      if (res.ok) {
        if (showToast) showToast("Mijoz zaldan chiqdi va shkaf bo'shatildi!", "info");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Xatolik yuz berdi", "error");
    }
  };

  const currentLockers = lockers[activeGenderTab] || [];
  const occupiedCount = currentLockers.filter(l => l.status === 'Occupied').length;
  const freeCount = currentLockers.length - occupiedCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-full overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-emerald-400" />
            <span>Zaldagi Mijozlar va Kiyinish Xonalari</span>
          </h2>
          <p className="text-xs text-slate-400">Realdagi davomat hamda shkaflar bandligi holati</p>
        </div>

        <button
          onClick={onOpenCheckIn}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          <span>+ Tezkor Check-In</span>
        </button>
      </div>

      {/* Grid: Left - Active Visitors Table, Right - Lockers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 Cols: Active Visitors */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-cyan-400" />
                <span>Hozir Zalda Bo'lgan Mijozlar ({activeVisitors.length})</span>
              </h3>
              <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Aktiv mashg'ulotda
              </span>
            </div>

            {activeVisitors.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Hozirda zalda hech kim yo'q. Check-In tugmasini bosib mijozlarni kiritishingiz mumkin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="custom-table text-xs">
                  <thead>
                    <tr>
                      <th>Mijoz</th>
                      <th>Shkaf</th>
                      <th>Kirgan Vaqti</th>
                      <th className="text-right">Chiqish</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVisitors.map((att) => (
                      <tr key={att.id}>
                        <td>
                          <span className="font-bold text-white block">{att.memberName}</span>
                          <span className="text-[10px] text-slate-400">{att.phone}</span>
                        </td>
                        <td>
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30 text-xs">
                            #{att.lockerNumber}
                          </span>
                        </td>
                        <td className="text-slate-300">
                          {new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleCheckout(att.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 ml-auto transition"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Chiqdi</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Lockers Matrix */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>Kiyinish Xonasi Shkaflari</span>
              </h3>

              {/* Locker Gender Selector */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setActiveGenderTab('male')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeGenderTab === 'male' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Erkaklar
                </button>
                <button
                  onClick={() => setActiveGenderTab('female')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeGenderTab === 'female' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ayollar
                </button>
              </div>
            </div>

            {/* Locker Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-semibold">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">Bo'sh shkaflar</span>
                <span className="text-emerald-400 font-extrabold text-lg">{freeCount} ta</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">Band shkaflar</span>
                <span className="text-amber-400 font-extrabold text-lg">{occupiedCount} ta</span>
              </div>
            </div>

            {/* Locker Grid Icons */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {currentLockers.map((lock) => (
                <div
                  key={lock.number}
                  title={lock.assignedTo ? `Mijoz: ${lock.assignedTo}` : 'Bo\'sh shkaf'}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition ${
                    lock.status === 'Occupied'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Key className={`w-4 h-4 mb-1 ${lock.status === 'Occupied' ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
                  <span className="font-extrabold text-xs">{lock.number}</span>
                  <span className="text-[9px] font-semibold tracking-wider uppercase mt-0.5">
                    {lock.status === 'Occupied' ? 'Band' : 'Bo\'sh'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

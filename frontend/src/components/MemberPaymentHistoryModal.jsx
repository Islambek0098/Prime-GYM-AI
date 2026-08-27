import React from 'react';
import { X, DollarSign, Calendar, CreditCard, Clock, User, CheckCircle2 } from 'lucide-react';

export default function MemberPaymentHistoryModal({ isOpen, onClose, member }) {
  if (!isOpen || !member) return null;

  const history = member.paymentHistory || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{member.fullName}</span>
                <span className="text-xs text-cyan-400 font-semibold">({member.id})</span>
              </h3>
              <p className="text-xs text-slate-400">To'lovlar va Tranzaksiyalar Tarixi</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Summary Stats */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-semibold block">Tarif Rejasi</span>
              <span className="text-white font-bold">{member.subscriptionName}</span>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="text-slate-400 font-semibold block">Jami To'langan</span>
              <span className="text-emerald-400 font-extrabold text-sm">{(member.totalPaid || 0).toLocaleString()} SO'M</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              member.debt > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-950 border-slate-800'
            }`}>
              <span className="text-slate-400 font-semibold block">Qarz Qoldig'i</span>
              <span className={`font-extrabold text-sm ${member.debt > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {member.debt > 0 ? `${member.debt.toLocaleString()} SO'M` : "🟢 Qarzsiz"}
              </span>
            </div>
          </div>

          {/* Payment Tranches History Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Barcha To'lov Transaksiyalari:</span>
            </h4>

            <div className="glass-card rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="custom-table text-xs">
                <thead>
                  <tr>
                    <th>Sana / Vaqt</th>
                    <th>Izoh / Maqsad</th>
                    <th>To'lov Usuli</th>
                    <th className="text-right">Summa</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-slate-500">
                        {member.totalPaid > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-slate-300">Boshlang'ich to'lov: {member.totalPaid.toLocaleString()} so'm</span>
                            <span className="text-[11px] text-slate-500">({member.paymentMethod || 'Naqd'})</span>
                          </div>
                        ) : (
                          "Hali to'lov yozuvlari mavjud emas."
                        )}
                      </td>
                    </tr>
                  ) : (
                    history.map((pay, idx) => (
                      <tr key={idx}>
                        <td className="text-slate-400">
                          {new Date(pay.date).toLocaleString('uz-UZ', { 
                            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
                          })}
                        </td>
                        <td className="font-bold text-white">{pay.note || "A'zolik to'lovi"}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            pay.paymentMethod === 'Karta / Click' 
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {pay.paymentMethod === 'Karta / Click' ? '💳 Karta' : '💵 Naqd'}
                          </span>
                        </td>
                        <td className="text-right font-extrabold text-emerald-400">
                          {(pay.amount || 0).toLocaleString()} so'm
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
    </div>
  );
}

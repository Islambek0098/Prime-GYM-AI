import React, { useState } from 'react';
import { CreditCard, Plus, Check, Edit, Trash2, Dumbbell, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Subscriptions({ subscriptions, onRefresh, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [form, setForm] = useState({ name: '', durationDays: 30, price: '', visitsCount: 30, description: '' });

  const handleOpenAdd = () => {
    setEditingSub(null);
    setForm({ name: '', durationDays: 30, price: '', visitsCount: 30, description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSub(sub);
    setForm({
      name: sub.name,
      durationDays: sub.durationDays,
      price: sub.price,
      visitsCount: sub.visitsCount,
      description: sub.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tarifni o'chirmoqchimisiz?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/subscriptions/${id}`, { method: 'DELETE' });
      if (showToast) showToast("Tarif o'chirildi", "info");
      onRefresh();
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Xatolik yuz berdi", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSub 
        ? `${API_BASE_URL}/api/subscriptions/${editingSub.id}`
        : `${API_BASE_URL}/api/subscriptions`;
      
      const method = editingSub ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setShowModal(false);
        if (showToast) {
          if (editingSub) showToast("Tarif ma'lumotlari o'zgartirildi!", "update");
          else showToast("Yangi tarif muvaffaqiyatli yaratildi!", "success");
        }
        onRefresh();
      } else {
        const data = await res.json();
        if (showToast) showToast(data.error || "Xatolik yuz berdi", "error");
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Server bilan bog'lanishda xatolik", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-full overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            <span>Tariflar va Abonementlar</span>
          </h2>
          <p className="text-xs text-slate-400">GYM fitnes klubi a'zolik paketlari va narxlari</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Tarif Yaratish</span>
        </button>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {subscriptions.map(sub => (
          <div
            key={sub.id}
            className="glass-card glass-card-interactive p-6 rounded-2xl border border-slate-800 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-extrabold uppercase">
                  {sub.durationDays} KUNLIK
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(sub)} className="p-1.5 text-slate-400 hover:text-white">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">{sub.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-8">{sub.description || "Cheksiz mashg'ulotlar"}</p>
              </div>

              <div className="py-2 border-y border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Amal qilish muddati: <strong className="text-white">{sub.durationDays} kun</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Tashriflar soni: <strong className="text-white">{sub.visitsCount} marta</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Narxi</span>
                <span className="text-2xl font-extrabold text-white">
                  {sub.price.toLocaleString()} <span className="text-xs font-semibold text-cyan-400">SO'M</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Sub Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingSub ? "Tarifni Tahrirlash" : "Yangi Tarif Paketini Qo'shish"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tarif Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: VIP (1 Oylik + Murabbiy)"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amal qilish (Kun)</label>
                  <input
                    type="number"
                    required
                    value={form.durationDays}
                    onChange={e => setForm({ ...form, durationDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tashriflar soni</label>
                  <input
                    type="number"
                    required
                    value={form.visitsCount}
                    onChange={e => setForm({ ...form, visitsCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Narxi (So'm)</label>
                <input
                  type="number"
                  required
                  placeholder="300000"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Izoh / Tavsif</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Zalga kirish, murabbiy, dush..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white h-20"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

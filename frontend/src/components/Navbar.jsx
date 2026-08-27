import React from 'react';
import { UserCheck, Plus, Bell, Search, Dumbbell, Sun, Moon } from 'lucide-react';

export default function Navbar({ onOpenCheckIn, onOpenAddMember, activeVisitorsCount, theme, onToggleTheme }) {
  const currentDate = new Date().toLocaleDateString('uz-UZ', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="h-20 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
      {/* Date & Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Hush kelibsiz! 👋
        </h2>
        <p className="text-xs text-slate-400 capitalize mt-0.5">{currentDate}</p>
      </div>

      {/* Action Buttons, Theme Switcher & Status */}
      <div className="flex items-center gap-4">
        
        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title="Mavzuni o'zgartirish (Dark / Light)"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Tungi Rejim</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Yorug' Rejim</span>
            </>
          )}
        </button>

        {/* Active Gym Count Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-cyan-400 shadow-inner">
          <Dumbbell className="w-4 h-4 text-cyan-400 animate-bounce" />
          <span>Hozir zalda: <strong className="text-white text-sm ml-1">{activeVisitorsCount}</strong> kishi</span>
        </div>

        {/* Tezkor Check-In Button */}
        <button
          onClick={onOpenCheckIn}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <UserCheck className="w-4 h-4" />
          <span>Tezkor Check-In</span>
        </button>

        {/* Yangi Mijoz Button */}
        <button
          onClick={onOpenAddMember}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Mijoz Qo'shish</span>
        </button>
      </div>
    </header>
  );
}

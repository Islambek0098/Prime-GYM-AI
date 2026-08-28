import React from 'react';
import { UserCheck, Plus, Dumbbell, Sun, Moon, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Navbar({ 
  onOpenCheckIn, 
  onOpenAddMember, 
  activeVisitorsCount, 
  theme, 
  onToggleTheme,
  onToggleMenu,
  isSidebarCollapsed
}) {
  const currentDate = new Date().toLocaleDateString('uz-UZ', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <header className="h-16 sm:h-20 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 min-w-0 transition-colors">
      
      {/* Left: Menu Toggle Button & Title */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={onToggleMenu}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shrink-0"
          title="Menuni yashirish / chiqarish"
        >
          <span className="lg:hidden"><Menu className="w-5 h-5" /></span>
          <span className="hidden lg:inline">
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </span>
        </button>

        <div className="min-w-0 hidden sm:block">
          <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-1.5 truncate">
            <span>Hush kelibsiz!</span> 👋
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-400 capitalize truncate">{currentDate}</p>
        </div>
      </div>

      {/* Right: Action Buttons, Theme Switcher & Status */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        
        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title="Mavzuni o'zgartirish (Dark / Light)"
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="hidden md:inline">Tungi Rejim</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden md:inline">Yorug' Rejim</span>
            </>
          )}
        </button>

        {/* Active Gym Count Badge */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-cyan-400 shadow-inner">
          <Dumbbell className="w-4 h-4 text-cyan-400 animate-bounce shrink-0" />
          <span className="hidden sm:inline">Zalda:</span>
          <strong className="text-white text-xs sm:text-sm">{activeVisitorsCount}</strong>
        </div>

        {/* Tezkor Check-In Button */}
        <button
          onClick={onOpenCheckIn}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all duration-200 transform hover:scale-105 active:scale-95 shrink-0"
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Tezkor Check-In</span>
          <span className="sm:hidden">Check-In</span>
        </button>

        {/* Yangi Mijoz Button */}
        <button
          onClick={onOpenAddMember}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all duration-200 transform hover:scale-105 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Mijoz Qo'shish</span>
          <span className="sm:hidden">+Mijoz</span>
        </button>
      </div>
    </header>
  );
}

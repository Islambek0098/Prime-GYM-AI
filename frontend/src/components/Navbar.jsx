import React from 'react';
import { UserCheck, Plus, Dumbbell, Sun, Moon, Menu, PanelLeftClose, PanelLeftOpen, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function Navbar({ 
  onOpenCheckIn, 
  onOpenAddMember, 
  activeVisitorsCount, 
  theme, 
  onToggleTheme,
  onToggleMenu,
  isSidebarCollapsed,
  isConnected = true,
  isWakingUp = false,
  isRetrying = false,
  onRetry
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
        
        {/* Server Status Badge Indicator */}
        <button
          onClick={onRetry}
          disabled={isRetrying}
          title={
            isWakingUp 
              ? "Render serveri uyg'onmoqda..." 
              : isConnected 
                ? "Server Online (Qayta yuklash uchun bosing)" 
                : "Server Offline! Qayta ulanish uchun bosing"
          }
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-semibold transition shrink-0 ${
            isWakingUp 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse hover:bg-amber-500/20' 
              : isConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 animate-bounce'
          }`}
        >
          {isWakingUp ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
              <span className="hidden xl:inline text-[11px]">Server Uyg'onmoqda...</span>
            </>
          ) : isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden xl:inline text-[11px]">Server Online</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="hidden xl:inline text-[11px]">Server Offline</span>
            </>
          )}
        </button>

        {/* Dark / Light Theme Toggle Button — Icon only */}
        <button
          onClick={onToggleTheme}
          title={theme === 'light' ? "Tungi rejimga o'tish (Dark)" : "Yorug' rejimga o'tish (Light)"}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center shrink-0 hover:scale-105 active:scale-95"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          ) : (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          )}
        </button>

        {/* Active Gym Count Badge */}
        <div 
          title={`Hozirda zalda ${activeVisitorsCount} nafar mijoz bor`}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-cyan-400 shadow-inner shrink-0"
        >
          <Dumbbell className="w-4 h-4 text-cyan-400 animate-bounce shrink-0" />
          <span className="hidden sm:inline">Zalda:</span>
          <strong className="text-white text-xs sm:text-sm">{activeVisitorsCount}</strong>
        </div>

        {/* Tezkor Check-In Button — Icon only */}
        <button
          onClick={onOpenCheckIn}
          title="Tezkor Check-In (Zalga kirish)"
          className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all duration-200 transform hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center"
        >
          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        </button>

        {/* Yangi Mijoz Qo'shish Button — Person + Plus Icon */}
        <button
          onClick={onOpenAddMember}
          title="Yangi Mijoz Qo'shish"
          className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all duration-200 transform hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center gap-0.5"
        >
          <div className="flex items-center -space-x-0.5">
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0 stroke-[3]" />
            <span className="text-sm sm:text-base leading-none">👤</span>
          </div>
        </button>
      </div>
    </header>
  );
}


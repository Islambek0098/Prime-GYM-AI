import React from 'react';
import { AlertTriangle, RefreshCw, Zap, WifiOff } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ServerStatusBanner({ isConnected, isWakingUp, isRetrying, onRetry }) {
  if (isConnected && !isWakingUp) return null;

  return (
    <div className="w-full px-2 sm:px-4 pt-2.5 pb-1 z-40 transition-all duration-300">
      {isWakingUp ? (
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 backdrop-blur-md shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5 sm:gap-2">
                <span className="truncate">Server Uyg'onmoqda...</span>
                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-amber-400 shrink-0" />
              </h4>
              <p className="text-[10px] sm:text-xs text-amber-200/80 line-clamp-1 sm:line-clamp-none">
                <span className="hidden sm:inline">Bepul Render serveri uyqu rejimidan chiqmoqda (bunga 30-50 soniya ketishi mumkin). Sahifani yopmang.</span>
                <span className="sm:hidden">Server uyqudan chiqmoqda (30-50s). Kuting...</span>
              </p>
            </div>
          </div>
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] sm:text-xs font-bold transition disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRetrying ? 'Tekshirilmoqda...' : 'Qayta tekshirish'}</span>
            <span className="sm:hidden">{isRetrying ? '...' : 'Yangilash'}</span>
          </button>
        </div>
      ) : !isConnected ? (
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 backdrop-blur-md shadow-lg shadow-rose-500/5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <WifiOff className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-rose-300 flex items-center gap-1.5 sm:gap-2 truncate">
                <span>Server bilan aloqa yo'q</span>
              </h4>
              <p className="text-[10px] sm:text-xs text-rose-200/80 line-clamp-1 sm:line-clamp-none">
                <span className="hidden sm:inline">Backend serveriga ulanib bo'lmadi. Internet yoki server holatini tekshiring.</span>
                <span className="sm:hidden">Serverga ulanib bo'lmadi.</span>
              </p>
            </div>
          </div>
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-rose-500/20 transition active:scale-95 disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRetrying ? 'Ulanmoqda...' : 'Qayta Ulanish'}</span>
            <span className="sm:hidden">{isRetrying ? '...' : 'Ulanish'}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

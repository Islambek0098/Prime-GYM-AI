import React from 'react';
import { AlertTriangle, RefreshCw, Zap, WifiOff } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ServerStatusBanner({ isConnected, isWakingUp, isRetrying, onRetry }) {
  if (isConnected && !isWakingUp) return null;

  return (
    <div className="w-full px-4 pt-3 pb-1 z-40 transition-all duration-300">
      {isWakingUp ? (
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:px-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 backdrop-blur-md shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                <span>Render.com Serveri Uyg'onmoqda...</span>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-200/80 truncate">
                Bepul Render serveri uyqu rejimidan chiqmoqda (bunga 30-50 soniya ketishi mumkin). Sahifani yopmang, ma'lumotlar avtomatik yuklanadi.
              </p>
            </div>
          </div>
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Tekshirilmoqda...' : 'Kutish / Qayta tekshirish'}</span>
          </button>
        </div>
      ) : !isConnected ? (
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:px-5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 backdrop-blur-md shadow-lg shadow-rose-500/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-rose-300 flex items-center gap-2">
                <span>Server bilan aloqa o'rnatib bo'lmadi!</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-950/60 font-mono text-rose-300 border border-rose-800/50">
                  {API_BASE_URL}
                </span>
              </h4>
              <p className="text-[11px] sm:text-xs text-rose-200/80 truncate">
                Backend serveriga ulanishda xatolik yuz berdi. Render.com serveri o'chirilgan yoki tarmoq xatoligi bo'lishi mumkin.
              </p>
            </div>
          </div>
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition active:scale-95 disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Ulanmoqda...' : 'Qayta Ulanish (Retry)'}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

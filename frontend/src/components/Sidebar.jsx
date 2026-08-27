import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CalendarCheck2, 
  ShoppingBag, 
  Settings, 
  Dumbbell, 
  Bot,
  FileSpreadsheet,
  DollarSign,
  Wallet
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, gymName, gymLogo }) {
  const menuItems = [
    { id: 'dashboard', label: 'Bosh Sahifa', icon: LayoutDashboard },
    { id: 'members', label: 'Mijozlar Bazasi', icon: Users },
    { id: 'attendance', label: 'Davomat & Shkaflar', icon: CalendarCheck2 },
    { id: 'pos', label: 'Fitnes Bar (POS)', icon: ShoppingBag },
    { id: 'subscriptions', label: 'Tariflar / Abonement', icon: CreditCard },
    { id: 'finance', label: 'Finans (Moliya)', icon: DollarSign },
    { id: 'expenses', label: 'Harajatlar', icon: Wallet },
    { id: 'settings', label: 'Sozlamalar & Telegram', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-20">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          {gymLogo ? (
            <div className="w-10 h-10 rounded-xl bg-slate-950 p-1 border border-slate-800 flex items-center justify-center overflow-hidden shadow-lg shrink-0">
              <img 
                src={gymLogo} 
                alt={gymName || 'Gym Logo'} 
                className="w-full h-full object-contain" 
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Dumbbell className="w-6 h-6 text-white transform -rotate-12" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm tracking-wide text-white leading-tight truncate">
              {gymName || 'CHAMPION GYM'}
            </h1>
            <p className="text-[11px] text-cyan-400 font-semibold tracking-wider uppercase">
              Admin Panel
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Integration Badges Footer */}
      <div className="p-4 border-t border-slate-800/80 space-y-2">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">Google Sheets</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Bot className="w-4 h-4 text-blue-400" />
            <span className="font-medium">Telegram Bot</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
        </div>
      </div>
    </aside>
  );
}

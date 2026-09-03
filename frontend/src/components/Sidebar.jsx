import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CalendarCheck2, 
  ShoppingBag, 
  Settings, 
  Dumbbell, 
  DollarSign,
  Wallet,
  Brain,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  gymName, 
  gymLogo, 
  isMobileOpen, 
  setIsMobileOpen, 
  isCollapsed, 
  setIsCollapsed 
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Bosh Sahifa', icon: LayoutDashboard },
    { id: 'ai-analytics', label: 'AI Smart Tahlil ⚡', icon: Brain },
    { id: 'members', label: 'Mijozlar Bazasi', icon: Users },
    { id: 'attendance', label: 'Davomat & Shkaflar', icon: CalendarCheck2 },
    { id: 'trainers', label: 'Murabbiylar & PT', icon: Dumbbell },
    { id: 'pos', label: 'Fitnes Bar (POS)', icon: ShoppingBag },
    { id: 'subscriptions', label: 'Tariflar / Abonement', icon: CreditCard },
    { id: 'finance', label: 'Finans (Moliya)', icon: DollarSign },
    { id: 'expenses', label: 'Harajatlar', icon: Wallet },
    { id: 'settings', label: 'Sozlamalar & Telegram', icon: Settings },
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col justify-between transition-all duration-300 shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-20 w-72' : 'w-72 lg:w-64'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-4 lg:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
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
              
              {(!isCollapsed || isMobileOpen) && (
                <div className="min-w-0">
                  <h1 className="font-extrabold text-sm tracking-wide text-white leading-tight truncate">
                    {gymName || 'PRIME GYM'}
                  </h1>
                  <p className="text-[11px] text-cyan-400 font-semibold tracking-wider uppercase">
                    Admin Panel
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              title="Menuni yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 lg:p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showText = !isCollapsed || isMobileOpen;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  title={!showText ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    !showText ? 'justify-center lg:px-2' : ''
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {showText && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

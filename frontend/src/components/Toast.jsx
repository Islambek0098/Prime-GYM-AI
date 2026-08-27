import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Edit3, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const type = toast.type || 'success';

  let config = {
    bgColor: 'bg-emerald-950/95',
    borderColor: 'border-emerald-500/40',
    borderLeftColor: 'border-l-emerald-500',
    textColor: 'text-emerald-100',
    subtitleColor: 'text-emerald-300/90',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    Icon: CheckCircle2,
    defaultTitle: "Muvaffaqiyatli qo'shildi!"
  };

  if (type === 'update' || type === 'warning') {
    config = {
      bgColor: 'bg-amber-950/95',
      borderColor: 'border-amber-500/40',
      borderLeftColor: 'border-l-amber-500',
      textColor: 'text-amber-100',
      subtitleColor: 'text-amber-300/90',
      iconBg: 'bg-amber-500/20 text-amber-400',
      Icon: Edit3,
      defaultTitle: "Muvaffaqiyatli o'zgartirildi!"
    };
  } else if (type === 'error') {
    config = {
      bgColor: 'bg-rose-950/95',
      borderColor: 'border-rose-500/40',
      borderLeftColor: 'border-l-rose-500',
      textColor: 'text-rose-100',
      subtitleColor: 'text-rose-300/90',
      iconBg: 'bg-rose-500/20 text-rose-400',
      Icon: AlertCircle,
      defaultTitle: "Xatolik yuz berdi!"
    };
  } else if (type === 'info') {
    config = {
      bgColor: 'bg-sky-950/95',
      borderColor: 'border-sky-500/40',
      borderLeftColor: 'border-l-sky-500',
      textColor: 'text-sky-100',
      subtitleColor: 'text-sky-300/90',
      iconBg: 'bg-sky-500/20 text-sky-400',
      Icon: Info,
      defaultTitle: "Ma'lumot!"
    };
  }

  const { Icon } = config;
  const title = toast.title || config.defaultTitle;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className={`${config.bgColor} border ${config.borderColor} px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border-l-4 ${config.borderLeftColor} backdrop-blur-md min-w-[300px] max-w-md`}>
        <div className={`w-9 h-9 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="font-bold text-sm text-white">{title}</h4>
          <p className={`text-xs ${config.subtitleColor} font-medium leading-relaxed`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0 ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

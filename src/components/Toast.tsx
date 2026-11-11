import React, { useEffect } from 'react';
import { CheckCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div role="status" className="fixed bottom-5 left-3 right-3 sm:left-auto sm:right-5 z-[9999] flex justify-end animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-semibold max-w-md w-full sm:w-auto min-w-0">
        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">{message}</span>
        <button
          onClick={onClose}
          aria-label="Cerrar aviso"
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string | null;
  /** 'error' para rechazos del servidor; 'warning' cuando el cambio quedó solo en este equipo. */
  variant?: ToastVariant;
  onClose: () => void;
}

const VARIANT_STYLES: Record<ToastVariant, { box: string; icon: React.ReactNode }> = {
  success: {
    box: 'bg-slate-900 border-slate-700',
    icon: <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />,
  },
  error: {
    box: 'bg-rose-700 border-rose-500',
    icon: <XCircle className="w-4 h-4 text-white flex-shrink-0" aria-hidden="true" />,
  },
  warning: {
    box: 'bg-amber-700 border-amber-500',
    icon: <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" aria-hidden="true" />,
  },
};

export const Toast: React.FC<ToastProps> = ({ message, variant = 'success', onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.success;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      data-testid="toast"
      data-variant={variant}
      className="fixed bottom-5 left-3 right-3 sm:left-auto sm:right-5 z-[9999] flex justify-end animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className={`${styles.box} text-white px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold max-w-md w-full sm:w-auto min-w-0`}>
        {styles.icon}
        <span className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">{message}</span>
        <button
          onClick={onClose}
          aria-label="Cerrar aviso"
          className={`${variant === 'success' ? 'text-slate-400 hover:bg-slate-800' : 'text-white/80 hover:bg-black/20'} hover:text-white p-1 rounded-lg`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

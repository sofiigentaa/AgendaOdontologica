import React, { useState } from 'react';
import { X, Share2, Copy, Check, ExternalLink, MessageSquare, Smartphone, ShieldCheck } from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string) => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Determine cleanest shareable URL
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://agendaodontologica-cuvt.onrender.com';

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(appUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = appUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      if (onShowToast) onShowToast('📋 ¡Enlace copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (onShowToast) onShowToast('⚠️ Copia el enlace manualmente desde la casilla');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`🦷 *Agenda Odontológica - Dra. Yani & Marie*\n\nAccede a la agenda y gestión de turnos desde este enlace:\n${appUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    if (onShowToast) onShowToast('Abriendo WhatsApp...');
  };

  const handleOpenNewTab = () => {
    window.open(appUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Agenda Odontológica',
          text: 'Acceso a la Agenda Odontológica de Dra. Yani & Marie',
          url: appUrl,
        });
        if (onShowToast) onShowToast('Enlace compartido');
      } catch (err: any) {
        if (err && err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1B4D3E] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Share2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Compartir Agenda
              </h2>
              <p className="text-xs text-emerald-200">
                Enlace para usar en celulares o computadoras
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Enlace de tu aplicación
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Abrir en pestaña</span>
            </button>
          </div>

          {/* Native Mobile Share if available */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-slate-500" />
              <span>Más opciones de compartir</span>
            </button>
          )}

          {/* Info Card */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-slate-700 text-xs leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#2E7D5E] shrink-0 mt-0.5" />
            <p>
              Puedes abrir este enlace desde cualquier teléfono móvil o computadora. Para mayor comodidad, en el navegador de tu celular selecciona <strong>"Agregar a la pantalla de inicio"</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

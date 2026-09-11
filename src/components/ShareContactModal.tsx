import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Mail, Download, Smartphone } from 'lucide-react';
import { Contact } from '../types';
import { formatContactAsText, downloadVCard } from '../utils/vcard';

interface ShareContactModalProps {
  isOpen: boolean;
  contact: Contact | null;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export const ShareContactModal: React.FC<ShareContactModalProps> = ({
  isOpen,
  contact,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !contact) return null;

  const formattedText = formatContactAsText(contact);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formattedText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = formattedText;
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
      onShowToast('📋 Ficha del contacto copiada al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast('Error al copiar al portapapeles');
    }
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(formattedText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    onShowToast('Abriendo WhatsApp...');
  };

  const handleGmail = () => {
    const subject = encodeURIComponent(`Ficha de Contacto: ${contact.fullName}`);
    const body = encodeURIComponent(formattedText);
    const emailTo = contact.email ? encodeURIComponent(contact.email) : '';
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailTo}&su=${subject}&body=${body}`;
    window.open(url, '_blank');
    onShowToast('Abriendo Gmail...');
  };

  const handleDownloadVCard = () => {
    downloadVCard(contact);
    onShowToast('🎴 Tarjeta vCard descargada');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Contacto: ${contact.fullName}`,
          text: formattedText,
        });
        onShowToast('Ficha compartida');
      } catch (err: any) {
        if (err && err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-backdrop">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2E7D5E] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">Compartir Contacto</h3>
              <p className="text-xs text-emerald-100">{contact.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Text Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Vista Previa de la Ficha
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2E7D5E] hover:underline"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {formattedText}
            </pre>
          </div>

          {/* Action Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Elegir Medio para Compartir
            </span>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-bold flex items-center justify-between transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-emerald-900">Enviar por WhatsApp</div>
                  <div className="text-[11px] text-emerald-700 font-normal">Abre WhatsApp con la ficha formateada</div>
                </div>
              </div>
            </button>

            {/* Copy Clipboard */}
            <button
              onClick={handleCopy}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold flex items-center justify-between transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800">
                    {copied ? '¡Texto Copiado!' : 'Copiar Texto al Portapapeles'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal">Para pegar en cualquier chat o documento</div>
                </div>
              </div>
            </button>

            {/* Gmail */}
            <button
              onClick={handleGmail}
              className="w-full p-3 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-900 font-bold flex items-center justify-between transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-red-900">Enviar por Gmail / Email</div>
                  <div className="text-[11px] text-red-700 font-normal">Abre redacción de correo con la ficha</div>
                </div>
              </div>
            </button>

            {/* vCard Download */}
            <button
              onClick={handleDownloadVCard}
              className="w-full p-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900 font-bold flex items-center justify-between transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-blue-900">Descargar Tarjeta vCard (.vcf)</div>
                  <div className="text-[11px] text-blue-700 font-normal">Para guardar directamente en la agenda del teléfono</div>
                </div>
              </div>
            </button>

            {/* Native Share if available */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 font-bold flex items-center justify-between transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-amber-900">Menú Compartir del Sistema</div>
                    <div className="text-[11px] text-amber-700 font-normal">Usa las opciones nativas del móvil o sistema</div>
                  </div>
                </div>
              </button>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

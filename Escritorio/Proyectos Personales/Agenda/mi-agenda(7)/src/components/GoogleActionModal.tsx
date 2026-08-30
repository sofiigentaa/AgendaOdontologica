import React from 'react';
import { Calendar, Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';

export type GoogleActionType = 'sync_calendar' | 'send_email' | 'sync_and_email';

interface GoogleActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  actionType: GoogleActionType;
  appointmentData: {
    patientName: string;
    patientEmail?: string;
    dateFormatted: string;
    time: string;
    durationMinutes: number;
    dentist: string;
    motive?: string;
  };
  userEmail?: string | null;
  isLoading?: boolean;
}

export const GoogleActionModal: React.FC<GoogleActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  appointmentData,
  userEmail,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {actionType === 'send_email' ? (
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                <Mail className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <Calendar className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {actionType === 'sync_calendar' && 'Confirmar Sincronización con Google Calendar'}
                {actionType === 'send_email' && 'Confirmar Envío de Correo por Gmail'}
                {actionType === 'sync_and_email' && 'Sincronizar Calendar y Enviar Gmail'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Cuenta conectada: <span className="font-semibold text-slate-700">{userEmail || 'Google'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Card */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs text-slate-700">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Paciente:</span>
            <span className="font-bold text-slate-900">{appointmentData.patientName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Fecha y Horario:</span>
            <span className="font-bold text-slate-900">
              {appointmentData.dateFormatted} a las {appointmentData.time} hs ({appointmentData.durationMinutes} min)
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Odontóloga:</span>
            <span className="font-bold text-slate-900">Dra. {appointmentData.dentist}</span>
          </div>

          {appointmentData.motive && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Motivo:</span>
              <span className="font-semibold text-slate-800">{appointmentData.motive}</span>
            </div>
          )}

          {actionType !== 'sync_calendar' && (
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Destinatario (Gmail):</span>
              <span className="font-mono font-bold text-blue-700">
                {appointmentData.patientEmail || 'Sin correo especificado'}
              </span>
            </div>
          )}
        </div>

        {/* Action Explanation Notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            {actionType === 'sync_calendar' && (
              <span>Se creará un evento en tu <strong>Google Calendar principal</strong> con recordatorios automáticos de 30 minutos y 24 horas antes.</span>
            )}
            {actionType === 'send_email' && (
              <span>Se enviará un correo electrónico formal con los detalles del turno a <strong>{appointmentData.patientEmail}</strong> desde tu cuenta de Gmail.</span>
            )}
            {actionType === 'sync_and_email' && (
              <span>Se agendará el evento en tu <strong>Google Calendar</strong> y se enviará la notificación por <strong>Gmail</strong> al paciente.</span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || (actionType === 'send_email' && !appointmentData.patientEmail)}
            className="px-4 py-2 bg-[#2E7D5E] hover:bg-[#24664c] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Procesando...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar y Ejecutar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

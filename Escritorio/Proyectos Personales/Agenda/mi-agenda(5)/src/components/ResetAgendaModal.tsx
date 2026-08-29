import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  RotateCcw, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Users,
  Database
} from 'lucide-react';

interface ResetAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
  onClearAppointmentsOnly: () => void;
  onResetSampleData: () => void;
  contactsCount: number;
  appointmentsCount: number;
}

export const ResetAgendaModal: React.FC<ResetAgendaModalProps> = ({
  isOpen,
  onClose,
  onClearAll,
  onClearAppointmentsOnly,
  onResetSampleData,
  contactsCount,
  appointmentsCount,
}) => {
  const [selectedAction, setSelectedAction] = useState<'clear_all' | 'clear_appts' | 'sample' | null>(null);
  const [confirmInput, setConfirmInput] = useState('');

  if (!isOpen) return null;

  const handleExecute = () => {
    if (selectedAction === 'clear_all') {
      if (confirmInput.trim().toUpperCase() !== 'BORRAR') {
        alert('Por favor escribe la palabra BORRAR para confirmar.');
        return;
      }
      onClearAll();
      onClose();
    } else if (selectedAction === 'clear_appts') {
      onClearAppointmentsOnly();
      onClose();
    } else if (selectedAction === 'sample') {
      onResetSampleData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col my-8 animate-modal-pop">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gestionar y Restablecer Agenda</h2>
              <p className="text-xs text-slate-400">
                Vaciar datos para producción o restablecer ejemplos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Info banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Datos actuales: <strong>{contactsCount}</strong> pacientes • <strong>{appointmentsCount}</strong> turnos
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-600">
            Selecciona la acción que deseas realizar:
          </p>

          {/* Action options */}
          <div className="space-y-3">
            
            {/* Option 1: Clear All (Start from scratch) */}
            <div
              onClick={() => setSelectedAction('clear_all')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                selectedAction === 'clear_all'
                  ? 'border-rose-600 bg-rose-50/70 shadow-sm ring-1 ring-rose-600'
                  : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 bg-white'
              }`}
            >
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-rose-900">
                    1. Vaciar TODO (Comenzar desde cero)
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-rose-200 text-rose-800 rounded">
                    Recomendado para Producción
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Borra <strong>todos los turnos, contactos, pacientes, notas y recordatorios</strong> tanto en la pantalla como en la base de datos Supabase. Deja la agenda 100% limpia para registrar pacientes reales.
                </p>
              </div>
            </div>

            {/* Option 2: Clear Appointments Only */}
            <div
              onClick={() => setSelectedAction('clear_appts')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                selectedAction === 'clear_appts'
                  ? 'border-amber-600 bg-amber-50/70 shadow-sm ring-1 ring-amber-600'
                  : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 bg-white'
              }`}
            >
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-900">
                  2. Vaciar únicamente los Turnos del Calendario
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Borra todos los turnos agendados en el calendario, pero <strong>conserva la lista de pacientes/contactos</strong> intacta.
                </p>
              </div>
            </div>

            {/* Option 3: Reset Sample Data */}
            <div
              onClick={() => setSelectedAction('sample')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                selectedAction === 'sample'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600'
                  : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 bg-white'
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-emerald-900">
                  3. Cargar datos de prueba / demostración
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Restaura los 100 pacientes y turnos de ejemplo precargados para demostraciones o pruebas.
                </p>
              </div>
            </div>

          </div>

          {/* Verification input for Clear All */}
          {selectedAction === 'clear_all' && (
            <div className="p-3.5 bg-rose-100/60 border border-rose-300 rounded-xl space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirmación de seguridad</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Esta acción no se puede deshacer. Escribe la palabra <strong>BORRAR</strong> abajo para confirmar:
              </p>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Escribe BORRAR aquí"
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-bold text-rose-900 uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!selectedAction || (selectedAction === 'clear_all' && confirmInput.trim().toUpperCase() !== 'BORRAR')}
            onClick={handleExecute}
            className={`px-5 py-2 text-xs font-bold rounded-xl shadow transition-all flex items-center gap-2 ${
              !selectedAction || (selectedAction === 'clear_all' && confirmInput.trim().toUpperCase() !== 'BORRAR')
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : selectedAction === 'clear_all'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : selectedAction === 'clear_appts'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {selectedAction === 'clear_all'
                ? 'Confirmar y Vaciar Todo'
                : selectedAction === 'clear_appts'
                ? 'Vaciar Turnos'
                : selectedAction === 'sample'
                ? 'Cargar Datos Ejemplo'
                : 'Selecciona una opción'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

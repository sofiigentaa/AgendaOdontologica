import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Contact } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  contact: Contact | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  contact,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-backdrop">
      <div 
        id="modal-delete-confirm"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 overflow-hidden space-y-4 animate-modal-pop"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar contacto?</h3>
            <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
          Está a punto de eliminar a <strong className="text-slate-900">{contact.fullName}</strong>. Se eliminarán también sus notas, recordatorios y archivos adjuntos asociados.
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-delete"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar Definitivamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};

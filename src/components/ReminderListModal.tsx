import React, { useState } from 'react';
import { X, Bell, Phone, CheckCircle2, Trash2, Calendar, User, Clock, AlertCircle, Pencil, Check } from 'lucide-react';
import { CallReminder, Contact } from '../types';

interface ReminderListModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: CallReminder[];
  contacts: Contact[];
  onToggleComplete: (reminderId: string) => void;
  onDeleteReminder: (reminderId: string) => void;
  onUpdateReminder?: (reminderId: string, data: { date: string; time: string; note?: string }) => void;
  onSelectContact: (contact: Contact) => void;
  onClearAllReminders?: () => void;
  onShowToast: (msg: string) => void;
}

export const ReminderListModal: React.FC<ReminderListModalProps> = ({
  isOpen,
  onClose,
  reminders,
  contacts,
  onToggleComplete,
  onDeleteReminder,
  onUpdateReminder,
  onSelectContact,
  onClearAllReminders,
  onShowToast,
}) => {
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState('');
  const [editingTime, setEditingTime] = useState('');
  const [editingNote, setEditingNote] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (rem: CallReminder) => {
    setEditingReminderId(rem.id);
    setEditingDate(rem.date);
    setEditingTime(rem.time);
    setEditingNote(rem.note || '');
  };

  const handleCancelEdit = () => {
    setEditingReminderId(null);
    setEditingDate('');
    setEditingTime('');
    setEditingNote('');
  };

  const handleSaveEdit = (e: React.FormEvent, reminderId: string) => {
    e.preventDefault();
    if (!editingDate || !editingTime) {
      onShowToast('Por favor especifique fecha y hora para el recordatorio');
      return;
    }
    if (onUpdateReminder) {
      onUpdateReminder(reminderId, {
        date: editingDate,
        time: editingTime,
        note: editingNote.trim(),
      });
    }
    setEditingReminderId(null);
    setEditingDate('');
    setEditingTime('');
    setEditingNote('');
  };

  const getContactForReminder = (contactId: string) => {
    return contacts.find((c) => c.id === contactId);
  };

  const pendingReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-backdrop">
      <div 
        id="modal-all-reminders"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[85vh] animate-modal-pop"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Recordatorios de Llamada</h2>
              <p className="text-xs text-slate-400">
                {pendingReminders.length} {pendingReminders.length === 1 ? 'llamada pendiente' : 'llamadas pendientes'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reminders.length > 0 && onClearAllReminders && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas eliminar todos los recordatorios de llamadas?')) {
                    onClearAllReminders();
                  }
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Eliminar todas las llamadas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vaciar Todas</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Pending Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Llamadas Pendientes ({pendingReminders.length})</span>
            </h3>

            {pendingReminders.length === 0 ? (
              <div className="p-6 text-center bg-amber-50/50 rounded-xl border border-amber-200/60 text-slate-500 text-xs font-medium">
                ¡Excelente! No tienes llamadas pendientes programadas en este momento.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReminders.map((rem) => {
                  const contact = getContactForReminder(rem.contactId);
                  const isEditing = editingReminderId === rem.id;

                  if (isEditing) {
                    return (
                      <form
                        key={rem.id}
                        onSubmit={(e) => handleSaveEdit(e, rem.id)}
                        className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5 text-amber-600" />
                            <span>Editar Recordatorio {contact ? `de ${contact.fullName}` : ''}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha</label>
                            <input
                              type="date"
                              value={editingDate}
                              onChange={(e) => setEditingDate(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Hora (24 hs)</label>
                            <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-lg px-2 py-1">
                              <select
                                value={(editingTime || '09:00').split(':')[0] || '09'}
                                onChange={(e) => {
                                  const h = e.target.value;
                                  const m = (editingTime || '09:00').split(':')[1] || '00';
                                  setEditingTime(`${h}:${m}`);
                                }}
                                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                              >
                                {Array.from({ length: 24 }).map((_, i) => {
                                  const h = String(i).padStart(2, '0');
                                  return <option key={h} value={h}>{h} hs</option>;
                                })}
                              </select>
                              <span className="font-bold text-slate-400">:</span>
                              <select
                                value={(editingTime || '09:00').split(':')[1] || '00'}
                                onChange={(e) => {
                                  const m = e.target.value;
                                  const h = (editingTime || '09:00').split(':')[0] || '09';
                                  setEditingTime(`${h}:${m}`);
                                }}
                                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                              >
                                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                                  <option key={m} value={m}>{m} min</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Nota del Recordatorio</label>
                          <input
                            type="text"
                            value={editingNote}
                            onChange={(e) => setEditingNote(e.target.value)}
                            placeholder="Ej: Pedir turno para electrocardiograma..."
                            className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Guardar Cambios</span>
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div
                      key={rem.id}
                      className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => onToggleComplete(rem.id)}
                          title="Marcar como llamada realizada"
                          className="mt-0.5 text-slate-300 hover:text-emerald-600 transition-colors"
                        >
                          <CheckCircle2 className="w-6 h-6" />
                        </button>
                        <div className="min-w-0 flex-1">
                          {contact && (
                            <button
                              onClick={() => {
                                onSelectContact(contact);
                                onClose();
                              }}
                              className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors text-left truncate block"
                            >
                              👤 {contact.fullName}
                            </button>
                          )}
                          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mt-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>📅 {rem.date} a las {rem.time} HS</span>
                          </div>
                          {rem.note && (
                            <p className="text-xs text-slate-600 mt-1 italic">"{rem.note}"</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                        {contact?.primaryPhone && (
                          <a
                            href={`tel:${contact.primaryPhone}`}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Llamar</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(rem)}
                          title="Editar recordatorio"
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-100/70 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReminder(rem.id)}
                          title="Eliminar recordatorio"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Section */}
          {completedReminders.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Historial de Llamadas Realizadas ({completedReminders.length})</span>
              </h3>

              <div className="space-y-2">
                {completedReminders.map((rem) => {
                  const contact = getContactForReminder(rem.contactId);
                  return (
                    <div
                      key={rem.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs opacity-70"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                        <span className="font-bold text-slate-800">{contact?.fullName || 'Contacto'}:</span>
                        <span className="line-through text-slate-500">{rem.date} {rem.time}</span>
                      </div>

                      <button
                        onClick={() => onDeleteReminder(rem.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

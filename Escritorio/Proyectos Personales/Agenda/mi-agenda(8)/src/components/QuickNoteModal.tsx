import React, { useState, useEffect } from 'react';
import { FileText, X, Plus, CheckCircle2, User, Trash2, Search, Clock, ExternalLink, ArrowLeft, Pencil, Check } from 'lucide-react';
import { Contact, ContactNote } from '../types';

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  notes?: ContactNote[];
  onAddNote: (contactId: string, text: string) => void;
  onUpdateNote?: (noteId: string, text: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onShowToast: (msg: string) => void;
  initialContactId?: string;
  onSelectContactDetail?: (contact: Contact) => void;
}

export const QuickNoteModal: React.FC<QuickNoteModalProps> = ({
  isOpen,
  onClose,
  contacts,
  notes = [],
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onShowToast,
  initialContactId = '',
  onSelectContactDetail,
}) => {
  const [activeModalTab, setActiveModalTab] = useState<'view' | 'add'>('view');
  const [contactId, setContactId] = useState(initialContactId || 'general');
  const [text, setText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Note inline editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Always reset to 'view' mode when modal is opened
  useEffect(() => {
    if (isOpen) {
      setActiveModalTab('view');
      setContactId(initialContactId || 'general');
      setText('');
      setSearchTerm('');
      setEditingNoteId(null);
      setEditingNoteText('');
    }
  }, [isOpen, initialContactId]);

  if (!isOpen) return null;

  const handleStartEditNote = (note: ContactNote) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleSaveEditNote = (noteId: string) => {
    if (!editingNoteText.trim()) {
      onShowToast('El texto de la nota no puede estar vacío');
      return;
    }
    if (onUpdateNote) {
      onUpdateNote(noteId, editingNoteText.trim());
    }
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const targetId = contactId || 'general';
    const selectedContact = contacts.find((c) => c.id === targetId);
    
    onAddNote(targetId, text.trim());
    onShowToast(`Nota guardada${selectedContact ? ` para ${selectedContact.fullName}` : ' (Sin paciente)'}`);
    
    setText('');
    setActiveModalTab('view');
  };

  // Filter notes by search
  const filteredNotes = notes.filter((n) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    const contact = contacts.find((c) => c.id === n.contactId);
    const contactName = contact ? contact.fullName.toLowerCase() : '';
    return n.text.toLowerCase().includes(query) || contactName.includes(query);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-backdrop">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-modal-pop">
        
        {/* Header */}
        <div className="bg-[#2E7D5E] text-white p-4 px-5 flex items-center justify-between border-b border-[#24664c] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Notas y Observaciones Médicas</h3>
              <p className="text-[11px] text-emerald-100">
                {activeModalTab === 'view' ? `Historial de ${notes.length} notas creadas` : 'Redactar nueva nota u observación'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Bar */}
        <div className="bg-slate-100 p-2.5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveModalTab('view')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeModalTab === 'view'
                  ? 'bg-white text-[#2E7D5E] shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ver Todas las Notas</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeModalTab === 'view' ? 'bg-[#2E7D5E] text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {notes.length}
              </span>
            </button>
          </div>

          {activeModalTab === 'add' && (
            <button
              onClick={() => setActiveModalTab('view')}
              className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la lista</span>
            </button>
          )}
        </div>

        {/* Tab 1: Ver Notas Creadas */}
        {activeModalTab === 'view' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {/* Top Toolbar in Notes View: Search and Quick Add Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar en las notas..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF7D] focus:bg-white"
                />
              </div>
              <button
                onClick={() => setActiveModalTab('add')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#2E7D5E] border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Nota</span>
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 my-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-50 text-[#2E7D5E] rounded-xl flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">No hay notas registradas</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Puedes agregar observaciones clínicas o recordatorios a cualquier paciente.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModalTab('add')}
                  className="px-4 py-2 bg-[#4CAF7D] hover:bg-[#3d986b] text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primera Nota</span>
                </button>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                No se encontraron notas que coincidan con "{searchTerm}".
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => {
                  const contact = contacts.find((c) => c.id === note.contactId);
                  const isEditing = editingNoteId === note.id;

                  return (
                    <div
                      key={note.id}
                      className={`p-3.5 bg-white rounded-xl border transition-all ${
                        isEditing
                          ? 'border-[#4CAF7D] ring-2 ring-emerald-100 shadow-md'
                          : 'border-slate-200 shadow-2xs hover:border-emerald-300'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                              <Pencil className="w-3 h-3 text-emerald-600" />
                              Editando nota
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <textarea
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                handleSaveEditNote(note.id);
                              }
                            }}
                            rows={3}
                            className="w-full px-3 py-2 text-xs text-slate-800 bg-emerald-50/20 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF7D] focus:bg-white"
                            autoFocus
                            placeholder="Escriba el nuevo contenido de la nota..."
                          />
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelEditNote}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditNote(note.id)}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#4CAF7D] hover:bg-[#3d986b] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar Cambios</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {contact ? (
                                <button
                                  onClick={() => {
                                    if (onSelectContactDetail) {
                                      onSelectContactDetail(contact);
                                      onClose();
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#2E7D5E] border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                                  title="Ver ficha completa del paciente"
                                >
                                  <User className="w-3 h-3 text-[#2E7D5E]" />
                                  <span>{contact.fullName}</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-[#2E7D5E]/70" />
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                                  Sin paciente (Nota General)
                                </span>
                              )}

                              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 ml-auto">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                {new Date(note.createdAt).toLocaleString()}
                              </span>
                              {note.updatedAt && (
                                <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                                  Editada
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap break-words bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                              {note.text}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {onUpdateNote && (
                              <button
                                type="button"
                                onClick={() => handleStartEditNote(note)}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer"
                                title="Editar esta nota"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}

                            {onDeleteNote && (
                              <button
                                type="button"
                                onClick={() => onDeleteNote(note.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                                title="Eliminar esta nota"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Crear Nueva Nota Form */}
        {activeModalTab === 'add' && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 overflow-y-auto">
            {/* Select Contact */}
            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#2E7D5E]" />
                <span>Seleccionar Paciente / Ficha</span>
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#4CAF7D] focus:border-[#4CAF7D]"
              >
                <option value="general">Sin paciente (Nota General / Recordatorio)</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    👤 {c.fullName} {c.insuranceName ? `(${c.insuranceName})` : '(Particular)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Note Content */}
            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1.5">
                Contenido de la Nota
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escriba aquí la nota, indicación clínica, observación o recordatorio para la ficha del paciente..."
                rows={5}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#333333] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF7D] focus:border-[#4CAF7D] leading-relaxed"
                required
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2 bg-[#4CAF7D] hover:bg-[#3d986b] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Nota</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MessageCircle, 
  Share2, 
  Star, 
  Edit3, 
  Trash2, 
  Shield, 
  CreditCard, 
  MapPin, 
  Bell, 
  Paperclip, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Download, 
  Send,
  UserCheck,
  Info,
  Calendar,
  Sparkles,
  StickyNote,
  Copy,
  Users,
  Eye,
  Pencil,
  Check,
  ExternalLink
} from 'lucide-react';
import { Contact, CallReminder, ContactNote, ContactAttachment, Appointment } from '../types';
import { openWhatsApp } from '../utils/whatsapp';
import { shareContact, downloadVCard, formatContactAsText } from '../utils/vcard';
import { getAppointmentTimeRange, formatDuration, formatDateDDMMYYYY, formatDateWithDayName } from '../utils/time';

interface ContactDetailModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onToggleFavorite: (contactId: string) => void;
  onScheduleAppointment?: (contact: Contact) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  appointments?: Appointment[];
  
  // Reminders
  reminders: CallReminder[];
  onAddReminder: (contactId: string, date: string, time: string, note?: string) => void;
  onUpdateReminder?: (reminderId: string, data: { date: string; time: string; note?: string }) => void;
  onToggleReminderComplete: (reminderId: string) => void;
  onDeleteReminder: (reminderId: string) => void;

  // Notes
  notes: ContactNote[];
  onAddNote: (contactId: string, text: string, color?: 'yellow' | 'pink' | 'blue' | 'green' | 'amber') => void;
  onUpdateNote?: (noteId: string, text: string, color?: 'yellow' | 'pink' | 'blue' | 'green' | 'amber') => void;
  onDeleteNote: (noteId: string) => void;

  // Attachments
  attachments: ContactAttachment[];
  onAddAttachment: (contactId: string, file: File) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onUpdateObservations?: (contactId: string, observations: string) => void;

  onShareContact?: (contact: Contact) => void;
  onShowToast: (msg: string) => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onScheduleAppointment,
  onEditAppointment,
  appointments = [],
  reminders,
  onAddReminder,
  onUpdateReminder,
  onToggleReminderComplete,
  onDeleteReminder,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  attachments,
  onAddAttachment,
  onDeleteAttachment,
  onUpdateObservations,
  onShareContact,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'reminders' | 'attachments' | 'notes'>('info');

  // Observations inline editing state
  const [isEditingObservations, setIsEditingObservations] = useState(false);
  const [observationsText, setObservationsText] = useState(contact?.observations || '');

  // Sync observations when contact changes
  React.useEffect(() => {
    setObservationsText(contact?.observations || '');
    setIsEditingObservations(false);
  }, [contact?.id, contact?.observations]);

  const handleSaveObservations = () => {
    if (!contact) return;
    if (onUpdateObservations) {
      onUpdateObservations(contact.id, observationsText.trim());
    }
    setIsEditingObservations(false);
  };

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // New reminder form state
  const [reminderDate, setReminderDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [reminderTime, setReminderTime] = useState('10:00');
  const [reminderNote, setReminderNote] = useState('');
  const [showAddReminderForm, setShowAddReminderForm] = useState(false);

  // Edit reminder state
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editingReminderDate, setEditingReminderDate] = useState('');
  const [editingReminderTime, setEditingReminderTime] = useState('');
  const [editingReminderNote, setEditingReminderNote] = useState('');

  // New note state
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedNoteColor, setSelectedNoteColor] = useState<'yellow' | 'pink' | 'blue' | 'green' | 'amber'>('yellow');

  // WhatsApp custom message
  const [customWaMsg, setCustomWaMsg] = useState('');

  // Share dropdown menu state
  const [showShareMenu, setShowShareMenu] = useState(false);

  // In-app attachment visualizer state
  const [viewingAttachment, setViewingAttachment] = useState<ContactAttachment | null>(null);

  // Ref for note input
  const noteInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !contact) return null;

  const contactReminders = reminders.filter((r) => r.contactId === contact.id);
  const contactNotes = notes.filter((n) => n.contactId === contact.id);
  const contactAttachments = attachments.filter((a) => a.contactId === contact.id);
  const patientAppointments = appointments
    .filter((a) => a.contactId === contact.id)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleWhatsApp = () => {
    if (!contact.primaryPhone) {
      onShowToast('El contacto no posee un número telefónico');
      return;
    }
    const msg = customWaMsg || `Hola ${contact.fullName}, te contacto desde Mi Agenda.`;
    openWhatsApp(contact.primaryPhone, msg);
    onShowToast(`WhatsApp abierto con ${contact.fullName}`);
  };

  const handleShare = async () => {
    if (onShareContact) {
      onShareContact(contact);
      return;
    }
    const res = await shareContact(contact);
    if (res.method === 'native') {
      onShowToast('Contacto compartido');
    } else if (res.method === 'whatsapp') {
      onShowToast('Abriendo WhatsApp para compartir la ficha');
    } else if (res.success) {
      onShowToast('📋 Datos del contacto copiados al portapapeles');
    } else {
      onShowToast('No se pudo compartir automáticamente');
    }
  };

  const handleCopyClipboard = async () => {
    const formatted = formatContactAsText(contact);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formatted);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = formatted;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      onShowToast('📋 Ficha del contacto copiada al portapapeles');
    } catch {
      onShowToast('Error al copiar ficha');
    }
    setShowShareMenu(false);
  };

  const handleShareWhatsApp = () => {
    const formatted = formatContactAsText(contact);
    const encoded = encodeURIComponent(formatted);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    onShowToast('Abriendo WhatsApp...');
    setShowShareMenu(false);
  };

  const handleCreateReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderDate || !reminderTime) return;
    onAddReminder(contact.id, reminderDate, reminderTime, reminderNote.trim());
    setReminderNote('');
    setShowAddReminderForm(false);
    onShowToast('Recordatorio de llamada programado');
  };

  const handleStartEditReminder = (rem: CallReminder) => {
    setEditingReminderId(rem.id);
    setEditingReminderDate(rem.date);
    setEditingReminderTime(rem.time);
    setEditingReminderNote(rem.note || '');
  };

  const handleCancelEditReminder = () => {
    setEditingReminderId(null);
    setEditingReminderDate('');
    setEditingReminderTime('');
    setEditingReminderNote('');
  };

  const handleSaveEditReminder = (e: React.FormEvent, reminderId: string) => {
    e.preventDefault();
    if (!editingReminderDate || !editingReminderTime) {
      onShowToast('Por favor especifique fecha y hora para el recordatorio');
      return;
    }
    if (onUpdateReminder) {
      onUpdateReminder(reminderId, {
        date: editingReminderDate,
        time: editingReminderTime,
        note: editingReminderNote.trim(),
      });
    }
    setEditingReminderId(null);
    setEditingReminderDate('');
    setEditingReminderTime('');
    setEditingReminderNote('');
  };

  const handleCreateNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) {
      onShowToast('Escriba el texto de la nota u observación antes de guardar');
      noteInputRef.current?.focus();
      return;
    }
    onAddNote(contact.id, newNoteText.trim(), selectedNoteColor);
    setNewNoteText('');
    onShowToast('Nota / Observación agregada a la ficha del paciente');
  };

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      onAddAttachment(contact.id, files[i]);
    }
    e.target.value = '';
    onShowToast('Documento adjuntado correctamente');
  };

  const handleOpenAttachmentDirect = (att: ContactAttachment) => {
    try {
      const parts = att.dataUrl.split(',');
      const mime = att.type || 'application/pdf';
      let blob: Blob;
      if (parts[0].includes(';base64')) {
        const byteChars = atob(parts[1]);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        blob = new Blob([new Uint8Array(byteNumbers)], { type: mime });
      } else {
        blob = new Blob([decodeURIComponent(parts[1])], { type: mime });
      }
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (!w || w.closed || typeof w.closed === 'undefined') {
        const a = document.createElement('a');
        a.href = url;
        a.download = att.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error(e);
      setViewingAttachment(att);
    }
  };

  const handleDownloadAttachment = (att: ContactAttachment) => {
    try {
      const parts = att.dataUrl.split(',');
      const mime = att.type || 'application/pdf';
      let blob: Blob;
      if (parts[0].includes(';base64')) {
        const byteChars = atob(parts[1]);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        blob = new Blob([new Uint8Array(byteNumbers)], { type: mime });
      } else {
        blob = new Blob([decodeURIComponent(parts[1])], { type: mime });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-backdrop">
      <div 
        id="modal-contact-details"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl my-auto overflow-hidden flex flex-col h-full max-h-[94vh] sm:max-h-[92vh] animate-modal-pop"
      >
        {/* Header Profile Hero */}
        <div className="bg-[#2E7D5E] text-white p-4 sm:p-6 relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#24664c]">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#2E7D5E] text-white flex items-center justify-center font-bold text-lg sm:text-2xl shadow-lg ring-2 sm:ring-4 ring-white/30 flex-shrink-0">
              {getInitials(contact.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold tracking-tight text-white truncate notranslate" translate="no">{contact.fullName}</h2>
                
                <button
                  onClick={() => onToggleFavorite(contact.id)}
                  title={contact.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                  className="text-white/80 hover:text-white p-1 cursor-pointer"
                >
                  <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${contact.isFavorite ? 'text-white fill-white' : 'text-white/50'}`} />
                </button>

                {contact.isParticular ? (
                  <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Particular
                  </span>
                ) : (
                  <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 flex items-center gap-1 truncate max-w-[200px]">
                    <Shield className="w-3 h-3 shrink-0" />
                    <span className="truncate">{contact.insuranceName}</span>
                  </span>
                )}
              </div>

              {contact.affiliateNumber && !contact.isParticular && (
                <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-200" />
                  <span>N° Afiliado: <strong>{contact.affiliateNumber}</strong></span>
                </p>
              )}
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
            {onScheduleAppointment && (
              <button
                onClick={() => {
                  onScheduleAppointment(contact);
                  onClose();
                }}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#4CAF7D] hover:bg-[#3d986b] text-white transition-colors text-xs font-bold flex items-center gap-1.5 shadow min-h-[38px] cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Agendar Turno</span>
                <span className="xs:hidden">Turno</span>
              </button>
            )}
            <button
              onClick={() => {
                onEdit(contact);
                onClose();
              }}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer min-h-[38px]"
              title="Editar datos del paciente"
            >
              <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => onDelete(contact)}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors text-xs font-medium min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
              title="Eliminar paciente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
              title="Cerrar ficha"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Communication Bar */}
        <div className="bg-slate-100 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={handleWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {contact.primaryPhone && (
              <a
                href={`tel:${contact.primaryPhone}`}
                className="px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold shadow-sm flex items-center gap-1.5 transition-all min-h-[38px]"
              >
                <Phone className="w-4 h-4" />
                <span>Llamar {contact.primaryPhone}</span>
              </a>
            )}

            <a
              href={contact.email 
                ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent('Consultorio Marie - Yani')}`
                : `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('Consultorio Marie - Yani')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold shadow-sm flex items-center gap-1.5 transition-all min-h-[38px]"
              title="Abrir redactar correo en Gmail"
            >
              <Mail className="w-4 h-4 text-red-400" />
              <span>Email</span>
            </a>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer"
              title="Compartir ficha del contacto"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>

            <button
              onClick={() => downloadVCard(contact)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer"
              title="Descargar tarjeta vCard (.vcf)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>vCard</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 sm:gap-6 border-b border-slate-200 bg-white px-3 sm:px-6 overflow-x-auto no-scrollbar touch-scroll">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 sm:py-3.5 px-2.5 sm:px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer min-h-[44px] ${
              activeTab === 'info'
                ? 'border-[#2E7D5E] text-[#2E7D5E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>Información</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-3 sm:py-3.5 px-2.5 sm:px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer min-h-[44px] ${
              activeTab === 'appointments'
                ? 'border-[#2E7D5E] text-[#2E7D5E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Historial de Turnos</span>
            {patientAppointments.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-emerald-100 text-[#2E7D5E] font-extrabold rounded-full border border-emerald-200">
                {patientAppointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`py-3 sm:py-3.5 px-2.5 sm:px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer min-h-[44px] ${
              activeTab === 'reminders'
                ? 'border-[#2E7D5E] text-[#2E7D5E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Recordatorios</span>
            {contactReminders.filter((r) => !r.completed).length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-slate-950 font-black rounded-full">
                {contactReminders.filter((r) => !r.completed).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 sm:py-3.5 px-2.5 sm:px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer min-h-[44px] ${
              activeTab === 'attachments'
                ? 'border-[#2E7D5E] text-[#2E7D5E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Paperclip className="w-4 h-4 shrink-0" />
            <span>Archivos</span>
            {contactAttachments.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-200 text-slate-700 font-bold rounded-full">
                {contactAttachments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 sm:py-3.5 px-2.5 sm:px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer min-h-[44px] ${
              activeTab === 'notes'
                ? 'border-[#2E7D5E] text-[#2E7D5E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Notas</span>
            {contactNotes.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-emerald-100 text-[#2E7D5E] font-bold rounded-full border border-emerald-200">
                {contactNotes.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: INFO GENERAL */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              
              {/* Coverage / Insurance Card Box */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2E7D5E] text-white flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Cobertura Médica / Sanitaria
                    </h4>
                    <p className="text-base font-bold text-slate-900">
                      {contact.isParticular ? 'Particular (Sin obra social / prepaga)' : contact.insuranceName}
                    </p>
                  </div>
                </div>

                {!contact.isParticular && contact.affiliateNumber && (
                  <div className="text-left sm:text-right">
                    <span className="text-emerald-700 font-medium text-xs block">N° de Afiliado:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm select-all">
                      {contact.affiliateNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Personal Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center min-h-[78px]">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0">
                    <Phone className="w-3.5 h-3.5 text-[#2E7D5E] shrink-0" />
                    Teléfono Principal
                  </span>
                  <p className="text-sm font-bold text-slate-900 truncate" title={contact.primaryPhone}>
                    {contact.primaryPhone}
                  </p>
                </div>

                {contact.altPhone && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center min-h-[78px]">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0">
                      <Phone className="w-3.5 h-3.5 text-[#2E7D5E] shrink-0" />
                      Teléfono Alternativo
                    </span>
                    <p className="text-sm font-bold text-slate-900 truncate" title={contact.altPhone}>
                      {contact.altPhone}
                    </p>
                  </div>
                )}

                {contact.email && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center min-h-[78px]">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0">
                      <Mail className="w-3.5 h-3.5 text-[#2E7D5E] shrink-0" />
                      Correo Electrónico
                    </span>
                    <a 
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent('Consultorio Marie - Yani')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-[#2E7D5E] hover:underline truncate block"
                      title={contact.email}
                    >
                      {contact.email}
                    </a>
                  </div>
                )}

                {contact.address && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center min-h-[78px]">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1 shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-[#2E7D5E] shrink-0" />
                      Dirección
                    </span>
                    <p className="text-sm font-bold text-slate-900 truncate" title={contact.address}>
                      {contact.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Observations Editable Card */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-2xs transition-all">
                {isEditingObservations ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        Editar Observaciones
                      </span>
                      <span className="text-[10.5px] text-amber-700 font-medium hidden sm:inline">Ctrl + Enter para guardar</span>
                    </div>
                    <textarea
                      value={observationsText}
                      onChange={(e) => setObservationsText(e.target.value)}
                      placeholder="Escribir observaciones o notas del paciente (ej: preferencias de turnos, antecedentes, recomendaciones)..."
                      rows={3}
                      className="w-full p-3 bg-white border border-amber-300 focus:border-amber-500 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-inner resize-y font-normal"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          handleSaveObservations();
                        }
                      }}
                    />
                    <div className="flex justify-end items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setObservationsText(contact.observations || '');
                          setIsEditingObservations(false);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveObservations}
                        className="px-3.5 py-1.5 bg-[#2E7D5E] hover:bg-[#24664c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Guardar Observaciones
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        Observaciones
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setObservationsText(contact.observations || '');
                          setIsEditingObservations(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200/90 text-amber-900 border border-amber-300/80 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Editar texto de observaciones"
                      >
                        <Pencil className="w-3 h-3 text-amber-700" />
                        <span>Editar</span>
                      </button>
                    </div>
                    <div
                      onClick={() => {
                        setObservationsText(contact.observations || '');
                        setIsEditingObservations(true);
                      }}
                      className="cursor-pointer hover:bg-amber-100/50 p-2 -m-1.5 rounded-xl transition-colors group"
                      title="Haz clic para editar observaciones"
                    >
                      {contact.observations ? (
                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {contact.observations}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-700/70 italic flex items-center gap-1.5">
                          <Pencil className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                          <span>Sin observaciones registradas. Haz clic aquí o en "Editar" para añadir una observación.</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Preset WhatsApp quick message customizer */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Mensaje Predeterminado para WhatsApp</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customWaMsg}
                    onChange={(e) => setCustomWaMsg(e.target.value)}
                    placeholder="Ej: Hola Dr., quisiera consultar disponibilidad para solicitar un turno..."
                    className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleWhatsApp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB: HISTORIAL DE TURNOS DEL PACIENTE */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Historial Completo de Turnos
                </h3>
                <p className="text-xs text-slate-500">
                  Muestra todos los turnos registrados para {contact.fullName}, independientemente de qué odontóloga lo atendió.
                </p>
              </div>

              {patientAppointments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-2">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold">No hay turnos registrados para este paciente</p>
                  <p className="text-xs text-slate-400">Las citas agendadas desde la agenda general aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientAppointments.map((appt) => {
                    const dent = appt.dentist || 'Yani';
                    const isAmbas = dent === 'Ambas';
                    const isMarie = dent === 'Marie';

                    return (
                      <div
                        key={appt.id}
                        className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-emerald-300 transition-all space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-extrabold text-xs rounded-lg border border-slate-200 font-mono">
                              📅 {formatDateWithDayName(appt.date)} • {getAppointmentTimeRange(appt.time, appt.durationMinutes).rangeText} ({formatDuration(appt.durationMinutes)})
                            </span>
                            <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                              appt.completed 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {appt.completed ? '✓ Atendido / Completado' : '⏳ Pendiente'}
                            </span>
                          </div>

                          {/* Dentist Badge & Edit Action */}
                          <div className="flex items-center gap-2">
                            {isAmbas ? (
                              <span className="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold rounded-lg shadow-2xs">
                                Las dos juntas (Marie y Yani)
                              </span>
                            ) : isMarie ? (
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold rounded-lg">
                                Dra. Marie
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-lg">
                                Dra. Yani
                              </span>
                            )}

                            {onEditAppointment && (
                              <button
                                type="button"
                                onClick={() => onEditAppointment(appt)}
                                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#2E7D5E] border border-slate-300 hover:border-emerald-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                title="Editar turno, horario, odontóloga o valores de este turno"
                              >
                                <Pencil className="w-3.5 h-3.5 text-[#2E7D5E]" />
                                <span>Editar</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {appt.motive && (
                          <p className="text-xs text-slate-700">
                            <strong>Motivo / Nota:</strong> {appt.motive}
                          </p>
                        )}

                        {/* Financial summary for this turn */}
                        {(appt.ingresos || appt.descartables || appt.estampillas || appt.materiales || appt.mecanicoDental) ? (
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-slate-700">
                              Ingreso: <strong className="text-emerald-700">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: (Number(appt.ingresos) || 0) % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 }).format(Number(appt.ingresos) || 0)}</strong>
                            </span>
                            <span className="text-slate-500">
                              Egresos: <strong className="text-rose-700">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: ((Number(appt.descartables) || 0) + (Number(appt.estampillas) || 0) + (Number(appt.materiales) || 0) + (Number(appt.mecanicoDental) || 0)) % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 }).format((Number(appt.descartables) || 0) + (Number(appt.estampillas) || 0) + (Number(appt.materiales) || 0) + (Number(appt.mecanicoDental) || 0))}</strong>
                            </span>
                            <span className="text-slate-600 font-semibold">
                              % Honorario: {appt.porcentajeHonorario ?? 50}%
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECORDATORIOS DE LLAMADA */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recordatorios para llamar a este contacto</h3>
                  <p className="text-xs text-slate-500">Programe llamadas para confirmación de turnos, recetas o seguimiento</p>
                </div>
                {!showAddReminderForm && (
                  <button
                    onClick={() => setShowAddReminderForm(true)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Recordatorio</span>
                  </button>
                )}
              </div>

              {/* Add Reminder Form */}
              {showAddReminderForm && (
                <form onSubmit={handleCreateReminderSubmit} className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Programar Llamada</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hora (24 hs)</label>
                      <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2 py-1.5">
                        <select
                          value={(reminderTime || '09:00').split(':')[0] || '09'}
                          onChange={(e) => {
                            const h = e.target.value;
                            const m = (reminderTime || '09:00').split(':')[1] || '00';
                            setReminderTime(`${h}:${m}`);
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
                          value={(reminderTime || '09:00').split(':')[1] || '00'}
                          onChange={(e) => {
                            const m = e.target.value;
                            const h = (reminderTime || '09:00').split(':')[0] || '09';
                            setReminderTime(`${h}:${m}`);
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nota del Recordatorio (Opcional)</label>
                    <input
                      type="text"
                      value={reminderNote}
                      onChange={(e) => setReminderNote(e.target.value)}
                      placeholder="Ej: Pedir turno para electrocardiograma..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddReminderForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-sm hover:bg-amber-400"
                    >
                      Guardar Recordatorio
                    </button>
                  </div>
                </form>
              )}

              {/* Reminders List */}
              {contactReminders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
                  <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No hay recordatorios de llamada programados</p>
                  <p className="text-xs text-slate-400 mt-1">Haga clic en "+ Nuevo Recordatorio" para agregar uno.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contactReminders.map((rem) => {
                    const isEditing = editingReminderId === rem.id;

                    if (isEditing) {
                      return (
                        <form
                          key={rem.id}
                          onSubmit={(e) => handleSaveEditReminder(e, rem.id)}
                          className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-300 space-y-3 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              <Pencil className="w-3.5 h-3.5 text-amber-600" />
                              <span>Editar Recordatorio de Llamada</span>
                            </span>
                            <span className="text-[10.5px] text-amber-700">Modifique los datos y guarde</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha</label>
                              <input
                                type="date"
                                value={editingReminderDate}
                                onChange={(e) => setEditingReminderDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Hora (24 hs)</label>
                              <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-lg px-2 py-1">
                                <select
                                  value={(editingReminderTime || '09:00').split(':')[0] || '09'}
                                  onChange={(e) => {
                                    const h = e.target.value;
                                    const m = (editingReminderTime || '09:00').split(':')[1] || '00';
                                    setEditingReminderTime(`${h}:${m}`);
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
                                  value={(editingReminderTime || '09:00').split(':')[1] || '00'}
                                  onChange={(e) => {
                                    const m = e.target.value;
                                    const h = (editingReminderTime || '09:00').split(':')[0] || '09';
                                    setEditingReminderTime(`${h}:${m}`);
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
                              value={editingReminderNote}
                              onChange={(e) => setEditingReminderNote(e.target.value)}
                              placeholder="Ej: Recordar traer cepillo de dientes..."
                              className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelEditReminder}
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
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          rem.completed
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white border-amber-200/90 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onToggleReminderComplete(rem.id)}
                            className={`p-1 rounded-full ${rem.completed ? 'text-emerald-600' : 'text-slate-300 hover:text-amber-500'}`}
                            title={rem.completed ? 'Marcar como pendiente' : 'Marcar como llamada realizada'}
                          >
                            <CheckCircle2 className={`w-5 h-5 ${rem.completed ? 'fill-emerald-100' : ''}`} />
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${rem.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                📅 {rem.date} a las {rem.time} HS
                              </span>
                              {rem.completed && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded-full">
                                  Realizado
                                </span>
                              )}
                            </div>
                            {rem.note && <p className="text-xs text-slate-600 mt-0.5">{rem.note}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {contact.primaryPhone && !rem.completed && (
                            <a
                              href={`tel:${contact.primaryPhone}`}
                              className="px-2.5 py-1 rounded-lg bg-teal-700 text-white font-bold text-xs flex items-center gap-1 hover:bg-teal-600 shadow-2xs"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Llamar</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEditReminder(rem)}
                            title="Editar recordatorio"
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
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
          )}

          {/* TAB 3: ADJUNTOS & DOCUMENTOS */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Adjuntar Documentos, Archivos o Fotos</h3>
                  <p className="text-xs text-slate-500">Guarde credenciales de la obra social, órdenes médicas o estudios</p>
                </div>

                <label className="px-3.5 py-2 bg-[#2E7D5E] hover:bg-[#24664c] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all">
                  <Paperclip className="w-4 h-4" />
                  <span>Adjuntar Archivo</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                  />
                </label>
              </div>

              {contactAttachments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
                  <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Sin archivos o documentos adjuntos</p>
                  <p className="text-xs text-slate-400 mt-1">Sube fotos de credenciales, estudios o archivos PDF.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contactAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 shadow-sm flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#2E7D5E] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate" title={att.name}>{att.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {(att.size / 1024).toFixed(1)} KB • {new Date(att.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        {/* Botón principal: Abrir archivo */}
                        <button
                          type="button"
                          onClick={() => handleOpenAttachmentDirect(att)}
                          className="flex-1 py-2 px-3 bg-[#2E7D5E] hover:bg-[#24664c] active:bg-[#1d523d] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                          title="Abrir archivo directamente"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Abrir</span>
                        </button>

                        {/* Descargar directo */}
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(att)}
                          title="Descargar archivo al dispositivo"
                          className="p-2 text-slate-600 hover:text-[#2E7D5E] hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => onDeleteAttachment(att.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
                          title="Eliminar archivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTAS Y OBSERVACIONES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Notas y Observaciones del Contacto</span>
                  </h3>
                  <p className="text-xs text-slate-500">Historial de notas y observaciones registradas cronológicamente</p>
                </div>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleCreateNoteSubmit} className="flex gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <input
                  ref={noteInputRef}
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Escriba una nota u observación (ej: consulta abonada, traer estudios el viernes)..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#2E7D5E] hover:bg-[#24664c] active:bg-[#1d523d] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Nota / Observación</span>
                </button>
              </form>

              {/* Notes List rendered line by line */}
              {contactNotes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No hay notas ni observaciones registradas para este contacto</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {contactNotes.map((note, index) => (
                    <div
                      key={note.id}
                      className={`p-3.5 bg-white rounded-xl border transition-all ${
                        editingNoteId === note.id
                          ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-md'
                          : 'border-slate-200 shadow-sm hover:border-emerald-300'
                      }`}
                    >
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                              <Pencil className="w-3 h-3 text-emerald-600" />
                              Editando nota #{contactNotes.length - index}
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
                            className="w-full px-3 py-2 text-xs sm:text-sm text-slate-800 bg-emerald-50/20 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
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
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#2E7D5E] hover:bg-[#24664c] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar Cambios</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                              #{contactNotes.length - index}
                            </span>
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  {new Date(note.createdAt).toLocaleString()}
                                </span>
                                {note.updatedAt && (
                                  <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                    Editada
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-wrap break-words">
                                {note.text}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditNote(note)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Editar nota u observación"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteNote(note.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar nota u observación"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* In-App Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-700 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
            {/* Viewer Header */}
            <div className="bg-[#2E7D5E] text-white px-5 py-3 flex items-center justify-between border-b border-[#24664c] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {viewingAttachment.name}
                  </h3>
                  <p className="text-[11px] text-emerald-100 truncate">
                    {(viewingAttachment.size / 1024).toFixed(1)} KB • {viewingAttachment.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingAttachment(null)}
                  className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors cursor-pointer"
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 bg-slate-900/50 overflow-auto p-2 sm:p-4 flex items-center justify-center">
              {viewingAttachment.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(viewingAttachment.name) ? (
                <div className="max-w-full max-h-full flex items-center justify-center overflow-auto">
                  <img
                    src={viewingAttachment.dataUrl}
                    alt={viewingAttachment.name}
                    className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl bg-white"
                  />
                </div>
              ) : (
                <div className="w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl border border-slate-200 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 text-[#2E7D5E] rounded-2xl mx-auto flex items-center justify-center">
                    <FileText className="w-8 h-8 text-[#2E7D5E]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900 break-words">{viewingAttachment.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">{(viewingAttachment.size / 1024).toFixed(1)} KB • {viewingAttachment.type || 'Documento'}</p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const parts = viewingAttachment.dataUrl.split(',');
                          const mime = viewingAttachment.type || 'application/pdf';
                          let blob: Blob;
                          if (parts[0].includes(';base64')) {
                            const byteChars = atob(parts[1]);
                            const byteNumbers = new Array(byteChars.length);
                            for (let i = 0; i < byteChars.length; i++) {
                              byteNumbers[i] = byteChars.charCodeAt(i);
                            }
                            blob = new Blob([new Uint8Array(byteNumbers)], { type: mime });
                          } else {
                            blob = new Blob([decodeURIComponent(parts[1])], { type: mime });
                          }
                          const url = URL.createObjectURL(blob);
                          const w = window.open(url, '_blank');
                          if (!w || w.closed || typeof w.closed === 'undefined') {
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = viewingAttachment.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full py-3 bg-[#2E7D5E] hover:bg-[#24664c] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Abrir Archivo en Pantalla Completa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = viewingAttachment.dataUrl;
                        a.download = viewingAttachment.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-600" />
                      <span>Descargar al Celular o PC</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Viewer Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    const link = document.createElement('a');
                    link.href = viewingAttachment.dataUrl;
                    link.download = viewingAttachment.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (e) {
                    console.error('Error al descargar:', e);
                  }
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px]"
              >
                <Download className="w-4 h-4 text-[#2E7D5E]" />
                <span>Descargar Archivo</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingAttachment(null)}
                className="px-4 py-2 bg-[#2E7D5E] hover:bg-[#24664c] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer min-h-[38px]"
              >
                Volver a la Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Share2, 
  Star, 
  Edit3, 
  Trash2, 
  Eye, 
  Shield, 
  CreditCard, 
  MapPin, 
  Bell, 
  FileText, 
  Paperclip,
  MoreVertical,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Contact, CallReminder, ViewMode } from '../types';
import { openWhatsApp } from '../utils/whatsapp';
import { shareContact } from '../utils/vcard';

interface ContactCardProps {
  contact: Contact;
  reminders: CallReminder[];
  attachmentsCount: number;
  notesCount: number;
  viewMode: ViewMode;
  onViewDetails: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onToggleFavorite: (contactId: string) => void;
  onAddReminder: (contact: Contact) => void;
  onScheduleAppointment?: (contact: Contact) => void;
  onShareContact?: (contact: Contact) => void;
  onShowToast: (msg: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  reminders,
  attachmentsCount,
  notesCount,
  viewMode,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddReminder,
  onScheduleAppointment,
  onShareContact,
  onShowToast,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  // Find active pending reminder
  const activeReminder = reminders.find((r) => r.contactId === contact.id && !r.completed);

  // Get initials for avatar
  const getInitials = (name: string) => {
    const cleanName = name.replace(/\s*\(.*?\)/g, '').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!contact.primaryPhone) {
      onShowToast('El contacto no tiene número de teléfono registrado');
      return;
    }
    const success = openWhatsApp(contact.primaryPhone, `Hola ${contact.fullName}, te contacto desde Mi Agenda.`);
    if (success) {
      onShowToast(`Abriendo WhatsApp con ${contact.fullName}`);
    }
  };

  const handleCall = (e: React.MouseEvent, phone?: string) => {
    e.stopPropagation();
    const targetPhone = phone || contact.primaryPhone;
    if (!targetPhone) {
      onShowToast('No hay teléfono registrado');
      return;
    }
    window.location.href = `tel:${targetPhone}`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShareContact) {
      onShareContact(contact);
      return;
    }
    const result = await shareContact(contact);
    if (result.method === 'native') {
      onShowToast('Contacto compartido');
    } else if (result.method === 'whatsapp') {
      onShowToast('Abriendo WhatsApp para compartir ficha');
    } else if (result.success) {
      onShowToast('📋 Datos del contacto copiados al portapapeles');
    } else {
      onShowToast('No se pudo compartir automáticamente');
    }
  };

  // Render for Grid View
  if (viewMode === 'grid') {
    return (
      <div 
        id={`contact-card-${contact.id}`}
        onClick={() => onViewDetails(contact)}
        className="group relative bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-[#4CAF7D] shadow-2xs hover:shadow-md hover-lift transition-all duration-200 overflow-hidden flex flex-col cursor-pointer active-touch-scale"
      >
        {/* Top Header Card Background Accent */}
        <div className="h-10 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 group-hover:from-emerald-100/80 group-hover:to-teal-100/60 transition-colors relative p-2 px-3 flex justify-end items-center gap-1.5 border-b border-emerald-100/50">
          
          {/* Health Insurance / Coverage Badge */}
          {contact.isParticular ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/90 text-[#2E7D5E] border border-emerald-200/80 shadow-2xs z-10">
              <Shield className="w-2.5 h-2.5 text-[#2E7D5E]" />
              <span>Particular</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/90 text-[#2E7D5E] border border-emerald-200/80 max-w-[130px] truncate shadow-2xs z-10">
              <Shield className="w-2.5 h-2.5 text-[#2E7D5E] flex-shrink-0" />
              <span className="truncate">{contact.insuranceName || 'Obra Social'}</span>
            </span>
          )}

          {/* Favorite Star Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(contact.id);
            }}
            title={contact.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
            className={`p-1 rounded-full shadow-2xs transition-all z-10 ${
              contact.isFavorite
                ? 'bg-[#2E7D5E] text-white hover:bg-[#24664c]'
                : 'bg-white/90 hover:bg-white text-slate-400 hover:text-slate-600'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                contact.isFavorite ? 'text-white fill-white' : ''
              }`}
            />
          </button>
        </div>

        {/* Card Body */}
        <div className="px-3 sm:px-4 pt-0 pb-3 flex-1 flex flex-col -mt-4 z-10">
          
          {/* Avatar & Main Info */}
          <div className="flex items-end gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D5E] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white flex-shrink-0">
              {getInitials(contact.fullName)}
            </div>
            <div className="flex-1 min-w-0 pt-3">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#2E7D5E] transition-colors truncate notranslate" translate="no">
                {contact.fullName}
              </h3>
              {contact.affiliateNumber && !contact.isParticular && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
                  <CreditCard className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span>N° Afil: {contact.affiliateNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Call Reminder Alert Box if any */}
          {activeReminder && (
            <div className="mb-2 p-1.5 px-2 bg-amber-50 border border-amber-200/80 rounded-lg flex items-start gap-1.5 text-[11px] text-amber-900">
              <Bell className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0 animate-bounce" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[10px] uppercase tracking-wide text-amber-700">Recordatorio de llamada</p>
                <p className="truncate font-medium">{activeReminder.date} - {activeReminder.time}</p>
                {activeReminder.note && <p className="truncate text-slate-600 text-[10px]">{activeReminder.note}</p>}
              </div>
            </div>
          )}

          {/* Contact Methods List */}
          <div className="space-y-1 text-[11px] text-slate-600 my-1.5">
            {contact.primaryPhone && (
              <div className="flex items-center justify-between group/phone hover:text-slate-900">
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-slate-700">{contact.primaryPhone}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handleWhatsApp}
                    title="Enviar WhatsApp"
                    className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleCall(e)}
                    title="Llamar"
                    className="p-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                  </button>
                  <a
                    href={contact.email ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent('Consultorio Marie - Yani')}` : `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('Consultorio Marie - Yani')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Enviar Email por Gmail"
                    className="p-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Mail className="w-3 h-3 text-red-500" />
                  </a>
                </div>
              </div>
            )}

            {contact.email && (
              <div className="flex items-center gap-1.5 truncate text-slate-500">
                <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <a 
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent('Consultorio Marie - Yani')}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()} 
                  className="truncate hover:underline hover:text-emerald-700"
                  title="Abrir redactar en Gmail"
                >
                  {contact.email}
                </a>
              </div>
            )}

            {contact.address && (
              <div className="flex items-center gap-1.5 truncate text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{contact.address}</span>
              </div>
            )}
          </div>

          {/* Footer Metadata & Actions */}
          <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              {notesCount > 0 ? (
                <span title={`${notesCount} notas guardadas`} className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#2E7D5E] border border-emerald-200">
                  <FileText className="w-2.5 h-2.5 text-[#2E7D5E]" />
                  <span>{notesCount} {notesCount === 1 ? 'nota' : 'notas'}</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Ficha técnica</span>
              )}
              {attachmentsCount > 0 && (
                <span title={`${attachmentsCount} archivos adjuntos`} className="flex items-center gap-0.5 text-slate-500 font-medium text-[10px]">
                  <Paperclip className="w-2.5 h-2.5 text-slate-400" />
                  {attachmentsCount}
                </span>
              )}
            </div>

            {/* Action Menu Buttons */}
            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              {onScheduleAppointment && (
                <button
                  onClick={() => onScheduleAppointment(contact)}
                  title="Agendar turno para este paciente"
                  className="p-1 rounded-md text-slate-400 hover:text-[#2E7D5E] hover:bg-emerald-50 transition-colors"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-[#2E7D5E]" />
                </button>
              )}
              <button
                onClick={() => onAddReminder(contact)}
                title="Programar recordatorio"
                className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(contact);
                }}
                title="Editar contacto"
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#2E7D5E] hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(contact)}
                title="Eliminar contacto"
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // Render for List View
  return (
    <div 
      id={`contact-item-${contact.id}`}
      onClick={() => onViewDetails(contact)}
      className="group bg-white rounded-xl border border-slate-200 hover:border-[#4CAF7D] shadow-2xs hover:shadow-sm transition-all p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        
        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-[#2E7D5E] text-white flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
          {getInitials(contact.fullName)}
        </div>

        {/* Contact info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#2E7D5E] transition-colors truncate notranslate" translate="no">
              {contact.fullName}
            </h3>

            {/* Favorite Star */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(contact.id);
              }}
              title={contact.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
              className={`p-0.5 rounded-full transition-all ${
                contact.isFavorite ? 'bg-[#2E7D5E] text-white shadow-2xs' : 'text-slate-300 hover:text-slate-600'
              }`}
            >
              <Star className={`w-3 h-3 ${contact.isFavorite ? 'text-white fill-white' : ''}`} />
            </button>

            {/* Insurance Badge */}
            {contact.isParticular ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/90 text-[#2E7D5E] border border-emerald-200/80">
                Particular
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/90 text-[#2E7D5E] border border-emerald-200/80 truncate max-w-[140px]">
                {contact.insuranceName} {contact.affiliateNumber && `(${contact.affiliateNumber})`}
              </span>
            )}

            {/* Reminder Badge if active */}
            {activeReminder && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Bell className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                Llamar {activeReminder.date} {activeReminder.time}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 flex-wrap">
            {contact.primaryPhone && (
              <span className="font-medium text-slate-700 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {contact.primaryPhone}
              </span>
            )}
            {contact.email && (
              <span className="truncate flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {contact.email}
              </span>
            )}
            {contact.address && (
              <span className="truncate flex items-center gap-1 hidden md:flex">
                <MapPin className="w-3 h-3 text-slate-400" />
                {contact.address}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleWhatsApp}
          title="Enviar WhatsApp"
          className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="hidden md:inline">WhatsApp</span>
        </button>

        <button
          onClick={(e) => handleCall(e)}
          title="Llamar"
          className="p-1.5 rounded-md bg-emerald-50/80 text-[#2E7D5E] hover:bg-[#2E7D5E] hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold"
        >
          <Phone className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Llamar</span>
        </button>

        <button
          onClick={() => onAddReminder(contact)}
          title="Recordatorio de llamada"
          className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleShare}
          title="Compartir"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(contact);
          }}
          title="Editar paciente"
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#2E7D5E] hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(contact)}
          title="Eliminar"
          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};

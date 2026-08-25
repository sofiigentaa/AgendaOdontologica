import React from 'react';
import { EventItem } from '../types';
import {
  getDayOfWeekName,
  formatFullDateSpanish,
  getDaysRemaining,
  formatCurrency,
  getTotalPaid,
  getRemainingBalance,
  getPaidPercentage,
} from '../utils/dateUtils';
import {
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Users,
  PlusCircle,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Tag,
} from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  currency: string;
  onOpenPaymentModal: (event: EventItem) => void;
  onOpenReceiptModal: (event: EventItem) => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  currency,
  onOpenPaymentModal,
  onOpenReceiptModal,
  onEditEvent,
  onDeleteEvent,
}) => {
  const dayName = getDayOfWeekName(event.eventDate);
  const fullDate = formatFullDateSpanish(event.eventDate);
  const countdown = getDaysRemaining(event.eventDate);
  const totalPaid = getTotalPaid(event);
  const remainingBalance = getRemainingBalance(event);
  const paidPercent = getPaidPercentage(event);

  const isFullyPaid = remainingBalance === 0;

  // Build WhatsApp share message
  const handleWhatsAppReminder = () => {
    if (!event.clientPhone) return;
    const cleanPhone = event.clientPhone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `¡Hola ${event.clientName}! Te escribo para saludarte respecto a tu evento "${event.title}".\n\n` +
      `📅 Fecha: ${dayName} ${fullDate}${event.eventTime ? ` a las ${event.eventTime} hs` : ''}\n` +
      `💰 Monto Total: ${formatCurrency(event.totalAmount, currency)}\n` +
      `✅ Seña y pagos abonados: ${formatCurrency(totalPaid, currency)}\n` +
      `⏳ Saldo pendiente a abonar: ${formatCurrency(remainingBalance, currency)}\n\n` +
      `¡Quedamos a tu disposición para cualquier consulta!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div
      id={`event-card-${event.id}`}
      className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden group ${
        isFullyPaid
          ? 'border-slate-200/90 hover:border-emerald-300'
          : 'border-slate-200/90 hover:border-amber-300'
      }`}
    >
      {/* Top Header Bar: Day of the week & Countdown */}
      <div className={`px-4.5 py-3 flex items-center justify-between border-b ${
        isFullyPaid ? 'bg-emerald-50/40 border-emerald-100/60' : 'bg-slate-50/70 border-slate-100'
      }`}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-white">
            {dayName}
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {fullDate}
          </span>
        </div>

        {/* Countdown Badge */}
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
            countdown.isToday
              ? 'bg-rose-100 text-rose-700 animate-pulse'
              : countdown.isPast
              ? 'bg-slate-200/80 text-slate-600'
              : countdown.days <= 7
              ? 'bg-amber-100 text-amber-900 border border-amber-200/60'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
          }`}
        >
          <Clock className="w-3 h-3" />
          {countdown.label}
        </span>
      </div>

      {/* Card Content Body */}
      <div className="p-4.5 sm:p-5 flex-1 space-y-4">
        {/* Title & Type Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {event.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/80">
                <Tag className="w-3 h-3" />
                {event.eventType}
              </span>
              {event.eventTime && (
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {event.eventTime} hs
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {isFullyPaid ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/80 text-emerald-900 border border-emerald-200 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              100% Pagado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/80 text-amber-900 border border-amber-200 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Saldo pendiente
            </span>
          )}
        </div>

        {/* Client & Venue Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">{event.clientName}</span>
          </div>

          {event.clientPhone && (
            <div className="flex items-center gap-1.5 truncate">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.clientPhone}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-1.5 truncate col-span-1 sm:col-span-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.guestCount ? (
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{event.guestCount} invitados</span>
            </div>
          ) : null}
        </div>

        {/* FINANCIAL SUMMARY BOX (The core requirement) */}
        <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-200/80">
            {/* Monto Total */}
            <div className="px-1">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                Total
              </span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                {formatCurrency(event.totalAmount, currency)}
              </span>
            </div>

            {/* Seña / Abonado */}
            <div className="px-1">
              <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">
                Dejó de Seña
              </span>
              <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
                {formatCurrency(totalPaid, currency)}
              </span>
            </div>

            {/* Falta Abonar */}
            <div className="px-1">
              <span className={`text-[10px] font-bold block uppercase tracking-wider ${
                isFullyPaid ? 'text-slate-400' : 'text-amber-800'
              }`}>
                Falta Abonar
              </span>
              <span className={`text-sm font-bold mt-0.5 block ${
                isFullyPaid ? 'text-emerald-700' : 'text-amber-900'
              }`}>
                {isFullyPaid ? '$ 0 (Al día)' : formatCurrency(remainingBalance, currency)}
              </span>
            </div>
          </div>

          {/* Payment Progress Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
              <span>Progreso de cobro</span>
              <span className={isFullyPaid ? 'text-emerald-700 font-bold' : 'text-slate-700 font-semibold'}>
                {paidPercent}% cubierto
              </span>
            </div>
            <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isFullyPaid ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>

          {/* Payment entries count */}
          {event.paymentHistory && event.paymentHistory.length > 0 && (
            <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span>{event.paymentHistory.length} {event.paymentHistory.length === 1 ? 'pago' : 'pagos'}</span>
              <span className="text-slate-600 font-medium">
                Último: {event.paymentHistory[event.paymentHistory.length - 1].date} ({event.paymentHistory[event.paymentHistory.length - 1].method})
              </span>
            </div>
          )}
        </div>

        {/* Optional Notes */}
        {event.notes && (
          <p className="text-xs text-slate-500 italic line-clamp-2 bg-slate-50 p-2 rounded-lg border border-dashed border-slate-200">
            "{event.notes}"
          </p>
        )}
      </div>

      {/* Card Action Buttons Footer */}
      <div className="px-4.5 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Add Payment Button (if balance remains) */}
          {!isFullyPaid && (
            <button
              id={`btn-add-payment-${event.id}`}
              onClick={() => onOpenPaymentModal(event)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs active:scale-95 transition-all"
              title="Registrar abono a este evento"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Abonar</span>
            </button>
          )}

          {/* View Receipt / Detail */}
          <button
            id={`btn-receipt-${event.id}`}
            onClick={() => onOpenReceiptModal(event)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold active:scale-95 transition-all shadow-2xs"
            title="Ver recibo y estado de cuenta"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Comprobante</span>
          </button>

          {/* WhatsApp Direct Reminder */}
          {event.clientPhone && (
            <button
              id={`btn-whatsapp-${event.id}`}
              onClick={handleWhatsAppReminder}
              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
              title="Enviar recordatorio de saldo por WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Edit & Delete Icons */}
        <div className="flex items-center gap-1">
          <button
            id={`btn-edit-event-${event.id}`}
            onClick={() => onEditEvent(event)}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors"
            title="Editar evento"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-delete-event-${event.id}`}
            onClick={() => onDeleteEvent(event.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Eliminar evento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

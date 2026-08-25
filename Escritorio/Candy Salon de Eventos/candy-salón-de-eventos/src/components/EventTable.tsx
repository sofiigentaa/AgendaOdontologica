import React from 'react';
import { EventItem } from '../types.ts';
import {
  getDayOfWeekName,
  formatShortDateSpanish,
  formatCurrency,
  getTotalPaid,
  getRemainingBalance,
  getPaidPercentage,
  getDaysRemaining,
} from '../utils/dateUtils.ts';
import {
  PlusCircle,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Clock,
  BellRing,
} from 'lucide-react';
import { EventCard } from './EventCard.tsx';

interface EventTableProps {
  events: EventItem[];
  currency: string;
  onOpenPaymentModal: (event: EventItem) => void;
  onOpenReceiptModal: (event: EventItem) => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (id: string) => void;
  onOpenReminderForEvent?: (eventId: string) => void;
}

export const EventTable: React.FC<EventTableProps> = ({
  events,
  currency,
  onOpenPaymentModal,
  onOpenReceiptModal,
  onEditEvent,
  onDeleteEvent,
  onOpenReminderForEvent,
}) => {
  return (
    <div>
      {/* Mobile Card List (Mobile-First touch-friendly layout) */}
      <div className="md:hidden space-y-3.5">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            currency={currency}
            onOpenPaymentModal={onOpenPaymentModal}
            onOpenReceiptModal={onOpenReceiptModal}
            onEditEvent={onEditEvent}
            onDeleteEvent={onDeleteEvent}
          />
        ))}
      </div>

      {/* Desktop Rich Data Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3.5 px-4.5">Día & Fecha</th>
                <th className="py-3.5 px-4">Evento / Cliente</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-right">Dejó de Seña</th>
                <th className="py-3.5 px-4 text-right">Falta Abonar</th>
                <th className="py-3.5 px-4 text-center">Estado / %</th>
                <th className="py-3.5 px-4.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((event) => {
                const dayName = getDayOfWeekName(event.eventDate);
                const shortDate = formatShortDateSpanish(event.eventDate);
                const countdown = getDaysRemaining(event.eventDate);
                const totalPaid = getTotalPaid(event);
                const remaining = getRemainingBalance(event);
                const percent = getPaidPercentage(event);
                const isPaid = remaining === 0;

                const handleWhatsApp = () => {
                  if (!event.clientPhone) return;
                  const cleanPhone = event.clientPhone.replace(/[^0-9]/g, '');
                  const msg = encodeURIComponent(
                    `¡Hola ${event.clientName}! Te escribimos desde Candy Salón respecto a tu evento "${event.title}" del ${dayName} ${shortDate}.\n` +
                    `Total: ${formatCurrency(event.totalAmount, currency)} | Abonado: ${formatCurrency(totalPaid, currency)} | Saldo restante: ${formatCurrency(remaining, currency)}`
                  );
                  window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                };

                return (
                  <tr
                    key={event.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Día & Fecha */}
                    <td className="py-3.5 px-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {dayName}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{shortDate}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{countdown.label}</span>
                            {event.eventTime && <span>• {event.eventTime} hs</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Evento & Cliente */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{event.title}</span>
                          <span className="text-[10px] font-semibold text-pink-700 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200/60">
                            {event.eventType}
                          </span>
                        </div>
                        <div className="text-slate-600 flex items-center gap-2 mt-0.5 text-xs font-medium">
                          <span>{event.clientName}</span>
                          {event.clientPhone && (
                            <span className="text-slate-400 text-[11px]">({event.clientPhone})</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Monto Total */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(event.totalAmount, currency)}
                      </span>
                    </td>

                    {/* Dejó de Seña (Total abonado) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div>
                        <span className="font-bold text-emerald-700 text-sm">
                          {formatCurrency(totalPaid, currency)}
                        </span>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {event.paymentHistory?.length || 0} pago(s)
                        </div>
                      </div>
                    </td>

                    {/* Falta Abonar (Saldo Restante) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-bold text-sm ${
                          isPaid ? 'text-emerald-600' : 'text-amber-800'
                        }`}
                      >
                        {isPaid ? '$ 0' : formatCurrency(remaining, currency)}
                      </span>
                    </td>

                    {/* Estado / Barra de Progreso */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Al Día
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Resta Cobrar
                          </span>
                        )}
                        <div className="w-20 bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              isPaid ? 'bg-emerald-500' : 'bg-pink-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isPaid && (
                          <button
                            onClick={() => onOpenPaymentModal(event)}
                            title="Abonar Seña / Pago"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Abonar</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenReceiptModal(event)}
                          title="Ver Comprobante"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/60 shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        {onOpenReminderForEvent && (
                          <button
                            onClick={() => onOpenReminderForEvent(event.id)}
                            title="Recordatorios del Evento"
                            className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors border border-pink-200/60 cursor-pointer"
                          >
                            <BellRing className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {event.clientPhone && (
                          <button
                            onClick={handleWhatsApp}
                            title="WhatsApp"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200/60 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditEvent(event)}
                          title="Editar"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent(event.id)}
                          title="Eliminar"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

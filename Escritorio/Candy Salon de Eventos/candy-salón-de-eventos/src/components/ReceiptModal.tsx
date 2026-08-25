import React, { useState } from 'react';
import { EventItem } from '../types';
import {
  getDayOfWeekName,
  formatFullDateSpanish,
  formatCurrency,
  getTotalPaid,
  getRemainingBalance,
  getDaysRemaining,
} from '../utils/dateUtils';
import { CandyLogo } from './CandyLogo';
import {
  X,
  Printer,
  Copy,
  Check,
  MessageCircle,
  Calendar,
  Clock,
  User,
  MapPin,
  FileCheck,
  AlertCircle,
  Trash2,
  BellRing,
  Sparkles,
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  currency: string;
  onDeletePayment?: (eventId: string, paymentId: string) => void;
  onOpenReminderForEvent?: (eventId: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  event,
  currency,
  onDeletePayment,
  onOpenReminderForEvent,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !event) return null;

  const dayOfWeek = getDayOfWeekName(event.eventDate);
  const fullDate = formatFullDateSpanish(event.eventDate);
  const countdown = getDaysRemaining(event.eventDate);
  const totalPaid = getTotalPaid(event);
  const remaining = getRemainingBalance(event);
  const isPaid = remaining === 0;

  // Build client summary text for WhatsApp with Candy Salón de Eventos
  const summaryText =
    `🍭 *CANDY SALÓN DE EVENTOS*\n` +
    `*RESUMEN DE RESERVA Y ESTADO DE CUENTA*\n` +
    `----------------------------------------\n` +
    `🎉 *Evento:* ${event.title}\n` +
    `👤 *Cliente:* ${event.clientName}\n` +
    `📅 *Día:* ${dayOfWeek.toUpperCase()}\n` +
    `📆 *Fecha:* ${fullDate}${event.eventTime ? ` a las ${event.eventTime} hs` : ''}\n` +
    `📍 *Lugar:* ${event.location || 'Candy Salón de Eventos'}\n` +
    `----------------------------------------\n` +
    `💰 *Monto Total:* ${formatCurrency(event.totalAmount, currency)}\n` +
    `✅ *Seña y Pagos Abonados:* ${formatCurrency(totalPaid, currency)}\n` +
    `⏳ *Saldo Pendiente:* ${isPaid ? '$ 0 (CANCELADO AL 100%)' : formatCurrency(remaining, currency)}\n` +
    `----------------------------------------\n` +
    `*Historial de Pagos:*\n` +
    (event.paymentHistory && event.paymentHistory.length > 0
      ? event.paymentHistory
          .map(
            (p, idx) =>
              `${idx + 1}. ${p.date} - ${p.concept}: ${formatCurrency(p.amount, currency)} (${p.method})${p.notes ? ` - ${p.notes}` : ''}`
          )
          .join('\n')
      : `1. Seña inicial: ${formatCurrency(event.depositAmount, currency)}`) +
    `\n\n¡Muchas gracias por confiar en *Candy Salón de Eventos*! ✨`;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const phone = event.clientPhone?.replace(/[^0-9]/g, '') || '';
    const encoded = encodeURIComponent(summaryText);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header toolbar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Comprobante de Reserva</h2>
              <span className="text-[10px] text-pink-300 font-semibold">Candy Salón de Eventos</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenReminderForEvent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReminderForEvent(event.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Añadir recordatorio para este evento"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>+ Recordatorio</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Imprimir comprobante"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Card Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Top Title & Brand */}
          <div className="border-b border-slate-200/80 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CandyLogo size="lg" showSubtitle={true} className="h-12 sm:h-14" />
              </div>

              <div className="sm:text-right">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    isPaid
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  {isPaid ? '100% CANCELADO' : 'SALDO PENDIENTE'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Ref: {event.id.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <h1 className="text-xl font-black text-slate-900">
                {event.title}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Categoría: {event.eventType} • Candy Salón de Eventos
              </p>
            </div>
          </div>

          {/* DÍA Y FECHA DEL EVENTO (High Visual Prominence) */}
          <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 block">
                Día y Fecha Confirmada
              </span>
              <div className="text-lg font-black tracking-wide text-white uppercase mt-0.5">
                {dayOfWeek}, {fullDate}
              </div>
              {event.eventTime && (
                <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-pink-400" />
                  <span>Horario: {event.eventTime} hs</span>
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {countdown.label}
              </span>
            </div>
          </div>

          {/* Client & Venue information */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">
                Titular / Cliente
              </span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{event.clientName}</div>
              {event.clientPhone && <div className="text-slate-600 font-medium mt-0.5">{event.clientPhone}</div>}
              {event.clientEmail && <div className="text-slate-500 truncate">{event.clientEmail}</div>}
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">
                Ubicación / Salón
              </span>
              <div className="font-semibold text-slate-800 mt-0.5">
                {event.location || 'Candy Salón de Eventos'}
              </div>
              {event.guestCount && (
                <div className="text-slate-600 mt-1 font-medium">
                  {event.guestCount} personas estimadas
                </div>
              )}
            </div>
          </div>

          {/* FINANCIAL BREAKDOWN TABLE */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Detalle Financiero y Señas
            </h3>
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden text-xs shadow-2xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3.5">Concepto</th>
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Método</th>
                    <th className="p-3.5 text-right">Monto</th>
                    {onDeletePayment && <th className="p-3.5 text-center print:hidden w-8"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {event.paymentHistory && event.paymentHistory.length > 0 ? (
                    event.paymentHistory.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-medium text-slate-900">
                          {pay.concept}
                          {pay.notes && <span className="block text-[11px] text-slate-500">{pay.notes}</span>}
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">{pay.date}</td>
                        <td className="p-3.5 text-slate-600 font-medium">{pay.method}</td>
                        <td className="p-3.5 text-right font-bold text-emerald-700">
                          {formatCurrency(pay.amount, currency)}
                        </td>
                        {onDeletePayment && (
                          <td className="p-3.5 text-center print:hidden">
                            <button
                              onClick={() => onDeletePayment(event.id, pay.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar este pago"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3.5 font-medium text-slate-900">Seña inicial</td>
                      <td className="p-3.5 text-slate-600 font-medium">{event.eventDate}</td>
                      <td className="p-3.5 text-slate-600 font-medium">Registro inicial</td>
                      <td className="p-3.5 text-right font-bold text-emerald-700">
                        {formatCurrency(event.depositAmount, currency)}
                      </td>
                      {onDeletePayment && <td className="p-3.5 print:hidden"></td>}
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total & Remaining calculation rows */}
              <div className="bg-slate-50/90 p-4.5 border-t border-slate-200/80 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Monto Total Presupuestado:</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {formatCurrency(event.totalAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span>Total Abonado (Seña + Pagos):</span>
                  <span className="font-bold text-sm">
                    - {formatCurrency(totalPaid, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                  <span className="text-sm font-black uppercase text-slate-900">
                    Saldo Pendiente por Abonar:
                  </span>
                  <span
                    className={`text-lg font-black ${
                      isPaid ? 'text-emerald-700' : 'text-amber-900'
                    }`}
                  >
                    {isPaid ? '$ 0 (CANCELADO)' : formatCurrency(remaining, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes if any */}
          {event.notes && (
            <div className="text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">Observaciones:</span>
              {event.notes}
            </div>
          )}
        </div>

        {/* Footer Actions (WhatsApp & Copy) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Resumen</span>
                </>
              )}
            </button>

            {event.clientPhone && (
              <button
                onClick={handleWhatsApp}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

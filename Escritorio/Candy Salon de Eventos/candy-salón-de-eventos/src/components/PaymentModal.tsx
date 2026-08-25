import React, { useState } from 'react';
import { EventItem, PaymentConcept, PaymentMethod, PaymentRecord } from '../types';
import {
  formatCurrency,
  getTotalPaid,
  getRemainingBalance,
  getDayOfWeekName,
  formatFullDateSpanish,
  getTodayString,
} from '../utils/dateUtils';
import { X, PlusCircle, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  currency: string;
  onAddPayment: (eventId: string, payment: PaymentRecord) => void;
}

const CONCEPTS: PaymentConcept[] = [
  'Abono parcial',
  'Pago final',
  'Adicional',
  'Seña inicial',
];

const METHODS: PaymentMethod[] = [
  'Transferencia',
  'Efectivo',
  'Mercado Pago',
  'Tarjeta',
  'Cheque',
  'Otro',
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  event,
  currency,
  onAddPayment,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(getTodayString());
  const [method, setMethod] = useState<PaymentMethod>('Transferencia');
  const [concept, setConcept] = useState<PaymentConcept>('Abono parcial');
  const [notes, setNotes] = useState('');

  if (!isOpen || !event) return null;

  const totalPaidSoFar = getTotalPaid(event);
  const currentRemaining = getRemainingBalance(event);
  const numAmount = typeof amount === 'number' ? amount : 0;
  const newRemaining = Math.max(0, currentRemaining - numAmount);

  const isCancellingTotal = numAmount >= currentRemaining && currentRemaining > 0;

  const handleQuickFillRemaining = () => {
    setAmount(currentRemaining);
    setConcept('Pago final');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (numAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date,
      amount: numAmount,
      method,
      concept: isCancellingTotal ? 'Pago final' : concept,
      notes: notes.trim() || undefined,
      receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onAddPayment(event.id, newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Registrar Abono / Pago</h2>
              <p className="text-xs text-slate-400 truncate max-w-[280px] font-medium">
                {event.title} • {event.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Summary Box */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 text-xs">
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-200/80">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Presupuesto</span>
              <div className="font-bold text-slate-900 mt-0.5 text-sm">
                {formatCurrency(event.totalAmount, currency)}
              </div>
            </div>
            <div>
              <span className="text-emerald-800 font-bold uppercase tracking-wider text-[10px]">Seña + Pagos</span>
              <div className="font-bold text-emerald-700 mt-0.5 text-sm">
                {formatCurrency(totalPaidSoFar, currency)}
              </div>
            </div>
            <div>
              <span className="text-amber-800 font-bold uppercase tracking-wider text-[10px]">Saldo Actual</span>
              <div className="font-bold text-amber-900 mt-0.5 text-sm">
                {formatCurrency(currentRemaining, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount input & Quick button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Monto del Abono ({currency}) *
              </label>
              {currentRemaining > 0 && (
                <button
                  type="button"
                  onClick={handleQuickFillRemaining}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                >
                  Liquidar saldo total ({formatCurrency(currentRemaining, currency)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                {currency}
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                autoFocus
                placeholder="0"
                value={amount === '' ? '' : amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-14 pr-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Date & Concept */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha del Pago *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Concepto
              </label>
              <select
                value={concept}
                onChange={(e) => setConcept(e.target.value as PaymentConcept)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden font-medium"
              >
                {CONCEPTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Method & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Método de Pago
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden font-medium"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                N° de Comprobante / Nota
              </label>
              <input
                type="text"
                placeholder="Ej. Transf #129384"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Real-time preview of remaining */}
          <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/90 text-xs flex items-center justify-between">
            <span className="font-bold text-emerald-950">
              Nuevo Saldo que Quedará Pendiente:
            </span>
            <span className="text-sm font-bold text-emerald-800">
              {newRemaining === 0 ? '¡$ 0 (Cancelado al 100%)!' : formatCurrency(newRemaining, currency)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Abono</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

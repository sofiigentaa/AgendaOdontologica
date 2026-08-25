import React, { useState, useEffect } from 'react';
import { EventItem, EventType, PaymentMethod, PaymentRecord, ReminderItem } from '../types';
import {
  getDayOfWeekName,
  formatFullDateSpanish,
  getDaysRemaining,
  formatCurrency,
  getTodayString,
} from '../utils/dateUtils';
import { X, Calendar, Clock, DollarSign, User, Phone, Mail, MapPin, Users, Tag, AlertCircle, CheckCircle2, BellRing, Sparkles } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventItem, autoReminders?: Array<Omit<ReminderItem, 'id' | 'createdAt'>>) => void;
  initialEvent?: EventItem | null;
  defaultDate?: string;
  currency: string;
}

const EVENT_TYPES: EventType[] = [
  'Cumpleaños',
  'Boda',
  'Quinceañero',
  'Corporativo',
  'Baby Shower',
  'Catering',
  'Graduación',
  'Bautismo',
  'Cena Privada',
  'Otro',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Transferencia',
  'Efectivo',
  'Mercado Pago',
  'Tarjeta',
  'Cheque',
  'Otro',
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
  defaultDate,
  currency,
}) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventType, setEventType] = useState<EventType>('Cumpleaños');
  const [eventDate, setEventDate] = useState(getTodayString());
  const [eventTime, setEventTime] = useState('20:00');
  const [location, setLocation] = useState('Candy Salón de Eventos');
  const [guestCount, setGuestCount] = useState<number | ''>('');
  
  // Financial fields
  const [totalAmount, setTotalAmount] = useState<number | ''>(0);
  const [depositAmount, setDepositAmount] = useState<number | ''>(0);
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>('Transferencia');
  const [depositNotes, setDepositNotes] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Auto-reminder toggles
  const [createBalanceReminder, setCreateBalanceReminder] = useState(true);
  const [createCandyReminder, setCreateCandyReminder] = useState(true);

  // Reset or initialize state
  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title || '');
      setClientName(initialEvent.clientName || '');
      setClientPhone(initialEvent.clientPhone || '');
      setClientEmail(initialEvent.clientEmail || '');
      setEventType(initialEvent.eventType || 'Cumpleaños');
      setEventDate(initialEvent.eventDate || getTodayString());
      setEventTime(initialEvent.eventTime || '20:00');
      setLocation(initialEvent.location || 'Candy Salón de Eventos');
      setGuestCount(initialEvent.guestCount ?? '');
      setTotalAmount(initialEvent.totalAmount ?? 0);
      setDepositAmount(initialEvent.depositAmount ?? 0);
      setGeneralNotes(initialEvent.notes || '');
      setCreateBalanceReminder(false);
      setCreateCandyReminder(false);

      const initialDepositRecord = initialEvent.paymentHistory?.find(
        (p) => p.concept === 'Seña inicial'
      );
      if (initialDepositRecord) {
        setDepositMethod(initialDepositRecord.method);
        setDepositNotes(initialDepositRecord.notes || '');
      }
    } else {
      // New Event
      setTitle('');
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setEventType('Cumpleaños');
      setEventDate(defaultDate || getTodayString());
      setEventTime('20:00');
      setLocation('Candy Salón de Eventos');
      setGuestCount('');
      setTotalAmount('');
      setDepositAmount('');
      setDepositMethod('Transferencia');
      setDepositNotes('');
      setGeneralNotes('');
      setCreateBalanceReminder(true);
      setCreateCandyReminder(true);
    }
  }, [initialEvent, defaultDate, isOpen]);

  if (!isOpen) return null;

  // Real-time calculations
  const numTotal = typeof totalAmount === 'number' ? totalAmount : 0;
  const numDeposit = typeof depositAmount === 'number' ? depositAmount : 0;
  const remaining = Math.max(0, numTotal - numDeposit);
  const percentageDeposit = numTotal > 0 ? Math.min(100, Math.round((numDeposit / numTotal) * 100)) : 0;

  const dayOfWeek = eventDate ? getDayOfWeekName(eventDate) : '';
  const fullDateSpan = eventDate ? formatFullDateSpanish(eventDate) : '';
  const countdown = eventDate ? getDaysRemaining(eventDate) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !clientName.trim() || !eventDate) {
      alert('Por favor completa el nombre del evento, cliente y la fecha.');
      return;
    }

    const now = new Date().toISOString();

    // Setup initial payment history
    let updatedHistory: PaymentRecord[] = initialEvent?.paymentHistory ? [...initialEvent.paymentHistory] : [];
    
    if (!initialEvent) {
      // If new and there's a deposit, log it as first payment record
      if (numDeposit > 0) {
        updatedHistory.push({
          id: `pay-${Date.now()}`,
          date: getTodayString(),
          amount: numDeposit,
          method: depositMethod,
          concept: 'Seña inicial',
          notes: depositNotes || 'Seña de reserva de fecha en Candy Salón',
          receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        });
      }
    } else {
      // If editing existing event and deposit amount was changed
      const depositIndex = updatedHistory.findIndex((p) => p.concept === 'Seña inicial');
      if (depositIndex >= 0) {
        updatedHistory[depositIndex] = {
          ...updatedHistory[depositIndex],
          amount: numDeposit,
          method: depositMethod,
          notes: depositNotes,
        };
      } else if (numDeposit > 0) {
        updatedHistory.unshift({
          id: `pay-${Date.now()}`,
          date: getTodayString(),
          amount: numDeposit,
          method: depositMethod,
          concept: 'Seña inicial',
          notes: depositNotes,
        });
      }
    }

    const eventId = initialEvent ? initialEvent.id : `evt-${Date.now()}`;

    const eventToSave: EventItem = {
      id: eventId,
      title: title.trim(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      clientEmail: clientEmail.trim() || undefined,
      eventType,
      eventDate,
      eventTime: eventTime.trim() || undefined,
      location: location.trim() || 'Candy Salón de Eventos',
      guestCount: typeof guestCount === 'number' && guestCount > 0 ? guestCount : undefined,
      totalAmount: numTotal,
      depositAmount: numDeposit,
      paymentHistory: updatedHistory,
      status: remaining === 0 && numTotal > 0 ? 'fully_paid' : numDeposit > 0 ? 'deposit_paid' : 'no_deposit',
      notes: generalNotes.trim() || undefined,
      createdAt: initialEvent ? initialEvent.createdAt : now,
      updatedAt: now,
    };

    // Auto-generate reminders if requested
    const autoReminders: Array<Omit<ReminderItem, 'id' | 'createdAt'>> = [];

    const calcDateBefore = (daysBefore: number): string => {
      try {
        const parts = eventDate.split('-').map(Number);
        const target = new Date(parts[0], parts[1] - 1, parts[2] - daysBefore);
        const today = new Date();
        const effectiveDate = target < today ? today : target;
        return `${effectiveDate.getFullYear()}-${String(effectiveDate.getMonth() + 1).padStart(2, '0')}-${String(effectiveDate.getDate()).padStart(2, '0')}`;
      } catch {
        return getTodayString();
      }
    };

    if (createBalanceReminder && remaining > 0) {
      autoReminders.push({
        eventId: eventId,
        eventTitle: title.trim(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        title: `Cobrar saldo restante ${formatCurrency(remaining, currency)} a ${clientName.trim()}`,
        dueDate: calcDateBefore(7),
        dueTime: '11:00',
        category: 'cobro_saldo',
        completed: false,
        priority: 'high',
        notes: `Evento: ${title.trim()} (${eventDate}). Falta abonar: ${formatCurrency(remaining, currency)}.`,
      });
    }

    if (createCandyReminder) {
      autoReminders.push({
        eventId: eventId,
        eventTitle: title.trim(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        title: `Confirmar invitados y ambientación Candy Bar - ${title.trim()}`,
        dueDate: calcDateBefore(3),
        dueTime: '16:00',
        category: 'decoracion_candy',
        completed: false,
        priority: 'medium',
        notes: `Candy Salón de Eventos: Chequear vajilla, golosinas y lista final de asistentes.`,
      });
    }

    onSave(eventToSave, autoReminders.length > 0 ? autoReminders : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {initialEvent ? 'Editar Evento' : 'Registrar Nuevo Evento'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Detalla la fecha, seña recibida y saldo pendiente
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. Basic Event Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              1. Datos Principales del Evento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre o Título del Evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Boda Sofía & Mateo / Cumpleaños 15 Valentina"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Evento
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden transition-all cursor-pointer font-medium"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. DÍA Y FECHA DEL EVENTO (Primary focus) */}
          <div className="p-4.5 bg-indigo-50/40 rounded-2xl border border-indigo-100/90 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              2. Día y Fecha del Evento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha del Evento *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Horario de Inicio
                </label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Real-time Day of Week banner */}
            {eventDate && (
              <div className="mt-2 p-3 bg-white rounded-xl border border-indigo-100/80 text-xs flex items-center justify-between shadow-2xs">
                <div>
                  <span className="font-bold text-slate-900 uppercase tracking-wide">
                    {dayOfWeek}
                  </span>
                  <span className="text-slate-600 ml-2 font-medium">
                    {fullDateSpan}
                  </span>
                </div>
                {countdown && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {countdown.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 3. SEÑA, MONTO TOTAL Y SALDO PENDIENTE (Primary focus) */}
          <div className="p-4.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
              3. Montos, Seña Dejada y Saldo a Abonar
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Presupuesto Total */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto Total del Evento ({currency}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={totalAmount === '' ? '' : totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-14 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Seña Dejada */}
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  ¿Cuánto Dejó de Seña / Anticipo? ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs pointer-events-none">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={depositAmount === '' ? '' : depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-14 pr-3.5 py-2.5 text-sm bg-white border border-emerald-300 rounded-xl font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>

            {/* LIVE CALCULATION BOX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-bold uppercase text-emerald-900 block">
                  Seña Registrada
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-base font-bold text-emerald-800">
                    {formatCurrency(numDeposit, currency)}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold">
                    ({percentageDeposit}% del total)
                  </span>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border ${
                remaining === 0 && numTotal > 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <span className={`text-[11px] font-bold uppercase block ${
                  remaining === 0 && numTotal > 0 ? 'text-emerald-900' : 'text-amber-900'
                }`}>
                  Falta Abonar (Saldo Pendiente)
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`text-base font-bold ${
                    remaining === 0 && numTotal > 0 ? 'text-emerald-800' : 'text-amber-950'
                  }`}>
                    {remaining === 0 && numTotal > 0 ? 'Totalmente Cubierto ($ 0)' : formatCurrency(remaining, currency)}
                  </span>
                  {remaining > 0 && (
                    <span className="text-xs text-amber-800 font-semibold">
                      ({100 - percentageDeposit}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Method & Deposit notes */}
            {numDeposit > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Método de Pago de la Seña
                  </label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden font-medium"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Comprobante / Nota de la Seña
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Transferencia #9948, Recibido en efectivo..."
                    value={depositNotes}
                    onChange={(e) => setDepositNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Client Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              4. Contacto del Cliente y Ubicación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="+54 9 11 1234-5678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lugar / Salón del Evento
                </label>
                <input
                  type="text"
                  placeholder="Ej. Salón Magnolia, Av. Libertador 4500"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cantidad de Invitados
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej. 100"
                  value={guestCount === '' ? '' : guestCount}
                  onChange={(e) => setGuestCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 5. Recordatorios Automáticos para Candy Salón */}
          <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-indigo-600" />
                5. Recordatorios & Alertas para este Evento
              </h3>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                Candy Salón
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createBalanceReminder}
                  onChange={(e) => setCreateBalanceReminder(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">
                  🔔 Crear recordatorio para cobrar saldo pendiente (7 días antes del evento)
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createCandyReminder}
                  onChange={(e) => setCreateCandyReminder(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">
                  🍭 Crear recordatorio para armado de Candy Bar & confirmación de invitados (3 días antes)
                </span>
              </label>
            </div>
          </div>

          {/* 6. General Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas Adicionales / Servicios Incluidos
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre catering, música, decoración, horarios o condiciones acordadas..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all"
            >
              {initialEvent ? 'Guardar Cambios' : 'Registrar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

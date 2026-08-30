import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Edit3, 
  CheckCircle2, 
  FileSpreadsheet,
  Copy,
  Check,
  Share2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Appointment, Contact } from '../types';

interface FinanceSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  contacts: Contact[];
  onEditAppointmentFinances: (appointmentId: string, financialData: {
    ingresos: number;
    descartables: number;
    estampillas: number;
    materiales: number;
    mecanicoDental: number;
    porcentajeHonorario: number;
    dentist: 'Yani' | 'Marie' | 'Ambas';
  }) => void;
  onToggleAppointmentComplete?: (appointmentId: string) => void;
  onShowToast?: (msg: string) => void;
}

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const FinanceSummaryModal: React.FC<FinanceSummaryModalProps> = ({
  isOpen,
  onClose,
  appointments,
  contacts,
  onEditAppointmentFinances,
  onToggleAppointmentComplete,
  onShowToast,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [showDailySettlementModal, setShowDailySettlementModal] = useState<boolean>(false);
  const [copiedSettlement, setCopiedSettlement] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'attendedOnly' | 'pendingOnly'>('all');

  // Sync today when opened
  React.useEffect(() => {
    if (isOpen) {
      if (!selectedDate) {
        setSelectedDate(getTodayString());
      }
      setShowDailySettlementModal(false);
      setCopiedSettlement(false);
    }
  }, [isOpen]);

  const handlePrevDay = () => {
    const baseDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
    baseDate.setDate(baseDate.getDate() - 1);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const todayStr = getTodayString();
    if (selectedDate >= todayStr) return;

    const baseDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
    baseDate.setDate(baseDate.getDate() + 1);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    const nextStr = `${year}-${month}-${day}`;

    if (nextStr > todayStr) {
      setSelectedDate(todayStr);
    } else {
      setSelectedDate(nextStr);
    }
  };

  const handleDateChange = (val: string) => {
    const todayStr = getTodayString();
    if (!val || val > todayStr) {
      setSelectedDate(todayStr);
    } else {
      setSelectedDate(val);
    }
  };

  const handleToday = () => {
    setSelectedDate(getTodayString());
  };

  // Editing form states
  const [editIngresos, setEditIngresos] = useState<number>(0);
  const [editDescartables, setEditDescartables] = useState<number>(0);
  const [editEstampillas, setEditEstampillas] = useState<number>(0);
  const [editMateriales, setEditMateriales] = useState<number>(0);
  const [editMecanico, setEditMecanico] = useState<number>(0);
  const [editPorcentaje, setEditPorcentaje] = useState<number>(50);
  const [editDentist, setEditDentist] = useState<'Yani' | 'Marie' | 'Ambas'>('Yani');

  const getContact = (contactId: string) => contacts.find((c) => c.id === contactId);

  const startEdit = (appt: Appointment) => {
    setEditingApptId(appt.id);
    setEditIngresos(appt.ingresos || 0);
    setEditDescartables(appt.descartables || 0);
    setEditEstampillas(appt.estampillas || 0);
    setEditMateriales(appt.materiales || 0);
    setEditMecanico(appt.mecanicoDental || 0);
    setEditPorcentaje(appt.porcentajeHonorario ?? 50);
    setEditDentist((appt.dentist as 'Yani' | 'Marie' | 'Ambas') || 'Yani');
  };

  const handleSaveFinances = (apptId: string) => {
    onEditAppointmentFinances(apptId, {
      ingresos: editIngresos,
      descartables: editDescartables,
      estampillas: editEstampillas,
      materiales: editMateriales,
      mecanicoDental: editMecanico,
      porcentajeHonorario: editPorcentaje,
      dentist: editDentist,
    });
    setEditingApptId(null);
  };

  // Helper to determine if an appointment counts as attended/completed
  const isApptAttended = (appt: Appointment) => {
    return Boolean(appt.completed);
  };

  // Helper to calculate turn financial stats
  const calculateTurnStats = (appt: Appointment) => {
    if (!appt) {
      return {
        ingresos: 0,
        descartables: 0,
        estampillas: 0,
        materiales: 0,
        mecanico: 0,
        totalEgresos: 0,
        balanceNeto: 0,
        pctPercent: 50,
        honorarioTotal: 0,
        correspondyYani: 0,
        correspondyMarie: 0,
        dentist: 'Yani' as const,
        isAttended: false,
      };
    }

    const isAttended = isApptAttended(appt);
    const ingresos = Number(appt.ingresos) || 0;
    const descartables = Number(appt.descartables) || 0;
    const estampillas = Number(appt.estampillas) || 0;
    const materiales = Number(appt.materiales) || 0;
    const mecanico = Number(appt.mecanicoDental) || 0;
    const totalEgresos = descartables + estampillas + materiales + mecanico;
    const balanceNeto = Math.max(0, ingresos - totalEgresos);
    const rawPct = appt.porcentajeHonorario !== undefined && appt.porcentajeHonorario !== null ? Number(appt.porcentajeHonorario) : 50;
    const pctPercent = isNaN(rawPct) ? 50 : rawPct;
    const pct = pctPercent / 100;
    const honorarioTotal = balanceNeto * pct;

    let correspondyYani = 0;
    let correspondyMarie = 0;

    const dentist = appt.dentist || 'Yani';
    if (dentist === 'Ambas') {
      correspondyYani = honorarioTotal / 2;
      correspondyMarie = honorarioTotal / 2;
    } else if (dentist === 'Marie') {
      correspondyMarie = honorarioTotal;
    } else {
      correspondyYani = honorarioTotal;
    }

    return {
      ingresos,
      descartables,
      estampillas,
      materiales,
      mecanico,
      totalEgresos,
      balanceNeto,
      pctPercent,
      honorarioTotal,
      correspondyYani,
      correspondyMarie,
      dentist,
      isAttended,
    };
  };

  // Group appointments by date
  const dayAppointments = useMemo(() => {
    const list = (appointments || []).filter((appt) => appt && appt.date === selectedDate);
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  // Attended vs Pending counts for selected date
  const attendedCount = useMemo(() => {
    return dayAppointments.filter(isApptAttended).length;
  }, [dayAppointments]);

  const pendingCount = useMemo(() => {
    return dayAppointments.length - attendedCount;
  }, [dayAppointments, attendedCount]);

  // Filtered list according to current filterMode
  const filteredAppointments = useMemo(() => {
    if (filterMode === 'attendedOnly') {
      return dayAppointments.filter(isApptAttended);
    }
    if (filterMode === 'pendingOnly') {
      return dayAppointments.filter((a) => !isApptAttended(a));
    }
    return dayAppointments;
  }, [dayAppointments, filterMode]);

  // Daily Totals (Attended turns only)
  const dailyTotals = useMemo(() => {
    let totIngresos = 0;
    let totEgresos = 0;
    let totDescartables = 0;
    let totEstampillas = 0;
    let totMateriales = 0;
    let totMecanico = 0;
    let totYani = 0;
    let totMarie = 0;

    dayAppointments.forEach((appt) => {
      // Only attended appointments contribute to the settlement
      if (!isApptAttended(appt)) return;

      const s = calculateTurnStats(appt);
      if (s) {
        totIngresos += s.ingresos || 0;
        totEgresos += s.totalEgresos || 0;
        totDescartables += s.descartables || 0;
        totEstampillas += s.estampillas || 0;
        totMateriales += s.materiales || 0;
        totMecanico += s.mecanico || 0;
        totYani += s.correspondyYani || 0;
        totMarie += s.correspondyMarie || 0;
      }
    });

    return {
      totIngresos,
      totEgresos,
      totDescartables,
      totEstampillas,
      totMateriales,
      totMecanico,
      totYani,
      totMarie,
      totNeto: Math.max(0, totIngresos - totEgresos),
    };
  }, [dayAppointments]);

  const formatMoney = (val: any) => {
    try {
      const num = typeof val === 'number' ? val : Number(val);
      const safeNum = isNaN(num) || !isFinite(num) ? 0 : num;
      const hasDecimals = safeNum % 1 !== 0;
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
      }).format(safeNum);
    } catch {
      return '$ 0';
    }
  };

  // Generate Daily Settlement Text for WhatsApp / Clipboard
  const generateSettlementSummaryText = () => {
    const dateFormatted = selectedDate;
    const attendedList = dayAppointments.filter(isApptAttended);

    let text = `📋 *CIERRE Y LIQUIDACIÓN DIARIA DE HONORARIOS*\n`;
    text += `📅 *Fecha:* ${dateFormatted}\n`;
    text += `👥 *Pacientes Atendidos:* ${attendedList.length} de ${dayAppointments.length}\n`;
    text += `------------------------------------\n`;
    text += `💰 *Ingresos Cobrados Totales:* ${formatMoney(dailyTotals.totIngresos)}\n`;
    text += `📉 *Egresos / Gastos Totales:* ${formatMoney(dailyTotals.totEgresos)}\n`;
    if (dailyTotals.totDescartables > 0) text += `   • Descartables: ${formatMoney(dailyTotals.totDescartables)}\n`;
    if (dailyTotals.totEstampillas > 0) text += `   • Estampillas: ${formatMoney(dailyTotals.totEstampillas)}\n`;
    if (dailyTotals.totMateriales > 0) text += `   • Materiales: ${formatMoney(dailyTotals.totMateriales)}\n`;
    if (dailyTotals.totMecanico > 0) text += `   • Mecánico: ${formatMoney(dailyTotals.totMecanico)}\n`;
    text += `💵 *Balance Neto:* ${formatMoney(dailyTotals.totNeto)}\n`;
    text += `------------------------------------\n`;
    text += `👩‍⚕️ *Liquidación Dra. Marie:* ${formatMoney(dailyTotals.totMarie)}\n`;
    text += `👩‍⚕️ *Liquidación Dra. Yani:* ${formatMoney(dailyTotals.totYani)}\n`;
    text += `------------------------------------\n`;
    text += `📝 *Detalle de Pacientes Atendidos:*\n`;

    if (attendedList.length === 0) {
      text += `_Sin pacientes atendidos registrados aún para este día._\n`;
    } else {
      attendedList.forEach((appt, idx) => {
        const contact = getContact(appt.contactId);
        const stats = calculateTurnStats(appt);
        const dentistName = appt.dentist === 'Ambas' ? 'Marie y Yani' : appt.dentist === 'Marie' ? 'Marie' : 'Yani';
        text += `${idx + 1}. *${contact?.fullName || 'Paciente'}* (${appt.time} hs - ${dentistName})\n`;
        text += `   Cobrado: ${formatMoney(stats.ingresos)} | Gastos: ${formatMoney(stats.totalEgresos)} | Honorario (${stats.pctPercent}%): ${formatMoney(stats.honorarioTotal)}\n`;
      });
    }

    text += `\nGenerado automáticamente por *Mi Agenda Odontológica* ✨`;
    return text;
  };

  const handleCopySettlement = () => {
    const text = generateSettlementSummaryText();
    navigator.clipboard.writeText(text);
    setCopiedSettlement(true);
    if (onShowToast) onShowToast('¡Liquidación diaria copiada al portapapeles!');
    setTimeout(() => setCopiedSettlement(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = generateSettlementSummaryText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-backdrop">
      <div 
        id="modal-finance-summary"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-4 overflow-hidden flex flex-col max-h-[94vh] animate-modal-pop"
      >
        {/* Compact Modal Header */}
        <div className="bg-[#2E7D5E] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#24664c] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-xs">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Finanzas y Liquidación de Honorarios
              </h2>
              <p className="text-[11px] text-emerald-100/90 leading-tight">
                Ingresos y egresos por turno atendido • Liquidación Marie / Yani
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compact Date Navigation & Financial Summary Panel */}
        <div className="px-3.5 py-2.5 bg-emerald-950 text-white border-b border-emerald-900 shrink-0 space-y-2.5">
          
          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-800">
            {/* Date navigation */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevDay}
                className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-[11px] font-bold rounded-lg transition-all cursor-pointer border border-emerald-700"
                title="Día Anterior"
              >
                ◀ Anterior
              </button>

              <button
                type="button"
                onClick={handleToday}
                className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer border ${
                  selectedDate === getTodayString()
                    ? 'bg-white text-[#2E7D5E] border-white shadow-xs'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-emerald-700'
                }`}
              >
                Hoy ({getTodayString()})
              </button>

              <button
                type="button"
                onClick={handleNextDay}
                disabled={selectedDate >= getTodayString()}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all border ${
                  selectedDate >= getTodayString()
                    ? 'bg-emerald-950 text-emerald-700 border-emerald-900 cursor-not-allowed opacity-50'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border-emerald-700 cursor-pointer'
                }`}
                title={selectedDate >= getTodayString() ? "No se puede seleccionar fechas futuras" : "Día Siguiente"}
              >
                Siguiente ▶
              </button>

              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="date"
                  value={selectedDate}
                  max={getTodayString()}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-emerald-950 text-white text-[11px] font-bold rounded-lg px-2 py-1 border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Filter Toggle for any date */}
            {dayAppointments.length > 0 && (
              <div className="flex items-center gap-1 bg-emerald-950/80 p-0.5 rounded-lg border border-emerald-800">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-emerald-500 text-slate-950 shadow-2xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  Todos ({dayAppointments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('attendedOnly')}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer ${
                    filterMode === 'attendedOnly'
                      ? 'bg-emerald-500 text-slate-950 shadow-2xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  Atendidos ({attendedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('pendingOnly')}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer ${
                    filterMode === 'pendingOnly'
                      ? 'bg-emerald-500 text-slate-950 shadow-2xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  Pendientes ({pendingCount})
                </button>
              </div>
            )}
          </div>

          {/* Subheader counts */}
          <div className="flex items-center justify-between text-[11px] px-0.5 text-emerald-200">
            <span>
              Fecha seleccionada: <strong className="text-white font-bold">{selectedDate}</strong>
            </span>
            <span className="text-emerald-300">
              <strong>{attendedCount}</strong> atendidos • <strong>{pendingCount}</strong> pendientes de {dayAppointments.length} turnos
            </span>
          </div>

          {/* Compact 4 Summary Cards (Ingresos, Egresos, Liquidación Marie, Liquidación Yani) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Ingresos */}
            <div className="bg-emerald-900/60 border border-emerald-800 p-2 sm:p-2.5 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                INGRESOS COBRADOS
              </p>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">
                {formatMoney(dailyTotals.totIngresos)}
              </p>
            </div>

            {/* Egresos */}
            <div className="bg-rose-950/60 border border-rose-900 p-2 sm:p-2.5 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-rose-400" />
                EGRESOS / COSTOS
              </p>
              <p className="text-sm sm:text-base font-black text-rose-200 mt-0.5">
                {formatMoney(dailyTotals.totEgresos)}
              </p>
            </div>

            {/* Parte Dra. Marie */}
            <div className="bg-blue-950/80 border border-blue-700 p-2 sm:p-2.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200 flex items-center gap-1 notranslate" translate="no">
                  <User className="w-3 h-3 text-blue-300" />
                  LIQUIDACIÓN MARIE
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">
                {formatMoney(dailyTotals.totMarie)}
              </p>
            </div>

            {/* Parte Dra. Yani */}
            <div className="bg-emerald-800/80 border border-emerald-600 p-2 sm:p-2.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 flex items-center gap-1 notranslate" translate="no">
                  <User className="w-3 h-3 text-emerald-300" />
                  LIQUIDACIÓN YANI
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">
                {formatMoney(dailyTotals.totYani)}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Main Body: Appointments for Selected Date */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {dayAppointments.length === 0 ? (
            <div className="py-10 text-center text-slate-500 space-y-3 bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <Calculator className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <p className="text-sm font-extrabold text-slate-800">
                  No hay turnos registrados para el día {selectedDate}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Selecciona otra fecha con los botones superiores o agenda turnos desde el Calendario.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  ◀ Ver Día Anterior
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-3 py-1.5 bg-[#2E7D5E] hover:bg-[#24664c] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Ir a Hoy ({getTodayString()})
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Day Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#2E7D5E]" />
                  <h3 className="font-extrabold text-slate-900">
                    Turnos del día <span className="text-[#2E7D5E] font-black">{selectedDate}</span>
                  </h3>
                  <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                    {attendedCount} atendidos • {pendingCount} pendientes
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="text-slate-600">
                    Neto Cobrado: <strong className="text-emerald-700">{formatMoney(dailyTotals.totNeto)}</strong>
                  </span>
                </div>
              </div>

              {/* Turn Cards */}
              <div className="space-y-2.5">
                {filteredAppointments.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      {filterMode === 'attendedOnly'
                        ? `No hay turnos marcados como atendidos en esta fecha (hay ${pendingCount} turnos pendientes).`
                        : `No hay turnos pendientes para esta fecha (${attendedCount} turnos atendidos).`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className="px-3 py-1.5 bg-[#2E7D5E] hover:bg-[#24664c] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Ver todos los {dayAppointments.length} turnos del día</span>
                    </button>
                  </div>
                ) : (
                  filteredAppointments.map((appt) => {
                    const contact = getContact(appt.contactId);
                    const stats = calculateTurnStats(appt);
                    const isEditing = editingApptId === appt.id;
                    const attended = isApptAttended(appt);

                    return (
                      <div
                        key={appt.id}
                        className={`border rounded-xl p-3 sm:p-3.5 transition-all space-y-2.5 ${
                          attended
                            ? 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300'
                            : 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                              attended ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}>
                              {appt.time} hs
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-extrabold text-slate-900">
                                  {contact?.fullName || 'Paciente'}
                                </h4>
                                {attended ? (
                                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Atendido
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold rounded flex items-center gap-0.5">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    Pendiente
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {contact?.isParticular ? 'Particular' : (contact?.insuranceName || 'Obra Social')}
                                {appt.motive ? ` • ${appt.motive}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Dentist Badge & Action Buttons */}
                          <div className="flex items-center gap-2">
                            {stats.dentist === 'Ambas' ? (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 text-[10.5px] font-black rounded-lg">
                                Marie y Yani
                              </span>
                            ) : stats.dentist === 'Marie' ? (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 text-[10.5px] font-extrabold rounded-lg">
                                Dra. Marie
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10.5px] font-extrabold rounded-lg">
                                Dra. Yani
                              </span>
                            )}

                            {onToggleAppointmentComplete && (
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleAppointmentComplete(appt.id);
                                  if (onShowToast) {
                                    onShowToast(attended ? 'Turno marcado como pendiente' : '¡Turno marcado como atendido!');
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border ${
                                  attended
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{attended ? 'Desmarcar' : 'Marcar Atendido'}</span>
                              </button>
                            )}

                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => startEdit(appt)}
                                className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#2E7D5E] rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-slate-200 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{attended ? 'Editar Montos' : 'Cargar Montos'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Editing Panel vs View Display */}
                        {isEditing ? (
                          <div className="p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-3 animate-in fade-in">
                            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-1">
                              Cargar / Editar Finanzas del Turno
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                  Odontóloga(s) a cargo:
                                </label>
                                <select
                                  value={editDentist}
                                  onChange={(e) => setEditDentist(e.target.value as any)}
                                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                                >
                                  <option value="Marie">Dra. Marie (100%)</option>
                                  <option value="Yani">Dra. Yani (100%)</option>
                                  <option value="Ambas">Las dos juntas (50% c/u)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-emerald-900 mb-0.5">
                                  Ingreso Cobrado ($)
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={editIngresos || ''}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/^0+(?=\d)/, '');
                                    setEditIngresos(raw === '' ? 0 : parseFloat(raw));
                                  }}
                                  placeholder="0.00"
                                  className="w-full px-2.5 py-1 bg-white border border-emerald-400 rounded-lg text-xs font-bold text-slate-900"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                  % Honorario Profesional
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  max="100"
                                  value={editPorcentaje === 0 ? '' : editPorcentaje}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/^0+(?=\d)/, '');
                                    setEditPorcentaje(raw === '' ? 0 : parseFloat(raw));
                                  }}
                                  placeholder="0"
                                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                                />
                              </div>
                            </div>

                            {/* Detailed Expenses */}
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                Egresos y Costos del Turno ($)
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div>
                                  <span className="text-[10px] font-semibold text-slate-600 block">Descartables:</span>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={editDescartables || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                                      setEditDescartables(raw === '' ? 0 : parseFloat(raw));
                                    }}
                                    placeholder="0.00"
                                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                                  />
                                </div>

                                <div>
                                  <span className="text-[10px] font-semibold text-slate-600 block">Estampillas:</span>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={editEstampillas || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                                      setEditEstampillas(raw === '' ? 0 : parseFloat(raw));
                                    }}
                                    placeholder="0.00"
                                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                                  />
                                </div>

                                <div>
                                  <span className="text-[10px] font-semibold text-slate-600 block">Materiales:</span>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={editMateriales || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                                      setEditMateriales(raw === '' ? 0 : parseFloat(raw));
                                    }}
                                    placeholder="0.00"
                                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                                  />
                                </div>

                                <div>
                                  <span className="text-[10px] font-semibold text-slate-600 block">Mecánico Dental:</span>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={editMecanico || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                                      setEditMecanico(raw === '' ? 0 : parseFloat(raw));
                                    }}
                                    placeholder="0.00"
                                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                              <span className="text-xs text-emerald-900 font-bold">
                                Subtotal Egresos: {formatMoney((editDescartables || 0) + (editEstampillas || 0) + (editMateriales || 0) + (editMecanico || 0))}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingApptId(null)}
                                  className="px-3 py-1 text-xs text-slate-600 font-bold hover:bg-slate-200 rounded-lg cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveFinances(appt.id)}
                                  className="px-3.5 py-1 bg-[#2E7D5E] hover:bg-[#24664c] text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                                >
                                  Guardar Montos
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Read-Only Summary per Turn */
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                            <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                              <span className="text-[10px] text-slate-500 font-semibold block">Cobrado:</span>
                              <span className="font-extrabold text-emerald-800">{formatMoney(stats.ingresos)}</span>
                            </div>

                            <div className="p-1.5 sm:p-2 bg-rose-50 rounded-lg border border-rose-100">
                              <span className="text-[10px] text-slate-500 font-semibold block">Egresos:</span>
                              <span className="font-extrabold text-rose-800">{formatMoney(stats.totalEgresos)}</span>
                            </div>

                            <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-semibold block">Honorario ({stats.pctPercent}%):</span>
                              <span className="font-extrabold text-slate-800">{formatMoney(stats.honorarioTotal)}</span>
                            </div>

                            <div className={`p-1.5 sm:p-2 rounded-lg border ${stats.correspondyMarie > 0 ? 'bg-blue-100 border-blue-300' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                              <span className="text-[10px] text-slate-600 font-bold block">Marie:</span>
                              <span className="font-black text-blue-900">{formatMoney(stats.correspondyMarie)}</span>
                            </div>

                            <div className={`p-1.5 sm:p-2 rounded-lg border ${stats.correspondyYani > 0 ? 'bg-emerald-100 border-emerald-300' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                              <span className="text-[10px] text-slate-600 font-bold block">Yani:</span>
                              <span className="font-black text-emerald-900">{formatMoney(stats.correspondyYani)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-600">
          <span>
            💡 Los montos se van completando turno por turno a medida que los pacientes son atendidos.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDailySettlementModal(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Generar Liquidación Diaria</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Daily Settlement Report Modal Popup */}
        {showDailySettlementModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 max-h-[90vh] flex flex-col">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      Liquidación Diaria Oficial
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cierre de jornada del día {selectedDate}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDailySettlementModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Settlement Summary Slip */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs overflow-y-auto flex-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold">Fecha de liquidación:</span>
                  <span className="font-extrabold text-slate-900">{selectedDate}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold">Pacientes atendidos:</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {attendedCount} de {dayAppointments.length} turnos
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold">Ingresos cobrados totales:</span>
                  <span className="font-black text-slate-900 text-sm">{formatMoney(dailyTotals.totIngresos)}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold">Egresos / Gastos totales:</span>
                  <span className="font-black text-rose-700">{formatMoney(dailyTotals.totEgresos)}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2 bg-emerald-50/60 p-2 rounded-lg">
                  <span className="text-emerald-900 font-extrabold">Balance Neto a Distribuir:</span>
                  <span className="font-black text-emerald-800 text-base">{formatMoney(dailyTotals.totNeto)}</span>
                </div>

                {/* Dentist Distribution Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-[10.5px] font-bold text-blue-900 block">A Pagar Dra. Marie:</span>
                    <span className="font-black text-blue-950 text-base mt-0.5 block">
                      {formatMoney(dailyTotals.totMarie)}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10.5px] font-bold text-emerald-900 block">A Pagar Dra. Yani:</span>
                    <span className="font-black text-emerald-950 text-base mt-0.5 block">
                      {formatMoney(dailyTotals.totYani)}
                    </span>
                  </div>
                </div>

                {/* List of Attended Patients */}
                <div className="pt-2 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Detalle de Turnos Atendidos ({attendedCount}):
                  </span>
                  {dayAppointments.filter(isApptAttended).length === 0 ? (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-center text-slate-500">
                      No hay pacientes marcados como atendidos aún en esta fecha.
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {dayAppointments.filter(isApptAttended).map((appt, i) => {
                        const contact = getContact(appt.contactId);
                        const stats = calculateTurnStats(appt);
                        return (
                          <div key={appt.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 truncate max-w-[180px]">
                              {i + 1}. {contact?.fullName || 'Paciente'} ({appt.time} hs)
                            </span>
                            <span className="font-mono font-bold text-emerald-700">
                              {formatMoney(stats.ingresos)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions for settlement */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCopySettlement}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSettlement ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSettlement ? '¡Copiado!' : 'Copiar Resumen'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDailySettlementModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Listo
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};


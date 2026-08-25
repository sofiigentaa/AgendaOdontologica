import React, { useState } from 'react';
import { EventItem } from '../types';
import {
  parseLocalDate,
  formatCurrency,
  getTotalPaid,
  getRemainingBalance,
  getDayOfWeekName,
  formatFullDateSpanish,
} from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

interface CalendarViewProps {
  events: EventItem[];
  currency: string;
  onOpenReceiptModal: (event: EventItem) => void;
  onOpenNewEventWithDate?: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  currency,
  onOpenReceiptModal,
  onOpenNewEventWithDate,
}) => {
  // Current viewed month & year
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Build days matrix
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDaysCount = new Date(year, month, 0).getDate();

  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDaysCount - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    calendarCells.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // Next month leading days (fill up to 35 or 42 grid cells)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  // Map events to YYYY-MM-DD
  const eventsByDate = new Map<string, EventItem[]>();
  events.forEach((ev) => {
    if (ev.status === 'cancelled') return;
    const existing = eventsByDate.get(ev.eventDate) || [];
    eventsByDate.set(ev.eventDate, [...existing, ev]);
  });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Calendar Header Controls */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {MONTH_NAMES[month]} {year}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Vista mensual de compromisos, señas y saldos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200/60 transition-colors shadow-2xs"
          >
            Hoy
          </button>
          <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200/80 p-0.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/70 text-center text-xs font-bold text-slate-600 py-2.5">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={i === 0 || i === 6 ? 'text-indigo-600' : ''}>
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
        {calendarCells.map((cell, idx) => {
          const adjMonth = cell.month < 0 ? 11 : cell.month > 11 ? 0 : cell.month;
          const dateStr = `${cell.year}-${String(adjMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
          const dayEvents = eventsByDate.get(dateStr) || [];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={idx}
              className={`p-2 min-h-[95px] flex flex-col justify-between transition-colors group relative ${
                !cell.isCurrentMonth
                  ? 'bg-slate-50/40 text-slate-300'
                  : isToday
                  ? 'bg-indigo-50/30'
                  : 'bg-white hover:bg-slate-50/60'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    isToday
                      ? 'bg-indigo-600 text-white font-bold'
                      : !cell.isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}
                >
                  {cell.day}
                </span>

                {/* Quick Add Button on hover */}
                {cell.isCurrentMonth && onOpenNewEventWithDate && (
                  <button
                    onClick={() => onOpenNewEventWithDate(dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-opacity"
                    title={`Crear evento el ${dateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Event Chips */}
              <div className="space-y-1.5 flex-1">
                {dayEvents.map((ev) => {
                  const remaining = getRemainingBalance(ev);
                  const isPaid = remaining === 0;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => onOpenReceiptModal(ev)}
                      className={`text-[11px] p-1.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] shadow-2xs ${
                        isPaid
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                          : 'bg-amber-50/80 border-amber-200 text-amber-950 hover:bg-amber-100'
                      }`}
                      title={`${ev.title}\nTotal: ${formatCurrency(ev.totalAmount, currency)}\nSeña: ${formatCurrency(getTotalPaid(ev), currency)}\nFalta: ${formatCurrency(remaining, currency)}`}
                    >
                      <div className="font-bold truncate leading-tight flex items-center justify-between gap-1">
                        <span className="truncate">{ev.title}</span>
                        {isPaid ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-600 truncate mt-0.5 flex items-center justify-between font-medium">
                        <span>{ev.clientName}</span>
                        <span className={`font-bold ${isPaid ? 'text-emerald-800' : 'text-amber-900'}`}>
                          {isPaid ? 'Pagado' : `Falta ${formatCurrency(remaining, currency)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

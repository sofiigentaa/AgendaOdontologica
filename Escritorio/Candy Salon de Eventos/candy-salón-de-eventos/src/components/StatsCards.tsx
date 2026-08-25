import React from 'react';
import { EventItem } from '../types';
import { formatCurrency, getTotalPaid, getRemainingBalance } from '../utils/dateUtils';
import { Wallet, AlertCircle, CheckCircle2, CalendarCheck, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  events: EventItem[];
  currency: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ events, currency }) => {
  // Calculations
  const activeEvents = events.filter(e => e.status !== 'cancelled');
  
  const totalBudgeted = activeEvents.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  const totalCollected = activeEvents.reduce((sum, e) => sum + getTotalPaid(e), 0);
  const totalPending = activeEvents.reduce((sum, e) => sum + getRemainingBalance(e), 0);

  const fullyPaidCount = activeEvents.filter(e => getRemainingBalance(e) === 0).length;
  const pendingBalanceCount = activeEvents.filter(e => getRemainingBalance(e) > 0).length;

  const percentageCollected = totalBudgeted > 0 
    ? Math.round((totalCollected / totalBudgeted) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Recaudado (Señas + Abonos) */}
      <div 
        id="stat-total-collected"
        className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Recaudado (Señas)
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(totalCollected, currency)}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              {percentageCollected}% cobrado
            </span>
            <span className="font-medium text-slate-400">{activeEvents.length} eventos</span>
          </div>
          {/* Progress mini bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${percentageCollected}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Saldo Pendiente por Cobrar */}
      <div 
        id="stat-total-pending"
        className="bg-white rounded-2xl border border-amber-200/80 p-4.5 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-amber-50/20 hover:border-amber-300 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Saldo Pendiente por Cobrar
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-amber-950">
            {formatCurrency(totalPending, currency)}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-amber-800">
            <span className="font-semibold">
              {pendingBalanceCount} {pendingBalanceCount === 1 ? 'evento con saldo' : 'eventos con saldo'}
            </span>
            <span className="text-amber-700/70 font-medium">
              {100 - percentageCollected}% por cobrar
            </span>
          </div>
          <div className="w-full bg-amber-100/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${100 - percentageCollected}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Total Presupuestado */}
      <div 
        id="stat-total-budgeted"
        className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Monto Total Contratado
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(totalBudgeted, currency)}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>Suma de contratos</span>
            <span className="font-semibold text-indigo-600">{activeEvents.length} eventos activos</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* 4. Eventos 100% Pagados vs Con Seña */}
      <div 
        id="stat-paid-count"
        className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Estado de Cobranza
          </span>
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{fullyPaidCount}</span>
            <span className="text-xs font-semibold text-slate-500">al día</span>
            <span className="text-slate-300">/</span>
            <span className="text-xl font-bold text-amber-700">{pendingBalanceCount}</span>
            <span className="text-xs font-semibold text-slate-500">con saldo</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>{fullyPaidCount} liquidados</span>
            <span className="text-emerald-700 font-semibold">
              {activeEvents.length > 0 ? Math.round((fullyPaidCount / activeEvents.length) * 100) : 0}% al día
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-1.5" 
              style={{ width: `${activeEvents.length > 0 ? (fullyPaidCount / activeEvents.length) * 100 : 0}%` }}
            />
            <div 
              className="bg-amber-400 h-1.5" 
              style={{ width: `${activeEvents.length > 0 ? (pendingBalanceCount / activeEvents.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

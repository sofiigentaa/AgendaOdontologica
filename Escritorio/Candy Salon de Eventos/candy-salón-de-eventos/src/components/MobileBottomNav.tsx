import React from 'react';
import { Table, CalendarDays, BellRing, Plus, Sparkles } from 'lucide-react';
import { ViewMode } from '../types.ts';

interface MobileBottomNavProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenReminders: () => void;
  onOpenNewEvent: () => void;
  pendingRemindersCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  viewMode,
  onViewModeChange,
  onOpenReminders,
  onOpenNewEvent,
  pendingRemindersCount,
}) => {
  return (
    <nav
      id="mobile-bottom-dock"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-3 py-1.5 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Listado / Tabla */}
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-h-[48px] min-w-[56px] transition-all cursor-pointer ${
            viewMode === 'table'
              ? 'text-pink-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              viewMode === 'table' ? 'bg-pink-100/80 text-pink-700' : 'bg-transparent'
            }`}
          >
            <Table className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight">Eventos</span>
        </button>

        {/* Center Primary Action: + Nuevo Evento */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={onOpenNewEvent}
            aria-label="Nuevo Evento"
            className="flex flex-col items-center justify-center w-13 h-13 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-lg shadow-pink-500/35 active:scale-95 transition-all ring-4 ring-white"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Calendario */}
        <button
          type="button"
          onClick={() => onViewModeChange('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-h-[48px] min-w-[56px] transition-all cursor-pointer ${
            viewMode === 'calendar'
              ? 'text-pink-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              viewMode === 'calendar' ? 'bg-pink-100/80 text-pink-700' : 'bg-transparent'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight">Calendario</span>
        </button>

        {/* Recordatorios */}
        <button
          type="button"
          onClick={onOpenReminders}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-h-[48px] min-w-[56px] text-slate-500 hover:text-slate-800 font-medium transition-all relative cursor-pointer"
        >
          <div className="p-1.5 rounded-xl bg-transparent relative">
            <BellRing className="w-5 h-5" />
            {pendingRemindersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                {pendingRemindersCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight">Alertas</span>
        </button>
      </div>
    </nav>
  );
};

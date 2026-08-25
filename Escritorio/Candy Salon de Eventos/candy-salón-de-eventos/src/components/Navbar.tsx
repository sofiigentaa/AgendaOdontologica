import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, Table, BellRing, RotateCcw, Trash2, Database, Sparkles, ChevronDown } from 'lucide-react';
import { ViewMode } from '../types.ts';
import { CandyLogo } from './CandyLogo.tsx';

interface NavbarProps {
  onOpenNewEvent?: () => void;
  onSyncSupabase?: () => void;
  isRefreshing?: boolean;
  onClearAllData?: () => void;
  onResetDemoData?: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenReminders: () => void;
  pendingRemindersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSyncSupabase,
  isRefreshing = false,
  onClearAllData,
  onResetDemoData,
  viewMode,
  onViewModeChange,
  onOpenReminders,
  pendingRemindersCount,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 gap-2 sm:gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center transition-transform hover:scale-[1.02]">
              <CandyLogo size="md" showSubtitle={true} className="h-9 sm:h-11" />
            </div>
          </div>

          {/* Desktop & Mobile Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Recordatorios Button (Desktop / Tablet) */}
            <button
              id="btn-open-reminders"
              type="button"
              onClick={onOpenReminders}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                pendingRemindersCount > 0
                  ? 'bg-pink-50 hover:bg-pink-100 text-pink-800 border-pink-300 shadow-xs ring-2 ring-pink-400/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <BellRing className="w-4 h-4 text-pink-600" />
              <span>Recordatorios</span>
              {pendingRemindersCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-red-500 text-white rounded-full leading-none">
                  {pendingRemindersCount}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">0</span>
              )}
            </button>

            {/* View Mode Toggle: Tabla & Calendario (Desktop) */}
            <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80 text-xs">
              <button
                id="btn-view-table"
                onClick={() => onViewModeChange('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Vista de Tabla"
              >
                <Table className="w-4 h-4 text-pink-600" />
                <span>Tabla</span>
              </button>
              <button
                id="btn-view-calendar"
                onClick={() => onViewModeChange('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Vista de Calendario"
              >
                <CalendarDays className="w-4 h-4 text-pink-600" />
                <span>Calendario</span>
              </button>
            </div>

            {/* Ruedita: Sincronización y Opciones de Supabase / Base de datos */}
            <div className="relative" ref={menuRef}>
              <button
                id="btn-database-sync-menu"
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                title="Sincronización con Supabase y opciones de base de datos"
                className={`flex items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                  isMenuOpen
                    ? 'bg-pink-100 text-pink-700 border-pink-300 shadow-xs ring-2 ring-pink-400/20'
                    : 'bg-slate-50 text-slate-600 hover:text-pink-600 hover:bg-pink-50 border-slate-200'
                }`}
              >
                <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-pink-600' : ''}`} />
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-pink-600" />
                      <span className="text-xs font-bold text-slate-800">Base de Datos / Supabase</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sincroniza o administra los datos</p>
                  </div>

                  <div className="p-1 space-y-0.5">
                    {/* Sincronizar con Supabase */}
                    {onSyncSupabase && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onSyncSupabase();
                        }}
                        disabled={isRefreshing}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-pink-50 hover:text-pink-700 rounded-xl transition-colors text-left cursor-pointer font-medium disabled:opacity-50"
                      >
                        <RotateCcw className={`w-4 h-4 text-pink-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <div>
                          <p className="font-semibold text-slate-800">Sincronizar con Supabase</p>
                          <p className="text-[10px] text-slate-400">Recargar datos en vivo</p>
                        </div>
                      </button>
                    )}

                    {/* Borrar Todo (Vaciar base de datos) */}
                    {onClearAllData && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onClearAllData();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors text-left cursor-pointer font-medium"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="font-semibold text-red-700">Borrar todo (Vaciar BD)</p>
                          <p className="text-[10px] text-red-400">Dejar tablas limpias en cero</p>
                        </div>
                      </button>
                    )}

                    {/* Cargar datos de ejemplo */}
                    {onResetDemoData && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onResetDemoData();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer font-medium"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="font-medium text-slate-700">Cargar datos de ejemplo</p>
                          <p className="text-[10px] text-slate-400">Para probar el sistema</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles
} from 'lucide-react';
import { 
  MONTH_NAMES_ES, 
  formatDateDDMMYYYY, 
  getTodayISO,
  formatDateWithDayName
} from '../utils/time';

export interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (newDate: string) => void;
  variant?: 'light' | 'dark';
  placeholder?: string;
  className?: string;
  onJumpSubmit?: (date: string) => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  variant = 'dark',
  placeholder = 'Elegir en calendario',
  className = '',
  onJumpSubmit,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Popover internal calendar month & year
  const todayStr = getTodayISO();
  const initialDateObj = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialDateObj.getFullYear()) ? new Date().getFullYear() : initialDateObj.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialDateObj.getMonth()) ? new Date().getMonth() : initialDateObj.getMonth()
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal month/year view when value changes
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [value]);

  // Click outside listener to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle month navigation inside popover
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const formattedDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
    if (onJumpSubmit) {
      onJumpSubmit(formattedDate);
    }
  };

  const handlePickToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = getTodayISO();
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(today);
    setIsOpen(false);
    if (onJumpSubmit) {
      onJumpSubmit(today);
    }
  };

  const handlePickTomorrow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    setViewYear(tomorrow.getFullYear());
    setViewMonth(tomorrow.getMonth());
    onChange(tomorrowStr);
    setIsOpen(false);
    if (onJumpSubmit) {
      onJumpSubmit(tomorrowStr);
    }
  };

  // Calendar math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Align starting on Monday: 0 = Mon, ..., 6 = Sun
  const firstDayRaw = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const firstDayOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1; // 0 for Monday

  const isLight = variant === 'light';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Area */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && value) {
              const parts = value.split('-');
              if (parts.length === 3) {
                setViewYear(parseInt(parts[0], 10));
                setViewMonth(parseInt(parts[1], 10) - 1);
              }
            }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shadow-2xs group ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              : 'bg-white/15 hover:bg-white/25 border-white/25 text-white'
          }`}
          title="Abrir calendario para elegir fecha"
        >
          <CalendarIcon className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
            isLight ? 'text-[#2E7D5E]' : 'text-emerald-200'
          }`} />
          <span className="font-bold tracking-tight">
            {value ? formatDateDDMMYYYY(value) : placeholder}
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            title="Limpiar fecha seleccionada"
            className={`p-1 rounded-full transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Responsive Calendar Picker: Centered Modal on Mobile, Dropdown Popover on Desktop */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs sm:hidden flex items-center justify-center p-3 animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-2xl p-4 shadow-2xl border transition-all animate-in zoom-in-95 duration-150 ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 shadow-slate-900/30 ring-1 ring-slate-200'
                  : 'bg-slate-900 border-emerald-500/40 text-white shadow-2xl ring-1 ring-emerald-500/30'
              }`}
            >
              {/* Header: Month & Year Selector + Prev/Next */}
              <div className="flex items-center justify-between gap-1 mb-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Mes anterior"
                  className={`p-2 rounded-xl transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
                    isLight ? 'hover:bg-slate-100 text-slate-700 bg-slate-50 border border-slate-200' : 'hover:bg-white/10 text-slate-200 bg-slate-800'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Quick Month & Year Dropdowns */}
                <div className="flex items-center gap-2">
                  <select
                    value={viewMonth}
                    onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                    className={`text-sm font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    {MONTH_NAMES_ES.map((mName, idx) => (
                      <option key={idx} value={idx}>
                        {mName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                    className={`text-sm font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    {Array.from({ length: 11 }).map((_, idx) => {
                      const y = new Date().getFullYear() - 3 + idx;
                      return (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="Mes siguiente"
                  className={`p-2 rounded-xl transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
                    isLight ? 'hover:bg-slate-100 text-slate-700 bg-slate-50 border border-slate-200' : 'hover:bg-white/10 text-slate-200 bg-slate-800'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Presets Row: Hoy, Mañana */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePickToday}
                    className="px-3 py-1.5 bg-[#2E7D5E] hover:bg-[#24664c] text-white text-xs font-black rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Seleccionar la fecha de hoy"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Ir a Hoy</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePickTomorrow}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    }`}
                  >
                    Mañana
                  </button>
                </div>

                <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {MONTH_NAMES_ES[viewMonth]} {viewYear}
                </span>
              </div>

              {/* Days of Week Header (Lun - Dom) */}
              <div className="grid grid-cols-7 text-center text-xs font-black mb-1.5 opacity-80 py-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                <span>Lu</span>
                <span>Ma</span>
                <span>Mi</span>
                <span>Ju</span>
                <span>Vi</span>
                <span className="text-amber-500">Sá</span>
                <span className="text-amber-500">Do</span>
              </div>

              {/* Days Grid Mobile */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`offset-m-${i}`} className="h-9 w-9" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateIso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isSelected = value === dateIso;
                  const isToday = dateIso === todayStr;

                  return (
                    <button
                      key={`m-${dayNum}`}
                      type="button"
                      onClick={() => handleSelectDay(dayNum)}
                      className={`h-9 w-9 mx-auto rounded-xl text-xs font-bold transition-all flex items-center justify-center relative cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-[#2E7D5E] text-white shadow-md font-black ring-2 ring-[#2E7D5E]/40 scale-105'
                          : isToday
                          ? 'border-2 border-[#2E7D5E] font-black text-[#2E7D5E] dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/60'
                          : isLight
                          ? 'hover:bg-slate-100 text-slate-800 bg-slate-50/60'
                          : 'hover:bg-slate-800 text-slate-200 bg-slate-800/40'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {isToday && !isSelected && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#2E7D5E] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer: Date preview and Close button */}
              <div className="mt-3.5 pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {value ? formatDateWithDayName(value) : 'Ninguna fecha seleccionada'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Popover */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`hidden sm:block absolute top-full mt-2 right-0 z-50 w-72 sm:w-80 rounded-2xl p-3.5 shadow-2xl border transition-all animate-in fade-in zoom-in-95 duration-150 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 shadow-slate-900/20 ring-1 ring-slate-200'
                : 'bg-slate-900 border-emerald-500/40 text-white shadow-2xl ring-1 ring-emerald-500/30'
            }`}
          >
            {/* Header: Month & Year Selector + Prev/Next */}
            <div className="flex items-center justify-between gap-1 mb-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mes anterior"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-slate-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Quick Month & Year Dropdowns */}
              <div className="flex items-center gap-1.5">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                  className={`text-xs font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  {MONTH_NAMES_ES.map((mName, idx) => (
                    <option key={idx} value={idx}>
                      {mName}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                  className={`text-xs font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  {Array.from({ length: 11 }).map((_, idx) => {
                    const y = new Date().getFullYear() - 3 + idx;
                    return (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Mes siguiente"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-slate-200'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets Row: Hoy, Mañana */}
            <div className="flex items-center justify-between gap-1.5 mb-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePickToday}
                  className="px-2.5 py-1 bg-[#2E7D5E] hover:bg-[#24664c] text-white text-[11px] font-black rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Seleccionar la fecha de hoy"
                >
                  <Sparkles className="w-3 h-3 text-emerald-200" />
                  <span>Hoy</span>
                </button>

                <button
                  type="button"
                  onClick={handlePickTomorrow}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                >
                  Mañana
                </button>
              </div>

              <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {viewYear}
              </span>
            </div>

            {/* Days of Week Header (Lun - Dom) */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold mb-1 opacity-70">
              <span>Lu</span>
              <span>Ma</span>
              <span>Mi</span>
              <span>Ju</span>
              <span>Vi</span>
              <span className="text-amber-500">Sá</span>
              <span className="text-amber-500">Do</span>
            </div>

            {/* Days Grid Desktop */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`offset-d-${i}`} className="h-7 w-7" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateIso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = value === dateIso;
                const isToday = dateIso === todayStr;

                return (
                  <button
                    key={`d-${dayNum}`}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-7 w-7 sm:h-8 sm:w-8 mx-auto rounded-lg text-xs font-bold transition-all flex items-center justify-center relative cursor-pointer ${
                      isSelected
                        ? 'bg-[#2E7D5E] text-white shadow-xs font-black ring-2 ring-[#2E7D5E]/40 scale-105'
                        : isToday
                        ? 'border-2 border-[#2E7D5E] font-black text-[#2E7D5E] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                        : isLight
                        ? 'hover:bg-slate-100 text-slate-800'
                        : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isToday && !isSelected && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#2E7D5E] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer: Date preview and Close button */}
            <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {value ? formatDateWithDayName(value) : 'Sin fecha'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

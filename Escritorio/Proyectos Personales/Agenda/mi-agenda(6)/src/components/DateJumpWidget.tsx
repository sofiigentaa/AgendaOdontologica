import React, { useState, useEffect } from 'react';
import { ArrowRight, Edit3, AlertCircle, X, Plus, Sparkles } from 'lucide-react';
import { parseFlexibleDate, formatDateWithDayName, getTodayISO, formatDateDDMMYYYY } from '../utils/time';
import { CustomDatePicker } from './CustomDatePicker';

interface DateJumpWidgetProps {
  onJump: (dateStr: string) => void;
  currentYear?: number;
  currentMonth?: number; // 1-indexed (1..12)
  variant?: 'dark' | 'light';
  onOpenScheduleModal?: (date: string) => void;
  selectedDate?: string;
  onClearSelectedDate?: () => void;
}

export const DateJumpWidget: React.FC<DateJumpWidgetProps> = ({
  onJump,
  currentYear,
  currentMonth,
  variant = 'dark',
  selectedDate,
  onClearSelectedDate,
}) => {
  const [validationNotice, setValidationNotice] = useState<string | null>(null);
  const [textVal, setTextVal] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [internalPickerDate, setInternalPickerDate] = useState('');

  const selectedPickerDate = selectedDate !== undefined ? selectedDate : internalPickerDate;

  // Auto-dismiss validation notice after 4 seconds
  useEffect(() => {
    if (validationNotice) {
      const timer = setTimeout(() => {
        setValidationNotice(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [validationNotice]);

  const handleTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!textVal.trim()) {
      setValidationNotice('Debe ingresar una fecha para ir');
      return;
    }

    const parsed = parseFlexibleDate(textVal, currentYear, currentMonth);
    if (parsed) {
      setValidationNotice(null);
      setIsInvalid(false);
      onJump(parsed);
      setInternalPickerDate(parsed);
      setTextVal('');
    } else {
      setIsInvalid(true);
      setValidationNotice('Formato no reconocido. Ingrese ej: 16 o 16/08');
      setTimeout(() => setIsInvalid(false), 3000);
    }
  };

  const handlePickerChange = (newDateIso: string) => {
    setInternalPickerDate(newDateIso);
    setValidationNotice(null);
    if (newDateIso) {
      onJump(newDateIso);
    } else if (onClearSelectedDate) {
      onClearSelectedDate();
    }
  };

  const handleClearText = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTextVal('');
    setIsInvalid(false);
    setValidationNotice(null);
  };

  const isLight = variant === 'light';

  // Live preview of parsed date if typing
  const liveParsedDate = textVal.trim() ? parseFlexibleDate(textVal, currentYear, currentMonth) : null;

  return (
    <div className="relative flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
      {/* Opción 1: Elegir en Calendario con CustomDatePicker y Selección de Formatos */}
      <div className="flex items-center gap-1 flex-1 sm:flex-initial min-w-0">
        <CustomDatePicker
          value={selectedPickerDate}
          onChange={handlePickerChange}
          variant={variant}
          placeholder="Elegir en calendario"
          className="w-full sm:w-auto"
          onJumpSubmit={(date) => {
            onJump(date);
          }}
        />

        {selectedPickerDate && (
          <button
            type="button"
            onClick={() => onJump(selectedPickerDate)}
            title="Ir a la fecha elegida"
            className={`px-2.5 py-1.5 rounded-lg font-black transition-all text-xs uppercase flex items-center gap-1 cursor-pointer shrink-0 shadow-xs active:scale-95 ${
              isLight
                ? 'bg-[#2E7D5E] hover:bg-[#24664c] text-white shadow-2xs'
                : 'bg-white hover:bg-emerald-50 text-emerald-950 hover:text-emerald-900 shadow-sm ring-1 ring-emerald-800/30'
            }`}
          >
            <span>Ir</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isLight ? 'text-white' : 'text-emerald-800'}`} />
          </button>
        )}
      </div>

      {/* Opción 2: Escribir día o fecha manualmente (ej: 16, 16/08, 16/08/2026) */}
      <form
        onSubmit={handleTextSubmit}
        title="Opción 2: Escribir el día o fecha manualmente (ej: 16, 16/08, 16/08/2026)"
        className={`flex items-center rounded-lg p-1 text-xs transition-all focus-within:ring-2 group shrink-0 shadow-2xs border flex-1 sm:flex-initial min-w-0 ${
          isLight
            ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800 focus-within:ring-[#2E7D5E]/30 focus-within:border-[#2E7D5E]'
            : 'bg-white/15 hover:bg-white/25 border-white/25 text-white focus-within:ring-white/50'
        }`}
      >
        <div className={`pl-1.5 pr-1 flex items-center shrink-0 ${
          isLight ? 'text-[#2E7D5E]' : 'text-emerald-200'
        }`}>
          <Edit3 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        </div>

        <div className="relative flex items-center flex-1 min-w-0">
          <input
            type="text"
            value={textVal}
            onChange={(e) => {
              setTextVal(e.target.value);
              if (isInvalid) setIsInvalid(false);
            }}
            placeholder="Día (ej. 16/08)"
            className={`text-xs font-semibold px-2 py-0.5 w-full sm:w-32 focus:outline-none transition-colors rounded ${
              isLight
                ? 'bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200'
                : 'bg-transparent text-white placeholder-white/70'
            } ${
              isInvalid ? 'bg-rose-500/40 text-rose-900 ring-2 ring-rose-400' : ''
            }`}
          />
          {textVal && (
            <button
              type="button"
              onClick={handleClearText}
              title="Limpiar texto"
              className={`absolute right-1 p-0.5 rounded-full hover:bg-slate-200/80 transition-colors ${
                isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/70 hover:text-white'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Live parsed feedback indicator */}
        {liveParsedDate && (
          <span className={`hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded font-bold mx-1 ${
            isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/80 text-emerald-200'
          }`}>
            {formatDateDDMMYYYY(liveParsedDate)}
          </span>
        )}

        <button
          type="submit"
          title="Ir a la fecha escrita"
          className={`px-2.5 py-1 rounded-md font-black transition-all text-xs uppercase flex items-center gap-1 cursor-pointer shrink-0 ml-1 shadow-xs active:scale-95 ${
            isLight
              ? 'bg-[#2E7D5E] hover:bg-[#24664c] text-white shadow-2xs'
              : 'bg-white hover:bg-emerald-50 text-emerald-950 hover:text-emerald-900 shadow-sm ring-1 ring-emerald-800/30'
          }`}
        >
          <span>Ir</span>
          <ArrowRight className={`w-3.5 h-3.5 ${isLight ? 'text-white' : 'text-emerald-800'}`} />
        </button>
      </form>

      {/* Pop-up Flotante de Validación */}
      {validationNotice && (
        <div 
          id="date-jump-validation-popup"
          className={`absolute top-full mt-2.5 right-0 sm:right-auto sm:left-1/3 z-50 min-w-[260px] max-w-sm rounded-xl p-2.5 shadow-2xl border transition-all animate-in fade-in zoom-in-95 duration-150 ${
            isLight 
              ? 'bg-amber-50 border-amber-300 text-slate-900 shadow-amber-900/10' 
              : 'bg-slate-900 border-amber-400/70 text-white shadow-2xl ring-1 ring-amber-400/40'
          }`}
        >
          <div className={`absolute -top-1.5 left-10 w-3 h-3 rotate-45 border-t border-l ${
            isLight ? 'bg-amber-50 border-amber-300' : 'bg-slate-900 border-amber-400/70'
          }`} />

          <div className="flex items-center justify-between gap-2.5 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-amber-500/20 text-amber-600 rounded-lg shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <p className={`text-xs font-bold leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {validationNotice}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setValidationNotice(null)}
              className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                isLight ? 'hover:bg-amber-200/70 text-slate-500 hover:text-slate-800' : 'hover:bg-white/10 text-slate-300'
              }`}
              title="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

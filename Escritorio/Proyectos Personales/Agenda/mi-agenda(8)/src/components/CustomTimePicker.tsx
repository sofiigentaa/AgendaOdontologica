import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';

interface CustomTimePickerProps {
  value: string; // "HH:MM" in 24h format e.g. "14:00"
  onChange: (newTime: string) => void;
  className?: string;
}

// Generate slots from 07:00 to 21:30 every 15 minutes
const GENERATED_TIME_SLOTS: string[] = [];
for (let h = 7; h <= 21; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    GENERATED_TIME_SLOTS.push(`${hh}:${mm}`);
  }
}
GENERATED_TIME_SLOTS.push('22:00');

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Parse current hour and minute
  const [hour, minute] = (value || '09:00').split(':');
  const currentHour = parseInt(hour || '9', 10);
  const currentMinute = parseInt(minute || '0', 10);

  // Close on outside click
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

  // Scroll active item into view when opening
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [isOpen]);

  const handleSelectTime = (slot: string) => {
    onChange(slot);
    setIsOpen(false);
  };

  const handleHourChange = (newH: number) => {
    const hh = String(Math.max(0, Math.min(23, newH))).padStart(2, '0');
    const mm = String(currentMinute || 0).padStart(2, '0');
    onChange(`${hh}:${mm}`);
  };

  const handleMinuteChange = (newM: number) => {
    const hh = String(currentHour || 0).padStart(2, '0');
    const mm = String(Math.max(0, Math.min(59, newM))).padStart(2, '0');
    onChange(`${hh}:${mm}`);
  };

  const displayTime = value ? `${value} hs` : 'Seleccionar horario';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button - Always strictly 24-hour format */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:ring-2 focus:ring-[#2E7D5E] focus:bg-white focus:outline-none transition-all shadow-2xs flex items-center justify-between gap-2 cursor-pointer font-mono"
        title="Seleccionar horario en formato 24 horas (ej. 14:00 hs)"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#2E7D5E] shrink-0" />
          <span className="text-slate-900 font-bold text-sm tracking-wide font-mono">
            {displayTime}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#2E7D5E]' : ''}`} />
      </button>

      {/* 24-Hour Selector Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2E7D5E]" />
              Formato 24 Horas
            </span>
            <span className="text-xs font-mono font-bold text-[#2E7D5E] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {value} hs
            </span>
          </div>

          {/* Quick Hours & Minutes Selectors */}
          <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Hora (00 - 23)
              </label>
              <select
                value={currentHour}
                onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#2E7D5E]"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00 hs ({i < 12 ? `${i || 12} AM` : `${i === 12 ? 12 : i - 12} PM`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Minutos
              </label>
              <select
                value={currentMinute}
                onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#2E7D5E]"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>
                    :{String(m).padStart(2, '0')} min
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable list of standard 15-minute consultation slots */}
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5 px-0.5 flex items-center justify-between">
            <span>Horarios habituales:</span>
            <span className="text-[10px] text-slate-400">Cada 15 min</span>
          </div>

          <div
            ref={listRef}
            className="max-h-44 overflow-y-auto grid grid-cols-3 gap-1.5 p-1 bg-slate-50/70 rounded-xl border border-slate-200"
          >
            {GENERATED_TIME_SLOTS.map((slot) => {
              const isSelected = value === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => handleSelectTime(slot)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-[#2E7D5E] text-white shadow-xs font-black ring-1 ring-[#2E7D5E]'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#2E7D5E] border border-slate-200'
                  }`}
                >
                  <span>{slot}</span>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>

          {/* Close button */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

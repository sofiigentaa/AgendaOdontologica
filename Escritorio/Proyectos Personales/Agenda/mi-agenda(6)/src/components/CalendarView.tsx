import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  Shield, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  ListFilter,
  Check,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
  Mail,
  Send,
  FileText
} from 'lucide-react';
import { Appointment, Contact } from '../types';
import { OBRAS_SOCIALES_LIST } from '../constants/insurances';
import { getAppointmentTimeRange, formatDuration, formatDateDDMMYYYY, formatDateWithDayName } from '../utils/time';
import { exportNextDayAppointmentsPlainFile } from '../utils/exportHelpers';
import { PatientSearchSelect } from './PatientSearchSelect';
import { DateJumpWidget } from './DateJumpWidget';

interface CalendarViewProps {
  appointments: Appointment[];
  contacts: Contact[];
  onOpenScheduleModal: (initialDate?: string, editingAppt?: Appointment | null, initialTime?: string) => void;
  onToggleAppointmentComplete: (appointmentId: string) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onSelectContact: (contact: Contact) => void;
  onOpenAddContactModal: () => void;
  targetDate?: string | null;
  onClearTargetDate?: () => void;
  googleUser?: { email?: string | null; displayName?: string | null } | null;
  onPromptGoogleAction?: (actionType: 'sync_calendar' | 'send_email', apptData: any, patient: Contact) => void;
  onConnectGoogle?: () => void;
  onUpdateAppointmentStatus?: (appointmentId: string, status: 'pending' | 'confirmed' | 'cancelled') => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  contacts,
  onOpenScheduleModal,
  onToggleAppointmentComplete,
  onDeleteAppointment,
  onSelectContact,
  onOpenAddContactModal,
  targetDate,
  onClearTargetDate,
  googleUser,
  onPromptGoogleAction,
  onConnectGoogle,
  onUpdateAppointmentStatus,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [highlightedDay, setHighlightedDay] = useState<string | null>(null);
  const [calendarSubMode, setCalendarSubMode] = useState<'month' | 'list'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInsuranceFilter, setSelectedInsuranceFilter] = useState('all');
  const [selectedDentistFilter, setSelectedDentistFilter] = useState<'all' | 'Yani' | 'Marie' | 'Ambas'>('all');
  const [selectedMotiveFilter, setSelectedMotiveFilter] = useState<string>('all');
  const [selectedApptDetail, setSelectedApptDetail] = useState<Appointment | null>(null);
  const [selectedDayModalDate, setSelectedDayModalDate] = useState<string | null>(null);
  const [pickedJumpDate, setPickedJumpDate] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  });

  // WhatsApp reminder feedback state inside appointment detail modal
  const [botSendFeedback, setBotSendFeedback] = useState<{ id: string; success: boolean; text: string } | null>(null);

  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('calendar_filters_collapsed');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.innerWidth < 640;
    } catch {
      return false;
    }
  });

  const toggleFiltersCollapsed = () => {
    setIsFiltersCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('calendar_filters_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Dynamic measurement of sticky filters bar height for seamless stacking
  const filtersRef = useRef<HTMLDivElement>(null);
  const [filtersHeight, setFiltersHeight] = useState(135);

  useEffect(() => {
    const updateDimensions = () => {
      setIsMobile(window.innerWidth < 640);
      if (filtersRef.current) {
        setFiltersHeight(filtersRef.current.offsetHeight);
      }
    };
    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    if (filtersRef.current) {
      ro.observe(filtersRef.current);
    }
    window.addEventListener('resize', updateDimensions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setHighlightedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setHighlightedDay(null);
  };

  const scrollToDayHeader = (dateVal: string) => {
    const performScroll = () => {
      if (calendarSubMode === 'list') {
        // In list view: find target date's appointment card and center it perfectly in the viewport
        let listDayEl = document.getElementById(`appt-card-day-${dateVal}`);
        
        // If exact date not found in list, find the first upcoming appointment >= dateVal
        if (!listDayEl) {
          const sorted = appointments
            .filter((a) => a.date >= dateVal)
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
          if (sorted.length > 0) {
            listDayEl = document.getElementById(`appt-card-day-${sorted[0].date}`);
          }
        }

        if (listDayEl) {
          listDayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        const listContainer = document.getElementById('sticky-list-header-bar') || document.getElementById('sticky-calendar-filters');
        if (listContainer) {
          listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      // In month view: scroll with header offset so day header is 100% visible right under sticky navbar
      const monthDayEl = document.getElementById(`calendar-day-${dateVal}`);
      if (monthDayEl) {
        const stickyHeader = document.getElementById('sticky-calendar-header-bar');
        const stickyFilters = document.getElementById('sticky-calendar-filters');
        const appHeaderHeight = 53; // Fixed main navbar
        const filtersH = stickyFilters ? stickyFilters.offsetHeight : filtersHeight || 80;
        const headerBarH = stickyHeader ? stickyHeader.offsetHeight : 0;
        
        const totalStickyOffset = appHeaderHeight + filtersH + headerBarH + 14;

        const rect = monthDayEl.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetScrollY = rect.top + scrollTop - totalStickyOffset;

        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: 'smooth',
        });
      } else {
        const topEl = document.getElementById('calendar-month-container') || document.getElementById('sticky-calendar-filters');
        if (topEl) {
          topEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    setTimeout(performScroll, 60);
    setTimeout(performScroll, 200);
  };

  const scrollToDayElement = (dayFormatted: string) => {
    setHighlightedDay(dayFormatted);
    setTimeout(() => setHighlightedDay(null), 4000);
    scrollToDayHeader(dayFormatted);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Set highlighted day with distinct visibility
    setHighlightedDay(todayFormatted);
    setTimeout(() => setHighlightedDay(null), 4500);

    // Scroll smoothly to today's top header
    scrollToDayHeader(todayFormatted);
  };

  const handleJumpToSpecificDate = (dateVal: string) => {
    if (!dateVal) return;
    const [yStr, mStr, dStr] = dateVal.split('-');
    const targetY = parseInt(yStr, 10);
    const targetM = parseInt(mStr, 10) - 1;
    const targetD = parseInt(dStr, 10);

    if (!isNaN(targetY) && !isNaN(targetM) && !isNaN(targetD)) {
      setCurrentDate(new Date(targetY, targetM, targetD));
      setHighlightedDay(dateVal);
      setSelectedDayModalDate(dateVal);
      setPickedJumpDate(dateVal);
      setTimeout(() => setHighlightedDay(null), 4500);

      // Scroll smoothly to target day header in month grid or list view
      scrollToDayHeader(dateVal);
    }
  };

  const handleCloseDayModal = () => {
    setSelectedDayModalDate(null);
    setPickedJumpDate('');
  };

  // Sync external targetDate prop if provided
  React.useEffect(() => {
    if (targetDate) {
      handleJumpToSpecificDate(targetDate);
      if (onClearTargetDate) {
        onClearTargetDate();
      }
    }
  }, [targetDate]);

  // Build grid days for the month
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Local date helper to avoid UTC timezone offset shifting today's date
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isCurrentMonthViewed = year === now.getFullYear() && month === now.getMonth();

  const getContact = (contactId: string) => {
    return contacts.find((c) => c.id === contactId);
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const contact = getContact(appt.contactId);
      const nameMatch = contact ? contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const motiveMatch = appt.motive ? appt.motive.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const matchesSearch = nameMatch || motiveMatch;

      if (!matchesSearch) return false;

      if (selectedInsuranceFilter === 'particular') {
        if (contact && !contact.isParticular) return false;
      } else if (selectedInsuranceFilter === 'obra_social') {
        if (contact && contact.isParticular) return false;
      } else if (selectedInsuranceFilter !== 'all') {
        if (!contact) return false;
        if (contact.isParticular) return false;
        if (!contact.insuranceName || contact.insuranceName.toLowerCase() !== selectedInsuranceFilter.toLowerCase()) {
          return false;
        }
      }

      if (selectedDentistFilter !== 'all') {
        const d = (appt.dentist || 'Yani').trim().toLowerCase();
        const f = selectedDentistFilter.trim().toLowerCase();
        if (f === 'ambas') {
          if (d !== 'ambas') return false;
        } else if (f === 'marie') {
          if (d !== 'marie' && d !== 'ambas') return false;
        } else if (f === 'yani') {
          if (d !== 'yani' && d !== 'ambas') return false;
        }
      }

      if (selectedMotiveFilter !== 'all') {
        const m = (appt.motive || '').toLowerCase();
        if (selectedMotiveFilter === 'consulta') {
          if (!m.includes('consulta')) return false;
        } else if (selectedMotiveFilter === 'limpieza') {
          if (!m.includes('limpieza') && !m.includes('profilaxis') && !m.includes('tartrectomia') && !m.includes('destartraje')) return false;
        } else if (selectedMotiveFilter === 'caries') {
          if (!m.includes('caries') && !m.includes('arreglo')) return false;
        } else if (selectedMotiveFilter === 'tc_uni') {
          if (!m.includes('tc uni') && !m.includes('unirradicular')) return false;
        } else if (selectedMotiveFilter === 'tc_bi') {
          if (!m.includes('tc bi') && !m.includes('birradicular')) return false;
        } else if (selectedMotiveFilter === 'tc_multi') {
          if (!m.includes('tc multi') && !m.includes('multirradicular')) return false;
        } else if (selectedMotiveFilter === 'especiales') {
          if (!m.includes('especial') && !m.includes('perno')) return false;
        } else if (selectedMotiveFilter === 'otro') {
          if (
            m.includes('consulta') ||
            m.includes('limpieza') ||
            m.includes('profilaxis') ||
            m.includes('caries') ||
            m.includes('arreglo') ||
            m.includes('tc uni') ||
            m.includes('tc bi') ||
            m.includes('tc multi') ||
            m.includes('especial') ||
            m.includes('perno')
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [appointments, contacts, searchTerm, selectedInsuranceFilter, selectedDentistFilter, selectedMotiveFilter]);

  // Appointments grouped by date YYYY-MM-DD
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    filteredAppointments.forEach((appt) => {
      if (!map[appt.date]) {
        map[appt.date] = [];
      }
      map[appt.date].push(appt);
    });

    // Sort time inside each day
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => a.time.localeCompare(b.time));
    });

    return map;
  }, [filteredAppointments]);

  // Sorted contacts for patient dropdown
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' }));
  }, [contacts]);

  // Escape key listener for detail popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedApptDetail) {
        setSelectedApptDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedApptDetail]);

  // Today's appointments count
  const todayApptsCount = useMemo(() => {
    return filteredAppointments.filter((a) => a.date === todayStr).length;
  }, [filteredAppointments, todayStr]);

  // Active filters calculation
  const activeFilters = useMemo(() => {
    const list: { label: string; clear: () => void; color: string }[] = [];
    if (selectedInsuranceFilter !== 'all') {
      const name = selectedInsuranceFilter === 'particular' 
        ? 'Particular' 
        : selectedInsuranceFilter === 'obra_social' 
          ? 'Obras Sociales' 
          : selectedInsuranceFilter;
      list.push({
        label: `Cobertura: ${name}`,
        clear: () => setSelectedInsuranceFilter('all'),
        color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      });
    }
    if (selectedMotiveFilter !== 'all') {
      const map: Record<string, string> = {
        consulta: 'Consulta',
        limpieza: 'Limpieza',
        caries: 'Caries',
        tc_uni: 'TC uni',
        tc_bi: 'TC bi',
        tc_multi: 'TC multi',
        especiales: 'Especiales',
        otro: 'Otro',
      };
      list.push({
        label: `Motivo: ${map[selectedMotiveFilter] || selectedMotiveFilter}`,
        clear: () => setSelectedMotiveFilter('all'),
        color: 'bg-blue-50 text-blue-800 border-blue-300',
      });
    }
    if (selectedDentistFilter !== 'all') {
      const dLabel = selectedDentistFilter === 'Marie' ? 'Dra. Marie' : selectedDentistFilter === 'Yani' ? 'Dra. Yani' : 'Las dos juntas';
      const dColor = selectedDentistFilter === 'Marie' 
        ? 'bg-blue-600 text-white border-blue-700' 
        : selectedDentistFilter === 'Yani' 
          ? 'bg-emerald-600 text-white border-emerald-700' 
          : 'bg-purple-600 text-white border-purple-700';
      list.push({
        label: dLabel,
        clear: () => setSelectedDentistFilter('all'),
        color: dColor,
      });
    }
    return list;
  }, [selectedInsuranceFilter, selectedMotiveFilter, selectedDentistFilter]);

  const clearAllFilters = () => {
    setSelectedInsuranceFilter('all');
    setSelectedMotiveFilter('all');
    setSelectedDentistFilter('all');
  };

  return (
    <div className="space-y-3">
      
      {/* Sticky Top Control Section (Search, View Mode & Filters) */}
      <div 
        id="sticky-calendar-filters"
        ref={filtersRef}
        style={!isMobile ? { top: 'var(--app-header-height, 53px)' } : undefined}
        className="relative sm:sticky z-30 bg-[#F5F5F5] pt-0.5 pb-2 space-y-2 transition-all shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]"
      >
        {/* Top Toolbar: Patient Selector, View Mode Switcher & Filter Collapse Toggle */}
        <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-2.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <PatientSearchSelect
              id="select-patient-medical-file"
              contacts={contacts}
              onSelectContact={onSelectContact}
              placeholder="Escribir o seleccionar nombre de paciente para abrir su ficha médica..."
              clearOnSelect={true}
              onOpenAddContactModal={onOpenAddContactModal}
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
            {/* Quick 'Hoy' shortcut button */}
            <button
              type="button"
              onClick={handleToday}
              title="Ir al día de hoy"
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-[#2E7D5E] border border-emerald-300 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs active:scale-95 transition-all"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#2E7D5E]" />
              <span>Hoy</span>
            </button>

            {/* View Mode Toggle (Vista Mes / Lista de Turnos) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setCalendarSubMode('month')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  calendarSubMode === 'month'
                    ? 'bg-white text-[#2E7D5E] shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vista Mes
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarSubMode('list');
                  setHighlightedDay(todayStr);
                  setTimeout(() => {
                    let listDayEl = document.getElementById(`appt-card-day-${todayStr}`);
                    if (!listDayEl) {
                      const sorted = appointments
                        .filter((a) => a.date >= todayStr)
                        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
                      if (sorted.length > 0) {
                        listDayEl = document.getElementById(`appt-card-day-${sorted[0].date}`);
                      }
                    }
                    if (listDayEl) {
                      listDayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 120);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  calendarSubMode === 'list'
                    ? 'bg-white text-[#2E7D5E] shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lista de Turnos
              </button>
            </div>

            {/* Toggle Achicar / Expandir Filtros */}
            <button
              type="button"
              id="btn-toggle-collapse-filters"
              onClick={toggleFiltersCollapsed}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                isFiltersCollapsed
                  ? 'bg-emerald-50 text-[#2E7D5E] border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={isFiltersCollapsed ? 'Expandir opciones de filtros' : 'Achicar barra para darle el máximo espacio libre al calendario'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isFiltersCollapsed ? 'Filtros' : 'Achicar'}</span>
              {activeFilters.length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-700 text-white text-[10px] font-extrabold rounded-full">
                  {activeFilters.length}
                </span>
              )}
              {isFiltersCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsed Mode with Active Filter Tags (Seamless strip) */}
        {isFiltersCollapsed && activeFilters.length > 0 && (
          <div className="px-1 py-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                Filtros activos:
              </span>
              {activeFilters.map((af, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border shadow-2xs ${af.color}`}
                >
                  <span>{af.label}</span>
                  <button
                    type="button"
                    onClick={af.clear}
                    className="hover:opacity-75 cursor-pointer ml-0.5"
                    title="Quitar este filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Limpiar todo
              </button>
              <button
                type="button"
                onClick={toggleFiltersCollapsed}
                className="text-[11px] font-bold text-[#2E7D5E] hover:underline cursor-pointer"
              >
                Modificar ▾
              </button>
            </div>
          </div>
        )}

        {/* Expanded Filter Toolbar (Cobertura, Motivo, and Odontóloga buttons - Seamless & Borderless) */}
        {!isFiltersCollapsed && (
          <div className="px-0 py-1 space-y-2">
            {/* Top Filter Row: Cobertura & Motivo & Quick Clear */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Cobertura Filter */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-slate-600 font-bold shrink-0">
                    Cobertura:
                  </span>
                  <select
                    value={selectedInsuranceFilter}
                    onChange={(e) => setSelectedInsuranceFilter(e.target.value)}
                    className="bg-white text-[#2E7D5E] border border-slate-200 hover:border-emerald-400 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#2E7D5E]/30 transition-colors cursor-pointer shadow-2xs"
                  >
                    <option value="all">Todas las coberturas</option>
                    <option value="particular">Particular</option>
                    <option value="obra_social">Obras Sociales</option>
                    <optgroup label="Obra Social específica">
                      {OBRAS_SOCIALES_LIST.map((ins) => (
                        <option key={ins} value={ins}>
                          {ins}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <span className="text-slate-300 hidden sm:inline">|</span>

                {/* Motive / Treatment Filter */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-slate-600 font-bold shrink-0">
                    Motivo:
                  </span>
                  <select
                    value={selectedMotiveFilter}
                    onChange={(e) => setSelectedMotiveFilter(e.target.value)}
                    className="bg-white text-blue-900 border border-slate-200 hover:border-blue-400 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors cursor-pointer shadow-2xs"
                  >
                    <option value="all">Todos los motivos</option>
                    <option value="consulta">Consulta (20 min)</option>
                    <option value="limpieza">Limpieza (40 min)</option>
                    <option value="caries">Restauración de caries (45 min)</option>
                    <option value="tc_uni">TC uni (1 h)</option>
                    <option value="tc_bi">TC bi (1 h 15 min)</option>
                    <option value="tc_multi">TC multi (1 h 40 min)</option>
                    <option value="especiales">Especiales (2 h)</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Limpiar filtros ({activeFilters.length})
                </button>
              )}
            </div>

            {/* Bottom Filter Row: Dedicated Odontóloga Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-700 font-bold shrink-0 mr-0.5">
                Odontóloga:
              </span>

              <button
                type="button"
                onClick={() => setSelectedDentistFilter(selectedDentistFilter === 'Marie' ? 'all' : 'Marie')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border whitespace-nowrap cursor-pointer ${
                  selectedDentistFilter === 'Marie'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-400/40'
                    : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                }`}
                title={selectedDentistFilter === 'Marie' ? 'Click para desmarcar' : 'Filtrar turnos de Dra. Marie'}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${selectedDentistFilter === 'Marie' ? 'bg-white' : 'bg-blue-500'}`} />
                <span>Dra. Marie</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDentistFilter(selectedDentistFilter === 'Yani' ? 'all' : 'Yani')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border whitespace-nowrap cursor-pointer ${
                  selectedDentistFilter === 'Yani'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/40'
                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                }`}
                title={selectedDentistFilter === 'Yani' ? 'Click para desmarcar' : 'Filtrar turnos de Dra. Yani'}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${selectedDentistFilter === 'Yani' ? 'bg-white' : 'bg-emerald-500'}`} />
                <span>Dra. Yani</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDentistFilter(selectedDentistFilter === 'Ambas' ? 'all' : 'Ambas')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border whitespace-nowrap cursor-pointer ${
                  selectedDentistFilter === 'Ambas'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs ring-2 ring-purple-400/40'
                    : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'
                }`}
                title={selectedDentistFilter === 'Ambas' ? 'Click para desmarcar' : 'Mostrar únicamente turnos atendidos por ambas en conjunto'}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${selectedDentistFilter === 'Ambas' ? 'bg-white' : 'bg-purple-500'}`} />
                <span>Las dos juntas (Marie y Yani)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Calendar Month Grid View Content (Unified Single Card) */}
      {calendarSubMode === 'month' && (
        <div id="calendar-month-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          {/* Calendar Controls Bar + Days of Week Header */}
          <div 
            id="sticky-calendar-header-bar"
            style={!isMobile ? { top: `calc(var(--app-header-height, 53px) + ${filtersHeight}px)` } : undefined}
            className="relative sm:sticky z-20 rounded-t-2xl shadow-xs bg-white"
          >
            {/* Calendar Controls Bar */}
            <div className="bg-[#2E7D5E] text-white p-2.5 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#24664c] gap-2 rounded-t-2xl">
              {/* Left / Top on mobile: Month Navigator + Prominent 'Ir a Hoy' Button */}
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/20 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      title="Mes anterior"
                      className="p-1.5 text-white hover:bg-white/25 active:scale-95 rounded-md transition-all cursor-pointer flex items-center justify-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      title="Mes siguiente"
                      className="p-1.5 text-white hover:bg-white/25 active:scale-95 rounded-md transition-all cursor-pointer flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1 whitespace-nowrap pl-1">
                    <span>{monthNames[month]} {year}</span>
                  </h3>
                </div>

                {/* Prominent, high-contrast 'Ir a Hoy' button always visible on mobile & desktop */}
                <button
                  type="button"
                  onClick={handleToday}
                  title="Ir al día de hoy"
                  className="px-3 py-1.5 bg-white text-[#2E7D5E] hover:bg-emerald-50 active:bg-emerald-100 font-black text-xs rounded-lg border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0 active:scale-95"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-[#2E7D5E]" />
                  <span>Ir a Hoy</span>
                </button>
              </div>

              {/* Right / Bottom on mobile: Date Search / Jump */}
              <div className="w-full sm:w-auto flex items-center justify-end gap-1.5 overflow-visible">
                <DateJumpWidget
                  onJump={handleJumpToSpecificDate}
                  currentYear={year}
                  currentMonth={month + 1}
                  selectedDate={pickedJumpDate}
                  onClearSelectedDate={() => setPickedJumpDate('')}
                  onOpenScheduleModal={onOpenScheduleModal}
                />
              </div>
            </div>

            {/* Mobile Helpful Hint Banner */}
            <div className="sm:hidden px-3 py-1.5 bg-emerald-50 text-[11px] font-bold text-[#2E7D5E] border-b border-emerald-100 flex items-center justify-between">
              <span>💡 Toca cualquier día para abrir y ver sus turnos</span>
              <button 
                type="button" 
                onClick={() => setCalendarSubMode('list')} 
                className="text-[#2E7D5E] underline font-extrabold cursor-pointer"
              >
                Ver Lista
              </button>
            </div>
          </div>

          {/* Responsive Calendar Container */}
          <div className="w-full overflow-hidden">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center py-1.5 sm:py-2 text-[11px] sm:text-sm font-black text-slate-700 select-none">
              <span className="text-slate-500">Dom</span>
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span className="text-slate-500">Sáb</span>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-100/50 rounded-b-2xl overflow-hidden">
              
              {/* Blank cells for previous month padding */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[52px] sm:min-h-[85px] lg:min-h-[96px] bg-slate-50/40 p-1 sm:p-2 opacity-30" />
              ))}

              {/* Days of current month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isToday = dayStr === todayStr;
                const dayAppts = appointmentsByDate[dayStr] || [];
                const dayDate = new Date(year, month, dayNum);
                const dayOfWeekShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dayDate.getDay()];
                const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

                const isHighlighted = highlightedDay === dayStr;

                return (
                  <div
                    id={`calendar-day-${dayStr}`}
                    key={dayStr}
                    onClick={() => {
                      setHighlightedDay(dayStr);
                      setSelectedDayModalDate(dayStr);
                    }}
                    className={`scroll-mt-36 sm:scroll-mt-44 min-h-[52px] sm:min-h-[85px] lg:min-h-[96px] p-1 sm:p-1.5 bg-white hover:bg-emerald-50/30 transition-all relative flex flex-col group cursor-pointer ${
                      isHighlighted
                        ? 'ring-3 ring-amber-400 bg-amber-50/70 z-10 shadow-md'
                        : isToday
                        ? 'bg-emerald-50/50 ring-2 ring-inset ring-[#2E7D5E]'
                        : isWeekend
                        ? 'bg-slate-50/30'
                        : ''
                    }`}
                  >
                    {/* Day number header with clean badge and spacing */}
                    <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-1 pb-0.5 border-b border-slate-100 min-w-0">
                      <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 flex-nowrap overflow-hidden">
                        {isToday ? (
                          <span className="px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded bg-[#2E7D5E] text-white text-[7.5px] sm:text-[9.5px] font-black uppercase tracking-wide shadow-2xs shrink-0">
                            HOY
                          </span>
                        ) : (
                          <span className={`text-[8.5px] sm:text-[10.5px] font-extrabold uppercase tracking-tight shrink-0 hidden sm:inline ${
                            isWeekend ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {dayOfWeekShort}
                          </span>
                        )}
                        <span className={`text-xs sm:text-sm font-black shrink-0 ${
                          isToday ? 'text-[#2E7D5E]' : 'text-slate-900 group-hover:text-[#2E7D5E]'
                        }`}>
                          {dayNum}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenScheduleModal(dayStr);
                        }}
                        title={`Agendar turno para ${dayOfWeekShort} ${dayNum}`}
                        className="opacity-0 group-hover:opacity-100 hidden sm:inline-block px-1.5 py-0.5 text-[#2E7D5E] bg-emerald-50 hover:bg-emerald-100 rounded text-[9.5px] font-bold border border-emerald-200 shrink-0 whitespace-nowrap transition-all"
                      >
                        + Turno
                      </button>
                    </div>

                    {/* Mobile: Compact Appointment Dots & Count */}
                    <div className="sm:hidden flex flex-col items-center justify-center flex-1 py-0.5">
                      {dayAppts.length > 0 && (
                        <div className="flex items-center gap-0.5 flex-wrap justify-center">
                          {dayAppts.slice(0, 3).map((a) => (
                            <span
                              key={a.id}
                              className={`w-1.5 h-1.5 rounded-full ${
                                a.dentist === 'Ambas'
                                  ? 'bg-purple-600'
                                  : a.dentist === 'Marie'
                                  ? 'bg-blue-600'
                                  : 'bg-emerald-600'
                              }`}
                            />
                          ))}
                          {dayAppts.length > 3 && (
                            <span className="text-[8px] font-black text-slate-600">+{dayAppts.length - 3}</span>
                          )}
                        </div>
                      )}
                      {dayAppts.length > 0 && (
                        <span className="text-[9px] font-bold text-slate-600 mt-0.5">
                          {dayAppts.length} {dayAppts.length === 1 ? 'turno' : 'turnos'}
                        </span>
                      )}
                    </div>

                    {/* Desktop: Full Appointment badges */}
                    <div className="hidden sm:block space-y-1 flex-1 overflow-hidden">
                      {dayAppts.map((appt) => {
                        const contact = getContact(appt.contactId);
                        const dentistName = appt.dentist || 'Yani';
                        const isAmbas = dentistName === 'Ambas';
                        const isYani = dentistName === 'Yani';
                        const isCancelled = appt.whatsappStatus === 'cancelled';
                        const isConfirmed = appt.whatsappStatus === 'confirmed';
                        const timeRange = getAppointmentTimeRange(appt.time, appt.durationMinutes);

                        if (isCancelled) {
                          return (
                            <div
                              key={appt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApptDetail(appt);
                              }}
                              title={`❌ Turno cancelado • ${contact?.fullName || 'Paciente'} (${appt.time} hs)`}
                              className="px-1.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg border border-rose-200 bg-rose-50/90 text-rose-800 text-[10px] sm:text-[11px] leading-tight flex items-center justify-between gap-1 cursor-pointer transition-all hover:bg-rose-100 shadow-2xs"
                            >
                              <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                                <span className="font-mono font-extrabold text-[9.5px] sm:text-[10px] shrink-0 text-rose-600">
                                  {appt.time}
                                </span>
                                <span className="truncate font-bold text-[10px] sm:text-[11px] text-rose-800 notranslate" translate="no">
                                  {contact?.fullName || 'Paciente'}
                                </span>
                              </div>
                              <span className="text-[8.5px] sm:text-[9.5px] font-extrabold shrink-0 px-1.5 py-0.2 rounded bg-rose-200 text-rose-900 shadow-2xs" translate="no">
                                Cancelado
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={appt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApptDetail(appt);
                            }}
                            title={`${timeRange.rangeShort} • ${contact?.fullName || 'Paciente'}${appt.motive ? ` (${appt.motive})` : ''} • Dra. ${dentistName}`}
                            className={`px-1.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg border text-[10px] sm:text-[11px] leading-tight flex items-center justify-between gap-1 cursor-pointer transition-all hover:scale-[1.01] shadow-2xs ${
                              appt.completed
                                ? 'bg-slate-100 border-slate-300 text-slate-500 opacity-75'
                                : isAmbas
                                ? 'bg-purple-50 border-purple-300 text-purple-950 hover:bg-purple-100'
                                : isYani
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                                : 'bg-blue-50 border-blue-300 text-blue-950 hover:bg-blue-100'
                            }`}
                          >
                            <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                              <span className="font-mono font-extrabold text-[9.5px] sm:text-[10px] shrink-0 opacity-90">
                                {appt.time}
                              </span>
                              <span className={`truncate font-bold text-[10px] sm:text-[11px] notranslate ${appt.completed ? 'line-through text-slate-500' : ''}`} translate="no">
                                {isConfirmed ? `✔ ${contact?.fullName || 'Paciente'}` : (contact?.fullName || 'Paciente')}
                              </span>
                            </div>
                            
                            <span className={`text-[8.5px] sm:text-[9.5px] font-black shrink-0 px-1 py-0.2 rounded notranslate no-underline ${
                              isAmbas ? 'bg-purple-200/80 text-purple-900' : isYani ? 'bg-emerald-200/80 text-emerald-900' : 'bg-blue-200/80 text-blue-900'
                            }`} translate="no">
                              {isAmbas ? 'Ambas' : isYani ? 'Yani' : 'Marie'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}

            </div>
          </div>

        </div>
      )}

      {/* Chronological Agenda / List Mode */}
      {calendarSubMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-6 space-y-4 sm:space-y-6">
          <div 
            id="sticky-list-header-bar"
            style={{ top: `calc(var(--app-header-height, 53px) + ${filtersHeight}px)` }}
            className="relative sm:sticky z-20 bg-white/95 backdrop-blur-xs py-3 border-b border-slate-200 -mx-3 px-3 -mt-3 sm:-mx-6 sm:px-6 sm:-mt-6 rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#2E7D5E]" />
                <span>Lista Cronológica de Turnos</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Ordenados por fecha y horario
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <DateJumpWidget
                onJump={handleJumpToSpecificDate}
                currentYear={year}
                currentMonth={month + 1}
                variant="light"
                selectedDate={pickedJumpDate}
                onClearSelectedDate={() => setPickedJumpDate('')}
                onOpenScheduleModal={onOpenScheduleModal}
              />
              <button
                type="button"
                onClick={handleToday}
                title="Ir al día de hoy"
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-[#2E7D5E]" />
                <span>Hoy</span>
              </button>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron turnos agendados.</p>
              <button
                type="button"
                onClick={() => onOpenScheduleModal()}
                className="px-4 py-2 bg-[#2E7D5E] hover:bg-[#24664c] active:bg-[#1e543e] text-white font-black text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Agendar Primer Turno</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments
                .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                .map((appt) => {
                  const contact = getContact(appt.contactId);
                  const isToday = appt.date === todayStr;

                  const isHighlighted = highlightedDay === appt.date;

                  return (
                    <div
                      id={`appt-card-day-${appt.date}`}
                      key={appt.id}
                      className={`scroll-mt-36 sm:scroll-mt-44 p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
                        isHighlighted
                          ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400 shadow-md scale-[1.01]'
                          : appt.completed
                          ? 'bg-slate-50 border-slate-200 opacity-75'
                          : isToday
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => onToggleAppointmentComplete(appt.id)}
                          className={`mt-0.5 sm:mt-1 transition-colors shrink-0 cursor-pointer ${
                            appt.completed ? 'text-[#2E7D5E]' : 'text-slate-300 hover:text-[#2E7D5E]'
                          }`}
                          title={appt.completed ? 'Marcar como no completado' : 'Marcar como atendido'}
                        >
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 notranslate break-words" translate="no">
                              {contact?.fullName || 'Paciente sin nombre'}
                            </span>

                            {/* Dentist Badge */}
                            {(appt.dentist || 'Yani') === 'Ambas' ? (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-[10px] sm:text-[11px] font-bold notranslate whitespace-nowrap" translate="no">
                                Marie y Yani
                              </span>
                            ) : (appt.dentist || 'Yani') === 'Yani' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] sm:text-[11px] font-bold notranslate whitespace-nowrap" translate="no">
                                Dra. Yani
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[10px] sm:text-[11px] font-bold notranslate whitespace-nowrap" translate="no">
                                Dra. Marie
                              </span>
                            )}

                            {contact?.isParticular ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#2E7D5E] text-[10px] sm:text-[11px] font-bold border border-emerald-200 whitespace-nowrap">
                                Particular
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#2E7D5E] text-[10px] sm:text-[11px] font-bold border border-emerald-200 whitespace-nowrap">
                                {contact?.insuranceName || 'Obra Social'}
                              </span>
                            )}

                            {isToday && (
                              <span className="px-2 py-0.5 rounded-full bg-[#2E7D5E] text-white text-[10px] font-extrabold uppercase whitespace-nowrap">
                                ¡Hoy!
                              </span>
                            )}

                            {/* WhatsApp Status Badge */}
                            {appt.whatsappStatus === 'confirmed' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1 shadow-2xs">
                                <span>✔ Confirmado</span>
                              </span>
                            )}
                            {appt.whatsappStatus === 'cancelled' && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1 shadow-2xs">
                                <span>❌ Canceló</span>
                              </span>
                            )}
                            {appt.whatsappStatus === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1 shadow-2xs">
                                <span>⏳ Recordatorio Enviado</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                            <span className="font-semibold flex items-center gap-1 text-slate-700">
                              <CalendarIcon className="w-3.5 h-3.5 text-[#2E7D5E]" />
                              {formatDateWithDayName(appt.date)}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700">
                            {appt.motive && (
                              <span className="break-words">
                                <span className="font-semibold text-slate-900">Motivo:</span> {appt.motive}
                              </span>
                            )}
                            <span className="whitespace-nowrap">
                              <span className="font-semibold text-slate-900">Horario:</span> {getAppointmentTimeRange(appt.time, appt.durationMinutes).rangeText}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons for appointment */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                        {/* Google Calendar Sync */}
                        {onPromptGoogleAction && (
                          <button
                            onClick={() => {
                              if (googleUser && contact) {
                                onPromptGoogleAction('sync_calendar', appt, contact);
                              } else if (onConnectGoogle) {
                                onConnectGoogle();
                              }
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200/80 bg-blue-50/40 cursor-pointer"
                            title="Sincronizar turno en Google Calendar"
                          >
                            <CalendarIcon className="w-4 h-4" />
                          </button>
                        )}

                        {/* Gmail Send Confirmation */}
                        {onPromptGoogleAction && contact?.email && (
                          <button
                            onClick={() => {
                              if (googleUser) {
                                onPromptGoogleAction('send_email', appt, contact);
                              } else if (onConnectGoogle) {
                                onConnectGoogle();
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200/80 bg-rose-50/40 cursor-pointer"
                            title={`Enviar confirmación por Gmail a ${contact.email}`}
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}

                        {contact?.primaryPhone && (
                          <button
                            type="button"
                            onClick={() => setSelectedApptDetail(appt)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Enviar WhatsApp con botones para Confirmar o Cancelar turno"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp (Confirmar / Cancelar)</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenScheduleModal(appt.date, appt)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          title="Editar turno"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteAppointment(appt.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          title="Cancelar / Eliminar turno"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Modal / Ventana de Turnos del Día Seleccionado */}
      {selectedDayModalDate && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setSelectedDayModalDate(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header de la ventana del día */}
            <div className="bg-[#2E7D5E] text-white p-3.5 sm:p-4 flex items-center justify-between gap-2 shrink-0 border-b border-[#24664c]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-4 h-4 text-emerald-100" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight capitalize truncate">
                    {formatDateWithDayName(selectedDayModalDate)}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-semibold text-emerald-100">
                      {(appointmentsByDate[selectedDayModalDate] || []).length} {(appointmentsByDate[selectedDayModalDate] || []).length === 1 ? 'turno agendado' : 'turnos agendados'}
                    </span>
                    {selectedDayModalDate === todayStr && (
                      <span className="px-1.5 py-0.2 bg-white text-[#2E7D5E] rounded text-[10px] font-black uppercase shadow-2xs">
                        ¡HOY!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(appointmentsByDate[selectedDayModalDate] || []).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const dayAppts = appointmentsByDate[selectedDayModalDate] || [];
                      const d = new Date(selectedDayModalDate + 'T00:00:00');
                      d.setDate(d.getDate() - 1); // para que la función genere la fecha exacta
                      exportNextDayAppointmentsPlainFile(dayAppts, contacts, d);
                    }}
                    className="p-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
                    title="Descargar listado de turnos de este día en archivo de texto plano (.txt)"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Exportar TXT</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const date = selectedDayModalDate;
                    setSelectedDayModalDate(null);
                    onOpenScheduleModal(date);
                  }}
                  className="px-3 py-1.5 bg-white text-[#2E7D5E] hover:bg-emerald-50 active:bg-emerald-100 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#2E7D5E]" />
                  <span className="hidden xs:inline">Agendar Turno</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseDayModal}
                  className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Listado de turnos del día */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
              {(() => {
                const dayAppts = (appointmentsByDate[selectedDayModalDate] || [])
                  .slice()
                  .sort((a, b) => a.time.localeCompare(b.time));

                if (dayAppts.length === 0) {
                  return (
                    <div className="py-10 px-4 text-center space-y-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/80 my-2">
                      <div className="w-14 h-14 rounded-2xl bg-white text-[#2E7D5E] flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
                        <CalendarIcon className="w-7 h-7 text-[#2E7D5E]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                          No hay turnos agendados para este día
                        </h4>
                        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                          La agenda para esta fecha se encuentra libre. Puedes registrar un nuevo turno ahora seleccionando el paciente y el horario.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const date = selectedDayModalDate;
                            handleCloseDayModal();
                            onOpenScheduleModal(date);
                          }}
                          className="px-5 py-2.5 bg-[#2E7D5E] hover:bg-[#24664c] active:bg-[#1e543e] text-white font-black text-xs sm:text-sm rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agendar Turno en este Día</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseDayModal}
                          className="px-4 py-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <span>Cerrar</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return dayAppts.map((appt) => {
                  const contact = getContact(appt.contactId);
                  const dentistName = appt.dentist || 'Yani';
                  const isAmbas = dentistName === 'Ambas';
                  const isYani = dentistName === 'Yani';
                  const timeRange = getAppointmentTimeRange(appt.time, appt.durationMinutes);

                  const isCancelled = appt.whatsappStatus === 'cancelled';

                  return (
                    <div
                      key={appt.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                        isCancelled
                          ? 'bg-rose-50/50 border-rose-200 shadow-2xs'
                          : appt.completed 
                          ? 'bg-slate-50 border-slate-200 opacity-75' 
                          : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          {/* Bloque Horario */}
                          <div className={`text-center px-2 py-1 rounded-lg shrink-0 border ${
                            isCancelled
                              ? 'bg-rose-100 border-rose-200'
                              : 'bg-slate-100 border-slate-200'
                          }`}>
                            <span className={`text-xs font-black font-mono block leading-tight ${
                              isCancelled ? 'text-rose-900' : 'text-slate-900'
                            }`}>
                              {appt.time}
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-semibold block leading-tight mt-0.5">
                              {appt.durationMinutes || 30}m
                            </span>
                          </div>

                          {/* Info Paciente y Odontóloga */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs sm:text-sm font-bold truncate notranslate ${
                                isCancelled ? 'text-rose-900' : 'text-slate-900'
                              }`} translate="no">
                                {contact?.fullName || 'Paciente'}
                              </span>
                              {isCancelled ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300 notranslate" translate="no">
                                  ❌ Cancelado
                                </span>
                              ) : (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full notranslate ${
                                  isAmbas 
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                                    : isYani 
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                                }`} translate="no">
                                  {isAmbas ? 'Las dos (Marie y Yani)' : `Dra. ${dentistName}`}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                              {contact?.isParticular ? (
                                <span className="text-[#2E7D5E] font-extrabold">Particular</span>
                              ) : (
                                <span className="text-slate-600 font-medium">
                                  {contact?.insuranceName || 'Obra Social'}
                                </span>
                              )}
                              {appt.motive && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-700 font-medium">{appt.motive}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botón Atendido / Pendiente */}
                        <button
                          type="button"
                          onClick={() => onToggleAppointmentComplete(appt.id)}
                          className={`p-1.5 rounded-xl border cursor-pointer transition-colors shrink-0 ${
                            appt.completed
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-slate-100 text-slate-400 hover:text-emerald-700 border-slate-200 hover:bg-emerald-50'
                          }`}
                          title={appt.completed ? 'Marcar como pendiente' : 'Marcar como atendido'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Pie de acciones de cada turno */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {contact?.primaryPhone && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDayModalDate(null);
                                setSelectedApptDetail(appt);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Enviar recordatorio con opciones de confirmar o cancelar"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp (Confirmar / Cancelar)</span>
                            </button>
                          )}
                          {contact && onSelectContact && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDayModalDate(null);
                                onSelectContact(contact);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
                            >
                              Ficha médica
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDayModalDate(null);
                              onOpenScheduleModal(appt.date, appt);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar turno"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteAppointment(appt.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar turno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer de la ventana */}
            {(appointmentsByDate[selectedDayModalDate] || []).length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseDayModal}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const date = selectedDayModalDate;
                    handleCloseDayModal();
                    onOpenScheduleModal(date);
                  }}
                  className="px-3.5 py-1.5 bg-[#2E7D5E] hover:bg-[#24664c] active:bg-[#1e543e] text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agendar Otro Turno</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointment Quick Detail Modal Popup */}
      {selectedApptDetail && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setSelectedApptDetail(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Sticky Header with prominent, unmissable Close Button */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#2E7D5E]" />
                <h3 className="text-base font-bold text-slate-900">Detalles del Turno</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApptDetail(null)}
                className="px-2.5 py-1.5 bg-slate-200/80 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer shadow-2xs active:scale-95 border border-slate-300/60"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4 text-slate-700" />
                <span>Cerrar</span>
              </button>
            </div>

            {(() => {
              const contact = getContact(selectedApptDetail.contactId);
              return (
                <>
                  {/* Scrollable Modal Body */}
                  <div className="overflow-y-auto px-5 py-4 space-y-4 text-xs text-slate-700 flex-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-sm font-bold text-slate-900">{contact?.fullName || 'Paciente'}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {contact?.isParticular ? (
                          <span className="text-[#2E7D5E] font-bold">Atención Particular</span>
                        ) : (
                          <span>
                            {contact?.insuranceName || 'Obra Social'} {contact?.affiliateNumber ? `• N° Afiliado: ${contact.affiliateNumber}` : ''}
                          </span>
                        )}
                      </p>
                      {contact?.primaryPhone && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {contact.primaryPhone}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-[#2E7D5E] font-bold uppercase">Odontóloga</span>
                        <p className="text-xs font-extrabold text-slate-900">
                          {(selectedApptDetail.dentist || 'Yani') === 'Ambas' 
                            ? 'Las dos juntas (Marie y Yani)' 
                            : (selectedApptDetail.dentist || 'Yani') === 'Yani' 
                            ? 'Dra. Yani' 
                            : 'Dra. Marie'}
                        </p>
                      </div>
                      <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-[#2E7D5E] font-bold uppercase">Fecha</span>
                        <p className="text-xs font-bold text-slate-900">{formatDateWithDayName(selectedApptDetail.date)}</p>
                      </div>
                      <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-[#2E7D5E] font-bold uppercase">Horario y Duración</span>
                        <p className="text-xs font-bold text-slate-900">
                          {getAppointmentTimeRange(selectedApptDetail.time, selectedApptDetail.durationMinutes).rangeText} ({formatDuration(selectedApptDetail.durationMinutes)})
                        </p>
                      </div>
                    </div>

                    {selectedApptDetail.motive && (
                      <div>
                        <span className="font-bold text-slate-800">Motivo / Observaciones:</span>
                        <p className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-800 mt-1">
                          {selectedApptDetail.motive}
                        </p>
                      </div>
                    )}

                    {/* WhatsApp Reminder with 1-Click Confirmation Links */}
                    <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-emerald-700" />
                          Recordatorio WhatsApp con Enlaces de Confirmación:
                        </span>
                        {contact?.primaryPhone && (
                          <span className="text-[11px] text-emerald-800 font-mono font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                            {contact.primaryPhone}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Envía un WhatsApp al paciente con enlaces mágicos para que confirme o cancele en 1 solo toque desde su celular.
                      </p>

                      {botSendFeedback && botSendFeedback.id === selectedApptDetail.id && (
                        <div className="space-y-2">
                          <div
                            className={`text-xs p-2.5 rounded-lg font-medium flex items-center gap-2 ${
                              botSendFeedback.success
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {botSendFeedback.success ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span className="font-semibold">{botSendFeedback.text}</span>
                          </div>
                          
                          {/* Dedicated quick-close button after sending WhatsApp */}
                          <button
                            type="button"
                            onClick={() => setSelectedApptDetail(null)}
                            className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <X className="w-4 h-4" />
                            <span>Listo / Volver a la Agenda</span>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!contact?.primaryPhone}
                          onClick={async () => {
                            if (!contact?.primaryPhone) {
                              setBotSendFeedback({
                                id: selectedApptDetail.id,
                                success: false,
                                text: 'El paciente no tiene número de teléfono registrado.',
                              });
                              return;
                            }

                            const dentistName = (selectedApptDetail.dentist || 'Yani') === 'Ambas'
                              ? 'las Dras. Marie y Yani'
                              : `la Dra. ${selectedApptDetail.dentist || 'Yani'}`;

                            const baseUrl = window.location.origin;
                            const patientParam = encodeURIComponent(contact.fullName || 'Paciente');
                            const dateParam = encodeURIComponent(selectedApptDetail.date || '');
                            const horaParam = encodeURIComponent(selectedApptDetail.time || '');
                            const dentistParam = encodeURIComponent(selectedApptDetail.dentist || 'Marie');

                            const confirmUrl = `${baseUrl}/?confirm_id=${selectedApptDetail.id}&action=confirm&paciente=${patientParam}&fecha=${dateParam}&hora=${horaParam}&dentista=${dentistParam}`;
                            const cancelUrl = `${baseUrl}/?confirm_id=${selectedApptDetail.id}&action=cancel&paciente=${patientParam}&fecha=${dateParam}&hora=${horaParam}&dentista=${dentistParam}`;

                            const rawText = `👋 Hola *${contact.fullName || 'Paciente'}*, le recordamos su turno en el *Consultorio Odontológico* con *${dentistName}*:

📅 *Fecha:* ${formatDateWithDayName(selectedApptDetail.date)} (${selectedApptDetail.date})
⏰ *Hora:* ${selectedApptDetail.time} hs
🩺 *Tratamiento:* ${selectedApptDetail.motive || 'Consulta General'}

Por favor confirme su asistencia tocando un enlace:
✅ *CONFIRMAR ASISTENCIA:*
${confirmUrl}

❌ *CANCELAR / REPROGRAMAR:*
${cancelUrl}

👉 O responda este mensaje con *"SI"* para confirmar o *"NO"* para cancelar.
¡Muchas gracias y la/lo esperamos! 🦷✨`;

                            // Clean phone number (Argentina +54 prefix format handling)
                            let cleanPhone = contact.primaryPhone.replace(/\D/g, '');
                            if (cleanPhone.length === 10 && !cleanPhone.startsWith('54')) {
                              cleanPhone = '549' + cleanPhone;
                            } else if (cleanPhone.startsWith('54') && !cleanPhone.startsWith('549') && cleanPhone.length === 12) {
                              cleanPhone = '549' + cleanPhone.slice(2);
                            }

                            // Eagerly sync appointment to server store so public endpoint has it instantly
                            try {
                              fetch('/api/sync/agenda', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  appointments: [selectedApptDetail],
                                  contacts: [contact],
                                }),
                              }).catch(() => {});
                            } catch {}

                            // Mark as reminder sent on server
                            try {
                              await fetch(`/api/appointment/${selectedApptDetail.id}/mark-reminder-sent`, {
                                method: 'POST',
                              });
                              setSelectedApptDetail((prev: any) => ({
                                ...prev,
                                whatsappStatus: 'pending',
                              }));
                            } catch {}

                            // Open WhatsApp Web or App
                            const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(rawText)}`;
                            window.open(waUrl, '_blank');

                            setBotSendFeedback({
                              id: selectedApptDetail.id,
                              success: true,
                              text: '¡WhatsApp abierto! Puedes cerrar esta ventana con la cruz arriba o el botón inferior.',
                            });
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                            !contact?.primaryPhone
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                          }`}
                        >
                          <Send className="w-4 h-4" />
                          <span>
                            {selectedApptDetail.whatsappStatus === 'pending'
                              ? 'Reenviar WhatsApp con Links de Confirmación'
                              : 'Enviar Recordatorio por WhatsApp (Con Links de 1 Toque)'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* WhatsApp Status Indicator */}
                    {selectedApptDetail.whatsappStatus && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 block">Estado del Turno:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedApptDetail.whatsappStatus === 'confirmed' && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ✔ Confirmado por el paciente
                            </span>
                          )}
                          {selectedApptDetail.whatsappStatus === 'cancelled' && (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-xs border border-rose-300 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              ❌ Cancelado por el paciente
                            </span>
                          )}
                          {selectedApptDetail.whatsappStatus === 'pending' && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-extrabold text-xs border border-amber-300">
                              ⏳ Recordatorio enviado - Esperando respuesta
                            </span>
                          )}
                        </div>

                        {/* Manual Status Action Controls */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 flex-wrap">
                          {selectedApptDetail.whatsappStatus !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateAppointmentStatus) {
                                  onUpdateAppointmentStatus(selectedApptDetail.id, 'confirmed');
                                }
                                setSelectedApptDetail((prev: any) => ({ ...prev, whatsappStatus: 'confirmed' }));
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar como Confirmado</span>
                            </button>
                          )}

                          {selectedApptDetail.whatsappStatus !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateAppointmentStatus) {
                                  onUpdateAppointmentStatus(selectedApptDetail.id, 'cancelled');
                                }
                                setSelectedApptDetail((prev: any) => ({ ...prev, whatsappStatus: 'cancelled' }));
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Marcar como Cancelado</span>
                            </button>
                          )}
                        </div>

                        {selectedApptDetail.whatsappLastReply && (
                          <p className="text-[11px] text-slate-500 italic">
                            Última respuesta registrada: {new Date(selectedApptDetail.whatsappLastReply).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })} hs
                          </p>
                        )}
                      </div>
                    )}

                    {/* Google Workspace Quick Actions */}
                    {onPromptGoogleAction && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 block">Sincronización con Google:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              if (googleUser && contact) {
                                onPromptGoogleAction('sync_calendar', selectedApptDetail, contact);
                              } else if (onConnectGoogle) {
                                onConnectGoogle();
                              }
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] border border-blue-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>Sincronizar Calendar</span>
                          </button>

                          {contact?.email && (
                            <button
                              onClick={() => {
                                if (googleUser && contact) {
                                 onPromptGoogleAction('send_email', selectedApptDetail, contact);
                                } else if (onConnectGoogle) {
                                  onConnectGoogle();
                                }
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] border border-rose-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Enviar Gmail</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sticky Footer with Clear 'Cerrar' Button and Actions */}
                  <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-100 shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedApptDetail(null)}
                      className="px-3 py-2 bg-slate-200/90 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cerrar</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {selectedApptDetail.whatsappStatus !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleAppointmentComplete(selectedApptDetail.id);
                            setSelectedApptDetail(null);
                          }}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {selectedApptDetail.completed ? 'Marcar Pendiente' : 'Marcar Atendido'}
                          </span>
                          <span className="sm:hidden">
                            {selectedApptDetail.completed ? 'Pendiente' : 'Atendido'}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const date = selectedApptDetail.date;
                          const appt = selectedApptDetail;
                          setSelectedApptDetail(null);
                          onOpenScheduleModal(date, appt);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onDeleteAppointment(selectedApptDetail.id);
                          setSelectedApptDetail(null);
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold text-xs cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Bell, 
  Star, 
  LayoutGrid, 
  List, 
  ShieldAlert, 
  UserCheck, 
  Download, 
  Upload, 
  RotateCcw,
  BookOpen,
  Calendar as CalendarIcon,
  Users,
  Plus,
  Sparkles,
  FileText
} from 'lucide-react';
import { ViewMode, FilterType, MainTab } from '../types';

interface HeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  isAssistantOpen: boolean;
  onToggleAssistant: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedInsurance: string;
  onInsuranceChange: (insurance: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
  onOpenScheduleModal: () => void;
  onOpenRemindersModal: () => void;
  pendingRemindersCount: number;
  totalContactsCount: number;
  appointmentsCount: number;
  favoritesCount: number;
  insuranceList: string[];
  notesCount: number;
  onResetData: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenQuickNoteModal?: () => void;
  onOpenInsuranceFolderModal?: () => void;
  onOpenFinanceModal?: () => void;
  googleUser?: { email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
  onConnectGoogle?: () => void;
  onDisconnectGoogle?: () => void;
  isConnectingGoogle?: boolean;
  isSyncingCloud?: boolean;
  onManualSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isAssistantOpen,
  onToggleAssistant,
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  selectedInsurance,
  onInsuranceChange,
  viewMode,
  onViewModeChange,
  onOpenAddModal,
  onOpenScheduleModal,
  onOpenRemindersModal,
  pendingRemindersCount,
  totalContactsCount,
  appointmentsCount,
  favoritesCount,
  insuranceList,
  notesCount,
  onResetData,
  onExportJson,
  onImportJson,
  onOpenQuickNoteModal,
  onOpenInsuranceFolderModal,
  onOpenFinanceModal,
  googleUser,
  onConnectGoogle,
  onDisconnectGoogle,
  isConnectingGoogle = false,
  isSyncingCloud = false,
  onManualSync,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Sync header height dynamically to CSS variable for sticky calendar filters
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--app-header-height', `${Math.round(height)}px`);
      }
    };
    updateHeaderHeight();
    
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      observer = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      observer.observe(headerRef.current);
    }

    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [activeTab, searchTerm, selectedFilter]);

  return (
    <header 
      ref={headerRef} 
      className="bg-[#2E7D5E] text-white border-b border-[#24664c] sticky top-0 left-0 right-0 w-full z-40 shadow-md max-w-full overflow-x-hidden"
    >
      <div className="max-w-[1600px] 2xl:max-w-[1780px] mx-auto px-3 sm:px-6 lg:px-8 py-2 space-y-2">
        
        {/* Single Row: Logo, Navigation Tabs & Backup Tools */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-nowrap py-0.5">
          
          {/* Title with Tooth Contour Isotype matching uploaded reference */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-xs shrink-0 p-1.5 backdrop-blur-xs">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                {/* Silueta exacta de la muela de referencia */}
                <path d="M 50 15 C 42 12 28 9 20 18 C 12 27 13 44 18 58 C 21 66 21 78 24 87 C 26 93 35 93 39 85 C 43 76 43 60 50 60 C 57 60 57 76 61 85 C 65 93 74 93 76 87 C 79 78 79 66 82 58 C 87 44 88 27 80 18 C 72 9 58 12 50 15 Z" />
              </svg>
            </div>
            <div className="whitespace-nowrap flex flex-col justify-center gap-0.5">
              <h1 className="text-xs sm:text-[15px] font-bold tracking-tight text-white leading-none notranslate" translate="no">
                Consultorio Marie - Yani
              </h1>
              <p className="text-[10px] sm:text-[11px] text-emerald-100/90 font-medium tracking-wide leading-none">
                Agenda odontológica
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs Bar (Hidden on mobile, shown on md+) */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Contactos Pill */}
            <button
              id="tab-contacts-main"
              onClick={() => onTabChange('contacts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer active:scale-95 min-h-[34px] ${
                activeTab === 'contacts'
                  ? 'bg-white text-[#2E7D5E] border-white shadow-2xs'
                  : 'bg-black/25 text-white/90 border-white/20 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Contactos</span>
            </button>

            {/* Calendario de Turnos Pill */}
            <button
              id="tab-calendar-main"
              onClick={() => onTabChange('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative shrink-0 border whitespace-nowrap cursor-pointer active:scale-95 min-h-[34px] ${
                activeTab === 'calendar'
                  ? 'bg-white text-[#2E7D5E] border-white shadow-2xs'
                  : 'bg-black/25 text-white/90 border-white/20 hover:text-white hover:bg-white/10'
              }`}
            >
              <CalendarIcon className={`w-3.5 h-3.5 ${activeTab === 'calendar' ? 'text-[#2E7D5E]' : 'text-emerald-100'}`} />
              <span>Calendario de Turnos</span>
            </button>

            {/* Carpeta de Obras Sociales */}
            {onOpenInsuranceFolderModal && (
              <button
                id="btn-open-insurance-folder"
                type="button"
                onClick={onOpenInsuranceFolderModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-700/90 hover:bg-emerald-600 active:bg-emerald-800 text-white border border-emerald-400/40 hover:border-white shadow-xs shrink-0 whitespace-nowrap cursor-pointer active:scale-95 min-h-[34px]"
                title="Ver y adjuntar nomencladores, normativas y aranceles por obra social"
              >
                <span>📁 Obras Sociales</span>
              </button>
            )}

            {/* Finanzas y Liquidaciones */}
            {onOpenFinanceModal && (
              <button
                id="btn-open-finances"
                onClick={onOpenFinanceModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 border border-amber-300 shadow-xs shrink-0 whitespace-nowrap cursor-pointer active:scale-95 min-h-[34px]"
                title="Liquidaciones diarias, egresos por turno y división Marie / Yani"
              >
                <span>💰 Finanzas</span>
              </button>
            )}

          </div>

          {/* Right Tools (Google Account & Backup & Actions) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Google Account Status / Connect Button */}
            {googleUser ? (
              <div 
                className="flex items-center gap-1.5 bg-white text-slate-800 rounded-xl px-2 sm:px-2.5 py-1 text-xs font-semibold shadow-xs border border-white/40"
                title={`Conectado como ${googleUser.email || 'Google User'}. Sincronización activa con Google Calendar y Gmail.`}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[11px] font-bold text-emerald-800 shrink-0 border border-emerald-300 overflow-hidden">
                  {googleUser.photoURL ? (
                    <img src={googleUser.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{(googleUser.email?.[0] || 'G').toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-none">
                  <span className="text-[11px] font-bold text-slate-900 truncate max-w-[130px]">{googleUser.displayName || googleUser.email?.split('@')[0]}</span>
                  <span className="text-[9px] text-emerald-700 font-bold">Gmail & Calendar ✔</span>
                </div>
                {onDisconnectGoogle && (
                  <button
                    onClick={onDisconnectGoogle}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer px-1 py-0.5 rounded hover:bg-slate-100 transition-colors"
                    title="Desconectar cuenta de Google"
                  >
                    Salir
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectGoogle}
                disabled={isConnectingGoogle}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs border border-white/40 cursor-pointer active:scale-95 transition-all"
                title="Conectar con tu cuenta de Google para sincronizar turnos con Calendar y enviar avisos por Gmail"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="hidden sm:inline">{isConnectingGoogle ? 'Conectando...' : 'Conectar Google'}</span>
                <span className="sm:hidden">{isConnectingGoogle ? '...' : 'Google'}</span>
              </button>
            )}

            {/* Import / Export / Backup Box */}
            <div className="flex items-center bg-black/25 rounded-xl border border-white/20 p-0.5 sm:p-1 shrink-0">
              <button
                onClick={onExportJson}
                title="Exportar copia de seguridad"
                className="p-1.5 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Importar contactos"
                className="p-1.5 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImportJson}
                className="hidden"
              />
              <button
                onClick={onResetData}
                title="Vaciar o Restablecer Agenda"
                className="p-1.5 text-white/80 hover:text-amber-300 transition-colors rounded-lg hover:bg-white/10 flex items-center gap-1 text-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Filter Controls Bar - only for Contacts tab */}
        {activeTab === 'contacts' && (
          <div className="mt-2 pt-2 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            
            {/* Filters & View Switcher */}
            <div className="flex items-center flex-wrap gap-2 w-full justify-between">
              
              {/* Filter Pills */}
              <div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/20 overflow-x-auto text-xs max-w-full no-scrollbar">
                <button
                  onClick={() => {
                    onFilterChange('all');
                    onInsuranceChange('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedFilter === 'all' && !selectedInsurance
                      ? 'bg-white text-[#2E7D5E] font-bold shadow-2xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Todos ({totalContactsCount})
                </button>

                <button
                  onClick={() => {
                    onFilterChange(selectedFilter === 'favorites' ? 'all' : 'favorites');
                    onInsuranceChange('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedFilter === 'favorites'
                      ? 'bg-white text-[#2E7D5E] font-bold shadow-2xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${selectedFilter === 'favorites' ? 'fill-[#2E7D5E] text-[#2E7D5E]' : 'fill-white text-white'}`} />
                  <span>Favoritos</span>
                  {favoritesCount > 0 && <span className="opacity-80">({favoritesCount})</span>}
                </button>

                <button
                  onClick={() => {
                    onFilterChange(selectedFilter === 'reminders' ? 'all' : 'reminders');
                    onInsuranceChange('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedFilter === 'reminders'
                      ? 'bg-white text-[#2E7D5E] font-bold shadow-2xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  title="Contactos con recordatorios de llamadas pendientes"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Llamadas</span>
                  {pendingRemindersCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                      {pendingRemindersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    onFilterChange(selectedFilter === 'notes' ? 'all' : 'notes');
                    onInsuranceChange('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedFilter === 'notes'
                      ? 'bg-white text-[#2E7D5E] font-bold shadow-2xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Con Notas</span>
                </button>

                <button
                  onClick={() => {
                    onFilterChange(selectedFilter === 'particular' ? 'all' : 'particular');
                    onInsuranceChange('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedFilter === 'particular'
                      ? 'bg-white text-[#2E7D5E] font-bold shadow-2xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  title={selectedFilter === 'particular' ? 'Haga clic para desactivar el filtro Particular' : 'Filtrar solo pacientes Particulares'}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Particular</span>
                </button>
              </div>

              {/* Insurance Dropdown Filter */}
              {insuranceList.length > 0 && (
                <div 
                  className="relative inline-block shrink-0" 
                  title={selectedFilter === 'particular' ? 'Desactiva el filtro Particular para filtrar por Obra Social o Prepaga' : 'Filtrar por Obra Social / Prepaga'}
                >
                  <select
                    disabled={selectedFilter === 'particular'}
                    value={selectedFilter === 'particular' ? '' : selectedInsurance}
                    onChange={(e) => {
                      onInsuranceChange(e.target.value);
                      if (e.target.value) {
                        onFilterChange('insurance');
                      } else {
                        onFilterChange('all');
                      }
                    }}
                    className={`text-xs rounded-xl px-2.5 py-1.5 focus:outline-none transition-all ${
                      selectedFilter === 'particular'
                        ? 'bg-black/10 border border-white/10 text-white/40 cursor-not-allowed opacity-50 select-none'
                        : 'bg-black/20 border border-white/20 text-white hover:bg-black/30 cursor-pointer focus:ring-1 focus:ring-white/50'
                    }`}
                  >
                    <option value="" className="bg-[#2E7D5E] text-white">
                      {selectedFilter === 'particular' ? 'Particular activo (Sin Obra Social)' : 'Filtrar Obra Social / Prepaga...'}
                    </option>
                    {insuranceList.map((ins) => (
                      <option key={ins} value={ins} className="bg-[#2E7D5E] text-white">
                        {ins}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/20 shrink-0 ml-auto sm:ml-0">
                <button
                  onClick={() => onViewModeChange('grid')}
                  title="Vista en Tarjetas"
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#2E7D5E] font-bold shadow-2xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onViewModeChange('list')}
                  title="Vista en Lista Detallada"
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-[#2E7D5E] font-bold shadow-2xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </header>
  );
};

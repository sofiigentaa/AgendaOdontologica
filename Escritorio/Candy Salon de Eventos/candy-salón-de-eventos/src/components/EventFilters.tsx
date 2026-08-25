import React from 'react';
import { FilterStatus, SortOption } from '../types';
import { Search, SlidersHorizontal, AlertCircle, CheckCircle2, Clock, Calendar } from 'lucide-react';

interface EventFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (status: FilterStatus) => void;
  sortOption: SortOption;
  onSortOptionChange: (sort: SortOption) => void;
  totalCount: number;
  filteredCount: number;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortOptionChange,
  totalCount,
  filteredCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-xs space-y-3.5">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-events"
            type="text"
            placeholder="Buscar por evento, cliente, fecha o ubicación..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200/70 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Ordenar:</span>
          <select
            id="select-sort-events"
            value={sortOption}
            onChange={(e) => onSortOptionChange(e.target.value as SortOption)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="date_asc">Fecha más próxima</option>
            <option value="date_desc">Fecha más lejana</option>
            <option value="balance_desc">Mayor saldo pendiente</option>
            <option value="total_desc">Mayor monto total</option>
            <option value="client_asc">Nombre de cliente (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs / Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          type="button"
          onClick={() => onStatusFilterChange('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Todos los eventos</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'all' ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('pending_balance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
            statusFilter === 'pending_balance'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>Con saldo pendiente</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('fully_paid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
            statusFilter === 'fully_paid'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>100% Abonado ($0)</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('upcoming_7_days')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
            statusFilter === 'upcoming_7_days'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 hover:bg-indigo-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>Próximos 7 días</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('this_month')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
            statusFilter === 'this_month'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Este Mes</span>
        </button>
      </div>
    </div>
  );
};

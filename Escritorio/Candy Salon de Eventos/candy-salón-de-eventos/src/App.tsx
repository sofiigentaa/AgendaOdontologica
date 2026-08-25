import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  EventItem,
  FilterStatus,
  PaymentRecord,
  ReminderItem,
  SortOption,
  ViewMode,
} from './types.ts';
import {
  loadEventsFromStorage,
  saveEventsToStorage,
  loadRemindersFromStorage,
  saveRemindersToStorage,
  resetToDemoData,
} from './utils/storage.ts';
import {
  fetchEvents,
  fetchReminders,
  saveEventApi,
  deleteEventApi,
  addPaymentApi,
  saveReminderApi,
  deleteReminderApi,
  resetDemoApi,
  clearAllDataApi,
} from './utils/api.ts';
import {
  getRemainingBalance,
  getDaysRemaining,
  parseLocalDate,
  getTodayString,
} from './utils/dateUtils.ts';

import { Navbar } from './components/Navbar.tsx';
import { StatsCards } from './components/StatsCards.tsx';
import { EventFilters } from './components/EventFilters.tsx';
import { EventTable } from './components/EventTable.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { EventModal } from './components/EventModal.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { ReceiptModal } from './components/ReceiptModal.tsx';
import { RemindersModal } from './components/RemindersModal.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { useAuth } from './contexts/AuthContext.tsx';

import { CalendarPlus, Plus, FilterX } from 'lucide-react';

export default function App() {
  const { user } = useAuth();

  // Persistence state
  const [events, setEvents] = useState<EventItem[]>(() => loadEventsFromStorage());
  const [reminders, setReminders] = useState<ReminderItem[]>(() => loadRemindersFromStorage());
  const currency = '$ARS';
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_asc');

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [defaultDateForNewEvent, setDefaultDateForNewEvent] = useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedEventForPayment, setSelectedEventForPayment] = useState<EventItem | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedEventForReceipt, setSelectedEventForReceipt] = useState<EventItem | null>(null);

  // Reminders Modal state
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [selectedEventIdForReminder, setSelectedEventIdForReminder] = useState<string | undefined>(undefined);

  // Initial fetch from backend Cloud SQL database
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [backendEvents, backendReminders] = await Promise.all([
        fetchEvents(),
        fetchReminders(),
      ]);
      if (backendEvents && backendEvents.length > 0) {
        setEvents(backendEvents);
      }
      if (backendReminders && backendReminders.length > 0) {
        setReminders(backendReminders);
      }
    } catch (err) {
      console.warn('Initial load data error:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, user]);

  // Sync to local storage whenever events change
  useEffect(() => {
    saveEventsToStorage(events);
  }, [events]);

  // Sync to local storage whenever reminders change
  useEffect(() => {
    saveRemindersToStorage(reminders);
  }, [reminders]);

  // Pending reminders count for badges
  const pendingRemindersCount = useMemo(() => {
    return reminders.filter((r) => !r.completed).length;
  }, [reminders]);

  // Handle Reminder Actions
  const handleAddReminder = (reminderData: Omit<ReminderItem, 'id' | 'createdAt'>) => {
    const newReminder: ReminderItem = {
      ...reminderData,
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [newReminder, ...prev]);
    saveReminderApi(newReminder);
  };

  const handleToggleCompleteReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, completed: !r.completed };
          saveReminderApi(updated);
          return updated;
        }
        return r;
      })
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    deleteReminderApi(id);
  };

  const handleOpenReminders = (eventId?: string) => {
    setSelectedEventIdForReminder(eventId);
    setIsRemindersModalOpen(true);
  };

  // Handle Event CRUD
  const handleSaveEvent = (
    savedEvent: EventItem,
    autoReminders?: Array<Omit<ReminderItem, 'id' | 'createdAt'>>
  ) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === savedEvent.id);
      if (exists) {
        return prev.map((e) => (e.id === savedEvent.id ? savedEvent : e));
      }
      return [savedEvent, ...prev];
    });

    saveEventApi(savedEvent);

    if (autoReminders && autoReminders.length > 0) {
      autoReminders.forEach((r) => {
        handleAddReminder(r);
      });
    }
  };

  const handleDeleteEvent = (id: string) => {
    const target = events.find((e) => e.id === id);
    if (!target) return;
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar el evento "${target.title}"?`
    );
    if (confirmDelete) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setReminders((prev) => prev.filter((r) => r.eventId !== id));
      deleteEventApi(id);
      if (selectedEventForReceipt?.id === id) setIsReceiptModalOpen(false);
      if (selectedEventForPayment?.id === id) setIsPaymentModalOpen(false);
    }
  };

  // Handle Adding Payments
  const handleAddPayment = (eventId: string, payment: PaymentRecord) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const newHistory = [...(ev.paymentHistory || []), payment];
        const newTotalPaid = newHistory.reduce((acc, p) => acc + p.amount, 0);
        const isPaid = newTotalPaid >= ev.totalAmount;

        const updated: EventItem = {
          ...ev,
          paymentHistory: newHistory,
          status: isPaid ? 'fully_paid' : 'deposit_paid',
          updatedAt: new Date().toISOString(),
        };

        if (selectedEventForReceipt?.id === eventId) {
          setSelectedEventForReceipt(updated);
        }

        return updated;
      })
    );

    addPaymentApi(eventId, payment);
  };

  // Handle Deleting a payment record from receipt view
  const handleDeletePayment = (eventId: string, paymentId: string) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const newHistory = (ev.paymentHistory || []).filter((p) => p.id !== paymentId);
        const newTotalPaid = newHistory.reduce((acc, p) => acc + p.amount, 0);
        const isPaid = newTotalPaid >= ev.totalAmount;

        const updated: EventItem = {
          ...ev,
          paymentHistory: newHistory,
          status: isPaid ? 'fully_paid' : newTotalPaid > 0 ? 'deposit_paid' : 'no_deposit',
          updatedAt: new Date().toISOString(),
        };

        saveEventApi(updated);

        if (selectedEventForReceipt?.id === eventId) {
          setSelectedEventForReceipt(updated);
        }

        return updated;
      })
    );
  };

  // Clear all data from Supabase and App
  const handleClearAllData = async () => {
    const confirmClear = window.confirm(
      '¿Estás seguro de que deseas BORRAR TODOS los eventos, pagos y recordatorios de Supabase y de la aplicación?\n\nEsta acción vaciará las tablas de la base de datos para que comiences desde cero.'
    );
    if (confirmClear) {
      setIsRefreshing(true);
      await clearAllDataApi();
      setEvents([]);
      setReminders([]);
      setIsRefreshing(false);
    }
  };

  // Reset to Demo Data
  const handleResetData = async () => {
    const confirmReset = window.confirm(
      '¿Deseas restablecer los datos de ejemplo de Candy Salón de Eventos en la base de datos?'
    );
    if (confirmReset) {
      setIsRefreshing(true);
      const serverResult = await resetDemoApi();
      if (serverResult) {
        setEvents(serverResult.events);
        setReminders(serverResult.reminders);
      } else {
        const demo = resetToDemoData();
        setEvents(demo.events);
        setReminders(demo.reminders);
      }
      setIsRefreshing(false);
    }
  };

  // Open Event Modal Helpers
  const handleOpenNewEvent = (customDate?: string) => {
    setEditingEvent(null);
    setDefaultDateForNewEvent(customDate || getTodayString());
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event: EventItem) => {
    setEditingEvent(event);
    setDefaultDateForNewEvent(undefined);
    setIsEventModalOpen(true);
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (event: EventItem) => {
    setSelectedEventForPayment(event);
    setIsPaymentModalOpen(true);
  };

  // Open Receipt Modal
  const handleOpenReceiptModal = (event: EventItem) => {
    setSelectedEventForReceipt(event);
    setIsReceiptModalOpen(true);
  };

  // Filtered & Sorted events calculation
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return events
      .filter((ev) => {
        // Search term check
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchTitle = ev.title.toLowerCase().includes(query);
          const matchClient = ev.clientName.toLowerCase().includes(query);
          const matchLocation = ev.location?.toLowerCase().includes(query) ?? false;
          const matchDate = ev.eventDate.includes(query);
          const matchType = ev.eventType.toLowerCase().includes(query);
          if (!matchTitle && !matchClient && !matchLocation && !matchDate && !matchType) {
            return false;
          }
        }

        // Status Filter check
        const remaining = getRemainingBalance(ev);
        if (statusFilter === 'pending_balance') {
          return remaining > 0 && ev.status !== 'cancelled';
        }
        if (statusFilter === 'fully_paid') {
          return remaining === 0 && ev.status !== 'cancelled';
        }
        if (statusFilter === 'upcoming_7_days') {
          const countdown = getDaysRemaining(ev.eventDate);
          return countdown.days >= 0 && countdown.days <= 7 && ev.status !== 'cancelled';
        }
        if (statusFilter === 'this_month') {
          const evDate = parseLocalDate(ev.eventDate);
          return (
            evDate.getMonth() === currentMonth &&
            evDate.getFullYear() === currentYear &&
            ev.status !== 'cancelled'
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'date_asc') {
          return a.eventDate.localeCompare(b.eventDate);
        }
        if (sortOption === 'date_desc') {
          return b.eventDate.localeCompare(a.eventDate);
        }
        if (sortOption === 'balance_desc') {
          return getRemainingBalance(b) - getRemainingBalance(a);
        }
        if (sortOption === 'total_desc') {
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        }
        if (sortOption === 'client_asc') {
          return a.clientName.localeCompare(b.clientName);
        }
        return 0;
      });
  }, [events, searchTerm, statusFilter, sortOption]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-pink-500 selection:text-white pb-20 md:pb-0">
      {/* Top Navigation */}
      <Navbar
        onOpenNewEvent={() => handleOpenNewEvent()}
        onSyncSupabase={loadData}
        isRefreshing={isRefreshing}
        onClearAllData={handleClearAllData}
        onResetDemoData={handleResetData}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenReminders={() => handleOpenReminders()}
        pendingRemindersCount={pendingRemindersCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* KPI / Stats Header */}
        <StatsCards events={events} currency={currency} />

        {/* Filters & View Controls */}
        <EventFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortOption={sortOption}
          onSortOptionChange={setSortOption}
          totalCount={events.length}
          filteredCount={filteredEvents.length}
        />

        {/* Content View: Table or Calendar */}
        {filteredEvents.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 border border-pink-100 mx-auto flex items-center justify-center mb-4">
              <CalendarPlus className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No se encontraron eventos
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
              {searchTerm || statusFilter !== 'all'
                ? 'No hay eventos que coincidan con los filtros de búsqueda aplicados.'
                : 'Comienza registrando tu primer evento con su fecha, seña y saldo a abonar en Candy Salón.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              {searchTerm || statusFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span>Limpiar Filtros</span>
                </button>
              ) : null}
              <button
                onClick={() => handleOpenNewEvent()}
                className="flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Evento</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* Table / Mobile Cards View */
          <EventTable
            events={filteredEvents}
            currency={currency}
            onOpenPaymentModal={handleOpenPaymentModal}
            onOpenReceiptModal={handleOpenReceiptModal}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onOpenReminderForEvent={(eventId) => handleOpenReminders(eventId)}
          />
        ) : (
          /* Monthly Calendar View */
          <CalendarView
            events={events}
            currency={currency}
            onOpenReceiptModal={handleOpenReceiptModal}
            onOpenNewEventWithDate={(dateStr) => handleOpenNewEvent(dateStr)}
          />
        )}
      </main>

      {/* Mobile Bottom Dock Bar */}
      <MobileBottomNav
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenReminders={() => handleOpenReminders()}
        onOpenNewEvent={() => handleOpenNewEvent()}
        pendingRemindersCount={pendingRemindersCount}
      />

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        initialEvent={editingEvent}
        defaultDate={defaultDateForNewEvent}
        currency={currency}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        event={selectedEventForPayment}
        currency={currency}
        onAddPayment={handleAddPayment}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        event={selectedEventForReceipt}
        currency={currency}
        onDeletePayment={handleDeletePayment}
        onOpenReminderForEvent={(eventId) => handleOpenReminders(eventId)}
      />

      <RemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        reminders={reminders}
        events={events}
        currency={currency}
        onAddReminder={handleAddReminder}
        onToggleComplete={handleToggleCompleteReminder}
        onDeleteReminder={handleDeleteReminder}
        initialEventId={selectedEventIdForReminder}
      />

      {/* Subtle Footer (Desktop) */}
      <footer className="hidden md:block bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-600">
            🍭 Candy Salón de Eventos • Gestión & Persistencia Cloud SQL
          </span>
          <span className="text-slate-400 font-medium">
            Control de señas, fechas, saldos restantes y recordatorios
          </span>
        </div>
      </footer>
    </div>
  );
}

import { EventItem } from '../types';

const SPANISH_DAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const SPANISH_MONTHS_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

/**
 * Parses YYYY-MM-DD to a local Date object without timezone offset issues
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateString);
}

/**
 * Get Spanish day of the week name (e.g. "Sábado")
 */
export function getDayOfWeekName(dateString: string): string {
  const date = parseLocalDate(dateString);
  return SPANISH_DAYS[date.getDay()];
}

/**
 * Get full formatted date in Spanish: "Sábado 24 de Octubre de 2026"
 */
export function formatFullDateSpanish(dateString: string): string {
  const date = parseLocalDate(dateString);
  const dayName = SPANISH_DAYS[date.getDay()];
  const dayNumber = date.getDate();
  const monthName = SPANISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName} ${dayNumber} de ${monthName} de ${year}`;
}

/**
 * Short date format: "24 Oct 2026"
 */
export function formatShortDateSpanish(dateString: string): string {
  const date = parseLocalDate(dateString);
  const dayNumber = date.getDate();
  const monthName = SPANISH_MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();

  return `${dayNumber} ${monthName} ${year}`;
}

/**
 * Calculates days remaining from today
 */
export function getDaysRemaining(dateString: string): {
  days: number;
  label: string;
  isPast: boolean;
  isToday: boolean;
} {
  const targetDate = parseLocalDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { days: 0, label: '¡Es Hoy!', isPast: false, isToday: true };
  } else if (diffDays === 1) {
    return { days: 1, label: 'Mañana', isPast: false, isToday: false };
  } else if (diffDays === -1) {
    return { days: -1, label: 'Ayer', isPast: true, isToday: false };
  } else if (diffDays > 1) {
    return { days: diffDays, label: `En ${diffDays} días`, isPast: false, isToday: false };
  } else {
    return { days: Math.abs(diffDays), label: `Hace ${Math.abs(diffDays)} días`, isPast: true, isToday: false };
  }
}

/**
 * Format currency amount cleanly with $ARS
 */
export function formatCurrency(amount: number, currency = '$ARS'): string {
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  return `${currency} ${formatted}`;
}

/**
 * Calculate total paid amount (including initial deposit + all payment history entries)
 */
export function getTotalPaid(event: EventItem): number {
  if (!event) return 0;
  if (!event.paymentHistory || event.paymentHistory.length === 0) {
    return event.depositAmount || 0;
  }

  const sumFromHistory = event.paymentHistory.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  // Ensure deposit is included if not already logged in history
  const hasDepositInHistory = event.paymentHistory.some(p => p.concept === 'Seña inicial');
  if (hasDepositInHistory) {
    return sumFromHistory;
  }
  return sumFromHistory + (event.depositAmount || 0);
}

/**
 * Calculate remaining balance
 */
export function getRemainingBalance(event: EventItem): number {
  const total = event.totalAmount || 0;
  const paid = getTotalPaid(event);
  const remaining = total - paid;
  return remaining > 0 ? remaining : 0;
}

/**
 * Calculate percentage paid
 */
export function getPaidPercentage(event: EventItem): number {
  const total = event.totalAmount || 0;
  if (total <= 0) return 100;
  const paid = getTotalPaid(event);
  const percentage = (paid / total) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

/**
 * Today as YYYY-MM-DD
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

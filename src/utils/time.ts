/**
 * Calculates start, end time and formatted range for an appointment.
 * @param timeStr string in format "HH:mm" (e.g. "09:00", "14:30")
 * @param durationMinutes duration in minutes (defaults to 30)
 */
export function getAppointmentTimeRange(timeStr: string, durationMinutes: number = 30): {
  start: string;
  end: string;
  rangeText: string;
  rangeShort: string;
} {
  if (!timeStr) {
    return { start: '', end: '', rangeText: '', rangeShort: '' };
  }

  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);

  if (isNaN(h) || isNaN(m)) {
    return { start: timeStr, end: '', rangeText: timeStr, rangeShort: timeStr };
  }

  const dur = durationMinutes && durationMinutes > 0 ? durationMinutes : 30;
  const totalMin = h * 60 + m + dur;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;

  const startFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const endFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  return {
    start: startFormatted,
    end: endFormatted,
    rangeText: `${startFormatted} a ${endFormatted} hs`,
    rangeShort: `${startFormatted} - ${endFormatted}`,
  };
}

/**
 * Formats duration in minutes to human-readable string:
 * e.g., 20 -> "20 min", 45 -> "45 min", 60 -> "1 h", 75 -> "1 h 15 min", 100 -> "1 h 40 min", 120 -> "2 h"
 */
export function formatDuration(durationMinutes?: number): string {
  if (!durationMinutes || durationMinutes <= 0) return '30 min';
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  if (m === 0) {
    return `${h} h`;
  }
  return `${h} h ${m} min`;
}

/**
 * Parses a flexible date string entered by user (e.g. "16/08/2026", "16-8-2026", "16/8", "16", "2026-08-16")
 * into standard "YYYY-MM-DD" format.
 * @param input raw string input
 * @param fallbackYear current year if unspecified
 * @param fallbackMonth current 1-indexed month if unspecified
 */
export function parseFlexibleDate(
  input: string,
  fallbackYear?: number,
  fallbackMonth?: number
): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const now = new Date();
  const defYear = fallbackYear || now.getFullYear();
  const defMonth = fallbackMonth || (now.getMonth() + 1);

  // Check ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map((n) => parseInt(n, 10));
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Check if just single/double digit day: "16" or "5"
  if (/^\d{1,2}$/.test(trimmed)) {
    const day = parseInt(trimmed, 10);
    if (day >= 1 && day <= 31) {
      return `${defYear}-${String(defMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Check separators: slash (/), dash (-), dot (.)
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 2) {
    // DD/MM -> current year
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return `${defYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  } else if (parts.length === 3) {
    // Can be DD/MM/YYYY or YYYY/MM/DD
    let d = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);
    let y = parseInt(parts[2], 10);

    // If first part is 4 digits, it's YYYY/MM/DD
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else {
      // 2-digit year (e.g. '26' -> 2026)
      if (y < 100) {
        y += 2000;
      }
    }

    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Converts ISO date "YYYY-MM-DD" to Argentine / Spanish standard "DD/MM/YYYY"
 * e.g. "2026-08-18" -> "18/08/2026"
 */
export function formatDateDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

/**
 * Converts ISO date "YYYY-MM-DD" to humanized Spanish format with day name:
 * e.g. "2026-08-18" -> "Martes 18/08/2026"
 */
export function formatDateWithDayName(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  
  const dt = new Date(y, m, d);
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[dt.getDay()] || '';
  return `${dayName} ${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`;
}

export type DateDisplayFormat = 'DD/MM/YYYY' | 'DD/MM' | 'LONG' | 'SHORT' | 'YYYY-MM-DD';

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MONTH_NAMES_SHORT_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * Returns current local date as YYYY-MM-DD string.
 */
export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats ISO date string to Spanish written format: e.g. "18 de Agosto, 2026"
 */
export function formatDateLongSpanish(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  const monthName = MONTH_NAMES_ES[m] || '';
  return `${d} de ${monthName}, ${y}`;
}

/**
 * Formats ISO date string to short Spanish format: e.g. "18 Ago 2026"
 */
export function formatDateShortSpanish(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  const monthName = MONTH_NAMES_SHORT_ES[m] || '';
  return `${d} ${monthName} ${y}`;
}

/**
 * Formats a date string into the chosen DateDisplayFormat.
 */
export function formatDateByFormat(dateStr?: string | null, format: DateDisplayFormat = 'DD/MM/YYYY'): string {
  if (!dateStr) return '';
  switch (format) {
    case 'DD/MM/YYYY':
      return formatDateDDMMYYYY(dateStr);
    case 'DD/MM': {
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
      }
      return dateStr;
    }
    case 'LONG':
      return formatDateLongSpanish(dateStr);
    case 'SHORT':
      return formatDateShortSpanish(dateStr);
    case 'YYYY-MM-DD':
    default:
      return dateStr;
  }
}

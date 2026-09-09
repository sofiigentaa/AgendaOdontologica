import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatDateByFormat,
  formatDateDDMMYYYY,
  formatDateWithDayName,
  getAppointmentTimeRange,
  parseFlexibleDate,
} from './time';

describe('getAppointmentTimeRange', () => {
  it('calculates a 30 minute default range in 24h format', () => {
    expect(getAppointmentTimeRange('14:00')).toEqual({
      start: '14:00',
      end: '14:30',
      rangeText: '14:00 a 14:30 hs',
      rangeShort: '14:00 - 14:30',
    });
  });

  it('wraps after midnight', () => {
    expect(getAppointmentTimeRange('23:30', 45).end).toBe('00:15');
  });

  it('returns empty values when time is missing', () => {
    expect(getAppointmentTimeRange('')).toEqual({
      start: '',
      end: '',
      rangeText: '',
      rangeShort: '',
    });
  });
});

describe('formatDuration', () => {
  it('formats minutes, hours and mixed durations', () => {
    expect(formatDuration(20)).toBe('20 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(75)).toBe('1 h 15 min');
    expect(formatDuration(120)).toBe('2 h');
  });

  it('falls back to 30 min when duration is missing', () => {
    expect(formatDuration(undefined)).toBe('30 min');
    expect(formatDuration(0)).toBe('30 min');
  });
});

describe('parseFlexibleDate', () => {
  it('parses ISO, DD/MM/YYYY, day-only and 2-digit year', () => {
    expect(parseFlexibleDate('2026-08-16')).toBe('2026-08-16');
    expect(parseFlexibleDate('16/08/2026')).toBe('2026-08-16');
    expect(parseFlexibleDate('16-8-26')).toBe('2026-08-16');
    expect(parseFlexibleDate('16/8', 2026, 8)).toBe('2026-08-16');
    expect(parseFlexibleDate('16', 2026, 8)).toBe('2026-08-16');
  });

  it('returns null for empty or invalid input', () => {
    expect(parseFlexibleDate('')).toBeNull();
    expect(parseFlexibleDate('32/13/2026')).toBeNull();
  });
});

describe('date display formats', () => {
  it('formats Argentine dates and weekday names', () => {
    expect(formatDateDDMMYYYY('2026-08-18')).toBe('18/08/2026');
    expect(formatDateWithDayName('2026-08-18')).toBe('Martes 18/08/2026');
    expect(formatDateByFormat('2026-08-18', 'DD/MM')).toBe('18/08');
    expect(formatDateByFormat('2026-08-18', 'LONG')).toBe('18 de Agosto, 2026');
  });
});

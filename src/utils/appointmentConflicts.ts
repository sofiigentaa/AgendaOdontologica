import { Appointment } from '../types';
import { normalizeDentist } from './dentist';

const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(timeStr: string): number {
  const [h, m] = (timeStr || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Two ranges overlap when they share any open interval.
 * Adjacent slots (09:00-09:30 and 09:30-10:00) do not collide.
 * Times are minutes since midnight of the same day; a range may extend past
 * 24:00 (e.g. 23:30 + 60 min ends at 24:30).
 */
export function checkTimeOverlap(
  start1: string,
  dur1: number,
  start2: string,
  dur2: number
): boolean {
  return rangesOverlap(timeToMinutes(start1), dur1, timeToMinutes(start2), dur2);
}

function rangesOverlap(s1: number, dur1: number, s2: number, dur2: number): boolean {
  const e1 = s1 + (dur1 || 30);
  const e2 = s2 + (dur2 || 30);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

/** True when the appointment ends after midnight (not allowed in the agenda). */
export function crossesMidnight(time: string, durationMinutes?: number): boolean {
  return timeToMinutes(time) + (Number(durationMinutes) || 30) > MINUTES_PER_DAY;
}

/** Days between two ISO dates (b - a). NaN if any is invalid. */
function dayDiff(a: string, b: string): number {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((tb - ta) / (MINUTES_PER_DAY * 60 * 1000));
}

/**
 * Same dentist, or either appointment assigned to both dentists.
 * Both sides use the same default (normalizeDentist), so two turns without an
 * assigned dentist at the same time are detected as overlapping.
 */
export function dentistsConflict(existingDentist?: string | null, targetDentist?: string | null): boolean {
  const apptDentist = normalizeDentist(existingDentist);
  const nextDentist = normalizeDentist(targetDentist);
  return apptDentist === nextDentist || apptDentist === 'Ambas' || nextDentist === 'Ambas';
}

export function isAppointmentBlockingCalendar(appt: Pick<Appointment, 'completed' | 'whatsappStatus'>): boolean {
  if (appt.completed) return false;
  if (appt.whatsappStatus === 'cancelled') return false;
  return true;
}

export function findConflictingAppointment<T extends Pick<Appointment, 'id' | 'date' | 'time' | 'durationMinutes' | 'dentist' | 'completed' | 'whatsappStatus'>>(
  appointments: T[],
  candidate: {
    date: string;
    time: string;
    durationMinutes?: number;
    dentist?: string;
    id?: string;
  }
): T | undefined {
  const duration = Number(candidate.durationMinutes) || 30;
  const candidateStart = timeToMinutes(candidate.time);
  return (appointments || []).find((appt) => {
    if (candidate.id && appt.id === candidate.id) return false;
    if (!appt.date || !candidate.date) return false;
    // Same day, or the previous/next day (turns that reach past midnight).
    const diff = dayDiff(candidate.date, appt.date);
    if (!Number.isFinite(diff) || Math.abs(diff) > 1) return false;
    if (!isAppointmentBlockingCalendar(appt)) return false;
    if (!dentistsConflict(appt.dentist, candidate.dentist)) return false;
    const apptStart = timeToMinutes(appt.time) + diff * MINUTES_PER_DAY;
    return rangesOverlap(candidateStart, duration, apptStart, appt.durationMinutes || 30);
  });
}

import { Appointment } from '../types';
import { normalizeDentist } from './dentist';

export function timeToMinutes(timeStr: string): number {
  const [h, m] = (timeStr || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Two ranges overlap when they share any open interval.
 * Adjacent slots (09:00-09:30 and 09:30-10:00) do not collide.
 */
export function checkTimeOverlap(
  start1: string,
  dur1: number,
  start2: string,
  dur2: number
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = s1 + (dur1 || 30);
  const s2 = timeToMinutes(start2);
  const e2 = s2 + (dur2 || 30);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

/**
 * Same dentist, or either appointment assigned to both dentists.
 * Defaults match the scheduling UI: existing turns without dentist count as Yani;
 * a new turn without dentist counts as Marie.
 */
export function dentistsConflict(existingDentist?: string, targetDentist?: string): boolean {
  const apptDentist = normalizeDentist(existingDentist);
  const nextDentist = normalizeDentist(
    targetDentist && String(targetDentist).trim() ? targetDentist : 'Marie'
  );
  return apptDentist === nextDentist || apptDentist === 'Ambas' || nextDentist === 'Ambas';
}

export function isAppointmentBlockingCalendar(appt: Appointment): boolean {
  if (appt.completed) return false;
  if (appt.whatsappStatus === 'cancelled') return false;
  return true;
}

export function findConflictingAppointment(
  appointments: Appointment[],
  candidate: {
    date: string;
    time: string;
    durationMinutes?: number;
    dentist?: string;
    id?: string;
  }
): Appointment | undefined {
  const duration = Number(candidate.durationMinutes) || 30;
  return (appointments || []).find((appt) => {
    if (candidate.id && appt.id === candidate.id) return false;
    if (appt.date !== candidate.date) return false;
    if (!isAppointmentBlockingCalendar(appt)) return false;
    if (!dentistsConflict(appt.dentist, candidate.dentist)) return false;
    return checkTimeOverlap(candidate.time, duration, appt.time, appt.durationMinutes || 30);
  });
}

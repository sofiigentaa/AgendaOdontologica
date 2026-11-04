import { Appointment } from '../types';

export const CLINIC_TIME_ZONE = 'America/Argentina/Buenos_Aires';

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
  const apptDentist = existingDentist || 'Yani';
  const nextDentist = targetDentist || 'Marie';
  return apptDentist === nextDentist || apptDentist === 'Ambas' || nextDentist === 'Ambas';
}

export function isAppointmentBlockingCalendar(appt: Appointment): boolean {
  if (appt.completed) return false;
  if (appt.whatsappStatus === 'cancelled') return false;
  return true;
}

export function minutesToTime(total: number): string {
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Redondea hacia arriba a la próxima franja (p. ej. 09:07 → 09:15). */
export function ceilTimeToStep(time: string, stepMinutes = 15): string {
  return minutesToTime(Math.ceil(timeToMinutes(time) / stepMinutes) * stepMinutes);
}

/** Fecha y hora actuales en la zona horaria de la clínica. */
export function getClinicNow(now: Date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  };
}

/**
 * Horarios de inicio libres para una odontóloga en un día, según los turnos ya cargados.
 * Recorre el rango de consulta en pasos de `stepMinutes`. Un inicio solo es válido si el
 * turno termina antes de `closingTime` y no es anterior a `minStartTime`.
 */
export function getAvailableStartTimes(
  appointments: Appointment[],
  candidate: { date: string; dentist?: string; durationMinutes?: number; id?: string },
  options: {
    from?: string;
    to?: string;
    stepMinutes?: number;
    closingTime?: string;
    minStartTime?: string;
  } = {}
): string[] {
  const from = timeToMinutes(options.from ?? '07:00');
  const to = timeToMinutes(options.to ?? '21:30');
  const closing = timeToMinutes(options.closingTime ?? '22:00');
  const earliest = options.minStartTime ? timeToMinutes(options.minStartTime) : 0;
  const step = options.stepMinutes ?? 15;
  const duration = Number(candidate.durationMinutes) || 30;
  const available: string[] = [];
  for (let start = Math.max(from, earliest); start <= to; start += step) {
    if (start + duration > closing) break;
    const time = minutesToTime(start);
    const conflict = findConflictingAppointment(appointments, {
      id: candidate.id,
      date: candidate.date,
      time,
      durationMinutes: duration,
      dentist: candidate.dentist,
    });
    if (!conflict) available.push(time);
  }
  return available;
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

/** Un cambio de fecha, hora, duración, odontóloga o estado que ocupa/libera el horario. */
export function hasScheduleChanged(previous: Appointment | undefined, next: Appointment): boolean {
  if (!previous) return true;
  return (
    previous.date !== next.date ||
    previous.time !== next.time ||
    (previous.durationMinutes || 30) !== (next.durationMinutes || 30) ||
    previous.dentist !== next.dentist ||
    isAppointmentBlockingCalendar(previous) !== isAppointmentBlockingCalendar(next)
  );
}

/**
 * Solo se valida contra la agenda los turnos nuevos o reprogramados. Así, un turno heredado
 * que ya se solapaba no bloquea otros cambios (por ejemplo, confirmarlo).
 */
export function findNewScheduleConflict(
  previous: Appointment[],
  next: Appointment[]
): { appointment: Appointment; conflict: Appointment } | undefined {
  const previousById = new Map((previous || []).map((a) => [a.id, a]));
  for (const appt of next || []) {
    if (!isAppointmentBlockingCalendar(appt)) continue;
    if (!hasScheduleChanged(previousById.get(appt.id), appt)) continue;
    const conflict = findConflictingAppointment(next, appt);
    if (conflict) return { appointment: appt, conflict };
  }
  return undefined;
}

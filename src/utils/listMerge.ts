import { Appointment, CallReminder, Contact } from '../types';

/**
 * Merge helpers that keep the on-screen order of cards stable when
 * fresh data arrives from Supabase / the backend.
 *
 * Rebuilding the array from the server order (or sorting by createdAt on
 * every sync) made patient cards jump around the grid.
 */

export function mergeByIdPreservingOrder<T extends { id: string }>(fresh: T[], prev: T[]): T[] {
  const freshMap = new Map<string, T>();
  for (const item of fresh) {
    if (item && item.id) {
      freshMap.set(item.id, item);
    }
  }

  if (prev.length === 0) {
    return Array.from(freshMap.values());
  }

  const prevIds = new Set<string>();
  for (const item of prev) {
    if (item && item.id) prevIds.add(item.id);
  }

  const result: T[] = [];

  // New records (other device / just saved) appear first, without reshuffling the rest.
  for (const item of fresh) {
    if (item && item.id && !prevIds.has(item.id)) {
      result.push(item);
    }
  }

  for (const item of prev) {
    if (!item || !item.id) continue;
    result.push(freshMap.get(item.id) ?? item);
  }

  return result;
}

export function pickIfUnchanged<T extends { id: string }>(
  prev: T[],
  next: T[],
  isSameItem: (a: T, b: T) => boolean
): T[] {
  if (prev === next) return prev;
  if (prev.length !== next.length) return next;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id || !isSameItem(prev[i], next[i])) {
      return next;
    }
  }
  return prev;
}

export function isSameContactRecord(a: Contact, b: Contact): boolean {
  return (
    a.fullName === b.fullName &&
    a.primaryPhone === b.primaryPhone &&
    a.altPhone === b.altPhone &&
    a.email === b.email &&
    a.address === b.address &&
    a.insuranceName === b.insuranceName &&
    a.affiliateNumber === b.affiliateNumber &&
    a.observations === b.observations &&
    a.isParticular === b.isParticular &&
    a.isFavorite === b.isFavorite &&
    a.avatarColor === b.avatarColor
  );
}

export function isSameAppointmentRecord(a: Appointment, b: Appointment): boolean {
  return (
    a.contactId === b.contactId &&
    a.date === b.date &&
    a.time === b.time &&
    a.durationMinutes === b.durationMinutes &&
    a.motive === b.motive &&
    a.dentist === b.dentist &&
    a.completed === b.completed &&
    (a.whatsappStatus || null) === (b.whatsappStatus || null) &&
    (a.whatsappLastReply || null) === (b.whatsappLastReply || null) &&
    a.ingresos === b.ingresos &&
    a.descartables === b.descartables &&
    a.estampillas === b.estampillas &&
    a.materiales === b.materiales &&
    a.mecanicoDental === b.mecanicoDental &&
    a.porcentajeHonorario === b.porcentajeHonorario
  );
}

export function isSameReminderRecord(a: CallReminder, b: CallReminder): boolean {
  return (
    a.contactId === b.contactId &&
    a.date === b.date &&
    a.time === b.time &&
    (a.note || '') === (b.note || '') &&
    a.completed === b.completed
  );
}

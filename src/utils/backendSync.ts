import { Contact, Appointment, CallReminder, ContactNote, ContactAttachment, InsuranceFolderFile } from '../types';

/**
 * Sync entire dataset or subset to our own backend (Express + Postgres),
 * protegido por sesión (cookie de login). Reemplaza el sync directo a Supabase.
 */
export async function syncToSupabase(data: {
  contacts?: Contact[];
  appointments?: Appointment[];
  reminders?: CallReminder[];
  notes?: ContactNote[];
  attachments?: ContactAttachment[];
  insuranceFiles?: InsuranceFolderFile[];
}): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/agenda', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString(),
        sourceDevice: navigator.userAgent,
      }),
    });
    if (!res.ok) {
      console.warn('Backend sync failed with status:', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Backend sync notice:', err);
    return false;
  }
}

/**
 * Fetch all records from our backend.
 */
export async function fetchFromSupabase(): Promise<{
  contacts?: Contact[];
  appointments?: Appointment[];
  reminders?: CallReminder[];
  notes?: ContactNote[];
  insuranceFiles?: InsuranceFolderFile[];
} | null> {
  try {
    const res = await fetch('/api/sync/agenda', { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    return json.data;
  } catch (err) {
    console.error('Backend fetch notice:', err);
    return null;
  }
}

/**
 * Delete a specific appointment: leemos el estado actual, sacamos el item, reenviamos.
 * (Se mantiene por compatibilidad; para borrados nuevos usar deleteAppointmentRemote.)
 */
export async function deleteAppointmentFromSupabase(appointmentId: string): Promise<void> {
  try {
    const current = await fetchFromSupabase();
    if (!current?.appointments) return;
    const updated = current.appointments.filter((a) => a.id !== appointmentId);
    await syncToSupabase({ appointments: updated });
  } catch (e) {
    console.warn('Could not delete appointment from backend:', e);
  }
}

export async function deleteReminderFromSupabase(reminderId: string): Promise<void> {
  try {
    const current = await fetchFromSupabase();
    if (!current?.reminders) return;
    const updated = current.reminders.filter((r) => r.id !== reminderId);
    await syncToSupabase({ reminders: updated });
  } catch (e) {
    console.warn('Could not delete reminder from backend:', e);
  }
}

export async function clearRemindersFromSupabase(): Promise<void> {
  try {
    await syncToSupabase({ reminders: [] });
  } catch (e) {
    console.warn('Could not clear reminders from backend:', e);
  }
}

export async function clearAllFromSupabase(): Promise<void> {
  try {
    await fetch('/api/db/clear', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'all', confirm: 'BORRAR' }),
    });
  } catch (e) {
    console.warn('Could not clear all from backend:', e);
  }
}

export async function clearAppointmentsFromSupabase(): Promise<void> {
  try {
    await fetch('/api/db/clear', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'appointments_only', confirm: 'BORRAR' }),
    });
  } catch (e) {
    console.warn('Could not clear appointments from backend:', e);
  }
}

/**
 * Realtime via SSE (Server-Sent Events) en vez de Supabase Realtime.
 * El backend ya expone /api/sync/events con broadcast en cada cambio.
 */
export function subscribeToSupabaseRealtime(onEvent: (payload: any) => void): () => void {
  let es: EventSource | null = null;
  try {
    es = new EventSource('/api/sync/events', { withCredentials: true } as any);
    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        if (parsed && parsed.type) {
          onEvent(parsed);
        }
      } catch {}
    };
    es.onerror = () => {
      // El navegador reintenta solo; no hace falta manejo extra.
    };
  } catch (err) {
    console.warn('SSE subscription note:', err);
  }

  return () => {
    if (es) es.close();
  };
}

// -------------------------------------------------------------
// Endpoints por registro individual (Postgres = fuente de verdad).
// Evitan que un dispositivo pise los cambios de otro: cada guardado
// o borrado toca UN SOLO registro por id, no la lista completa.
// -------------------------------------------------------------

export interface SaveResult {
  ok: boolean;
  status: number;
  error?: string;
  /** Present on 409: the appointment that overlaps. */
  conflict?: { id: string; date: string; time: string; dentist?: string };
}

async function postRecord(url: string, body: unknown): Promise<SaveResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true, status: res.status };
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // respuesta sin JSON
    }
    return {
      ok: false,
      status: res.status,
      error: json?.error || `El servidor respondió ${res.status}.`,
      conflict: json?.conflict,
    };
  } catch (e) {
    console.warn(`POST ${url} error:`, e);
    return { ok: false, status: 0, error: 'Sin conexión con el servidor. El cambio quedó solo en este dispositivo.' };
  }
}

export interface FreshList<T> {
  records: T[];
  /** Ids deleted on the server: must be removed from the local copy too. */
  deletedIds: string[];
}

/** Returns null when the server could not be read (so callers don't mistake an error for "empty"). */
async function fetchFresh<T>(url: string, key: string): Promise<FreshList<T> | null> {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.success) return null;
    return { records: json[key] || [], deletedIds: json.deletedIds || [] };
  } catch {
    return null;
  }
}

export function upsertContact(contact: Contact): Promise<SaveResult> {
  return postRecord('/api/contacts', contact);
}

export async function deleteContactRemote(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/contacts/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    return res.ok;
  } catch (e) {
    console.warn('deleteContactRemote error:', e);
    return false;
  }
}

export function fetchContactsFresh(): Promise<FreshList<Contact> | null> {
  return fetchFresh<Contact>('/api/contacts', 'contacts');
}

/**
 * @param force true only when the user explicitly chose "Agendar de todos modos"
 * after the overlap warning; the server validates it.
 */
export function upsertAppointment(appointment: Appointment, options: { force?: boolean } = {}): Promise<SaveResult> {
  return postRecord('/api/appointments', options.force ? { ...appointment, force: true } : appointment);
}

export async function deleteAppointmentRemote(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    return res.ok;
  } catch (e) {
    console.warn('deleteAppointmentRemote error:', e);
    return false;
  }
}

export function fetchAppointmentsFresh(): Promise<FreshList<Appointment> | null> {
  return fetchFresh<Appointment>('/api/appointments', 'appointments');
}

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
}) {
  try {
    await fetch('/api/sync/agenda', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString(),
        sourceDevice: navigator.userAgent,
      }),
    });
  } catch (err) {
    console.error('Backend sync notice:', err);
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
      body: JSON.stringify({}),
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
      body: JSON.stringify({ target: 'appointments_only' }),
    });
  } catch (e) {
    console.warn('Could not clear appointments from backend:', e);
  }
}

/**
 * Realtime via SSE (Server-Sent Events) en vez de Supabase Realtime.
 * El backend ya expone /api/sync/events con broadcast en cada cambio.
 */
export function subscribeToSupabaseRealtime(onSync: () => void): () => void {
  let es: EventSource | null = null;
  try {
    es = new EventSource('/api/sync/events', { withCredentials: true } as any);
    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        if (parsed.type === 'AGENDA_UPDATE' || parsed.type === 'INITIAL_SYNC' || parsed.type === 'INSURANCE_FILES_UPDATE') {
          onSync();
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

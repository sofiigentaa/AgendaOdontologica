import { supabase } from '../supabaseClient';
import { Contact, Appointment, CallReminder, ContactNote, ContactAttachment, InsuranceFolderFile } from '../types';

/**
 * Sync entire dataset or subset directly to Supabase
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
    if (data.contacts && data.contacts.length > 0) {
      const payload = data.contacts.map((c) => ({
        id: c.id,
        full_name: c.fullName,
        is_particular: c.isParticular ?? true,
        insurance_name: c.insuranceName || null,
        affiliate_number: c.affiliateNumber || null,
        primary_phone: c.primaryPhone,
        alt_phone: c.altPhone || null,
        email: c.email || null,
        address: c.address || null,
        observations: c.observations || null,
        is_favorite: c.isFavorite ?? false,
        avatar_color: c.avatarColor || null,
        created_at: c.createdAt || new Date().toISOString(),
        updated_at: c.updatedAt || new Date().toISOString(),
      }));
      await supabase.from('contacts').upsert(payload, { onConflict: 'id' });
    }

    if (data.appointments && data.appointments.length > 0) {
      const payload = data.appointments.map((a) => ({
        id: a.id,
        contact_id: a.contactId,
        date: a.date,
        time: a.time,
        duration_minutes: a.durationMinutes || 30,
        motive: a.motive || '',
        dentist: a.dentist || 'Yani',
        completed: a.completed ?? false,
        created_at: a.createdAt || new Date().toISOString(),
        ingresos: a.ingresos || 0,
        descartables: a.descartables || 0,
        estampillas: a.estampillas || 0,
        materiales: a.materiales || 0,
        mecanico_dental: a.mecanicoDental || 0,
        porcentaje_honorario: a.porcentajeHonorario || 50,
      }));
      await supabase.from('appointments').upsert(payload, { onConflict: 'id' });
    }

    if (data.reminders && data.reminders.length > 0) {
      const payload = data.reminders.map((r) => ({
        id: r.id,
        contact_id: r.contactId,
        date: r.date,
        time: r.time,
        note: r.note || '',
        completed: r.completed ?? false,
        created_at: r.createdAt || new Date().toISOString(),
      }));
      await supabase.from('call_reminders').upsert(payload, { onConflict: 'id' });
    }

    if (data.notes && data.notes.length > 0) {
      const payload = data.notes.map((n) => ({
        id: n.id,
        contact_id: n.contactId,
        text: n.text,
        color: n.color || null,
        created_at: n.createdAt || new Date().toISOString(),
      }));
      await supabase.from('contact_notes').upsert(payload, { onConflict: 'id' });
    }

    if (data.insuranceFiles && data.insuranceFiles.length > 0) {
      const payload = data.insuranceFiles.map((f) => ({
        id: f.id,
        insurance_name: f.insuranceName || 'General',
        title: f.title || f.fileName || 'Archivo',
        file_name: f.fileName,
        file_size: f.fileSize,
        file_type: f.fileType,
        data_url: f.dataUrl,
        notes: f.notes || null,
        created_at: f.createdAt || new Date().toISOString(),
      }));
      await supabase.from('insurance_files').upsert(payload, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Supabase sync notice:', err);
  }
}

/**
 * Fetch all records from Supabase
 */
export async function fetchFromSupabase(): Promise<{
  contacts?: Contact[];
  appointments?: Appointment[];
  reminders?: CallReminder[];
  notes?: ContactNote[];
  insuranceFiles?: InsuranceFolderFile[];
} | null> {
  try {
    const [contactsRes, appointmentsRes, remindersRes, notesRes, filesRes] = await Promise.all([
      supabase.from('contacts').select('*'),
      supabase.from('appointments').select('*'),
      supabase.from('call_reminders').select('*'),
      supabase.from('contact_notes').select('*'),
      supabase.from('insurance_files').select('*'),
    ]);

    const result: {
      contacts?: Contact[];
      appointments?: Appointment[];
      reminders?: CallReminder[];
      notes?: ContactNote[];
      insuranceFiles?: InsuranceFolderFile[];
    } = {};

    if (contactsRes.data && contactsRes.data.length > 0) {
      result.contacts = contactsRes.data.map((row: any) => ({
        id: row.id,
        fullName: row.full_name,
        isParticular: row.is_particular,
        insuranceName: row.insurance_name,
        affiliateNumber: row.affiliate_number,
        primaryPhone: row.primary_phone,
        altPhone: row.alt_phone,
        email: row.email,
        address: row.address,
        observations: row.observations,
        isFavorite: row.is_favorite,
        avatarColor: row.avatar_color,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    if (appointmentsRes.data && appointmentsRes.data.length > 0) {
      result.appointments = appointmentsRes.data.map((row: any) => ({
        id: row.id,
        contactId: row.contact_id,
        date: row.date,
        time: row.time,
        durationMinutes: row.duration_minutes,
        motive: row.motive,
        dentist: row.dentist,
        completed: row.completed,
        createdAt: row.created_at,
        ingresos: Number(row.ingresos || 0),
        descartables: Number(row.descartables || 0),
        estampillas: Number(row.estampillas || 0),
        materiales: Number(row.materiales || 0),
        mecanicoDental: Number(row.mecanico_dental || 0),
        porcentajeHonorario: Number(row.porcentaje_honorario || 50),
      }));
    }

    if (remindersRes.data && remindersRes.data.length > 0) {
      result.reminders = remindersRes.data.map((row: any) => ({
        id: row.id,
        contactId: row.contact_id,
        date: row.date,
        time: row.time,
        note: row.note,
        completed: row.completed,
        createdAt: row.created_at,
      }));
    }

    if (notesRes.data && notesRes.data.length > 0) {
      result.notes = notesRes.data.map((row: any) => ({
        id: row.id,
        contactId: row.contact_id,
        text: row.text,
        color: row.color,
        createdAt: row.created_at,
      }));
    }

    if (filesRes.data && filesRes.data.length > 0) {
      result.insuranceFiles = filesRes.data.map((row: any) => ({
        id: row.id,
        insuranceName: row.insurance_name,
        title: row.title,
        fileName: row.file_name,
        fileSize: row.file_size,
        fileType: row.file_type,
        dataUrl: row.data_url,
        notes: row.notes,
        createdAt: row.created_at,
      }));
    }

    return (result.contacts || result.appointments || result.reminders || result.notes || result.insuranceFiles) ? result : null;
  } catch (err) {
    console.warn('Supabase fetch notice:', err);
    return null;
  }
}

/**
 * Subscribe directly to Supabase Realtime Channels with robust background sync fallback
 */
export function subscribeToSupabaseRealtime(onSync: () => void): () => void {
  let active = true;
  let channel: any = null;

  try {
    channel = supabase
      .channel('agenda-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        if (active) onSync();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        if (active) onSync();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_reminders' }, () => {
        if (active) onSync();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_notes' }, () => {
        if (active) onSync();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insurance_files' }, () => {
        if (active) onSync();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected successfully
        }
      });
  } catch (err) {
    console.warn('Supabase Realtime subscription note:', err);
  }

  // Periodic heartbeat sync fallback (every 8s) to ensure cross-device consistency
  const pollInterval = setInterval(() => {
    if (active) {
      onSync();
    }
  }, 8000);

  return () => {
    active = false;
    clearInterval(pollInterval);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch {}
    }
  };
}


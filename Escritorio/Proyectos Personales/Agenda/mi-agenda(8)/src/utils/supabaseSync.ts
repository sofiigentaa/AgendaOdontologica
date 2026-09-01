import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Contact, Appointment, CallReminder, ContactNote, ContactAttachment, InsuranceFolderFile } from '../types';
import { INITIAL_CONTACTS, INITIAL_APPOINTMENTS } from '../data/sampleContacts';

const initialContactsMap = new Map<string, Contact>();
INITIAL_CONTACTS.forEach((c) => initialContactsMap.set(c.id, c));

/**
 * Sync entire dataset or subset directly to Supabase with comprehensive column schema support
 */
export async function syncToSupabase(data: {
  contacts?: Contact[];
  appointments?: Appointment[];
  reminders?: CallReminder[];
  notes?: ContactNote[];
  attachments?: ContactAttachment[];
  insuranceFiles?: InsuranceFolderFile[];
}) {
  if (!isSupabaseConfigured) {
    return;
  }
  try {
    if (data.contacts && data.contacts.length > 0) {
      const payload = data.contacts.map((c) => ({
        id: c.id,
        name: c.fullName || '',
        full_name: c.fullName || '',
        phone: c.primaryPhone || '',
        primary_phone: c.primaryPhone || '',
        alt_phone: c.altPhone || '',
        email: c.email || '',
        address: c.address || '',
        notes: JSON.stringify(c),
        observations: c.observations || '',
        insurance: c.insuranceName || (c.isParticular ? 'Particular' : ''),
        insurance_name: c.insuranceName || (c.isParticular ? 'Particular' : ''),
        affiliate_number: c.affiliateNumber || '',
        avatar: c.avatarColor || '',
        avatar_color: c.avatarColor || '',
        is_particular: c.isParticular ?? true,
        is_favorite: c.isFavorite ?? false,
        created_at: c.createdAt || new Date().toISOString(),
        updated_at: c.updatedAt || new Date().toISOString(),
      }));

      // Try full schema first, fallback to standard compatible text fields
      const res = await supabase.from('contacts').upsert(payload, { onConflict: 'id' });
      if (res.error) {
        const minimal = data.contacts.map((c) => ({
          id: c.id,
          name: c.fullName || '',
          phone: c.primaryPhone || '',
          email: c.email || '',
          notes: JSON.stringify(c),
          insurance: c.insuranceName || (c.isParticular ? 'Particular' : ''),
          avatar: c.avatarColor || '',
          created_at: c.createdAt || new Date().toISOString(),
        }));
        await supabase.from('contacts').upsert(minimal, { onConflict: 'id' });
      }
    }

    if (data.appointments && data.appointments.length > 0) {
      const payload = data.appointments.map((a) => {
        return {
          id: a.id,
          contact_id: a.contactId,
          contact_name: a.motive || '',
          title: a.dentist || 'Marie',
          dentist: a.dentist || 'Marie',
          date: a.date,
          time: a.time,
          duration: a.durationMinutes || 30,
          duration_minutes: a.durationMinutes || 30,
          treatment: a.motive || '',
          motive: a.motive || '',
          notes: JSON.stringify(a),
          status: a.completed ? 'completed' : a.whatsappStatus === 'cancelled' ? 'cancelled' : 'scheduled',
          completed: Boolean(a.completed),
          color: a.whatsappStatus === 'confirmed' ? '#10b981' : a.whatsappStatus === 'cancelled' ? '#ef4444' : '#3b82f6',
          whatsapp_status: a.whatsappStatus || null,
          whatsapp_last_reply: a.whatsappLastReply || null,
          ingresos: a.ingresos || 0,
          descartables: a.descartables || 0,
          estampillas: a.estampillas || 0,
          materiales: a.materiales || 0,
          mecanico_dental: a.mecanicoDental || 0,
          porcentaje_honorario: a.porcentajeHonorario || 50,
          created_at: a.createdAt || new Date().toISOString(),
        };
      });

      const res = await supabase.from('appointments').upsert(payload, { onConflict: 'id' });
      if (res.error) {
        const minimal = data.appointments.map((a) => ({
          id: a.id,
          contact_id: a.contactId,
          contact_name: a.motive || '',
          title: a.dentist || 'Marie',
          date: a.date,
          time: a.time,
          duration: a.durationMinutes || 30,
          treatment: a.motive || '',
          notes: JSON.stringify(a),
          status: a.completed ? 'completed' : a.whatsappStatus === 'cancelled' ? 'cancelled' : a.whatsappStatus === 'confirmed' ? 'confirmed' : 'scheduled',
          color: a.whatsappStatus === 'confirmed' ? '#10b981' : a.whatsappStatus === 'cancelled' ? '#ef4444' : '#3b82f6',
          created_at: a.createdAt || new Date().toISOString(),
        }));
        await supabase.from('appointments').upsert(minimal, { onConflict: 'id' });
      }
    }

    if (data.reminders && data.reminders.length > 0) {
      const payload = data.reminders.map((r) => ({
        id: r.id,
        contact_id: r.contactId,
        contact_name: '',
        phone: '',
        reason: r.note || '',
        note: JSON.stringify(r),
        date: r.date,
        time: r.time,
        completed: Boolean(r.completed),
        created_at: r.createdAt || new Date().toISOString(),
      }));
      const res = await supabase.from('call_reminders').upsert(payload, { onConflict: 'id' });
      if (res.error) {
        const minimal = data.reminders.map((r) => ({
          id: r.id,
          contact_id: r.contactId,
          contact_name: '',
          phone: '',
          reason: r.note || '',
          date: r.date,
          time: r.time,
          completed: Boolean(r.completed),
          created_at: r.createdAt || new Date().toISOString(),
        }));
        await supabase.from('call_reminders').upsert(minimal, { onConflict: 'id' });
      }
    }

    if (data.notes && data.notes.length > 0) {
      const payload = data.notes.map((n) => ({
        id: n.id,
        contact_id: n.contactId,
        text: n.text,
        color: n.color || 'yellow',
        created_at: n.createdAt || new Date().toISOString(),
      }));
      await supabase.from('contact_notes').upsert(payload, { onConflict: 'id' });
    }

    if (data.insuranceFiles && data.insuranceFiles.length > 0) {
      const payload = data.insuranceFiles.map((f) => ({
        id: f.id,
        insurance: f.insuranceName || 'General',
        insurance_name: f.insuranceName || 'General',
        name: f.title || f.fileName || 'Archivo',
        title: f.title || f.fileName || 'Archivo',
        file_name: f.fileName || 'Archivo',
        size: String(f.fileSize || 0),
        file_size: f.fileSize || 0,
        type: f.fileType || '',
        file_type: f.fileType || '',
        data: f.dataUrl || '',
        data_url: f.dataUrl || '',
        uploaded_at: f.createdAt || new Date().toISOString(),
        created_at: f.createdAt || new Date().toISOString(),
      }));
      const res = await supabase.from('insurance_files').upsert(payload, { onConflict: 'id' });
      if (res.error) {
        const minimal = data.insuranceFiles.map((f) => ({
          id: f.id,
          insurance: f.insuranceName || 'General',
          name: f.title || f.fileName || 'Archivo',
          size: String(f.fileSize || 0),
          type: f.fileType || '',
          data: f.dataUrl || '',
          uploaded_at: f.createdAt || new Date().toISOString(),
          created_at: f.createdAt || new Date().toISOString(),
        }));
        await supabase.from('insurance_files').upsert(minimal, { onConflict: 'id' });
      }
    }
  } catch (err) {
    console.error('Supabase sync notice:', err);
  }
}

/**
 * Delete a specific appointment directly from Supabase table
 */
export async function deleteAppointmentFromSupabase(appointmentId: string): Promise<void> {
  try {
    await supabase.from('appointments').delete().eq('id', appointmentId);
  } catch (e) {
    console.warn('Could not delete appointment from Supabase:', e);
  }
}

/**
 * Delete a specific call reminder directly from Supabase table
 */
export async function deleteReminderFromSupabase(reminderId: string): Promise<void> {
  try {
    await supabase.from('call_reminders').delete().eq('id', reminderId);
  } catch (e) {
    console.warn('Could not delete reminder from Supabase:', e);
  }
}

/**
 * Delete all call reminders directly from Supabase table
 */
export async function clearRemindersFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('call_reminders').delete().neq('id', '___none___');
  } catch (e) {
    console.warn('Could not clear reminders from Supabase:', e);
  }
}

/**
 * Delete all contacts, appointments, reminders, notes and files from Supabase table
 */
export async function clearAllFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await Promise.allSettled([
      supabase.from('call_reminders').delete().neq('id', '___none___'),
      supabase.from('contact_notes').delete().neq('id', '___none___'),
      supabase.from('contact_attachments').delete().neq('id', '___none___'),
      supabase.from('insurance_files').delete().neq('id', '___none___'),
      supabase.from('appointments').delete().neq('id', '___none___'),
      supabase.from('contacts').delete().neq('id', '___none___'),
    ]);
  } catch (e) {
    console.warn('Could not clear all from Supabase:', e);
  }
}

export async function clearAppointmentsFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('appointments').delete().neq('id', '___none___');
  } catch (e) {
    console.warn('Could not clear appointments from Supabase:', e);
  }
}

/**
 * Fetch all records from Supabase with resilient fallbacks and alias resolution
 */
export async function fetchFromSupabase(): Promise<{
  contacts?: Contact[];
  appointments?: Appointment[];
  reminders?: CallReminder[];
  notes?: ContactNote[];
  insuranceFiles?: InsuranceFolderFile[];
} | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
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
      result.contacts = contactsRes.data.map((row: any) => {
        let parsedNotesObj: any = null;
        try {
          if (row.notes && typeof row.notes === 'string' && row.notes.startsWith('{')) {
            parsedNotesObj = JSON.parse(row.notes);
          }
        } catch {}

        let name = (
          row.fullName ||
          row.full_name ||
          row.name ||
          row.contact_name ||
          parsedNotesObj?.fullName ||
          ''
        ).trim();
        let phone = row.primaryPhone || row.primary_phone || row.phone || parsedNotesObj?.primaryPhone || '';
        let altPhone = row.altPhone || row.alt_phone || parsedNotesObj?.altPhone || '';
        let email = row.email || parsedNotesObj?.email || '';
        let address = row.address || parsedNotesObj?.address || '';
        let insurance = row.insuranceName || row.insurance_name || row.insurance || parsedNotesObj?.insuranceName || '';
        let affiliateNumber = row.affiliateNumber || row.affiliate_number || parsedNotesObj?.affiliateNumber || '';
        let observations = parsedNotesObj ? (parsedNotesObj.observations || '') : (row.observations || row.notes || row.note || '');
        let avatar = row.avatarColor || row.avatar_color || row.avatar || parsedNotesObj?.avatarColor || '';
        let isParticular = parsedNotesObj?.isParticular ?? (row.isParticular ?? row.is_particular ?? (insurance === 'Particular' || !insurance));
        let isFavorite = Boolean(parsedNotesObj?.isFavorite ?? (row.isFavorite ?? row.is_favorite ?? false));

        // Auto-heal if contact name was empty
        if (!name && initialContactsMap.has(row.id)) {
          const fallback = initialContactsMap.get(row.id)!;
          name = fallback.fullName;
          if (!phone) phone = fallback.primaryPhone;
          if (!insurance) insurance = fallback.insuranceName || '';
          if (!observations) observations = fallback.observations || '';
          if (!avatar) avatar = fallback.avatarColor || '';
        }

        return {
          id: row.id,
          fullName: name,
          isParticular: isParticular,
          insuranceName: insurance,
          affiliateNumber: affiliateNumber,
          primaryPhone: phone,
          altPhone: altPhone,
          email: email,
          address: address,
          observations: observations,
          isFavorite: isFavorite,
          avatarColor: avatar || undefined,
          createdAt: row.createdAt || row.created_at || parsedNotesObj?.createdAt || new Date().toISOString(),
          updatedAt: row.updatedAt || row.updated_at || parsedNotesObj?.updatedAt || new Date().toISOString(),
        };
      }).filter((c: any) => c && c.id && !c.id.startsWith('sample-') && !c.id.startsWith('demo-'));
    }

    if (appointmentsRes.data && appointmentsRes.data.length > 0) {
      const activeRows: any[] = [];
      
      for (const row of appointmentsRes.data) {
        if (row.id && (row.id.startsWith('appt-sample-') || row.id.startsWith('sample-') || row.contact_id?.startsWith('sample-') || row.contactId?.startsWith('sample-'))) {
          continue;
        }
        let rawObj: any = {};
        try {
          if (row.notes && typeof row.notes === 'string' && row.notes.startsWith('{')) {
            rawObj = JSON.parse(row.notes);
          }
        } catch {}

        const whatsappStatus = 
          row.whatsapp_status || 
          row.whatsappStatus || 
          (row.status === 'confirmed' ? 'confirmed' : null) ||
          (row.status === 'cancelled' ? 'cancelled' : null) ||
          rawObj.whatsappStatus || 
          (rawObj.status === 'confirmed' ? 'confirmed' : null) ||
          (rawObj.status === 'cancelled' ? 'cancelled' : null) ||
          null;

        const contactId = row.contactId || row.contact_id || row.patient_id || rawObj.contactId || '';
        const date = row.date || rawObj.date || '';
        const time = row.time || rawObj.time || '';
        const motive = row.motive || row.treatment || rawObj.motive || row.contact_name || row.title || 'Consulta';
        const dentist = row.dentist || rawObj.dentist || (row.title === 'Marie' || row.title === 'Yani' || row.title === 'Ambas' ? row.title : 'Marie');
        const duration = Number(row.durationMinutes || row.duration_minutes || row.duration || rawObj.durationMinutes || 30);
        const completed = Boolean(row.completed === true || row.status === 'completed' || rawObj.completed === true);
        const whatsappLastReply = row.whatsapp_last_reply || row.whatsappLastReply || rawObj.whatsappLastReply || null;

        activeRows.push({
          id: row.id,
          contactId: contactId,
          date: date,
          time: time,
          durationMinutes: duration,
          motive: motive,
          dentist: dentist,
          completed: completed,
          whatsappStatus: whatsappStatus,
          whatsappLastReply: whatsappLastReply,
          createdAt: row.createdAt || row.created_at || rawObj.createdAt || new Date().toISOString(),
          ingresos: Number(row.ingresos ?? rawObj.ingresos ?? 0),
          descartables: Number(row.descartables ?? rawObj.descartables ?? 0),
          estampillas: Number(row.estampillas ?? rawObj.estampillas ?? 0),
          materiales: Number(row.materiales ?? rawObj.materiales ?? 0),
          mecanicoDental: Number(row.mecanicoDental ?? row.mecanico_dental ?? rawObj.mecanicoDental ?? 0),
          porcentajeHonorario: Number(row.porcentajeHonorario ?? row.porcentaje_honorario ?? rawObj.porcentajeHonorario ?? 50),
        });
      }

      result.appointments = activeRows;
    }

    if (!remindersRes.error && Array.isArray(remindersRes.data)) {
      result.reminders = remindersRes.data.map((row: any) => {
        let rawRem: any = {};
        try {
          if (row.note && typeof row.note === 'string' && row.note.startsWith('{')) {
            rawRem = JSON.parse(row.note);
          }
        } catch {}
        return {
          id: row.id,
          contactId: row.contactId || row.contact_id || rawRem.contactId || '',
          date: row.date || rawRem.date || '',
          time: row.time || rawRem.time || '',
          note: rawRem.note || row.reason || (row.note && !row.note.startsWith('{') ? row.note : '') || '',
          completed: Boolean(row.completed || rawRem.completed),
          createdAt: row.createdAt || row.created_at || rawRem.createdAt || new Date().toISOString(),
        };
      });
    }

    if (notesRes.data && notesRes.data.length > 0) {
      result.notes = notesRes.data.map((row: any) => ({
        id: row.id,
        contactId: row.contactId || row.contact_id || '',
        text: row.text || '',
        color: row.color || 'yellow',
        createdAt: row.createdAt || row.created_at || new Date().toISOString(),
      }));
    }

    if (filesRes.data && filesRes.data.length > 0) {
      result.insuranceFiles = filesRes.data.map((row: any) => ({
        id: row.id,
        insuranceName: row.insurance || row.insurance_name || 'General',
        title: row.name || row.title || 'Archivo',
        fileName: row.name || row.file_name || 'Archivo',
        fileSize: Number(row.size || row.file_size) || 0,
        fileType: row.type || row.file_type || '',
        dataUrl: row.data || row.data_url || '',
        notes: row.notes || '',
        createdAt: row.createdAt || row.created_at || new Date().toISOString(),
      }));
    }

    return (result.contacts || result.appointments || result.reminders || result.notes || result.insuranceFiles) ? result : null;
  } catch (err) {
    console.error('Supabase fetch notice:', err);
    return null;
  }
}

/**
 * Subscribe directly to Supabase Realtime Channels with robust background sync fallback
 */
export function subscribeToSupabaseRealtime(onSync: () => void): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }
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

  // Periodic heartbeat sync fallback (every 10s) to ensure cross-device consistency
  const pollInterval = setInterval(() => {
    if (active) {
      onSync();
    }
  }, 10000);

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


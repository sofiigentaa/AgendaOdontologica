import { Contact, CallReminder, ContactNote, ContactAttachment, Appointment, InsuranceFolderFile } from '../types';
import { INITIAL_CONTACTS, INITIAL_REMINDERS, INITIAL_NOTES, INITIAL_ATTACHMENTS, INITIAL_APPOINTMENTS, INITIAL_INSURANCE_FILES } from '../data/sampleContacts';
import { saveAllInsuranceFilesToIDB } from './idbStorage';
import { syncToFirestore, fetchFromFirestore } from '../services/firebaseFirestore';
import { clearAllFromSupabase, clearAppointmentsFromSupabase, clearRemindersFromSupabase, syncToSupabase } from './supabaseSync';

const CONTACTS_KEY = 'mi_agenda_contacts_v6';
const REMINDERS_KEY = 'mi_agenda_reminders_v6';
const NOTES_KEY = 'mi_agenda_notes_v6';
const ATTACHMENTS_KEY = 'mi_agenda_attachments_v6';
const APPOINTMENTS_KEY = 'mi_agenda_appointments_v6';
const INSURANCE_FILES_KEY = 'mi_agenda_insurance_files_v6';

// Purge any legacy sample data stored under old keys
if (typeof window !== 'undefined') {
  try {
    const isPurged = localStorage.getItem('mi_agenda_purged_v6');
    if (!isPurged) {
      // Remove all legacy mock datasets from v1 to v5
      const legacyPrefixes = [
        'mi_agenda_contacts',
        'mi_agenda_reminders',
        'mi_agenda_notes',
        'mi_agenda_attachments',
        'mi_agenda_appointments',
        'mi_agenda_insurance_files',
      ];
      
      // Collect all keys first to safely remove them without index shifting issues
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) allKeys.push(key);
      }
      
      allKeys.forEach((key) => {
        if (
          legacyPrefixes.some((p) => key.startsWith(p)) ||
          key.startsWith('mi_agenda_') ||
          key.startsWith('auth_')
        ) {
          localStorage.removeItem(key);
        }
      });
      
      // Initialize v6 keys to empty arrays
      localStorage.setItem(CONTACTS_KEY, JSON.stringify([]));
      localStorage.setItem(REMINDERS_KEY, JSON.stringify([]));
      localStorage.setItem(NOTES_KEY, JSON.stringify([]));
      localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify([]));
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([]));
      localStorage.setItem(INSURANCE_FILES_KEY, JSON.stringify([]));
      
      localStorage.setItem('mi_agenda_purged_v6', 'true');
      
      // Wipe sample data from Supabase & Firestore in background
      clearAllFromSupabase().catch(() => {});
      syncToFirestore({
        contacts: [],
        appointments: [],
        reminders: [],
        notes: [],
        attachments: [],
        insuranceFiles: [],
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('Purge legacy storage check failed:', e);
  }
}

const initialContactsMap = new Map<string, Contact>();
INITIAL_CONTACTS.forEach((c) => initialContactsMap.set(c.id, c));

// Contacts
export function getStoredContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) {
      return [];
    }
    const contacts: Contact[] = JSON.parse(raw);
    if (!Array.isArray(contacts)) {
      return [];
    }
    // Filter out any legacy sample contacts (IDs starting with 'sample-' or 'demo-')
    const cleaned = contacts.filter((c) => c && c.id && !c.id.startsWith('sample-') && !c.id.startsWith('demo-'));
    if (cleaned.length !== contacts.length) {
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Error reading contacts', e);
    return [];
  }
}

export function saveStoredContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    syncToCloudDatabase({ contacts });
  } catch (e) {
    console.error('Error saving contacts', e);
  }
}

// Reminders
export function getStoredReminders(): CallReminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (!raw) {
      return [];
    }
    const reminders: CallReminder[] = JSON.parse(raw);
    if (!Array.isArray(reminders)) {
      return [];
    }
    const cleaned = reminders.filter((r) => r && r.id && !r.id.startsWith('rem-sample-') && !r.id.startsWith('sample-') && !r.contactId?.startsWith('sample-'));
    if (cleaned.length !== reminders.length) {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Error reading reminders', e);
    return [];
  }
}

export function saveStoredReminders(reminders: CallReminder[]): void {
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    syncToCloudDatabase({ reminders });
  } catch (e) {
    console.error('Error saving reminders', e);
  }
}

// Notes
export function getStoredNotes(): ContactNote[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) {
      return [];
    }
    const notes: ContactNote[] = JSON.parse(raw);
    if (!Array.isArray(notes)) {
      return [];
    }
    const cleaned = notes.filter((n) => n && n.id && !n.contactId?.startsWith('sample-'));
    if (cleaned.length !== notes.length) {
      localStorage.setItem(NOTES_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Error reading notes', e);
    return [];
  }
}

export function saveStoredNotes(notes: ContactNote[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    syncToCloudDatabase({ notes });
  } catch (e) {
    console.error('Error saving notes', e);
  }
}

// Attachments
export function getStoredAttachments(): ContactAttachment[] {
  try {
    const raw = localStorage.getItem(ATTACHMENTS_KEY);
    if (!raw) {
      return [];
    }
    const attachments: ContactAttachment[] = JSON.parse(raw);
    if (!Array.isArray(attachments)) {
      return [];
    }
    const cleaned = attachments.filter((a) => a && a.id && !a.contactId?.startsWith('sample-'));
    if (cleaned.length !== attachments.length) {
      localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Error reading attachments', e);
    return [];
  }
}

export function saveStoredAttachments(attachments: ContactAttachment[]): void {
  try {
    localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(attachments));
    syncToCloudDatabase({ attachments });
  } catch (e) {
    console.error('Error saving attachments', e);
  }
}

// Appointments
export function getStoredAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    if (!raw) {
      return [];
    }
    const appointments = JSON.parse(raw);
    if (!Array.isArray(appointments)) {
      return [];
    }
    const cleaned = appointments.filter((a) => a && a.id && !a.id.startsWith('appt-sample-') && !a.id.startsWith('sample-') && !a.contactId?.startsWith('sample-'));
    if (cleaned.length !== appointments.length) {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Error reading appointments', e);
    return [];
  }
}

export function saveStoredAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
    syncToCloudDatabase({ appointments });
  } catch (e) {
    console.error('Error saving appointments', e);
  }
}

// Insurance Files
export function getStoredInsuranceFiles(): InsuranceFolderFile[] {
  try {
    const raw = localStorage.getItem(INSURANCE_FILES_KEY);
    if (raw === null) {
      localStorage.setItem(INSURANCE_FILES_KEY, JSON.stringify(INITIAL_INSURANCE_FILES));
      return INITIAL_INSURANCE_FILES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Filter out legacy dummy sample files (ids starting with 'ins-file-')
    const cleaned = parsed.filter((f: any) => f && f.id && !f.id.startsWith('ins-file-'));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(INSURANCE_FILES_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Error reading insurance files', e);
    return [];
  }
}

export function saveStoredInsuranceFiles(files: InsuranceFolderFile[]): void {
  // 1. Always save complete files with full content in IndexedDB
  saveAllInsuranceFilesToIDB(files).catch((e) => console.error('IndexedDB save error:', e));

  // 2. Save safe lightweight copy in localStorage (strip large dataUrls to prevent QuotaExceededError)
  try {
    const lightweightFiles = files.map((f) => ({
      ...f,
      dataUrl: f.dataUrl && f.dataUrl.length < 50000 ? f.dataUrl : '',
    }));
    localStorage.setItem(INSURANCE_FILES_KEY, JSON.stringify(lightweightFiles));
  } catch (e) {
    console.warn('LocalStorage save handled safely:', e);
  }
}

export function resetToSampleData(): void {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(INITIAL_CONTACTS));
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(INITIAL_REMINDERS));
  localStorage.setItem(NOTES_KEY, JSON.stringify(INITIAL_NOTES));
  localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(INITIAL_ATTACHMENTS));
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
  localStorage.setItem(INSURANCE_FILES_KEY, JSON.stringify(INITIAL_INSURANCE_FILES));
  syncToCloudDatabase({
    contacts: INITIAL_CONTACTS,
    reminders: INITIAL_REMINDERS,
    notes: INITIAL_NOTES,
    attachments: INITIAL_ATTACHMENTS,
    appointments: INITIAL_APPOINTMENTS,
    insuranceFiles: INITIAL_INSURANCE_FILES,
  });
}

export function clearAllAgendaData(): void {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify([]));
  localStorage.setItem(REMINDERS_KEY, JSON.stringify([]));
  localStorage.setItem(NOTES_KEY, JSON.stringify([]));
  localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify([]));
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([]));
  localStorage.setItem(INSURANCE_FILES_KEY, JSON.stringify([]));
  
  // Wipe from Supabase
  clearAllFromSupabase().catch(() => {});

  // Sync empty arrays to Firebase Firestore
  syncToFirestore({
    contacts: [],
    reminders: [],
    notes: [],
    attachments: [],
    appointments: [],
  }).catch((err) => console.warn('Error clearing Firestore:', err));

  // Call server to wipe cloud DB
  fetch('/api/db/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'all' }),
  }).catch((err) => console.warn('Error clearing cloud DB:', err));
}

export function clearAppointmentsOnly(): void {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([]));
  
  // Wipe from Supabase
  clearAppointmentsFromSupabase().catch(() => {});

  // Sync empty appointments to Firebase Firestore
  syncToFirestore({
    appointments: [],
  }).catch((err) => console.warn('Error clearing appointments in Firestore:', err));

  fetch('/api/db/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'appointments_only' }),
  }).catch((err) => console.warn('Error clearing appointments in cloud DB:', err));
}

export function clearRemindersOnly(): void {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify([]));
  
  // Wipe from Supabase
  clearRemindersFromSupabase().catch(() => {});

  // Sync empty reminders to Firebase Firestore
  syncToFirestore({
    reminders: [],
  }).catch((err) => console.warn('Error clearing reminders in Firestore:', err));

  fetch('/api/db/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'reminders_only' }),
  }).catch((err) => console.warn('Error clearing reminders in cloud DB:', err));
}

export async function syncToCloudDatabase(data: {
  contacts?: Contact[];
  appointments?: Appointment[];
  reminders?: CallReminder[];
  notes?: ContactNote[];
  attachments?: ContactAttachment[];
  insuranceFiles?: InsuranceFolderFile[];
}) {
  // Sync to Firebase Firestore if available
  syncToFirestore(data).catch((err) => console.warn('Firestore sync error:', err));

  try {
    // Direct unified API for immediate cross-device sync and disk persistence
    await fetch('/api/sync/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString(),
        sourceDevice: typeof window !== 'undefined' ? (window.navigator?.userAgent?.includes('Mobile') ? 'mobile' : 'desktop') : 'unknown',
      }),
    });
  } catch (err) {
    // Fallback error logging
  }
}

export async function fetchFromCloudDatabase(): Promise<{
  contacts?: Contact[];
  appointments?: Appointment[];
  reminders?: CallReminder[];
  notes?: ContactNote[];
  attachments?: ContactAttachment[];
  insuranceFiles?: InsuranceFolderFile[];
} | null> {
  // 1. Fetch from unified cross-device server endpoint
  try {
    const res = await fetch('/api/sync/agenda');
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        const d = json.data;
        if ((d.contacts && d.contacts.length > 0) || (d.appointments && d.appointments.length > 0) || (d.reminders && d.reminders.length > 0) || (d.insuranceFiles && d.insuranceFiles.length > 0)) {
          return d;
        }
      }
    }
  } catch (err) {
    // Network retry fallback
  }

  // 2. Try fetching from Firebase Firestore
  try {
    const firestoreData = await fetchFromFirestore();
    if (firestoreData && (firestoreData.contacts?.length || firestoreData.appointments?.length)) {
      return firestoreData;
    }
  } catch (e) {
    console.warn('Could not fetch from Firestore:', e);
  }

  return null;
}


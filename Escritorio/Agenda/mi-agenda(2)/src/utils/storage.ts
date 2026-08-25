import { Contact, CallReminder, ContactNote, ContactAttachment, Appointment, InsuranceFolderFile } from '../types';
import { INITIAL_CONTACTS, INITIAL_REMINDERS, INITIAL_NOTES, INITIAL_ATTACHMENTS, INITIAL_APPOINTMENTS, INITIAL_INSURANCE_FILES } from '../data/sampleContacts';
import { saveAllInsuranceFilesToIDB } from './idbStorage';
import { syncToFirestore, fetchFromFirestore } from '../services/firebaseFirestore';

const CONTACTS_KEY = 'mi_agenda_contacts_v4';
const REMINDERS_KEY = 'mi_agenda_reminders_v4';
const NOTES_KEY = 'mi_agenda_notes_v4';
const ATTACHMENTS_KEY = 'mi_agenda_attachments_v4';
const APPOINTMENTS_KEY = 'mi_agenda_appointments_v4';
const INSURANCE_FILES_KEY = 'mi_agenda_insurance_files_v4';

// Contacts
export function getStoredContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) {
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(INITIAL_CONTACTS));
      return INITIAL_CONTACTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading contacts', e);
    return INITIAL_CONTACTS;
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
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(INITIAL_REMINDERS));
      return INITIAL_REMINDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading reminders', e);
    return INITIAL_REMINDERS;
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
      localStorage.setItem(NOTES_KEY, JSON.stringify(INITIAL_NOTES));
      return INITIAL_NOTES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading notes', e);
    return INITIAL_NOTES;
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
      localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(INITIAL_ATTACHMENTS));
      return INITIAL_ATTACHMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading attachments', e);
    return INITIAL_ATTACHMENTS;
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
    if (raw === null) {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
      return INITIAL_APPOINTMENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
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

export async function syncToCloudDatabase(data: {
  contacts?: Contact[];
  appointments?: Appointment[];
  reminders?: CallReminder[];
  notes?: ContactNote[];
  attachments?: ContactAttachment[];
  insuranceFiles?: InsuranceFolderFile[];
}) {
  // Sync to Firebase Firestore
  syncToFirestore(data).catch((err) => console.warn('Firestore sync error:', err));

  try {
    await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    // Cloud SQL fallback
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
  // Try fetching from Firebase Firestore first
  try {
    const firestoreData = await fetchFromFirestore();
    if (firestoreData && (firestoreData.contacts?.length || firestoreData.appointments?.length)) {
      return firestoreData;
    }
  } catch (e) {
    console.warn('Could not fetch from Firestore, falling back to server DB:', e);
  }

  try {
    const res = await fetch('/api/db/all');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}


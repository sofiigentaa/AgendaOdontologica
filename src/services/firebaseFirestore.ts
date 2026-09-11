import { Contact, CallReminder, ContactNote, ContactAttachment, Appointment, InsuranceFolderFile } from '../types';

export interface AgendaCloudPayload {
  contacts?: Contact[];
  appointments?: Appointment[];
  reminders?: CallReminder[];
  notes?: ContactNote[];
  attachments?: ContactAttachment[];
  insuranceFiles?: InsuranceFolderFile[];
  lastUpdated?: string;
  sourceDevice?: string;
}

// Generate unique device ID for this browser session
const SESSION_DEVICE_ID = `device_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

/**
 * Save an Insurance File (Supabase handles sync in the background)
 */
export async function saveInsuranceFileToCloud(_file: InsuranceFolderFile): Promise<void> {
  // Directly handled by Supabase synchronization
}

/**
 * Delete an Insurance File from cloud
 */
export async function deleteInsuranceFileFromCloud(_fileId: string): Promise<void> {
  // Directly handled by Supabase synchronization
}

/**
 * Save a Patient Contact Attachment
 */
export async function saveAttachmentToCloud(_attachment: ContactAttachment): Promise<void> {
  // Handled by main agenda state
}

/**
 * Delete a Patient Contact Attachment
 */
export async function deleteAttachmentFromCloud(_attachmentId: string): Promise<void> {
  // Handled by main agenda state
}

/**
 * Push agenda updates
 */
export async function syncToFirestore(_payload: AgendaCloudPayload, _immediate = true): Promise<void> {
  // Handled directly via Supabase
}

/**
 * Force an immediate bidirectional sync
 */
export async function forceSyncToCloud(_currentData: AgendaCloudPayload): Promise<AgendaCloudPayload | null> {
  return null;
}

/**
 * Fetch initial agenda state
 */
export async function fetchFromFirestore(): Promise<AgendaCloudPayload | null> {
  return null;
}

/**
 * Real-time Agenda Subscription placeholder (clean no-op to avoid /api/sync/events 404s)
 */
export function subscribeToFirestoreAgenda(
  _onData: (data: AgendaCloudPayload) => void
): () => void {
  return () => {};
}

/**
 * Real-time Insurance Files subscription placeholder (clean no-op to avoid /api/sync/events 404s)
 */
export function subscribeToFirestoreInsuranceFiles(
  _onFiles: (files: InsuranceFolderFile[]) => void
): () => void {
  return () => {};
}

export { SESSION_DEVICE_ID };



/**
 * IndexedDB storage utility for large files (PDFs, images, documents > 5MB up to 500MB+)
 * This completely bypasses localStorage's 5MB limit.
 */
import { InsuranceFolderFile, ContactAttachment } from '../types';

const DB_NAME = 'mi_agenda_idb_v1';
const DB_VERSION = 1;
const STORE_INSURANCE_FILES = 'insurance_files';
const STORE_ATTACHMENTS = 'attachments';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_INSURANCE_FILES)) {
        db.createObjectStore(STORE_INSURANCE_FILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ATTACHMENTS)) {
        db.createObjectStore(STORE_ATTACHMENTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Insurance Files in IndexedDB
export async function getAllInsuranceFilesFromIDB(): Promise<InsuranceFolderFile[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_INSURANCE_FILES, 'readonly');
      const store = tx.objectStore(STORE_INSURANCE_FILES);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve(req.result || []);
      };
      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB, falling back:', err);
    return [];
  }
}

export async function saveAllInsuranceFilesToIDB(files: InsuranceFolderFile[]): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_INSURANCE_FILES, 'readwrite');
    const store = tx.objectStore(STORE_INSURANCE_FILES);
    store.clear();
    for (const f of files) {
      store.put(f);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error saving files to IndexedDB:', err);
  }
}

export async function saveSingleInsuranceFileToIDB(file: InsuranceFolderFile): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_INSURANCE_FILES, 'readwrite');
    const store = tx.objectStore(STORE_INSURANCE_FILES);
    store.put(file);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error saving single file to IndexedDB:', err);
  }
}

export async function deleteInsuranceFileFromIDB(fileId: string): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_INSURANCE_FILES, 'readwrite');
    const store = tx.objectStore(STORE_INSURANCE_FILES);
    store.delete(fileId);
  } catch (err) {
    console.error('Error deleting file from IndexedDB:', err);
  }
}

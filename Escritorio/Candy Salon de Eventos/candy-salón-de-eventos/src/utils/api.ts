import { EventItem, PaymentRecord, ReminderItem } from '../types.ts';
import {
  loadEventsFromStorage,
  saveEventsToStorage,
  loadRemindersFromStorage,
  saveRemindersToStorage,
} from './storage.ts';

// Get current auth token if user is signed in
let currentAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
}

function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }
  return headers;
}

// Fetch all events from backend (with storage fallback)
export async function fetchEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch('/api/events', {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data: EventItem[] = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      saveEventsToStorage(data);
      return data;
    }
    return loadEventsFromStorage();
  } catch (err) {
    console.warn('Using local cached events due to network error:', err);
    return loadEventsFromStorage();
  }
}

// Save event to backend
export async function saveEventApi(event: EventItem): Promise<void> {
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      console.warn('Failed to persist event to server, cached locally.');
    }
  } catch (err) {
    console.warn('Network error saving event to server:', err);
  }
}

// Delete event from backend
export async function deleteEventApi(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      console.warn('Failed to delete event from server');
    }
  } catch (err) {
    console.warn('Network error deleting event from server:', err);
  }
}

// Add payment to backend
export async function addPaymentApi(eventId: string, payment: PaymentRecord): Promise<void> {
  try {
    const res = await fetch(`/api/events/${eventId}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payment),
    });
    if (!res.ok) {
      console.warn('Failed to add payment on server');
    }
  } catch (err) {
    console.warn('Network error adding payment:', err);
  }
}

// Fetch all reminders from backend
export async function fetchReminders(): Promise<ReminderItem[]> {
  try {
    const res = await fetch('/api/reminders', {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data: ReminderItem[] = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      saveRemindersToStorage(data);
      return data;
    }
    return loadRemindersFromStorage();
  } catch (err) {
    console.warn('Using local cached reminders due to network error:', err);
    return loadRemindersFromStorage();
  }
}

// Save reminder to backend
export async function saveReminderApi(reminder: ReminderItem): Promise<void> {
  try {
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reminder),
    });
    if (!res.ok) {
      console.warn('Failed to save reminder on server');
    }
  } catch (err) {
    console.warn('Network error saving reminder:', err);
  }
}

// Delete reminder from backend
export async function deleteReminderApi(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/reminders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      console.warn('Failed to delete reminder on server');
    }
  } catch (err) {
    console.warn('Network error deleting reminder:', err);
  }
}

// Reset demo data on backend
export async function resetDemoApi(): Promise<{ events: EventItem[]; reminders: ReminderItem[] } | null> {
  try {
    const res = await fetch('/api/reset-demo', {
      method: 'POST',
      headers: getHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.events && data.reminders) {
        saveEventsToStorage(data.events);
        saveRemindersToStorage(data.reminders);
        return { events: data.events, reminders: data.reminders };
      }
    }
  } catch (err) {
    console.warn('Failed to reset demo on server:', err);
  }
  return null;
}

// Clear all events, reminders and payments from backend & local storage
export async function clearAllDataApi(): Promise<boolean> {
  try {
    const res = await fetch('/api/clear-all', {
      method: 'POST',
      headers: getHeaders(),
    });
    saveEventsToStorage([]);
    saveRemindersToStorage([]);
    return res.ok;
  } catch (err) {
    console.warn('Failed to clear database on server, clearing locally:', err);
    saveEventsToStorage([]);
    saveRemindersToStorage([]);
    return false;
  }
}

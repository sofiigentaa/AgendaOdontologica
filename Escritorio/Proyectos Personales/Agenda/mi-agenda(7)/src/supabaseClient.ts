import { createClient } from '@supabase/supabase-js';

// Clean and sanitize Supabase URL if environment variable contains extra paths like /rest/v1 or trailing slashes
function sanitizeSupabaseUrl(url?: string): string {
  if (!url) return 'https://kkkhwhemraiyozqjsisl.supabase.co';
  let cleaned = url.trim();
  try {
    const parsed = new URL(cleaned);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    // If not a standard URL object, remove trailing /rest/v1 or slashes
    return cleaned.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }
}

const DEFAULT_SUPABASE_URL = 'https://kkkhwhemraiyozqjsisl.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiZXhwIjoyNTM0MDIzMDA4MDB9.placeholder_key';

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const SUPABASE_URL = sanitizeSupabaseUrl(rawUrl || DEFAULT_SUPABASE_URL);
export const SUPABASE_ANON_KEY = envKey || FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  envKey &&
  envKey !== '' &&
  envKey !== FALLBACK_ANON_KEY &&
  SUPABASE_URL &&
  !SUPABASE_URL.includes('placeholder')
);

// Safe createClient that will never crash the React runtime
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

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

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const SUPABASE_URL = sanitizeSupabaseUrl(rawUrl);
export const SUPABASE_ANON_KEY = envKey || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('placeholder')
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

import { createClient } from '@supabase/supabase-js';

// Clean and sanitize Supabase URL if environment variable contains extra paths like /rest/v1 or trailing slashes
function sanitizeSupabaseUrl(url?: string): string {
  if (!url) return 'https://xdrvhkmritmcgyquynov.supabase.co';
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
export const SUPABASE_ANON_KEY =
  envKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkcnZoa21yaXRtY2d5cXV5bm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDE0MTksImV4cCI6MjEwMjgxNzQxOX0.OSg3ZtpNfFxJxh-ytF3t2XrpfFfHjITd2s6r16y7mMk';

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

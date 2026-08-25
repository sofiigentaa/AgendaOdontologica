import { createClient } from '@supabase/supabase-js';

// Supabase configuration for the dental clinic app
const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  envUrl &&
  envKey &&
  envUrl.startsWith('https://') &&
  !envUrl.includes('placeholder')
);

export const SUPABASE_URL = envUrl || 'https://xdrvhkmritmcgyquynov.supabase.co';
export const SUPABASE_ANON_KEY =
  envKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkcnZoa21yaXRtY2d5cXV5bm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDE0MTksImV4cCI6MjEwMjgxNzQxOX0.OSg3ZtpNfFxJxh-ytF3t2XrpfFfHjITd2s6r16y7mMk';

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

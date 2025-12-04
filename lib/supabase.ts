import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Raw env values (may be missing or malformed in some builds)
const RAW_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const RAW_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Helper to validate URL so a bad env value doesn't crash native builds
function getSafeUrl(raw: string | undefined | null): string {
  if (!raw) return 'https://example.supabase.co';
  try {
    // Will throw if the URL is invalid
    new URL(raw);
    return raw;
  } catch {
    console.warn(
      '[Supabase] Invalid EXPO_PUBLIC_SUPABASE_URL value, falling back to safe dummy URL.'
    );
    return 'https://example.supabase.co';
  }
}

function getSafeKey(raw: string | undefined | null): string {
  if (!raw) {
    console.warn(
      '[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY missing, using dummy key. ' +
        'Auth and data calls will fail, but the app UI will still load.'
    );
    return 'public-anon-key';
  }
  return raw;
}

const supabaseUrl = getSafeUrl(RAW_SUPABASE_URL);
const supabaseAnonKey = getSafeKey(RAW_SUPABASE_ANON_KEY);

// Wrap createClient so even if something unexpected goes wrong,
// we still return a non-crashing client.
let client;

try {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: Platform.OS === 'web' ? window.localStorage : AsyncStorage,
    },
  });
} catch (error) {
  console.error(
    '[Supabase] Failed to initialize Supabase client. Falling back to dummy client.',
    error
  );

  // Last-resort fallback: dummy client that always "fails" gracefully.
  client = createClient('https://example.supabase.co', 'public-anon-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: Platform.OS === 'web' ? window.localStorage : AsyncStorage,
    },
  });
}

export const supabase = client;

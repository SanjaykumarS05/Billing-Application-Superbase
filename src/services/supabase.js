import { createClient } from '@supabase/supabase-js';

function envValue(key) {
  return String(import.meta.env[key] || '').trim().replace(/^"+|"+$/g, '');
}

const supabaseUrl = envValue('VITE_SUPABASE_URL');
const supabaseAnonKey = envValue('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseTableName = envValue('VITE_SUPABASE_TABLE_NAME') || 'billing_states';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

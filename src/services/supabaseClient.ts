/**
 * SUPABASE CLIENT ARCHITECTURE PLACEHOLDER
 * 
 * To switch from mock localStorage to Supabase in production:
 * 1. Install '@supabase/supabase-js'
 * 2. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env
 * 3. Uncomment the client creation below
 * 4. Update the service methods in /src/services to query Supabase tables
 *    (e.g., supabase.from('clients').select('*'))
 * 
 * Notice that all /src/services functions already match Supabase async signatures,
 * returning { data, error } or Promise<T> objects with identical typing.
 */

/*
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in .env.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
*/

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

import { createClient } from '@supabase/supabase-js';

// Read-only client using the anon key. Safe to use anywhere, including the
// browser: RLS grants anon SELECT on everything and no writes at all.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill it in.',
  );
}

export const supabaseRead = createClient(url, anonKey, {
  auth: { persistSession: false },
});

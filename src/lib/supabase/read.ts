import { createClient } from '@supabase/supabase-js';

// Read-only client using the public (publishable/anon) key. Safe to use
// anywhere, including the browser: RLS grants anon SELECT on everything and no
// writes at all. Every mutation goes through a server route instead, using the
// service-role key (see ./admin.ts and AGENTS.md).

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Supabase renamed this key "publishable" in 2025; older projects still call it
// "anon". Accept either so the app works with any project vintage.
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !publicKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill it in.',
  );
}

export const supabaseRead = createClient(url, publicKey, {
  auth: { persistSession: false },
});

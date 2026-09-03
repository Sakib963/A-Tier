import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client. Bypasses RLS, so it is the ONLY way anything is
// written. The 'server-only' import above makes the build fail loudly if this
// module is ever pulled into a client component.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill it in.',
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

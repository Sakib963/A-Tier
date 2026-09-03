import { NextResponse } from 'next/server';
import { supabaseRead } from '@/lib/supabase/read';

// Keepalive: a GitHub Actions cron hits this every 3 days so the free
// Supabase project never hits the 7-day inactivity pause between matches.
// Cheap on purpose: one indexed count, no rows returned.

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error, count } = await supabaseRead
    .from('players')
    .select('id', { count: 'exact', head: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    players: count ?? 0,
    confidence: '100%',
    at: new Date().toISOString(),
  });
}

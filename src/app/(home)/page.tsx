import { NextMatchHero } from '@/components/NextMatchHero';
import { RecentMatches } from '@/components/RecentMatches';
import { TheTable } from '@/components/TheTable';
import { getBalances, getNextMatch, getRecentMatches } from '@/lib/data';

// Money and poll counts must never render stale, and we are not using
// cacheComponents, so opt this route out of the static shell.
export const dynamic = 'force-dynamic';

/**
 * The whole website, on one page: next match, The Table, recent matches.
 * No admin-portal shell. Club-website energy.
 */
export default async function Home() {
  const [next, balances, recent] = await Promise.all([
    getNextMatch(),
    getBalances(),
    getRecentMatches(),
  ]);

  return (
    <div className="space-y-14">
      <NextMatchHero next={next} />
      <TheTable balances={balances} />
      <RecentMatches matches={recent} />
    </div>
  );
}

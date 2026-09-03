import Link from 'next/link';
import { Empty, SectionHead } from './TheTable';
import { RECENT } from '@/lib/copy';
import { Blob, HardHat, Zigzag } from './Doodles';
import { Taka } from './Taka';
import { formatMatchDate, taka } from '@/lib/format';
import type { MatchBreakdown } from '@/lib/data';

/**
 * Recent completed matches with what each one actually cost.
 *
 * Every figure here comes from the attendance rows frozen at finalize, so
 * these numbers can never shift after the fact.
 */
export function RecentMatches({ matches }: { matches: MatchBreakdown[] }) {
  return (
    <section className="relative">
      <Blob
        variant={3}
        className="-right-20 -bottom-10 -z-10 h-64 w-64 fill-turf-500/15"
      />

      <SectionHead
        heading={RECENT.heading}
        icon={<HardHat className="h-6 w-6 text-hardhat" />}
      />

      {matches.length === 0 ? (
        <Empty>{RECENT.empty}</Empty>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {matches.map((m) => (
            <li key={m.match.id}>
              <MatchCard breakdown={m} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MatchCard({ breakdown }: { breakdown: MatchBreakdown }) {
  const { match, attendances } = breakdown;
  const perShare = match.per_share_cost ?? 0;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group relative block h-full overflow-hidden rounded-3xl border-2 border-turf-900/10 bg-white p-5 transition hover:-translate-y-1 hover:border-turf-500/50 hover:shadow-xl"
    >
      <Zigzag className="-top-1 left-0 h-3 w-full stroke-hardhat/50" />
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold text-turf-950">{match.turf_name}</h3>
        <span className="shrink-0 text-xs text-turf-700/70">
          {formatMatchDate(match.match_date)}
        </span>
      </div>

      {/* The headline number, kept large and clear. */}
      <p className="mt-4 text-xs font-semibold tracking-wide text-turf-700 uppercase">
        {RECENT.colPerHead}
      </p>
      <Taka
        amount={perShare}
        className="font-display block text-3xl text-turf-950"
      />

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-turf-900/10 pt-3 text-sm">
        <Stat label={RECENT.colFee} value={<Taka amount={match.fee} />} />
        <Stat label={RECENT.colPlayed} value={String(attendances.length)} />
        <Stat
          label={RECENT.colGuests}
          value={
            match.guest_count > 0
              ? `${match.guest_count} · ${taka(match.guest_cash)}`
              : 'None'
          }
        />
      </dl>
    </Link>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-turf-700/70 uppercase">
        {label}
      </dt>
      <dd className="tabular font-semibold text-turf-950">{value}</dd>
    </div>
  );
}

import { ConfidenceMeter } from './Brand';
import { NEXT_MATCH, STATUS_SHORT } from '@/lib/copy';
import { Taka } from './Taka';
import {
  daysUntilCancelBy,
  formatCancelBy,
  formatLongDate,
} from '@/lib/format';
import type { NextMatch } from '@/lib/data';

/**
 * The front door. Turf, date, time, status, the countdown to the 4-day
 * cancel-by deadline, and the live poll count.
 *
 * The poll shown here is advisory: it plans headcount and drives the
 * keep-or-cancel call. It never bills anyone.
 */
export function NextMatchHero({ next }: { next: NextMatch | null }) {
  if (!next) {
    return (
      <section className="rounded-3xl border-2 border-dashed border-turf-700/30 bg-white/60 px-6 py-14 text-center">
        <Eyebrow />
        <p className="mx-auto mt-4 max-w-md text-lg text-turf-900">
          {NEXT_MATCH.none}
        </p>
      </section>
    );
  }

  const { match, poll } = next;
  const daysLeft = daysUntilCancelBy(match.match_date);

  return (
    <section className="overflow-hidden rounded-3xl bg-turf-900 text-cream shadow-xl">
      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Eyebrow tone="dark" />
          <span className="rounded-full bg-cream/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            {STATUS_SHORT[match.status]}
          </span>
        </div>

        <h2 className="font-display mt-4 text-4xl leading-tight tracking-tight sm:text-5xl">
          {match.turf_name}
        </h2>

        <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <Fact label="When">
            {formatLongDate(match.match_date)}
            <span className="block text-cream/70">{match.match_time}</span>
          </Fact>
          <Fact label="Slot fee">
            <Taka amount={match.fee} />
            <span className="block text-sm text-cream/70">
              Split by who turns up
            </span>
          </Fact>
          <Fact label="The poll so far">
            <span className="tabular">
              {poll.in} in · {poll.out} out
            </span>
            <span className="block text-sm text-cream/70">
              {NEXT_MATCH.pollTail}
            </span>
          </Fact>
        </dl>
      </div>

      {/* The cancel-by deadline: the turf's resale window, not a payment lock. */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-cream/15 bg-turf-950/40 px-6 py-5 sm:px-10">
        <div>
          <p className="text-sm font-semibold text-hardhat">
            {countdownLine(daysLeft)}
          </p>
          <p className="mt-1 text-sm text-cream/75">
            {NEXT_MATCH.cancelBy(formatCancelBy(match.match_date))}
          </p>
        </div>
        <ConfidenceMeter tone="dark" />
      </div>
    </section>
  );
}

function countdownLine(daysLeft: number): string {
  if (daysLeft > 0) return NEXT_MATCH.daysToLock(daysLeft);
  if (daysLeft === 0) return NEXT_MATCH.lockToday;
  return NEXT_MATCH.lockPassed;
}

function Eyebrow({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <p
      className={`text-xs font-bold tracking-[0.2em] uppercase ${
        tone === 'dark' ? 'text-hardhat' : 'text-turf-700'
      }`}
    >
      {NEXT_MATCH.eyebrow}
    </p>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-cream/60 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold">{children}</dd>
    </div>
  );
}

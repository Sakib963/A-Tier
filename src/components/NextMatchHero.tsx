import { ConfidenceMeter } from './Brand';
import {
  Arcs,
  Blob,
  Dots,
  Football,
  Mascot,
  PitchLines,
  YesStamp,
  Zigzag,
} from './Doodles';
import { Taka } from './Taka';
import { BRAND, NEXT_MATCH, STATUS_SHORT } from '@/lib/copy';
import {
  daysUntilCancelBy,
  formatCancelBy,
  formatLongDate,
} from '@/lib/format';
import type { NextMatch } from '@/lib/data';

/**
 * The front door: a full container-width split hero. Brand and the vote CTA on
 * one side, the upcoming match on the other, loud SVG shapes behind it all.
 *
 * The poll here is advisory. It plans headcount and drives the keep-or-cancel
 * call at the 4-day mark. It never bills anyone.
 */
export function NextMatchHero({ next }: { next: NextMatch | null }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-turf-900 text-cream shadow-2xl">
      {/* ---------------------------------------------------- the fun layer */}
      <Blob
        variant={2}
        className="-top-24 -left-28 h-[26rem] w-[26rem] fill-turf-500/40"
      />
      <Blob
        variant={3}
        className="-right-24 -bottom-32 h-[24rem] w-[24rem] fill-hardhat/20"
      />
      <Blob
        variant={1}
        className="top-1/3 -left-8 h-40 w-40 fill-hardhat/15"
      />
      <Arcs className="-bottom-4 left-0 h-80 w-80 stroke-hardhat/30" />
      <PitchLines className="top-1/2 left-1/2 h-72 w-[30rem] -translate-x-1/2 -translate-y-1/2 stroke-cream/15" />
      <Dots className="top-4 right-6 h-48 w-48 fill-hardhat/45" seed={11} />
      <Dots className="bottom-6 left-1/3 h-32 w-32 fill-turf-100/30" seed={23} />
      <Zigzag className="top-0 left-0 h-4 w-full stroke-hardhat/40" />

      <div className="relative grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-14 lg:pt-16 lg:pb-20">
        {/* ------------------------------------------ left: brand + the CTA */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <Football className="h-5 w-5 text-hardhat" />
            <span className="text-xs font-bold tracking-[0.25em] text-hardhat uppercase">
              {NEXT_MATCH.eyebrow}
            </span>
          </div>

          <h1 className="font-display mt-4 text-6xl leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
            {BRAND.wordmark}
          </h1>

          <p className="mt-4 max-w-sm text-xl leading-snug font-semibold text-cream/90">
            {BRAND.taglines[0]}
          </p>
          <p className="mt-2 max-w-sm text-sm text-cream/70">
            {BRAND.taglines[2]}
          </p>

          {next ? (
            <div className="mt-8">
              <p className="font-display text-2xl text-hardhat">
                {NEXT_MATCH.voteCta}
              </p>
              {/* Real voting arrives in build order step 4. */}
              <div className="mt-3 flex flex-wrap gap-3">
                <span className="rounded-full bg-hardhat px-6 py-3 font-bold text-turf-950 shadow-lg">
                  {NEXT_MATCH.voteIn}
                </span>
                <span className="rounded-full border-2 border-cream/30 px-6 py-3 font-bold text-cream/80">
                  {NEXT_MATCH.voteOut}
                </span>
              </div>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-cream/55">
                {NEXT_MATCH.advisory}
              </p>
            </div>
          ) : null}
        </div>

        {/* The legend himself, standing in the gap between the two columns.
            Decorative only: he sits behind the cards and never covers a
            figure, and he is hidden below xl where there is no room. */}
        <Mascot className="pointer-events-none absolute bottom-0 left-[46%] hidden h-56 w-auto -translate-x-1/2 xl:block" />

        {/* ------------------------------------- right: the match, or a nudge */}
        <div className="flex items-center justify-center">
          {next ? <MatchCard next={next} /> : <NoMatch />}
        </div>
      </div>
    </section>
  );
}

function MatchCard({ next }: { next: NextMatch }) {
  const { match, poll } = next;
  const daysLeft = daysUntilCancelBy(match.match_date);

  return (
    <div className="relative w-full max-w-sm rotate-[-1.2deg] rounded-3xl bg-cream p-6 text-turf-950 shadow-2xl">
      <YesStamp className="absolute -top-4 -right-3 bg-cream" />

      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-turf-100 px-3 py-1 text-[11px] font-bold tracking-wide text-turf-700 uppercase">
          {STATUS_SHORT[match.status]}
        </span>
        <Football className="h-5 w-5 text-turf-500" />
      </div>

      <h2 className="font-display mt-3 text-3xl leading-tight tracking-tight">
        {match.turf_name}
      </h2>
      <p className="mt-1 font-semibold text-turf-900">
        {formatLongDate(match.match_date)}
      </p>
      <p className="text-turf-700">{match.match_time}</p>

      {/* Money sits on the solid card, never over a shape. */}
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-turf-50 p-3">
          <dt className="text-[10px] font-bold tracking-wide text-turf-700 uppercase">
            Slot fee
          </dt>
          <dd className="mt-0.5">
            <Taka amount={match.fee} className="text-2xl font-bold" />
          </dd>
          <p className="mt-0.5 text-[10px] text-turf-700/70">
            Split by who turns up
          </p>
        </div>
        <div className="rounded-2xl bg-turf-50 p-3">
          <dt className="text-[10px] font-bold tracking-wide text-turf-700 uppercase">
            The poll so far
          </dt>
          <dd className="tabular mt-0.5 text-2xl font-bold">
            {poll.in} <span className="text-sm font-semibold">in</span>
            <span className="mx-1 text-turf-700/40">/</span>
            {poll.out} <span className="text-sm font-semibold">out</span>
          </dd>
          <p className="mt-0.5 text-[10px] text-turf-700/70">
            {NEXT_MATCH.pollTail}
          </p>
        </div>
      </dl>

      <div className="mt-4 border-t border-turf-900/10 pt-4">
        <p className="text-sm font-bold text-turf-950">
          {countdownLine(daysLeft)}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-turf-700">
          {NEXT_MATCH.cancelBy(formatCancelBy(match.match_date))}
        </p>
        <ConfidenceMeter className="mt-3" />
      </div>
    </div>
  );
}

/** No match yet. The mascot holds the space, because he is already on it. */
function NoMatch() {
  return (
    <div className="relative w-full max-w-sm rounded-3xl border-2 border-dashed border-cream/25 bg-turf-950/30 p-8 text-center">
      <Mascot className="mx-auto h-44 w-auto" />
      <p className="mt-4 text-lg leading-snug font-semibold text-cream">
        {NEXT_MATCH.none}
      </p>
      <ConfidenceMeter tone="dark" className="mt-4" />
    </div>
  );
}

function countdownLine(daysLeft: number): string {
  if (daysLeft > 0) return NEXT_MATCH.daysToLock(daysLeft);
  if (daysLeft === 0) return NEXT_MATCH.lockToday;
  return NEXT_MATCH.lockPassed;
}

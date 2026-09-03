import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BREAKDOWN, STATUS_LABEL } from '@/lib/copy';
import { getMatchById } from '@/lib/data';
import { Taka } from '@/components/Taka';
import { TIER_LABEL, formatLongDate, taka } from '@/lib/format';

export const dynamic = 'force-dynamic';

// Next 16: params is a Promise. See the vendored upgrade guide,
// node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md
export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const breakdown = await getMatchById(id);

  if (!breakdown) notFound();

  const { match, attendances, totalShares, totalCharged } = breakdown;
  const finalized = match.finalized_at !== null;
  const uncovered = finalized && totalShares === 0 && match.fee > 0;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="text-sm font-semibold text-turf-700 hover:underline"
        >
          Back to the front page
        </Link>
        <h1 className="font-display mt-3 text-3xl tracking-tight text-turf-950">
          {match.turf_name}
        </h1>
        <p className="mt-1 text-turf-900">
          {formatLongDate(match.match_date)} · {match.match_time}
        </p>
        <p className="mt-2 text-sm text-turf-700/80">
          {STATUS_LABEL[match.status]}
        </p>
      </div>

      <section className="rounded-2xl border border-turf-900/10 bg-white p-6">
        <h2 className="font-display text-xl tracking-tight text-turf-950">
          {BREAKDOWN.heading}
        </h2>

        {!finalized ? (
          <p className="mt-4 text-turf-900">{BREAKDOWN.notFinalized}</p>
        ) : (
          <>
            {uncovered ? (
              <p className="mt-4 rounded-xl border border-owed/30 bg-owed/5 px-4 py-3 text-sm text-owed">
                {BREAKDOWN.uncovered(taka(match.fee))}
              </p>
            ) : null}

            <dl className="mt-4 grid gap-4 sm:grid-cols-4">
              <Figure label={BREAKDOWN.slotFee} value={<Taka amount={match.fee} />} />
              <Figure
                label={BREAKDOWN.guestCash}
                value={<Taka amount={match.guest_cash} />}
                note={
                  match.guest_count > 0
                    ? `${match.guest_count} guest${match.guest_count === 1 ? '' : 's'}`
                    : 'No guests'
                }
              />
              <Figure
                label={BREAKDOWN.shares}
                value={String(totalShares)}
                note="Free players sit outside the split"
              />
              <Figure
                label={BREAKDOWN.perHead}
                value={<Taka amount={match.per_share_cost ?? 0} />}
                emphasis
              />
            </dl>
          </>
        )}
      </section>

      {finalized && attendances.length > 0 ? (
        <section>
          <h2 className="font-display text-xl tracking-tight text-turf-950">
            {BREAKDOWN.whoPlayed}
          </h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-turf-900/10 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-turf-900/10 bg-turf-50 text-xs font-semibold tracking-wide text-turf-700 uppercase">
                  <th scope="col" className="px-4 py-3 text-left">
                    Player
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    Tier tonight
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Share
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Owed
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-turf-900/5 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold text-turf-950">
                      {a.playerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-turf-700">
                      {TIER_LABEL[a.tier]}
                    </td>
                    <td className="tabular px-4 py-3 text-right text-sm text-turf-700">
                      {a.share}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Taka
                        amount={a.amount_charged}
                        className="text-lg font-bold text-turf-950"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-turf-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-turf-700" colSpan={3}>
                    Collected from the crew
                  </td>
                  <td className="px-4 py-3 text-right text-turf-950">
                    <Taka amount={totalCharged} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Figure({
  label,
  value,
  note,
  emphasis = false,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wide text-turf-700/80 uppercase">
        {label}
      </dt>
      <dd
        className={`tabular font-bold text-turf-950 ${
          emphasis ? 'font-display text-3xl' : 'text-xl'
        }`}
      >
        {value}
      </dd>
      {note ? (
        <p className="mt-0.5 text-[11px] text-turf-700/70">{note}</p>
      ) : null}
    </div>
  );
}

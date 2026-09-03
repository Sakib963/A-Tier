import { TABLE, rotate } from '@/lib/copy';
import { Blob, Dots, Football, Wrench } from './Doodles';
import { Taka } from './Taka';
import { TIER_LABEL } from '@/lib/format';
import type { PlayerBalance } from '@/lib/types';

/**
 * The Table: every player's balance, framed like league standings.
 *
 * This is a money surface, so VOICE-AND-COPY section 7 applies: the figure is
 * large, tabular and unmissable, negatives are red, and the humor lives only
 * in the small flavor line beside the name. Nobody in debt is ever shamed.
 */
export function TheTable({ balances }: { balances: PlayerBalance[] }) {
  return (
    <section className="relative">
      <Blob
        variant={1}
        className="-top-10 -left-16 -z-10 h-56 w-56 fill-hardhat/20"
      />
      <Dots
        className="-top-4 right-0 -z-10 h-32 w-32 fill-turf-500/25"
        seed={5}
      />

      <SectionHead
        heading={TABLE.heading}
        sub={TABLE.sub}
        icon={<Football className="h-6 w-6 text-turf-500" />}
      />

      {balances.length === 0 ? (
        <Empty>{TABLE.empty}</Empty>
      ) : (
        <div className="overflow-hidden rounded-3xl border-2 border-turf-900/10 bg-white shadow-lg">
          <table className="w-full">
            <caption className="sr-only">
              Player balances. Payments in minus match costs out.
            </caption>
            <thead>
              <tr className="border-b border-turf-900/10 bg-turf-50">
                <th
                  scope="col"
                  className="w-10 px-4 py-3 text-left text-xs font-semibold tracking-wide text-turf-700 uppercase"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 text-left text-xs font-semibold tracking-wide text-turf-700 uppercase"
                >
                  {TABLE.colPlayer}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-turf-700 uppercase"
                >
                  {TABLE.colBalance}
                </th>
              </tr>
            </thead>
            <tbody>
              {balances.map((row, i) => (
                <Row key={row.player_id} row={row} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Row({ row, rank }: { row: PlayerBalance; rank: number }) {
  const negative = row.balance < 0;
  const settled = Math.round(row.balance) === 0;

  const flavor = settled
    ? TABLE.settled
    : negative
      ? rotate(TABLE.negativeFlavor, row.player_id)
      : rotate(TABLE.positiveFlavor, row.player_id);

  return (
    <tr className="border-b border-turf-900/5 last:border-0 hover:bg-turf-50/60">
      <td className="tabular px-4 py-3 text-sm text-turf-700/70">{rank}</td>
      <td className="px-2 py-3">
        <span className="font-semibold text-turf-950">{row.name}</span>
        <span className="ml-2 text-xs text-turf-700/60">
          {TIER_LABEL[row.default_tier]}
        </span>
        <span className="block text-xs text-turf-700/70">{flavor}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <Taka
          amount={row.balance}
          className={`text-xl font-bold ${
            negative ? 'text-owed' : 'text-turf-950'
          }`}
        />
      </td>
    </tr>
  );
}

export function SectionHead({
  heading,
  sub,
  icon,
}: {
  heading: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="font-display text-3xl tracking-tight text-turf-950">
          {heading}
        </h2>
      </div>
      {sub ? <p className="mt-1.5 text-sm text-turf-700/80">{sub}</p> : null}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-turf-700/25 bg-white/70 px-6 py-12 text-center">
      <Wrench className="mx-auto h-9 w-9 text-hardhat" />
      <p className="mt-3 text-turf-900">{children}</p>
    </div>
  );
}

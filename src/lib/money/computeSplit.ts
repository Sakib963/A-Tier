// The core contract. See A-Tier-BUILD-SPEC.md section 4 and
// A-Tier-requirements-v0.2.md section 3.
//
// The split is share-based, not headcount-based, because who shows up and at
// what rate changes every match. This module is pure: no dates, no database,
// no randomness. Everything downstream (the finalize preview, the immutable
// attendance rows) derives from it, so it is unit-tested first and separately.

import type { Tier } from '../types';

export const SHARES: Record<Tier, number> = {
  full: 1,
  half: 0.5,
  free: 0,
};

export interface Attendee {
  playerId: string;
  tier: Tier;
}

export interface Charge {
  playerId: string;
  tier: Tier;
  share: number;
  amount: number;
}

export interface SplitResult {
  totalShares: number;
  /** Rounded to 2 dp. */
  perShare: number;
  charges: Charge[];
  /** True when the split cannot cover the fee, so nobody is charged. */
  uncovered: boolean;
}

/** Round half-up to 2 dp, avoiding binary float artifacts like 1.005 -> 1.00. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Split a match fee across the players who actually turned up.
 *
 * Guest cash comes off the fee first, so guests lighten everyone's bill.
 * Free players are deliberately excluded from the denominator: the rest
 * quietly absorb them. That is intended behavior, not a rounding bug.
 *
 * Charge is driven by actual attendance only. The RSVP poll never reaches
 * this function.
 */
export function computeSplit(
  fee: number,
  guestCash: number,
  attendees: Attendee[],
): SplitResult {
  const net = Math.max(fee - guestCash, 0);

  const totalShares = round2(
    attendees.reduce((sum, a) => sum + SHARES[a.tier], 0),
  );

  const perShare = totalShares > 0 ? round2(net / totalShares) : 0;

  const charges: Charge[] = attendees.map((a) => {
    const share = SHARES[a.tier];
    return {
      playerId: a.playerId,
      tier: a.tier,
      share,
      amount: round2(perShare * share),
    };
  });

  // Nobody can cover the fee: no attendees at all, or everyone is free.
  // The admin UI warns; no one is charged.
  const uncovered = totalShares === 0 && net > 0;

  return { totalShares, perShare, charges, uncovered };
}

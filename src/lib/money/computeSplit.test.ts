import { describe, expect, it } from 'vitest';
import { computeSplit, SHARES, type Attendee } from './computeSplit';
import type { Tier } from '../types';

/** Build n attendees of one tier, with stable ids for readable failures. */
function squad(count: number, tier: Tier, prefix = tier): Attendee[] {
  return Array.from({ length: count }, (_, i) => ({
    playerId: `${prefix}-${i + 1}`,
    tier,
  }));
}

function amountFor(result: ReturnType<typeof computeSplit>, playerId: string) {
  return result.charges.find((c) => c.playerId === playerId)?.amount;
}

describe('SHARES', () => {
  it('maps tiers to the specified share weights', () => {
    expect(SHARES).toEqual({ full: 1, half: 0.5, free: 0 });
  });
});

describe('computeSplit: the required cases', () => {
  // The day-2 scenario from requirements section 3: "200 isn't 200 today".
  it('splits 3500 across 18 full + 2 half at ~184 per share', () => {
    const attendees = [...squad(18, 'full'), ...squad(2, 'half')];
    const result = computeSplit(3500, 0, attendees);

    expect(result.totalShares).toBe(19); // 18 + 1
    expect(result.perShare).toBeCloseTo(184.21, 2);
    expect(Math.round(result.perShare)).toBe(184);
    expect(result.uncovered).toBe(false);

    expect(amountFor(result, 'full-1')).toBeCloseTo(184.21, 2);
    expect(amountFor(result, 'half-1')).toBeCloseTo(92.11, 2); // half pays half
    expect(result.charges).toHaveLength(20);
  });

  it('subtracts guest cash from the fee before splitting', () => {
    // 3500 - 500 = 3000 net over 10 full shares.
    const result = computeSplit(3500, 500, squad(10, 'full'));

    expect(result.totalShares).toBe(10);
    expect(result.perShare).toBe(300);
    expect(amountFor(result, 'full-1')).toBe(300);
    expect(result.uncovered).toBe(false);
  });

  it('flags uncovered when everyone is free and charges nobody', () => {
    const result = computeSplit(3500, 0, squad(5, 'free'));

    expect(result.totalShares).toBe(0);
    expect(result.perShare).toBe(0);
    expect(result.uncovered).toBe(true);
    expect(result.charges.every((c) => c.amount === 0)).toBe(true);
  });

  it('computes each amount correctly in a mixed squad', () => {
    // 2000 net, shares = 2 full + 1 (2 halves) + 0 free = 3.
    const attendees: Attendee[] = [
      { playerId: 'a', tier: 'full' },
      { playerId: 'b', tier: 'full' },
      { playerId: 'c', tier: 'half' },
      { playerId: 'd', tier: 'half' },
      { playerId: 'e', tier: 'free' },
    ];
    const result = computeSplit(2000, 0, attendees);

    expect(result.totalShares).toBe(3);
    expect(result.perShare).toBe(666.67); // 666.666... rounded to 2 dp

    // Amounts derive from the ROUNDED perShare, per BUILD-SPEC section 4.
    // A half share of 666.67 is 333.335, which rounds up to 333.34.
    expect(amountFor(result, 'a')).toBe(666.67);
    expect(amountFor(result, 'b')).toBe(666.67);
    expect(amountFor(result, 'c')).toBe(333.34);
    expect(amountFor(result, 'd')).toBe(333.34);
    expect(amountFor(result, 'e')).toBe(0);
  });
});

describe('computeSplit: free players and the denominator', () => {
  it('excludes free players from the denominator so payers absorb them', () => {
    const withoutFree = computeSplit(1000, 0, squad(4, 'full'));
    const withFree = computeSplit(1000, 0, [
      ...squad(4, 'full'),
      ...squad(3, 'free'),
    ]);

    // Adding free players must not dilute the per-share cost. This is the
    // intended behavior from requirements section 3, not a bug.
    expect(withFree.totalShares).toBe(withoutFree.totalShares);
    expect(withFree.perShare).toBe(250);
    expect(withoutFree.perShare).toBe(250);
  });

  it('always charges a free player zero, whatever the fee', () => {
    const result = computeSplit(9999, 0, [
      { playerId: 'payer', tier: 'full' },
      { playerId: 'honorary', tier: 'free' },
    ]);

    expect(amountFor(result, 'honorary')).toBe(0);
    expect(amountFor(result, 'payer')).toBe(9999);
  });
});

describe('computeSplit: guest cash edges', () => {
  it('clamps net to zero when guest cash exceeds the fee', () => {
    const result = computeSplit(1000, 1500, squad(5, 'full'));

    expect(result.perShare).toBe(0);
    expect(result.charges.every((c) => c.amount === 0)).toBe(true);
    // The fee is fully covered, so this is not an uncovered match.
    expect(result.uncovered).toBe(false);
  });

  it('charges nobody when guest cash exactly covers the fee', () => {
    const result = computeSplit(2000, 2000, squad(4, 'full'));

    expect(result.perShare).toBe(0);
    expect(result.uncovered).toBe(false);
  });

  it('handles guest cash with a mixed squad', () => {
    // 3500 - 400 = 3100 net; shares = 8 full + 2 half = 9.
    const result = computeSplit(3500, 400, [
      ...squad(8, 'full'),
      ...squad(2, 'half'),
    ]);

    expect(result.totalShares).toBe(9);
    expect(result.perShare).toBeCloseTo(344.44, 2);
    expect(amountFor(result, 'half-1')).toBeCloseTo(172.22, 2);
  });
});

describe('computeSplit: empty and degenerate inputs', () => {
  it('flags uncovered when a fee exists but nobody played', () => {
    const result = computeSplit(3500, 0, []);

    expect(result.totalShares).toBe(0);
    expect(result.perShare).toBe(0);
    expect(result.charges).toEqual([]);
    expect(result.uncovered).toBe(true);
  });

  it('does not flag uncovered when there is no fee and nobody played', () => {
    const result = computeSplit(0, 0, []);

    expect(result.uncovered).toBe(false);
    expect(result.perShare).toBe(0);
  });

  it('does not flag uncovered for a free-only squad with a zero net fee', () => {
    const result = computeSplit(500, 500, squad(3, 'free'));

    expect(result.totalShares).toBe(0);
    expect(result.uncovered).toBe(false);
  });

  it('handles a single full player paying the whole fee', () => {
    const result = computeSplit(3500, 0, squad(1, 'full'));

    expect(result.totalShares).toBe(1);
    expect(result.perShare).toBe(3500);
    expect(amountFor(result, 'full-1')).toBe(3500);
  });

  it('handles a lone half player covering only half the fee', () => {
    // Half of 0.5 shares means per-share is double the fee. The half player
    // still only owes half of that, i.e. the fee itself.
    const result = computeSplit(1000, 0, squad(1, 'half'));

    expect(result.totalShares).toBe(0.5);
    expect(result.perShare).toBe(2000);
    expect(amountFor(result, 'half-1')).toBe(1000);
  });
});

describe('computeSplit: rounding and precision', () => {
  it('rounds perShare and every amount to 2 dp', () => {
    const result = computeSplit(1000, 0, squad(3, 'full'));

    expect(result.perShare).toBe(333.33);
    for (const c of result.charges) {
      expect(c.amount).toBe(Number(c.amount.toFixed(2)));
    }
  });

  it('keeps total shares clean for many half players despite float math', () => {
    // 0.5 summed 7 times is a classic float drift case.
    const result = computeSplit(700, 0, squad(7, 'half'));

    expect(result.totalShares).toBe(3.5);
    expect(result.perShare).toBe(200);
    expect(amountFor(result, 'half-1')).toBe(100);
  });

  it('accepts tiny drift between summed charges and the fee', () => {
    // Per BUILD-SPEC section 4: do not force reconciliation in v1.
    const result = computeSplit(1000, 0, squad(3, 'full'));
    const summed = result.charges.reduce((s, c) => s + c.amount, 0);

    expect(summed).toBeCloseTo(999.99, 2);
    expect(Math.abs(summed - 1000)).toBeLessThan(0.05);
  });

  it('handles a fractional fee', () => {
    const result = computeSplit(1000.5, 0.25, squad(2, 'full'));

    expect(result.perShare).toBe(500.13); // 1000.25 / 2 = 500.125 -> 500.13
  });
});

describe('computeSplit: purity', () => {
  it('does not mutate the attendees array or its members', () => {
    const attendees: Attendee[] = [
      { playerId: 'a', tier: 'full' },
      { playerId: 'b', tier: 'half' },
    ];
    const snapshot = JSON.parse(JSON.stringify(attendees));

    computeSplit(1000, 0, attendees);

    expect(attendees).toEqual(snapshot);
  });

  it('returns the same result for the same inputs', () => {
    const attendees = [...squad(18, 'full'), ...squad(2, 'half')];

    expect(computeSplit(3500, 0, attendees)).toEqual(
      computeSplit(3500, 0, attendees),
    );
  });

  it('preserves attendee order in charges', () => {
    const attendees: Attendee[] = [
      { playerId: 'z', tier: 'full' },
      { playerId: 'm', tier: 'free' },
      { playerId: 'a', tier: 'half' },
    ];
    const result = computeSplit(600, 0, attendees);

    expect(result.charges.map((c) => c.playerId)).toEqual(['z', 'm', 'a']);
  });
});

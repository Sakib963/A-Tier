// Every user-facing string lives here, sourced from A-Tier-VOICE-AND-COPY.md.
//
// Rules that are not negotiable (see that doc):
//   * NO EM DASHES anywhere in user-facing text.
//   * Celebrate, never mock. Atiar bhai is the hero of every line, and nobody
//     is ever the butt of the joke.
//   * Never shame a debtor. Negative balances get gentle, funny nudges.
//   * Comedy never obscures a real number. Humor decorates the label only.

import type { MatchStatus } from './types';

export const BRAND = {
  wordmark: 'A-Tier',
  taglines: [
    'The football fund that finally adds up.',
    'Turf, money, transparency. Atiar-approved.',
    "Because Atiar bhai said he'd handle it.",
  ],
  footer:
    "Built with love, humor, and 100% confidence. Atiar bhai probably could've done it in 2 days.",
} as const;

export const NEXT_MATCH = {
  eyebrow: 'Next up',
  none: "No match scheduled. Atiar bhai hasn't said yet. (He will.)",
  cancelBy: (date: string) =>
    `Atiar bhai keeps the turf or gives it back on ${date}. Vote before then.`,
  daysToLock: (n: number) =>
    n === 1 ? '1 day to lock the slot' : `${n} days to lock the slot`,
  lockToday: 'Last day to lock the slot',
  lockPassed: 'Slot call already made. The poll stays open until match day.',
  pollTail: 'Atiar bhai voted yes. Twice.',
  voteCta: 'You playing?',
  voteIn: "I'm in",
  voteOut: "Can't make it",
  namePrompt: 'Who are you, legend?',
  advisory:
    'The poll plans the match. It does not bill anyone: only who actually plays gets charged.',
} as const;

export const TABLE = {
  heading: 'The Table',
  sub: "Who's funded, who's running on Atiar-trust.",
  colPlayer: 'Player',
  colBalance: 'Balance',
  positiveFlavor: ['Funded.', 'Atiar-approved.'],
  negativeFlavor: [
    'Running on Atiar-trust.',
    'Time for a top-up, boss.',
    'IOU to the legend.',
  ],
  settled: 'All square.',
  empty: "No players yet. Tell Atiar bhai, he'll add everyone in 10 minutes.",
} as const;

export const RECENT = {
  heading: 'Recent damage',
  colFee: 'Fee',
  colPlayed: 'Played',
  colPerHead: 'Per head',
  colGuests: 'Guests',
  perHead: (perShare: string) => `Tonight's Atiar rate: ${perShare}`,
  empty: 'No matches played yet. The legend is warming up.',
} as const;

export const BREAKDOWN = {
  heading: 'The full maths',
  slotFee: 'Slot fee',
  guestCash: 'Guest cash',
  shares: 'Shares in play',
  perHead: 'Per head',
  whoPlayed: 'Who played and what they owed',
  uncovered: (fee: string) =>
    `Nobody's covering this one. Even Atiar bhai can't split ${fee} by zero.`,
  notFinalized:
    'Not settled yet. The maths lands once an admin ticks who turned up.',
} as const;

export const STATUS_LABEL: Record<MatchStatus, string> = {
  scheduled: 'Pencilled in (Atiar-tentative)',
  confirmed: 'Confirmed. Atiar bhai has spoken',
  completed: 'Played. Legends were made.',
  cancelled: 'Called off. Slot handed back like a gentleman.',
};

export const STATUS_SHORT: Record<MatchStatus, string> = {
  scheduled: 'Pencilled in',
  confirmed: 'Confirmed',
  completed: 'Played',
  cancelled: 'Called off',
};

export const SYSTEM = {
  notFound: [
    'Atiar bhai is currently fixing the water pump. Try again in 2 days.',
    'Page not found. But Atiar bhai says he can fix it by today.',
  ],
  error: "Something broke. Don't worry, Atiar bhai is already on it (2 days max).",
  loaders: [
    'Estimating completion… today.',
    'Fixing the water pump, brb.',
    'Extending the office building…',
    'Saying yes to your request…',
    'Confidence: 100%.',
    'Atiar bhai is on it.',
  ],
  empty: 'Nothing here yet. The legend is just getting started.',
  confidence: 'Atiar Confidence Meter',
} as const;

export const TOAST = {
  voteSaved: ['Noted. Atiar bhai has been informed.', 'Locked in. See you on the turf.'],
} as const;

/**
 * Deterministic pick from a rotation. Server and client must agree on the
 * string or React hydration complains, so this is seeded, never random.
 */
export function rotate(list: readonly string[], seed: number | string): string {
  const n =
    typeof seed === 'number'
      ? Math.abs(Math.trunc(seed))
      : Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return list[n % list.length] ?? list[0] ?? '';
}

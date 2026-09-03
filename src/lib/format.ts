// Display helpers. VOICE-AND-COPY section 7 is the hard rule here: on any
// screen showing real money the figure must be unmissable and correct. So
// formatting is boring on purpose, and every figure gets tabular digits.

import type { Tier } from './types';

/** The taka sign. Needs a font with Bengali coverage; see globals.css. */
export const TAKA = '৳';

/** Digits only, grouped. Rounded to the nearest whole taka for display. */
export function takaDigits(amount: number): string {
  return Math.abs(Math.round(amount)).toLocaleString('en-US');
}

/**
 * Taka, rounded to the nearest whole unit for display. Storage keeps 2 dp.
 *
 * Prefer the <Taka> component on screen: it styles the sign separately so the
 * figure stays unmissable even where Bengali glyph coverage is patchy. This
 * plain-string form is for titles, aria labels and non-visual contexts.
 */
export function taka(amount: number): string {
  return `${TAKA}${takaDigits(amount)}`;
}

/** Signed taka for balances: a real minus sign, never parentheses. */
export function takaSigned(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded < 0 ? '-' : ''}${taka(rounded)}`;
}

/** The playful skin. Data and logic stay full/half/free everywhere. */
export const TIER_LABEL: Record<Tier, string> = {
  full: 'Full Atiar',
  half: 'Semi-Atiar',
  free: 'Honorary Atiar',
};

export const TIER_SHORT: Record<Tier, string> = {
  full: 'Full',
  half: 'Half',
  free: 'Free',
};

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
};

/** A match_date is a plain date string (YYYY-MM-DD); parse it as local. */
export function parseMatchDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function formatMatchDate(dateStr: string): string {
  return parseMatchDate(dateStr).toLocaleDateString('en-GB', DATE_OPTS);
}

export function formatLongDate(dateStr: string): string {
  return parseMatchDate(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Midnight today, so day diffs ignore the time of day. */
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysUntil(dateStr: string): number {
  const target = parseMatchDate(dateStr);
  const diff = target.getTime() - startOfToday().getTime();
  return Math.round(diff / 86_400_000);
}

/**
 * The cancel-by deadline: 4 days before the match, the turf's resale window.
 * Requirements decision 4. This is NOT a payment lock and never affects money.
 */
export const CANCEL_BY_DAYS = 4;

export function cancelByDate(matchDate: string): Date {
  const d = parseMatchDate(matchDate);
  d.setDate(d.getDate() - CANCEL_BY_DAYS);
  return d;
}

export function formatCancelBy(matchDate: string): string {
  return cancelByDate(matchDate).toLocaleDateString('en-GB', DATE_OPTS);
}

/** Days left to make the keep-or-cancel call. Negative once it has passed. */
export function daysUntilCancelBy(matchDate: string): number {
  return daysUntil(matchDate) - CANCEL_BY_DAYS;
}

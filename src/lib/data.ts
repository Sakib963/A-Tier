import 'server-only';
import { supabaseRead } from './supabase/read';
import type {
  Attendance,
  Match,
  Player,
  PlayerBalance,
  Vote,
} from './types';

// Read helpers for the public site. Reads only, via the anon key and RLS.
// Kept server-side so the landing page can render fully formed HTML.

export interface PollCount {
  in: number;
  out: number;
}

export interface NextMatch {
  match: Match;
  poll: PollCount;
  /** Existing votes by player id, so the picker can show a current choice. */
  votes: Record<string, Vote>;
}

export interface MatchBreakdown {
  match: Match;
  attendances: (Attendance & { playerName: string })[];
  totalShares: number;
  totalCharged: number;
}

/**
 * The upcoming match: the soonest scheduled or confirmed one that has not
 * passed. Cancelled and completed matches never show as "next".
 */
export async function getNextMatch(): Promise<NextMatch | null> {
  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const { data: matches, error } = await supabaseRead
    .from('matches')
    .select('*')
    .in('status', ['scheduled', 'confirmed'])
    .gte('match_date', todayStr)
    .order('match_date', { ascending: true })
    .limit(1);

  if (error) throw new Error(`getNextMatch: ${error.message}`);

  const match = matches?.[0] as Match | undefined;
  if (!match) return null;

  const { data: rsvps, error: rsvpError } = await supabaseRead
    .from('rsvps')
    .select('player_id, vote')
    .eq('match_id', match.id);

  if (rsvpError) throw new Error(`getNextMatch rsvps: ${rsvpError.message}`);

  const poll: PollCount = { in: 0, out: 0 };
  const votes: Record<string, Vote> = {};
  for (const row of rsvps ?? []) {
    const vote = row.vote as Vote;
    votes[row.player_id as string] = vote;
    poll[vote] += 1;
  }

  return { match, poll, votes };
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabaseRead
    .from('players')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`getPlayers: ${error.message}`);
  return (data ?? []) as Player[];
}

/**
 * The Table. Balance is derived by the player_balances view:
 * payments in minus charges out. Negatives are expected and allowed.
 *
 * Sorted richest first, like a league table, with names breaking ties.
 */
export async function getBalances(): Promise<PlayerBalance[]> {
  const { data, error } = await supabaseRead
    .from('player_balances')
    .select('*');

  if (error) throw new Error(`getBalances: ${error.message}`);

  const rows = (data ?? []) as PlayerBalance[];
  return rows
    .map((r) => ({
      ...r,
      total_paid: Number(r.total_paid),
      total_charged: Number(r.total_charged),
      balance: Number(r.balance),
    }))
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

/**
 * Recent completed matches with their frozen breakdowns. The amounts come
 * from the attendances rows written at finalize, never recomputed, so past
 * matches can never shift.
 */
export async function getRecentMatches(limit = 5): Promise<MatchBreakdown[]> {
  const { data: matches, error } = await supabaseRead
    .from('matches')
    .select('*')
    .eq('status', 'completed')
    .order('match_date', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getRecentMatches: ${error.message}`);

  const list = (matches ?? []) as Match[];
  if (list.length === 0) return [];

  return Promise.all(list.map((m) => getMatchBreakdown(m)));
}

/** One match plus its attendance rows. Returns null if the id is unknown. */
export async function getMatchById(id: string): Promise<MatchBreakdown | null> {
  const { data, error } = await supabaseRead
    .from('matches')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`getMatchById: ${error.message}`);
  if (!data) return null;

  return getMatchBreakdown(data as Match);
}

async function getMatchBreakdown(match: Match): Promise<MatchBreakdown> {
  const { data, error } = await supabaseRead
    .from('attendances')
    .select('*, players(name)')
    .eq('match_id', match.id);

  if (error) throw new Error(`getMatchBreakdown: ${error.message}`);

  const rows = (data ?? []) as (Attendance & {
    players: { name: string } | null;
  })[];

  const attendances = rows
    .map((r) => ({
      ...r,
      share: Number(r.share),
      amount_charged: Number(r.amount_charged),
      playerName: r.players?.name ?? 'Unknown',
    }))
    .sort(
      (a, b) =>
        b.amount_charged - a.amount_charged ||
        a.playerName.localeCompare(b.playerName),
    );

  return {
    match: {
      ...match,
      fee: Number(match.fee),
      guest_cash: Number(match.guest_cash),
      per_share_cost:
        match.per_share_cost === null ? null : Number(match.per_share_cost),
    },
    attendances,
    totalShares: attendances.reduce((s, a) => s + a.share, 0),
    totalCharged: attendances.reduce((s, a) => s + a.amount_charged, 0),
  };
}

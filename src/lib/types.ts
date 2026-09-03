// Shared domain types. These mirror the Postgres enums and tables in
// supabase/migrations/0001_init.sql.

export type Tier = 'full' | 'half' | 'free';
export type MatchStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
export type Vote = 'in' | 'out';

export interface Player {
  id: string;
  name: string;
  default_tier: Tier;
  email: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  turf_name: string;
  match_date: string;
  match_time: string;
  fee: number;
  status: MatchStatus;
  guest_count: number;
  guest_cash: number;
  per_share_cost: number | null;
  created_at: string;
  finalized_at: string | null;
}

export interface Rsvp {
  id: string;
  match_id: string;
  player_id: string;
  vote: Vote;
  updated_at: string;
}

/** Immutable history. Written once at finalize, never recomputed. */
export interface Attendance {
  id: string;
  match_id: string;
  player_id: string;
  tier: Tier;
  share: number;
  amount_charged: number;
}

export interface Payment {
  id: string;
  player_id: string;
  amount: number;
  paid_on: string;
  note: string | null;
  created_at: string;
}

/** Derived, never stored. From the player_balances view. */
export interface PlayerBalance {
  player_id: string;
  name: string;
  default_tier: Tier;
  total_paid: number;
  total_charged: number;
  balance: number;
}

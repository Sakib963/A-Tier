-- A-Tier: initial schema
-- Source of truth: A-Tier-BUILD-SPEC.md section 3.
--
-- Design notes:
--   * Balance is DERIVED, never stored (see player_balances view).
--   * attendances rows are immutable history: amount_charged is frozen at
--     finalize time so later fee or tier edits can never retro-alter a past
--     match's numbers.
--   * RLS: anon may SELECT everything (the public site reads it all) and may
--     write nothing. Every mutation goes through a server route holding the
--     service-role key, which bypasses RLS.

-- ---------------------------------------------------------------- extensions
create extension if not exists pgcrypto;

-- --------------------------------------------------------------------- enums
do $$ begin
  create type tier as enum ('full', 'half', 'free');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vote as enum ('in', 'out');
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------------- tables
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_tier tier not null default 'full',
  email text,
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  turf_name text not null,
  match_date date not null,
  match_time text not null,
  fee numeric(10,2) not null,
  status match_status not null default 'scheduled',
  guest_count int not null default 0,
  guest_cash numeric(10,2) not null default 0,
  per_share_cost numeric(10,2),      -- filled at finalize
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

-- Advisory poll only. Never touches money.
-- A "no" voter who plays is charged; a "yes" voter who skips is not.
create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  vote vote not null,
  updated_at timestamptz not null default now(),
  unique (match_id, player_id)
);

-- The finalized set: who actually played + the immutable computed charge.
create table if not exists attendances (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  tier tier not null,                -- effective tier used for this match
  share numeric(3,1) not null,       -- 1.0 / 0.5 / 0.0
  amount_charged numeric(10,2) not null,
  unique (match_id, player_id)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  amount numeric(10,2) not null,
  paid_on date not null,
  note text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------- indexes
create index if not exists rsvps_match_idx on rsvps (match_id);
create index if not exists attendances_match_idx on attendances (match_id);
create index if not exists attendances_player_idx on attendances (player_id);
create index if not exists payments_player_idx on payments (player_id);
create index if not exists matches_date_idx on matches (match_date);

-- ------------------------------------------------------- derived balance view
-- balance = payments in - match costs out. May be negative; that is allowed
-- and is shown in red on the site, never blocked.
create or replace view player_balances as
select
  p.id                                    as player_id,
  p.name,
  p.default_tier,
  coalesce(paid.total, 0)                 as total_paid,
  coalesce(charged.total, 0)              as total_charged,
  coalesce(paid.total, 0) - coalesce(charged.total, 0) as balance
from players p
left join (
  select player_id, sum(amount) as total
  from payments group by player_id
) paid on paid.player_id = p.id
left join (
  select player_id, sum(amount_charged) as total
  from attendances group by player_id
) charged on charged.player_id = p.id;

-- ----------------------------------------------------------------------- RLS
alter table players     enable row level security;
alter table matches     enable row level security;
alter table rsvps       enable row level security;
alter table attendances enable row level security;
alter table payments    enable row level security;

-- Public read on everything. The whole site is transparent by design.
drop policy if exists players_public_read on players;
create policy players_public_read on players for select to anon, authenticated using (true);

drop policy if exists matches_public_read on matches;
create policy matches_public_read on matches for select to anon, authenticated using (true);

drop policy if exists rsvps_public_read on rsvps;
create policy rsvps_public_read on rsvps for select to anon, authenticated using (true);

drop policy if exists attendances_public_read on attendances;
create policy attendances_public_read on attendances for select to anon, authenticated using (true);

drop policy if exists payments_public_read on payments;
create policy payments_public_read on payments for select to anon, authenticated using (true);

-- No anon insert/update/delete policies exist, so all writes are denied to the
-- browser. Server routes use the service-role key, which bypasses RLS.

-- The view runs with the privileges of the querying role, so the underlying
-- table policies above still apply.
alter view player_balances set (security_invoker = on);

grant select on player_balances to anon, authenticated;

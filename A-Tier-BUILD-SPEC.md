# A-Tier — Build Spec (v1)

Technical companion to `A-Tier-requirements-v0.2.md` (the functional source of truth). Read that first for *what* and *why*; this doc is *how*.

---

## 0. Non-negotiables

1. **It's a website, not an admin portal.** No sidebar-dashboard shell, no data-grid app feel. A public landing page shows it all (next match, the standings table, recent matches, the poll, Atiar fun). Admin actions live behind a simple login on their own plain, focused pages. Think "club website," not "internal tool."
2. **The money math is the product.** Get `computeSplit` (§4) correct and unit-tested before building any UI on top of it.
3. **History is immutable.** Once a match is finalized, store the computed amounts. Later fee/tier changes must never retro-alter a past match's numbers.

---

## 1. Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS.**
- **Supabase** for Postgres (DB only in v1 — no Supabase Auth; admin gate is custom, see §6).
- Deploy on **Vercel** (free).
- Keep dependencies light. Tailwind for styling; a few headless primitives are fine, but design custom and playful — do not lean on a dashboard component kit.

---

## 2. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # client, read-only via RLS
SUPABASE_SERVICE_ROLE_KEY=          # server only, for all writes
ADMIN_PASSCODE=                     # single shared admin secret (v1)
SESSION_SECRET=                     # to sign the admin cookie
```

---

## 3. Data model (Postgres / Supabase)

Enums:
```sql
create type tier as enum ('full', 'half', 'free');
create type match_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled');
create type vote as enum ('in', 'out');
```

Tables:
```sql
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_tier tier not null default 'full',
  email text,
  created_at timestamptz not null default now()
);

create table matches (
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

-- advisory poll only; never touches money
create table rsvps (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  vote vote not null,
  updated_at timestamptz not null default now(),
  unique (match_id, player_id)
);

-- the finalized set: who actually played + immutable computed charge
create table attendances (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  tier tier not null,                -- effective tier used for this match
  share numeric(3,1) not null,       -- 1.0 / 0.5 / 0.0
  amount_charged numeric(10,2) not null,
  unique (match_id, player_id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  amount numeric(10,2) not null,
  paid_on date not null,
  note text,
  created_at timestamptz not null default now()
);
```

**Balance** is derived, not stored:
`balance(player) = sum(payments.amount) − sum(attendances.amount_charged)`.
Expose as a SQL view or compute in a server route.

**RLS:** enable on all tables. Grant anon **select** on all tables (public site reads everything). Grant **no** anon insert/update/delete — every write goes through a server route using the service-role key (§6).

---

## 4. Core contract: `computeSplit`

Pure function. Write it and its tests first.

```ts
type Tier = 'full' | 'half' | 'free';
const SHARES: Record<Tier, number> = { full: 1, half: 0.5, free: 0 };

interface Attendee { playerId: string; tier: Tier; }
interface Charge { playerId: string; tier: Tier; share: number; amount: number; }
interface SplitResult {
  totalShares: number;
  perShare: number;          // 2 dp
  charges: Charge[];
  uncovered: boolean;        // true if the split can't cover the fee (see below)
}

function computeSplit(fee: number, guestCash: number, attendees: Attendee[]): SplitResult
```

Rules:
- `net = max(fee - guestCash, 0)`.
- `totalShares = sum(SHARES[tier])` over attendees.
- `perShare = totalShares > 0 ? net / totalShares : 0`, rounded to 2 dp.
- each `amount = round(perShare * SHARES[tier], 2)`.
- `uncovered = totalShares === 0 && net > 0` (e.g. everyone free, or no attendees but a fee exists) → admin UI must warn; no one is charged.

Rounding: store 2 dp. Display rounded to the nearest taka. Tiny drift between summed charges and the fee is acceptable in v1 — do not force reconciliation.

**Required tests** (at least): the 18-full + 2-half = per-share ≈ 184 case; a case with guest cash; an all-free `uncovered` case; a mixed case verifying each amount.

---

## 5. Money & match rules (recap — full detail in requirements §3, §5)

- Charge = **actual attendance only.** The RSVP poll is advisory; it never bills anyone. Voted-no-but-played is charged; voted-yes-but-skipped is not.
- Tier per match = player's `default_tier`, but admin may override it at finalize for that match only.
- Deduction happens **only at finalize** (writes `attendances` + `matches.per_share_cost` + `finalized_at`).
- Balances carry forward month to month and **may go negative** (show in red, never block).
- Guests: count + cash per match; cash subtracts from fee before the split.
- **4-day mark = cancel-by deadline** (turf resale window), *not* a payment lock. The poll can keep updating until match day.

---

## 6. Auth model (keep it dead simple)

- **Public site:** no login. Reads everything. Players cast their in/out vote by picking their name — this hits a public server route `POST /api/rsvp` (no password) that upserts the vote via service role.
- **Admin:** `POST /api/login` checks `ADMIN_PASSCODE`, sets a signed, http-only session cookie. Admin pages and all admin write routes check that cookie server-side. One shared passcode for v1 — not per-user (per-player PIN is a later phase).
- **All mutations go through server routes** using the service-role key. The browser never holds write access.

---

## 7. Routes & pages

**Public (no login) — this is the whole "website":**
- `/` — **Landing, shows it all**, in sections:
  - *Next match* hero — turf, date, time, status, countdown to the 4-day cancel-by deadline, live poll count (X in / Y out), and an inline "cast your vote" (pick name → in/out).
  - *The Table* — every player's balance, styled like a league standings table (fun framing), negatives in red.
  - *Recent matches* — cards with the cost breakdown (fee, who played, per-share, guests).
  - Atiar fun woven throughout (requirements §10).
- `/matches/[id]` — optional match detail / full breakdown page.

**Admin (behind login) — plain, focused, one-job pages, NOT a dashboard:**
- `/login` — passcode field.
- `/admin/players` — list + create/edit players (name, default tier, optional email).
- `/admin/matches` — list + create/confirm/cancel matches; optional "email the crew" on confirm.
- `/admin/matches/[id]/finalize` — the money screen: tick who actually played, override tiers inline, enter guest count + cash → **live `computeSplit` preview** → confirm to write.
- `/admin/payments` — record a payment (player, amount, date, note).

Reach admin pages from a simple text nav that only appears when logged in. No widget grid, no sidebar shell.

---

## 8. Build order (do in this sequence, commit per step)

1. Scaffold Next.js + TS + Tailwind + Supabase client. Add env. Create the schema (SQL migration) + RLS. Seed ~5 test players.
2. `computeSplit` + unit tests (§4). **Green before moving on.**
3. Public landing read-only: next match hero, the Table, recent matches — wired to real data.
4. RSVP voting: name-picker + in/out → `/api/rsvp`. Live poll count on the hero.
5. Admin: login/passcode → players CRUD → matches CRUD → **finalize screen with live split preview** → payments. Balances update from finalized matches + payments.
6. Atiar theme pass across all copy, empty states, 404, loaders (requirements §10).
7. Keepalive (§9). Deploy to Vercel.

---

## 9. Keepalive

Add `GET /api/ping` (cheap DB `select 1`). A GitHub Actions cron hits it every 3 days to keep the Supabase free project from pausing after 7 days idle. (UptimeRobot free monitor is an alternative.)

---

## 10. Out of scope for v1

Per-player PIN login, polished email system, group treasury view (collected / prepaid-to-turf / pool), stats & history dashboards. Design so these slot in later, but don't build them now.

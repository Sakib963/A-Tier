# A-Tier

*The football fund that finally adds up.*

A transparent money + match manager for a weekly turf football crew. Public
website, not an admin portal: anyone can open the URL and see the next match,
everyone's balance, and what each match actually cost.

## Specs

The four spec docs at the repo root are the source of truth. Read them in this
order:

1. `A-Tier-KICKOFF-PROMPT.md` - the directive and prime directives.
2. `A-Tier-requirements-v0.2.md` - what the app does and why (behavioral source of truth).
3. `A-Tier-BUILD-SPEC.md` - stack, schema, the money-math contract, page map, build order.
4. `A-Tier-VOICE-AND-COPY.md` - the voice guide and copy for every surface.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres only).
Deployed on Vercel. Dependencies stay light on purpose.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev
```

### Database setup

Run the migration and seed against your Supabase project (SQL Editor, or the
Supabase CLI):

```bash
supabase/migrations/0001_init.sql   # schema, balance view, RLS
supabase/seed.sql                   # ~5 test players
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm test` | Unit tests (the money math) |
| `npm run typecheck` | `tsc --noEmit` |

## Architecture notes

- **Reads** go through the anon key + RLS (`src/lib/supabase/read.ts`). The
  public site reads everything; the schema is transparent by design.
- **Writes** only ever happen in server routes via the service-role key
  (`src/lib/supabase/admin.ts`, guarded by `server-only`). The browser never
  holds write access.
- **Balance is derived**, never stored: the `player_balances` view computes
  `payments in - charges out`. Negatives are allowed and shown in red.
- **History is immutable.** Finalizing a match freezes `amount_charged` per
  attendee, so later fee or tier edits can never retro-alter past matches.
- **The RSVP poll is advisory.** It plans headcount and drives the keep-or-cancel
  call at the 4-day mark. It never bills anyone: only admin-finalized actual
  attendance is charged.

## Keepalive

`GET /api/ping` does a cheap DB check. `.github/workflows/keepalive.yml` hits it
every 3 days so the free Supabase project does not pause. Set the
`KEEPALIVE_URL` repo secret to your deployed origin.

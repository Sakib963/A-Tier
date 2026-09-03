<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# A-Tier project rules

*The football fund that finally adds up.*

A transparent money + match manager for a weekly turf football crew (~25
players). Personal side project, not an office tool.

## Specs are the source of truth

Four docs at the repo root. Read before changing behavior:

1. `A-Tier-KICKOFF-PROMPT.md` - the directive and prime directives.
2. `A-Tier-requirements-v0.2.md` - **behavioral source of truth.** What the app
   does and why, plus the resolved decisions list (section 12).
3. `A-Tier-BUILD-SPEC.md` - stack, schema, the money-math contract (section 4),
   page map (section 7), build order (section 8).
4. `A-Tier-VOICE-AND-COPY.md` - voice guide and ready-made copy per surface.

If product behavior is ambiguous, **ask; do not invent it.** Small technical
choices are fine to make alone, noted briefly.

## Non-negotiables

1. **It is a website, not an admin portal.** The public landing page shows
   everything: next match, the standings table of balances, recent match cost
   breakdowns, the poll. No sidebar shell, no data-grid feel. Club-website
   energy. Admin actions live on plain, focused, one-job pages behind a
   passcode, reachable from a simple text nav that only appears when logged in.
2. **The money math is the product.** `computeSplit` is a pure, unit-tested
   function. Tests stay green; UI never gets built on unverified math.
3. **The RSVP poll is advisory and never bills anyone.** It plans headcount and
   drives the keep-or-cancel call at the 4-day mark. Only admin-finalized
   actual attendance is charged. Voted-no-but-played pays; voted-yes-but-skipped
   does not; did-not-vote-but-played pays.
4. **History is immutable.** Finalizing freezes each attendee's
   `amount_charged` and the match's `per_share_cost`. Later fee or tier edits
   must never retro-alter a past match.
5. **Every surface carries the Atiar voice**, from the first render. Not a final
   polish pass.

## The money model

Share-based, not headcount. Full = 1.0, half = 0.5, free = 0.0 shares.

```
net       = max(fee - guestCash, 0)
perShare  = totalShares > 0 ? net / totalShares : 0    // 2 dp
amount    = round(perShare * shares[tier], 2)
uncovered = totalShares === 0 && net > 0               // warn, charge nobody
```

- Guest cash is subtracted from the fee **first**, so guests lighten everyone's
  bill.
- Free players are **excluded from the denominator** on purpose: the rest
  quietly absorb them. This is intended, not a bug.
- Tier per match = the player's `default_tier`, but an admin may override it at
  finalize **for that match only**, without touching the profile.
- Store 2 dp, display rounded to the nearest taka. Tiny drift between summed
  charges and the fee is acceptable in v1; do not force reconciliation.
- Money moves **only at finalize**. Nothing else deducts.

Reference case: fee 3500, no guests, 18 full + 2 half play, shares = 19,
per-share ~= 184. Full owes 184, half owes 92.

## Balances

- Derived, never stored: the `player_balances` view computes
  `sum(payments) - sum(attendances.amount_charged)`.
- Carry forward month to month. **Negatives are allowed**, shown in red, and
  never block anything.
- Admin records payments received; there is no payment gateway.

## Data & auth architecture

- **Reads:** anon key + RLS via `src/lib/supabase/read.ts`. The public site
  reads every table; transparency is the point.
- **Writes:** only ever in server routes via the service-role key
  (`src/lib/supabase/admin.ts`, guarded by `import 'server-only'`). The browser
  never holds write access. RLS grants anon SELECT only, with no write policies
  at all.
- **Players** have no login in v1: they pick their name to cast a vote, hitting
  a public `POST /api/rsvp`. Trust-based by design (requirements decision 1).
  Per-player PIN is a later phase.
- **Admin** is one shared `ADMIN_PASSCODE` setting a signed http-only cookie.
  Every admin page and write route checks it server-side.

## Voice rules

Read `A-Tier-VOICE-AND-COPY.md` and pull its strings rather than writing
generic labels. The hard ones:

- **NO EM DASHES in any user-facing text.**
- **Celebrate, never mock.** The joke is always "Atiar bhai is unstoppable,"
  never that anyone is foolish. Not Atiar, not the staff who play free, not
  whoever owes money. Everyone is an Atiar of some grade.
- **Never shame a debtor.** Negative balances get gentle, funny nudges.
- **Comedy never obscures a real number.** On any money surface the figure is
  unmissable and correct; humor decorates the label only. If a line makes an
  amount harder to read, cut the line.
- Light Banglish and "bhai" land well. Give reusable strings (loaders, empty
  states) a small rotation.
- Tier display skin: `full` = "Full Atiar", `half` = "Semi-Atiar", `free` =
  "Honorary Atiar" (a title of honor, never a jab). Data and logic stay
  full/half/free everywhere.

## Conventions

- Money figures use the `.tabular` class (tabular-nums) so digits line up.
- Currency is taka: display as `৳1,234`, rounded to the nearest taka.
- Palette lives in `src/app/globals.css` under `@theme` (Tailwind 4 is
  CSS-first; there is no `tailwind.config.js`).
- Keep dependencies light. Tailwind for styling, a few headless primitives at
  most. Do not add a dashboard component kit.

## Commands

```bash
npm run dev        # dev server on :3000
npm test           # unit tests (the money math)
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

## Build order

Follow `A-Tier-BUILD-SPEC.md` section 8 in sequence, committing per step. Do
not jump ahead.

1. ~~Scaffold + schema + RLS + seed~~ (done)
2. `computeSplit` + unit tests. Green before moving on.
3. Public landing, read-only: next match hero, The Table, recent matches.
4. RSVP voting: name picker + in/out, live poll count.
5. Admin: login, players CRUD, matches CRUD, finalize screen with live split
   preview, payments.
6. Atiar theme pass across all copy, empty states, 404, loaders.
7. Keepalive + deploy to Vercel.

## Out of scope for v1

Per-player PIN login, polished email system, group treasury view (collected /
prepaid-to-turf / pool), stats and history dashboards. Design so they slot in
later; do not build them now.

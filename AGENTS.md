<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# A-Tier project rules

*The football fund that finally adds up.*

The public website for the Celloscope Football Club crew (~36 players, weekly
turf football). Personal side project, not an office tool. `README.md` has the
full architecture, setup, caching strategy, and deploy steps; read it first.

## Architecture in one breath

The club Google Sheet is the single source of truth. `lib/club-sheet.ts` reads
it with a read-only service account and reshapes it into `ClubData`.
`app/api/club-data/route.ts` serves that as cached JSON. `public/a-tier.html` is
a static page, served at `/` by a rewrite in `next.config.ts`, that fetches the
JSON and renders it. No database, no admin UI, no writes, no auth.

## Non-negotiables

1. **The sheet is the source of truth, and the app is read-only.** Admins edit
   the sheet; players vote on its Current Match tab (the Vote buttons open
   `SHEET_URL`). Never add a database, a write path, or a second copy of the
   data. Money math (deposits, spend, balances) is done in the sheet; the app
   only sums player rows for the wallet totals.
2. **The sheet layout is fixed. Do not guess.** If parsing looks off (a tab not
   found, a header not matched, numbers that do not add up), report the exact
   tab and cell instead of inventing a workaround. Columns are matched by
   header text through the alias lists in `lib/club-sheet.ts`; tabs by name.
3. **Keep `public/a-tier.html` a static HTML file.** Do not port it to React or
   split it into components. Do not change its visual design or copy unless
   asked. Leave `SHEET_URL` alone.
4. **Only `ClubData` fields leave the server.** The sheet also holds players'
   phone numbers and emails. Never add contact details to the API response.
   `reference-and-docs/` holds a local copy of the sheet with that data and is
   gitignored; keep it out of commits.
5. **Every surface carries the Atiar voice** (see Voice rules). Loading and
   error states included.

## Where things live

| Path | Role |
|---|---|
| `lib/club-sheet.ts` | Sheet client, tab parsers, `getClubData()`, the 24-hour cache for past match counts. |
| `app/api/club-data/route.ts` | `GET /api/club-data`: 5-minute cache, `runtime = "nodejs"` (googleapis needs Node). |
| `public/a-tier.html` | The whole landing page: inline CSS and one inline script. |
| `next.config.ts` | The `/` to `/a-tier.html` rewrite. |
| `A-Tier-*.md` | Original v1 specs for a Supabase build. Superseded for architecture; `A-Tier-VOICE-AND-COPY.md` still applies. |

### Sheet tabs the parser depends on

- `Player Directory & Wallet`: header row with `Player Name`, `Total Deposit`,
  `Total Spent`, `Available Balance`, `No of Play Match`, `Player Type`,
  `Player Position`, `Image Link`. Player rows start with a numeric `#`.
- `Match Schedule & Venue`: `ID`, `Turf Name`, `Match Date`, `Slot Time`,
  `Match Status` (`Live` / `Upcoming` / `Confirmed` / `Completed`), `Total Rent`,
  `Advance Paid`, `Due to Turf`.
- `Current Match`: `Yes (N)` and `No (N)` header labels.
- One tab per match named `DD-MMM-YYYY` with a `Played (N)` label.

Each tab is read over `A1:AE100`. Dates come back as serial numbers
(`UNFORMATTED_VALUE`) and kick-off times are built in Asia/Dhaka (`+06:00`).

### The page script (`public/a-tier.html`)

- Top: `SHEET_URL`, `FACTS`, `boot()`, `doneLoading()`, `loadFailed()`, helpers.
- Runs immediately: vote links, loading skeletons, hero effects, scroll reveal
  and count-up, back-to-top.
- `initAll()`: everything that renders sheet data. It runs only after `boot()`
  has the JSON. Anything new that reads `DATA` goes in here.
- Each block is wrapped in `guard()` so one failure cannot blank the page.
- Placeholder values that data will replace carry `data-skel` so they shimmer
  while loading. Give any new data-bound element the same treatment, and make
  sure `loadFailed()` leaves it in a sensible state.

## Caching (summary; details in README)

| Layer | Lifetime |
|---|---|
| Past match played counts (`unstable_cache`, key `match-played`) | 24 hours; a `0` is always re-read |
| Whole `ClubData` (`unstable_cache`, key `club-data`) | 5 minutes |
| Route output (`export const revalidate = 300`, ISR, prerendered at build) | 5 minutes |
| CDN (`s-maxage=300, stale-while-revalidate=120`) | 5 minutes |
| Player photos | Browser, set by the image hosts |

Rules when touching caching:

- Keep the three 5-minute values in `route.ts` in step, and keep `revalidate` a
  number literal.
- New sheet reads go inside `getClubData()` so the 5-minute layer covers them.
  Give data its own longer cache only if it is truly frozen once written.
- A normal refresh must stay at two Sheets API calls.
- `unstable_cache` is the pre-Cache-Components API. It is fine here because
  `cacheComponents` is off; do not mix in `use cache` without migrating
  everything.

## Voice rules

Read `A-Tier-VOICE-AND-COPY.md` before writing any user-facing text. The hard
ones:

- **NO EM DASHES in any user-facing text.**
- **Celebrate, never mock.** The joke is always "Atiar bhai is unstoppable",
  never that anyone is foolish.
- **Never shame a debtor.** Negative balances are shown in red, gently.
- **Comedy never obscures a real number.** On any money surface the figure is
  unmissable and correct; humor decorates the label only.
- Light Banglish and "bhai" land well.

## Conventions

- Currency is taka via the page's `bdt()` helper: `৳1,234`, rounded, `en-IN`
  grouping. Money uses the `.money` class (tabular mono digits); negatives get
  `.neg`, positives `.pos`.
- Colors come from the CSS variables in `:root` of `a-tier.html`
  (`--amber`, `--mint`, `--red`, `--ink`, ...). Reuse them; do not add a CSS
  framework.
- Keep dependencies light: `next`, `react`, `googleapis`, and nothing else at
  runtime unless there is a strong reason.

## Commands

```bash
npm run dev        # dev server on :3000
npm run typecheck  # tsc --noEmit
npm run build      # production build (reads the sheet; needs the env vars)
npm run start      # serve the production build
```

There is no test suite. To verify a change: typecheck, build, check that
`/api/club-data` returns JSON with `nextMatch`, `totals`, `history`, and
`players`, and that `/` renders live data (wallet table, squad cards,
countdown, vote counts) plus the loading and error states.

## Known hardcoded bits on the page

These are static copy in `a-tier.html`, not read from the sheet:

- The kick-off line under the countdown (`#cd-cap`) and "Kick-off 7:30 PM" in
  the ticker and next-match timeline card.
- The team chips (managers, round-robin note) in the match card.
- The per-head rate in history is a constant (`PER_HEAD_DEFAULT = 200` in
  `lib/club-sheet.ts`).

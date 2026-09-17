# A-Tier

*The football fund that finally adds up.*

The public home ground for the Celloscope Football Club crew: the next match,
the live yes/no vote count, everyone's wallet balance, the squad, and the season
so far. Anyone with the URL can see it.

There is no database and no admin panel. **The club Google Sheet is the single
source of truth.** Admins keep editing the sheet exactly as they do today, and
players mark themselves in or out on the sheet's Current Match tab (the Vote
buttons open it). This app only reads the sheet and presents it.

## How it fits together

```
Google Sheet ──(service account, read-only)──> lib/club-sheet.ts
                                                   │ reshapes tabs into ClubData
                                                   ▼
                                        app/api/club-data/route.ts   GET /api/club-data (cached JSON)
                                                   ▲
                                                   │ fetch on page load
public/a-tier.html  <── served at / via a rewrite in next.config.ts
```

| Path | What it is |
|---|---|
| `lib/club-sheet.ts` | The only code that knows the sheet layout. Reads the tabs and returns `ClubData`. |
| `app/api/club-data/route.ts` | The one API route. Returns `ClubData` as JSON, cached (see [Caching](#caching-strategy)). |
| `public/a-tier.html` | The landing page. A self-contained static HTML file (CSS and JS inline), deliberately not React. |
| `next.config.ts` | Rewrites `/` to `/a-tier.html`. |
| `.env.local.example` | The env vars the app needs. |

### What is read from the sheet

| Tab | Used for |
|---|---|
| `Player Directory & Wallet` | `players[]`: name, company, deposit, spent, balance, matches, type, position, image link. `totals` are summed from these rows (pool = deposit minus spent). |
| `Match Schedule & Venue` | The next match (status `Live` wins, otherwise the earliest `Upcoming`/`Confirmed` that is not in the past) and the history (every `Completed` row, newest first). |
| `Current Match` | The live vote count, from the `Yes (N)` / `No (N)` header labels. Falls back to counting the checkboxes. |
| `DD-MMM-YYYY` (one per match, e.g. `15-Sep-2026`) | How many played in a finished match, from its `Played (N)` label. |

Columns are found by their header text (for example `Total Deposit`,
`Available Balance`), not by position, so moving a column is fine but renaming a
header or a tab needs a matching change in the alias lists in
`lib/club-sheet.ts`. Each tab is read over `A1:AE100`, so the player directory
holds up to 98 players (rows 3 to 100) before that range needs widening.

Only the fields in `ClubData` ever leave the server. The sheet also holds phone
numbers and emails; those are read but never returned.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the service account values
npm run dev                        # http://localhost:3000
```

### Google service account

1. In Google Cloud, create a service account and a JSON key for it. Enable the
   Google Sheets API on that project.
2. Share the club sheet with the service account's `client_email` as a
   **Viewer**.
3. Copy `client_email` and `private_key` from the JSON key into `.env.local`.

| Variable | Value |
|---|---|
| `SHEET_ID` | The ID in the sheet URL (already set in the example). |
| `GOOGLE_CLIENT_EMAIL` | `client_email` from the JSON key. |
| `GOOGLE_PRIVATE_KEY` | `private_key` from the JSON key. Line breaks may be real or written as `\n`; the code handles both. |

If `/api/club-data` returns `{"error":"Could not read the club sheet"}`, the
server log has the real cause. The usual ones:

- `account not found`: `GOOGLE_CLIENT_EMAIL` is wrong or still the placeholder.
- `ERR_OSSL_UNSUPPORTED` / `DECODER routines`: the private key is malformed
  (often stray quotes or broken line breaks).
- `The caller does not have permission`: the sheet is not shared with the
  service account.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build (reads the sheet once, see below) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

## Caching strategy

The sheet changes a few times a day at most, and a busy matchday should not
hammer the Sheets API or make every visitor wait on Google. So the data is
cached in layers, and each layer matches how often that data really changes.

| Layer | Where | Lifetime | What it holds |
|---|---|---|---|
| 1. Past match counts | `unstable_cache` in `lib/club-sheet.ts` (key `match-played` + tab name) | 24 hours | The `Played (N)` count for each finished match. |
| 2. Club data | `unstable_cache` in `route.ts` (key `club-data`) | 5 minutes | The whole `ClubData` object. |
| 3. Route output | `export const revalidate = 300` in `route.ts` | 5 minutes | The JSON response, prerendered at build time and regenerated in the background (ISR). |
| 4. CDN | `Cache-Control: s-maxage=300, stale-while-revalidate=120` | 5 minutes, plus 2 stale | The response at Vercel's edge. |
| 5. Browser | Set by the image hosts, not by us | Slack avatars 1 year, Drive thumbnails 1 day | Player photos. The server never downloads images; the sheet only gives it their URLs. |

**Why past matches are cached separately.** A refresh of layer 2 makes two
Sheets calls: one for the tab list and one batch read of the three core tabs.
Played counts live in a separate tab per match, which would add one more call
per finished match on every refresh, growing all season. Those counts do not
change once a match is done, so they sit in their own 24-hour cache and a
normal refresh stays at two calls. A count of `0` usually means attendance has
not been entered yet, so a `0` is always re-read fresh until a real number
appears.

**What this means in practice.**

- A new vote, payment, or player shows up on the site within about 5 minutes
  (up to about 7 with the stale window).
- Correcting the played count of an already finished match can take up to 24
  hours to show. Next.js keeps this data cache across deployments, so a redeploy
  does not clear it; purge the Data Cache from the Vercel project settings if it
  cannot wait.
- `npm run build` reads the sheet to prerender `/api/club-data`, so the env vars
  must be available at build time. Without them the build still passes, but the
  route becomes dynamic (layers 1, 2, and 4 still apply).

**When changing it.** Keep `revalidate` in `route.ts` a plain number literal
(Next.js reads it statically) and keep it in step with the `unstable_cache`
revalidate and the `s-maxage` header. New sheet reads belong inside
`getClubData` so they are covered by the 5-minute layer; only data that is
truly frozen deserves a longer cache of its own.

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel. The Next.js preset needs no
   changes.
2. Before the first deploy, add `SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, and
   `GOOGLE_PRIVATE_KEY` for Production and Preview. Paste the private key
   **without** the surrounding quotes used in `.env.local`.
3. Deploy, then check that `/api/club-data` returns JSON and `/` shows live
   numbers.

## The landing page

`public/a-tier.html` is plain HTML, CSS, and JS in one file. The inline script:

- holds `SHEET_URL` (where the Vote buttons go) and `FACTS` (the rotating Atiar
  facts, which are not in the sheet);
- runs the page effects straight away (hero animation, scroll reveal, loading
  skeletons, back-to-top button);
- calls `boot()`, which fetches `/api/club-data` and then runs `initAll()` to
  render the match card, wallet stats and table, squad cards, and season
  timeline. If the fetch fails, `loadFailed()` swaps the skeletons for a
  friendly error.

Elements marked `data-skel` shimmer while loading; their text is only a
placeholder until the data arrives.

## Background docs

The `A-Tier-*.md` spec docs at the repo root describe the original v1 plan (a
Supabase database, admin pages, in-app voting). That architecture was replaced
by the sheet-backed site above. `A-Tier-VOICE-AND-COPY.md` still applies to
every word on the page.

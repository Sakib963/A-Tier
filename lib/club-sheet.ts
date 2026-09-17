// lib/club-sheet.ts
//
// Reads the Celloscope Football Club Google Sheet with a service account and
// reshapes the messy multi-block tabs into the exact `DATA` shape the A-Tier
// landing page expects. The sheet stays the single source of truth; this file
// is the only thing that knows its layout.
//
// Tabs used:
//   "Player Directory & Wallet"  -> players[] + totals
//   "Match Schedule & Venue"     -> next match details + completed history
//   "Current Match"              -> live yes/no vote counts
//   "<DD-MMM-YYYY>" per-match tab -> played count for a completed match
//
// If your teammate renames a column or tab, adjust the alias lists below.

import { google } from "googleapis";
import { unstable_cache } from "next/cache";

const SPREADSHEET_ID = process.env.SHEET_ID!;
// The crew collects a flat amount per head each match. Adjust if that changes.
const PER_HEAD_DEFAULT = 200;

// ---------- types (mirror the page's DATA object, minus the static `facts`) ----------
export interface Player {
  no: number; name: string; company: string;
  deposit: number; spent: number; balance: number;
  matches: number; type: string; position: string;
  legend: boolean; img: string | null;
}
export interface ClubData {
  nextMatch: {
    id: string; dateISO: string; dateLabel: string; time: string;
    venue: string; status: string; rent: number; advance: number; due: number;
    yes: number; no: number; roster: number;
  };
  totals: { deposit: number; spent: number; pool: number };
  history: { id: string; date: string; rent: number; played: number; perHead: number }[];
  players: Player[];
}

// ---------- auth ----------
// One client per server instance, so parallel reads share a single access token.
let client: ReturnType<typeof google.sheets> | undefined;
function sheetsClient() {
  if (client) return client;
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      // Vercel stores the key with literal \n, so turn those back into newlines.
      private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return (client = google.sheets({ version: "v4", auth }));
}

// ---------- small helpers ----------
type Grid = any[][];
const S = (v: any) => (v == null ? "" : String(v)).trim();
const num = (v: any) =>
  typeof v === "number" ? v : parseFloat(S(v).replace(/[^0-9.-]/g, "")) || 0;
const isTrue = (v: any) => v === true || S(v).toUpperCase() === "TRUE";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Sheets/Excel serial date -> JS Date at UTC midnight (epoch 1899-12-30).
const serialToDate = (serial: number) => new Date(Math.round((serial - 25569) * 86400000));
const todaySerial = () => Date.now() / 86400000 + 25569;
const fmtDayMon = (serial: number) => {
  const d = serialToDate(serial);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

// Find the header row (first row that contains every required label) and return
// a lookup from field name -> column index using the alias lists.
function headerCols(grid: Grid, required: string[], aliases: Record<string, string[]>) {
  for (let r = 0; r < Math.min(grid.length, 12); r++) {
    const row = (grid[r] || []).map((c) => S(c).toLowerCase());
    const has = required.every((label) => row.some((c) => c.includes(label.toLowerCase())));
    if (!has) continue;
    const cols: Record<string, number> = {};
    for (const [field, names] of Object.entries(aliases)) {
      cols[field] = row.findIndex((c) => names.some((n) => c.includes(n.toLowerCase())));
    }
    return { headerRow: r, cols };
  }
  throw new Error(`Header row not found (need: ${required.join(", ")})`);
}

// Parse "Yes (5)" style labels -> 5.
const countInLabel = (grid: Grid, startsWith: string): number | null => {
  for (const row of grid) {
    for (const cell of row || []) {
      const m = S(cell).match(new RegExp(`^${startsWith}\\s*\\((\\d+)\\)`, "i"));
      if (m) return parseInt(m[1], 10);
    }
  }
  return null;
};

// ---------- parsers ----------
function parsePlayers(grid: Grid): Player[] {
  const { headerRow, cols } = headerCols(
    grid,
    ["player name", "total deposit"],
    {
      no: ["#"], name: ["player name"], company: ["company"],
      deposit: ["total deposit"], spent: ["total spent"], balance: ["available balance", "balance"],
      matches: ["no of play", "matches"], type: ["player type"], position: ["player position", "position"],
      img: ["image link", "image"],
    }
  );
  const players: Player[] = [];
  for (let r = headerRow + 1; r < grid.length; r++) {
    const row = grid[r] || [];
    const no = row[cols.no];
    if (typeof no !== "number") continue; // stop at blank / totals rows
    const name = S(row[cols.name]);
    if (!name) continue;
    players.push({
      no,
      name,
      company: S(row[cols.company]),
      deposit: num(row[cols.deposit]),
      spent: num(row[cols.spent]),
      balance: num(row[cols.balance]),
      matches: num(row[cols.matches]),
      type: S(row[cols.type]),
      position: S(row[cols.position]) || "All-Rounder",
      legend: /atiar/i.test(name),
      img: S(row[cols.img]) || null,
    });
  }
  return players;
}

function computeTotals(players: Player[]) {
  const deposit = players.reduce((s, p) => s + p.deposit, 0);
  const spent = players.reduce((s, p) => s + p.spent, 0);
  return { deposit, spent, pool: deposit - spent };
}

interface SchedRow {
  id: string; turf: string; address: string; dateSerial: number;
  slot: string; status: string; rent: number; advance: number; due: number;
}
function parseSchedule(grid: Grid): SchedRow[] {
  const { headerRow, cols } = headerCols(
    grid,
    ["id", "match status"],
    {
      id: ["id"], turf: ["turf name"], address: ["address"], date: ["match date"],
      slot: ["slot time"], status: ["match status"], rent: ["total rent"],
      advance: ["advance paid"], due: ["due to turf"],
    }
  );
  const rows: SchedRow[] = [];
  for (let r = headerRow + 1; r < grid.length; r++) {
    const row = grid[r] || [];
    const id = S(row[cols.id]);
    if (!id) continue;
    rows.push({
      id,
      turf: S(row[cols.turf]),
      address: S(row[cols.address]),
      dateSerial: num(row[cols.date]),
      slot: S(row[cols.slot]),
      status: S(row[cols.status]),
      rent: num(row[cols.rent]),
      advance: num(row[cols.advance]),
      due: num(row[cols.due]),
    });
  }
  return rows;
}

// "07:30 PM To 09:00 PM" -> { hh: 19, mm: 30 }
function startTime(slot: string) {
  const m = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return { hh: 19, mm: 30 };
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const pm = /pm/i.test(m[3]);
  if (pm && hh !== 12) hh += 12;
  if (!pm && hh === 12) hh = 0;
  return { hh, mm };
}

function pickNextMatch(schedule: SchedRow[]) {
  const now = todaySerial();
  const upcoming = schedule
    .filter((s) => /live|upcoming|confirmed/i.test(s.status) && s.dateSerial >= now - 1)
    .sort((a, b) => a.dateSerial - b.dateSerial);
  const live = schedule.find((s) => /live/i.test(s.status));
  const m = live || upcoming[0] || schedule[schedule.length - 1];
  const d = serialToDate(m.dateSerial);
  const { hh, mm } = startTime(m.slot);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateISO =
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(hh)}:${pad(mm)}:00+06:00`; // Asia/Dhaka
  return {
    id: m.id,
    dateISO,
    dateLabel: fmtDayMon(m.dateSerial),
    time: m.slot,
    venue: [m.turf, "Dhaka"].filter(Boolean).join(", "),
    status: m.status,
    rent: m.rent,
    advance: m.advance,
    due: m.due,
  };
}

function parseCurrentVotes(grid: Grid) {
  // The Current Match attendance block labels its columns "Yes (5)" / "No (0)".
  const yesLabel = countInLabel(grid, "Yes");
  const noLabel = countInLabel(grid, "No");
  if (yesLabel != null && noLabel != null) return { yes: yesLabel, no: noLabel };
  // Fallback: count the TRUE flags directly.
  const { headerRow, cols } = headerCols(
    grid, ["player name", "yes"], { name: ["player name"], yes: ["yes"], no: ["no"] }
  );
  let yes = 0, no = 0;
  for (let r = headerRow + 1; r < grid.length; r++) {
    const row = grid[r] || [];
    if (!S(row[cols.name])) continue;
    if (isTrue(row[cols.yes])) yes++;
    if (isTrue(row[cols.no])) no++;
  }
  return { yes, no };
}

// A completed match's own tab is titled by its date, e.g. "15-Sep-2026".
function tabForDate(titles: string[], serial: number): string | undefined {
  const d = serialToDate(serial);
  const want = `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}-${d.getUTCFullYear()}`.toLowerCase();
  const wantPadded = `${String(d.getUTCDate()).padStart(2, "0")}-${MONTHS[d.getUTCMonth()]}-${d.getUTCFullYear()}`.toLowerCase();
  return titles.find((t) => {
    const l = t.toLowerCase();
    return l === want || l === wantPadded;
  });
}

// ---------- main ----------
export async function getClubData(): Promise<ClubData> {
  const sheets = sheetsClient();

  // Tab titles (to locate the date-named per-match tabs).
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });
  const titles = (meta.data.sheets || []).map((s: any) => s.properties!.title!);

  // Core tabs in one round trip. UNFORMATTED keeps dates as serials and
  // checkboxes as real booleans, which makes parsing reliable.
  const core = ["Current Match", "Match Schedule & Venue", "Player Directory & Wallet"];
  const batch = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: core.map((t) => `'${t}'!A1:AE100`),
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  const grid: Record<string, Grid> = {};
  core.forEach((t, i) => (grid[t] = (batch.data.valueRanges![i].values as Grid) || []));

  const players = parsePlayers(grid["Player Directory & Wallet"]);
  const totals = computeTotals(players);
  const schedule = parseSchedule(grid["Match Schedule & Venue"]);
  const votes = parseCurrentVotes(grid["Current Match"]);

  const nextMatch = { ...pickNextMatch(schedule), yes: votes.yes, no: votes.no, roster: players.length };

  // History: completed matches, newest first. Read each date-tab for its played count.
  const completed = schedule
    .filter((s) => /complete/i.test(s.status))
    .sort((a, b) => b.dateSerial - a.dateSerial);

  const history: ClubData["history"] = await Promise.all(
    completed.map(async (m) => {
      const tab = tabForDate(titles, m.dateSerial);
      // 0 usually means attendance isn't filled in yet, so skip the cached value and read fresh.
      const played = tab ? (await readPlayedCountCached(tab)) || (await readPlayedCount(tab)) : 0;
      return { id: m.id, date: fmtDayMon(m.dateSerial), rent: m.rent, played, perHead: PER_HEAD_DEFAULT };
    })
  );

  return { nextMatch, totals, history, players };
}

// A finished match's played count lives in its own date tab and does not change
// once the match is done, so it is cached for a day instead of the 5-minute
// window the rest of the data uses. That keeps each refresh at two Sheets calls
// no matter how long the season runs.
async function readPlayedCount(tab: string): Promise<number> {
  const g = await sheetsClient().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${tab}'!A1:AE100`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  return countInLabel((g.data.values as Grid) || [], "Played") ?? 0;
}
const readPlayedCountCached = unstable_cache(readPlayedCount, ["match-played"], { revalidate: 86400 });

// app/api/club-data/route.ts
//
// The one endpoint the A-Tier page talks to. It reads the Google Sheet through
// the service account, caches the result for a short window, and returns the
// DATA the page renders. The sheet is read at most once per cache window, not
// on every page load, so a busy matchday will not hammer the Sheets API.

import { unstable_cache } from "next/cache";
import { getClubData } from "@/lib/club-sheet";

// Cache the sheet read for 5 minutes. A new vote in the sheet shows up within about 5 minutes.
const getCached = unstable_cache(getClubData, ["club-data"], { revalidate: 300 });

export const revalidate = 300;
export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getCached();
    return Response.json(data, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("club-data read failed:", err);
    return Response.json({ error: "Could not read the club sheet" }, { status: 500 });
  }
}

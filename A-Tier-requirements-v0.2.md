# A-Tier — Requirement Doc (v0.2)

*A transparent money + match manager for the Celloscope turf football crew.*
*Not an office event. Not office-sponsored. Just us, a turf, and a spreadsheet that finally makes sense.*
*Branding note: pronounce "A-Tier" badly and you get Atiar. This is intentional. Every screen honours the man.*

---

## 1. What this thing is for

Three jobs, in priority order:

1. **Money transparency** — everyone sees exactly what each match cost, who played, at what rate, and their own running balance. This is the urgent problem.
2. **Match info** — when/where is the next match, is it confirmed, who's likely in.
3. **RSVP poll** — players vote in / out so we can plan headcount and decide whether to keep the slot.

All wrapped in maximum Atiar-flavoured fun.

---

## 2. Users & roles

- **Player** — anyone in the crew (~25). Views everything, casts their own in/out vote.
- **Admin** — one or several (Sakib assigns). Creates players, creates/confirms/cancels matches, finalizes attendance + money, records payments.

**Login (v1):** none. Player picks their name from a list to act. Trust-based, casual group.
**Login (later):** per-player PIN. Deferred, not built now.

---

## 3. The money model (the heart of it)

Split by **shares**, not headcount, because who shows up and at what rate changes every match.

| Tier | Shares |
|------|--------|
| Full | 1.0 |
| Half | 0.5 |
| Free (e.g. staff) | 0.0 |

**Per-share cost = (slot fee − guest cash) ÷ total shares**

- Guest cash is subtracted from the fee *first*, so guests lighten everyone's bill.
- Full pays `per-share × 1`, half `× 0.5`, free `0`.
- Free players don't count in the denominator — the rest quietly absorb them (intended).
- Money is deducted **only when an admin finalizes the match**.

**Worked example (your day-2 scenario):**
Fee 3500, no guests. 18 full + 2 half actually play → shares = 18 + 1 = 19 → per-share ≈ **184**.
Full players owe 184, half players owe 92. Your "200 isn't 200 today" — computed exactly, in the open.

---

## 4. Player profile

- Name
- **Default tier** (Full / Half / Free) — the player's normal setting.
- Running balance.

Per **decision 2**: the default tier auto-applies to each match, **but** when an admin finalizes that match's money they can override the tier for that one match without touching the profile.

---

## 5. Match lifecycle

Statuses: **Scheduled → Confirmed → Completed** (or **Cancelled** any time before match day).

1. **Scheduled / Confirmed** — admin sets turf, date, time, fee, status. On confirm, admin can optionally blast an email to all players (email is optional, see §7).
2. **RSVP poll** — players vote in / out, exactly like a WhatsApp poll. This is **advisory only**: it exists so we can see the likely headcount and decide whether to keep or cancel the slot. It does **not** decide who pays. Players can change their vote any time before match day.
3. **Cancel-by deadline — 4 days before match** (per **decision 4**). This is the turf's resale window. By this point the admin reads the poll and either keeps the slot or cancels it so the turf can resell without penalty. The poll can keep updating after this — it's just a planning signal, and the 4-day mark is when the keep/cancel call gets made.
4. **Completed** — after the match, admin finalizes **actual attendance** (per **decision 3**): who really turned up and played. Applies any per-match tier overrides, records guests, and the system computes + deducts each attendee's share.
5. **Cancelled** — too few players by the 4-day deadline → admin cancels, turf resells, nobody is charged.

**Who pays = who actually played. Nothing else.**
- Voted "no" but showed up and played → charged their tier.
- Voted "yes" but didn't show up → **not** charged. The poll was a guess; no penalty.
- Didn't vote at all but played → charged their tier.
- The RSVP poll never touches money — it only drives the keep-or-cancel decision.

---

## 6. Guests

Per **decision 6**: recorded as a **count + total cash** per match (e.g. "2 guests, 400"). Not named, not in the fund. Their cash is subtracted from the fee before the share split.

---

## 7. Payments, balances, notifications

- **Top-ups** (per **decision 7**): admin records a payment received — e.g. "Sakib paid 800 on Sep 3."
- **Balance** = payments in − match costs out.
- **Carry-forward** (per **decision 5**): leftover balance rolls into next month.
- **Negative allowed** (per **decision 5**): advance runs out → balance goes negative (shown in red). No blocking.
- **Email** (optional): admin can trigger a "match confirmed" blast to players who have an email on file. Players without email are simply skipped.

---

## 8. Player-facing views (the front door)

Any player hits the URL and sees — no admin-portal vibes:

- **Next match** card — turf, date, time, status, countdown to the 4-day cancel-by deadline, and the live poll count (X in / Y out).
- **My balance** — current number, colour-coded, with a per-match breakdown (fee, attendance, my tier, what I owed).
- **RSVP poll** — I'm in / I'm out, updatable any time before match day. Advisory only — it plans the match, it doesn't bill me.
- **Atiar fun layer** — see §10.

## 9. Admin views

- Create / edit players (name, default tier, optional email).
- Create / confirm / cancel matches; send email blast.
- Finalize a completed match: mark actual attendance, override tiers per-match, enter guest count + cash → system computes and deducts.
- Record payments received.

---

## 10. The Atiar / A-Tier theme layer (the fun spec)

- Fee tiers skinned playfully in the UI (Full = "A-Tier", etc.) while the functional spec stays Full/Half/Free.
- 404 page: *"Atiar bhai is currently fixing the water pump. Try again in 2 days."*
- "Atiar Confidence Meter" pinned at 100% next to every deadline.
- Loading text: *"Estimating completion… today."*
- More to come — every text and visual nods to the legend, in good fun.

---

## 11. Tech stack

- **Next.js on Vercel** — free, one place for frontend + API.
- **Supabase** — free Postgres + auth + realtime. Verified free for our scale (500MB DB / 50k users — we use ~1%). Realtime is a bonus: the poll count can update live.
- **Keepalive ping** — GitHub Actions cron every 3 days (or free UptimeRobot) to stop the free-tier 7-day inactivity pause from napping the app between matches.

---

## 12. Decisions (resolved)

1. **Login** — none in v1 (name-picker); PIN later.
2. **Tier** — profile default + per-match admin override.
3. **Attendance** — RSVP poll is advisory; money is driven by admin-finalized actual attendance.
4. **4-day mark** — cancel-by deadline for the turf resale window, *not* a payment lock.
5. **Balances** — carry forward month to month; negative allowed.
6. **Guests** — count + cash, subtracted before the split.
7. **Payments** — admin records them.
8. **Who pays** — actual attendance only. Voted-no-but-played pays; voted-yes-but-skipped doesn't.
9. **Treasury view** — per-player balances only in v1; collected / prepaid-to-turf / pool summary comes later.

## 13. Phase plan

- **v1 (build first):** money model, player + match management, RSVP poll, finalization + deduction, payments, balances, front-door views, keepalive. Theme layer sprinkled in.
- **Later:** PIN login, email polish, group treasury view, stats/history.

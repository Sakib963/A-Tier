# Kickoff prompt — paste this to start the agent

---

You are building **A-Tier**, a small web app that manages money and match info for a weekly turf-football crew (~25 players) with full transparency. It is a personal side project, not an office tool.

Three spec files are in this repo — **read all three fully before writing any code**:
- `A-Tier-requirements-v0.2.md` — what the app does and why (functional source of truth).
- `A-Tier-BUILD-SPEC.md` — stack, database schema, the money-math contract, page map, and the exact build order.
- `A-Tier-VOICE-AND-COPY.md` — the Atiar voice guide and ready-to-use copy for every surface. Use these strings (or write in this voice); do not ship generic labels.

## Prime directives

1. **Build a website, not an admin portal.** The public landing page (`/`) shows everything — next match, the standings table of balances, recent match cost breakdowns, the in/out poll, and playful "Atiar" copy. Admin actions live behind a simple login on plain, focused, one-job pages. No sidebar-dashboard shell, no data-grid app feel. Club-website energy.
2. **The money math is the product.** Implement `computeSplit` (BUILD-SPEC §4) as a pure function with unit tests, and get the tests green, before building any UI on top of it. The split is share-based: full = 1, half = 0.5, free = 0 shares; per-share = (fee − guest cash) ÷ total shares; charge = actual attendance only.
3. **The RSVP poll is advisory.** It only helps decide whether to keep or cancel the slot. It never bills anyone. Whoever actually plays gets charged; a "no" voter who shows up pays, a "yes" voter who skips does not.
4. **History is immutable.** Finalizing a match stores the computed amounts; later changes must never alter past matches.
5. **Every surface is Atiar.** This app is an affectionate tribute to Atiar bhai — a can-do folk legend. Every text, icon, empty state, loader, and error should carry that spirit, using `A-Tier-VOICE-AND-COPY.md` as the copy source. The humor **celebrates, never mocks** — Atiar (and everyone else) is always the hero, never the punchline. The one exception to the fun: on money screens, the number is always instantly clear; humor decorates the label, never obscures the figure.

## How to work

- Follow the **build order in BUILD-SPEC §8**, committing after each step. Do not jump ahead to later phases.
- Keep the stack lean: Next.js (App Router) + TypeScript + Tailwind + Supabase (DB only). All writes go through server routes using the service-role key; the browser only reads.
- Start by scaffolding the project, then create the DB schema + RLS from BUILD-SPEC §3, then write `computeSplit` + tests.
- If any behavior is ambiguous or a spec decision seems missing, **ask me before assuming** — do not invent product behavior. Small technical/implementation choices you can make yourself; note them briefly.
- Pull copy from `A-Tier-VOICE-AND-COPY.md` as you build each surface — don't leave the Atiar voice for a final polish pass. It's part of every screen from the first render.

## Definition of done for v1

A deployed site where: anyone can open the URL and see the next match, everyone's balance, and recent match breakdowns; a player can cast an in/out vote by name; an admin can log in, manage players and matches, finalize a match (ticking real attendance, overriding tiers, entering guests) and watch the split compute live before saving, and record payments; balances reflect finalized matches minus payments; and a keepalive ping is in place so the free Supabase project doesn't pause.

Start now with step 1 of the build order. Confirm your understanding of the plan first, in a few lines, before scaffolding.

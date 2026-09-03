-- Optional demo data for local development: one upcoming match with a few
-- votes, and one finalized match so The Table and the breakdowns have
-- something real to render.
--
-- Safe to re-run. Delete these rows once you are creating real matches
-- through the admin screens (build order step 5):
--   delete from matches where turf_name in ('Turf One', 'Kickoff Arena');

-- ---------------------------------------------------- upcoming (confirmed)
insert into matches (turf_name, match_date, match_time, fee, status)
select 'Turf One', (current_date + 6), '9:00 PM', 3500, 'confirmed'
where not exists (select 1 from matches where turf_name = 'Turf One');

-- A few advisory votes. These plan headcount and never bill anyone.
insert into rsvps (match_id, player_id, vote)
select m.id, p.id, v.vote
from matches m
join (values
  ('Sakib', 'in'::vote),
  ('Atiar', 'in'::vote),
  ('Rafi',  'in'::vote),
  ('Nabil', 'out'::vote)
) as v(name, vote) on true
join players p on p.name = v.name
where m.turf_name = 'Turf One'
on conflict (match_id, player_id) do nothing;

-- ------------------------------------------------- finalized (completed)
-- Fee 3000, 200 guest cash from 1 guest, so net 2800.
-- Shares: Sakib 1 + Atiar 1 + Rafi 1 + Nabil 0.5 + Mamun 0 = 3.5
-- Per share: 2800 / 3.5 = exactly 800.
insert into matches (
  turf_name, match_date, match_time, fee, status,
  guest_count, guest_cash, per_share_cost, finalized_at
)
select 'Kickoff Arena', (current_date - 5), '10:00 PM', 3000, 'completed',
       1, 200, 800, now()
where not exists (select 1 from matches where turf_name = 'Kickoff Arena');

-- Frozen attendance rows. Written once, never recomputed: this is the
-- immutable history rule.
insert into attendances (match_id, player_id, tier, share, amount_charged)
select m.id, p.id, a.tier, a.share, a.amount
from matches m
join (values
  ('Sakib', 'full'::tier, 1.0, 800.00),
  ('Atiar', 'full'::tier, 1.0, 800.00),
  ('Rafi',  'full'::tier, 1.0, 800.00),
  ('Nabil', 'half'::tier, 0.5, 400.00),
  ('Mamun', 'free'::tier, 0.0,   0.00)
) as a(name, tier, share, amount) on true
join players p on p.name = a.name
where m.turf_name = 'Kickoff Arena'
on conflict (match_id, player_id) do nothing;

-- Some money in, so balances are not all negative.
insert into payments (player_id, amount, paid_on, note)
select p.id, v.amount, (current_date - 10), v.note
from (values
  ('Sakib', 2000.00, 'Advance for the month'),
  ('Atiar',  800.00, 'Paid on the spot'),
  ('Rafi',   500.00, 'Partial')
) as v(name, amount, note)
join players p on p.name = v.name
where not exists (
  select 1 from payments pay where pay.player_id = p.id
);

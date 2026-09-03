-- A-Tier seed data: a small test squad.
-- Safe to re-run: inserts are skipped if a player with that name exists.

insert into players (name, default_tier, email)
select * from (values
  ('Sakib',   'full'::tier, 'sakib@example.com'),
  ('Atiar',   'full'::tier, null),
  ('Rafi',    'full'::tier, 'rafi@example.com'),
  ('Nabil',   'half'::tier, null),
  ('Mamun',   'free'::tier, null)
) as seed(name, default_tier, email)
where not exists (
  select 1 from players p where p.name = seed.name
);

-- Expensplit schema (PRD.md Section 2) with seed data matching src/mockData.ts.
-- Safe to re-run: tables, policies and seed rows are created only if missing.
-- All monetary amounts are integer cents.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- A member is a display name scoped to one group (PRD Feature A).
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  title text not null,
  payer_id uuid not null references public.group_members (id) on delete restrict,
  total_amount integer not null check (total_amount >= 0),
  receipt_image text,
  created_timestamp timestamptz not null default now()
);

create table if not exists public.line_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  position integer not null default 0,
  description text not null,
  amount integer not null check (amount >= 0),
  -- group_members ids sharing this item. Order matters: leftover cents from an
  -- uneven split go to the first members listed.
  assigned_to uuid[] not null default '{}'
);

create index if not exists group_members_group_id_idx on public.group_members (group_id);
create index if not exists expenses_group_id_idx on public.expenses (group_id);
create index if not exists expenses_payer_id_idx on public.expenses (payer_id);
create index if not exists line_items_expense_id_idx on public.line_items (expense_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- DEVELOPMENT ONLY: these policies let anyone with the anon key read and write
-- every row. Replace them with membership-based policies before going live.
-- ---------------------------------------------------------------------------

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.line_items enable row level security;

drop policy if exists "dev public access" on public.groups;
create policy "dev public access" on public.groups
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev public access" on public.group_members;
create policy "dev public access" on public.group_members
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev public access" on public.expenses;
create policy "dev public access" on public.expenses
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev public access" on public.line_items;
create policy "dev public access" on public.line_items
  for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed data (mirrors src/mockData.ts)
-- Members: ...0001 Bob, ...0002 Amy, ...0003 Tony, ...0004 Sarah
-- ---------------------------------------------------------------------------

insert into public.groups (id, name, invite_code) values
  ('11111111-1111-4111-8111-111111111111', 'Tokyo Trip 2026', 'TOKYO-2026-X7K9')
on conflict (id) do nothing;

insert into public.group_members (id, group_id, display_name, created_at) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Bob',   '2026-04-01T09:00:00+09:00'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Amy',   '2026-04-01T09:01:00+09:00'),
  ('aaaaaaaa-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Tony',  '2026-04-01T09:02:00+09:00'),
  ('aaaaaaaa-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Sarah', '2026-04-01T09:03:00+09:00')
on conflict (id) do nothing;

insert into public.expenses (id, group_id, title, payer_id, total_amount, created_timestamp) values
  -- Izakaya dinner, paid by Bob
  ('eeeeeeee-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Izakaya Torikizoku',
   'aaaaaaaa-0000-4000-8000-000000000001', 12400, '2026-04-12T20:45:00+09:00'),
  -- Transit and station shop run, paid by Amy
  ('eeeeeeee-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Shinjuku Station',
   'aaaaaaaa-0000-4000-8000-000000000002', 8600, '2026-04-13T09:10:00+09:00')
on conflict (id) do nothing;

insert into public.line_items (id, expense_id, position, description, amount, assigned_to) values
  ('cccccccc-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-000000000001', 0, 'Yakitori platter', 3600,
   array['aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002',
         'aaaaaaaa-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000004']::uuid[]),
  ('cccccccc-0000-4000-8000-000000000002', 'eeeeeeee-0000-4000-8000-000000000001', 1, 'Tonkotsu ramen', 1800,
   array['aaaaaaaa-0000-4000-8000-000000000002']::uuid[]),
  ('cccccccc-0000-4000-8000-000000000003', 'eeeeeeee-0000-4000-8000-000000000001', 2, 'Sashimi set', 3200,
   array['aaaaaaaa-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000004']::uuid[]),
  ('cccccccc-0000-4000-8000-000000000004', 'eeeeeeee-0000-4000-8000-000000000001', 3, 'Draft beer x3', 2800,
   array['aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002',
         'aaaaaaaa-0000-4000-8000-000000000003']::uuid[]),
  ('cccccccc-0000-4000-8000-000000000005', 'eeeeeeee-0000-4000-8000-000000000001', 4, 'Service charge', 1000,
   array['aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002',
         'aaaaaaaa-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000004']::uuid[]),
  ('cccccccc-0000-4000-8000-000000000006', 'eeeeeeee-0000-4000-8000-000000000002', 0, 'Subway day pass x4', 6000,
   array['aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002',
         'aaaaaaaa-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000004']::uuid[]),
  ('cccccccc-0000-4000-8000-000000000007', 'eeeeeeee-0000-4000-8000-000000000002', 1, 'Train snacks', 1400,
   array['aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000004']::uuid[]),
  ('cccccccc-0000-4000-8000-000000000008', 'eeeeeeee-0000-4000-8000-000000000002', 2, 'Umbrella', 1200,
   array['aaaaaaaa-0000-4000-8000-000000000003']::uuid[])
on conflict (id) do nothing;

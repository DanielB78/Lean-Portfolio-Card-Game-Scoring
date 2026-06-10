-- Graph data storage for saved chart datasets (Round 1 and Round 2)
-- Run in the Supabase SQL editor for project qamuzgmfeyaurnkrmwvj

create table if not exists public.graph_submissions (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.graph_data_points (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.graph_submissions (id) on delete cascade,
  team_name text not null,
  round_mode text not null check (round_mode in ('round1', 'round2')),
  graph_type text not null check (
    graph_type in (
      'delay_cost_repeatable',
      'cumulative_value',
      'cumulative_flow',
      'lead_time_histogram',
      'delivery_risk',
      'score_breakdown'
    )
  ),
  turn_number integer,
  values jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_graph_data_points_team_round
  on public.graph_data_points (team_name, round_mode, created_at desc);

create index if not exists idx_graph_data_points_submission
  on public.graph_data_points (submission_id);

alter table public.graph_submissions enable row level security;
alter table public.graph_data_points enable row level security;

create policy "Allow anonymous inserts on graph_submissions"
  on public.graph_submissions
  for insert
  to anon
  with check (true);

create policy "Allow anonymous inserts on graph_data_points"
  on public.graph_data_points
  for insert
  to anon
  with check (true);

create policy "Allow anonymous reads on graph_submissions"
  on public.graph_submissions
  for select
  to anon
  using (true);

create policy "Allow anonymous reads on graph_data_points"
  on public.graph_data_points
  for select
  to anon
  using (true);

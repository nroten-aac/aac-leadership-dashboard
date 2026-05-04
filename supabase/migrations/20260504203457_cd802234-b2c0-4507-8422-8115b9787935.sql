
-- AAC Roadmap tables. People still come from public.members; we key Roadmap data
-- on members.id (uuid string) instead of pco_person_id so we don't duplicate people.

create table if not exists public.law_content_overrides (
  law_n         text primary key,
  diagnostic    jsonb,
  metrics       jsonb,
  updated_at    timestamptz not null default now(),
  updated_by    uuid
);
alter table public.law_content_overrides enable row level security;
create policy "auth read law_content_overrides" on public.law_content_overrides for select to authenticated using (true);
create policy "auth write law_content_overrides" on public.law_content_overrides for all to authenticated using (true) with check (true);

create table if not exists public.law_status_overrides (
  law_n         text primary key,
  status        text not null check (status in ('pending','in-progress','complete')),
  promoted_at   timestamptz not null default now(),
  promoted_by   uuid
);
alter table public.law_status_overrides enable row level security;
create policy "auth read law_status_overrides" on public.law_status_overrides for select to authenticated using (true);
create policy "auth write law_status_overrides" on public.law_status_overrides for all to authenticated using (true) with check (true);

create table if not exists public.custom_actions (
  id            text primary key,
  law_n         text not null,
  phase         smallint not null check (phase between 1 and 4),
  source        text not null check (source in ('chip','jim','impl')),
  title         text not null,
  body          text not null,
  created_at    timestamptz not null default now(),
  created_by    uuid
);
create index if not exists idx_custom_actions_law on public.custom_actions (law_n);
create index if not exists idx_custom_actions_phase on public.custom_actions (phase);
alter table public.custom_actions enable row level security;
create policy "auth read custom_actions" on public.custom_actions for select to authenticated using (true);
create policy "auth write custom_actions" on public.custom_actions for all to authenticated using (true) with check (true);

create table if not exists public.action_completions (
  action_id     text primary key,
  is_done       boolean not null default false,
  completed_at  timestamptz,
  completed_by  uuid
);
alter table public.action_completions enable row level security;
create policy "auth read action_completions" on public.action_completions for select to authenticated using (true);
create policy "auth write action_completions" on public.action_completions for all to authenticated using (true) with check (true);

-- Vision is a singleton.
create table if not exists public.vision_statement (
  id              int primary key default 1 check (id = 1),
  statement       text,
  updated_at      timestamptz not null default now(),
  updated_by      uuid
);
alter table public.vision_statement enable row level security;
create policy "auth read vision_statement" on public.vision_statement for select to authenticated using (true);
create policy "auth write vision_statement" on public.vision_statement for all to authenticated using (true) with check (true);

-- Pastoral notes keyed to existing members.id (one current note per person).
create table if not exists public.pastoral_notes (
  member_id      uuid primary key,
  note           text,
  updated_at     timestamptz not null default now(),
  updated_by     uuid
);
alter table public.pastoral_notes enable row level security;
create policy "auth read pastoral_notes" on public.pastoral_notes for select to authenticated using (true);
create policy "auth write pastoral_notes" on public.pastoral_notes for all to authenticated using (true) with check (true);

-- Activity feed (Today summary + full feed modal).
create table if not exists public.activity_events (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in ('stage-move','action-toggle','note-saved','law-begin')),
  payload         jsonb not null,
  ts              timestamptz not null default now(),
  actor_id        uuid
);
create index if not exists idx_activity_events_ts on public.activity_events (ts desc);
alter table public.activity_events enable row level security;
create policy "auth read activity_events" on public.activity_events for select to authenticated using (true);
create policy "auth insert activity_events" on public.activity_events for insert to authenticated with check (true);

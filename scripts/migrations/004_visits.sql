-- 004_visits.sql
-- 방문(독서 모임) 세션: 약속/초대/시간 제한

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references libraries(id) on delete cascade,
  host_id uuid not null,
  scheduled_at timestamptz not null,
  max_participants int not null default 2,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create index if not exists visits_library_id_idx on visits(library_id);
create index if not exists visits_host_id_idx on visits(host_id);

create table if not exists visit_invitees (
  visit_id uuid not null references visits(id) on delete cascade,
  user_id uuid not null,
  status text not null default 'pending',
  message text null,
  responded_at timestamptz null,
  created_at timestamptz not null default now(),
  primary key (visit_id, user_id)
);

create index if not exists visit_invitees_user_id_idx on visit_invitees(user_id);


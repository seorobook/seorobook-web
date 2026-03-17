-- 서로북 초기 스키마 (바닥부터)
-- Neon Postgres. 인증은 Neon Auth(user id = text) 전제.
-- 실행 순서: 이 파일만 순서대로 실행하면 됨.

-- 1. 프로필 (유저당 1행, auth user id = id)
create table if not exists profiles (
  id text primary key,
  skin text,
  visited_library_share_ids text[] default '{}'
);

-- 2. 서재 (1유저 1서재. owner_id unique)
create table if not exists libraries (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null unique,
  name text not null,
  map_data jsonb,
  share_id text unique,
  only_owner boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_libraries_owner_id on libraries(owner_id);
create index if not exists idx_libraries_share_id on libraries(share_id);

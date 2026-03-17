-- MEMO §7.1: profiles 닉네임·아바타 확장. 최소한 닉네임부터.
alter table profiles
  add column if not exists nickname text;

comment on column profiles.nickname is '표시 이름. 없으면 이메일 기반 이름 사용';

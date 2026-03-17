-- MEMO §7.3: 독서 기록·리뷰
-- books: 읽은 책 한 줄. reviews: 감상, 기본 비공개.

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  author text,
  read_at date,
  created_at timestamptz not null default now()
);

create index if not exists idx_books_user_id on books(user_id);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  book_id uuid not null references books(id) on delete cascade,
  content text not null,
  visibility text not null default 'private' check (visibility in ('private', 'public', 'sero')),
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_book_id on reviews(book_id);
create index if not exists idx_reviews_user_id on reviews(user_id);

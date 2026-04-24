'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const GUEST_KEY = 'seorobook_guest_id';
const POLL_MS = 3000;

/** Mirrors migration 002 check constraint. */
type MeetupStatus = 'waiting' | 'reading' | 'discussion' | 'ended' | 'cancelled';

type Meetup = {
  id: string;
  title: string;
  status: MeetupStatus;
};

type MeetupMember = {
  member_id: string;
  user_id: string;
  role: 'host' | 'member' | 'guest';
  nickname: string;
  book_title: string | null;
  author: string | null;
};

const STATUS_META: Record<MeetupStatus, { label: string; tone: string; dot: string }> = {
  waiting:    { label: '대기',    tone: 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/30',   dot: 'bg-[#facc15]' },
  reading:    { label: '독서중',  tone: 'bg-[#06d6a0]/15 text-[#06d6a0] border-[#06d6a0]/30',   dot: 'bg-[#06d6a0] animate-pulse' },
  discussion: { label: '토의중',  tone: 'bg-[#8b5cf6]/15 text-[#a78bfa] border-[#8b5cf6]/30',   dot: 'bg-[#a78bfa] animate-pulse' },
  ended:      { label: '종료',    tone: 'bg-white/5 text-[#7a8a82] border-white/10',            dot: 'bg-[#7a8a82]' },
  cancelled:  { label: '취소됨',  tone: 'bg-red-500/10 text-red-300 border-red-500/30',         dot: 'bg-red-400' },
};

export default function MeetGuestRoomPage() {
  const params = useParams<{ meetupId: string }>();
  const meetupId = params.meetupId;

  const [guestId, setGuestId] = useState<string | null>(null);
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [members, setMembers] = useState<MeetupMember[]>([]);
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setGuestId(window.localStorage.getItem(GUEST_KEY));
  }, []);

  const fetchSnapshot = useCallback(async () => {
    if (!meetupId) return;
    setError(null);
    try {
      const res = await fetch(`/api/meetups/${meetupId}`);
      const text = await res.text();
      if (!res.ok) {
        setError(text || `오류 (${res.status})`);
        return;
      }
      const data = JSON.parse(text) as { meetup: Meetup; members: MeetupMember[] };
      setMeetup(data.meetup);
      setMembers(data.members);
    } catch {
      setError('불러오기에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [meetupId]);

  useEffect(() => {
    fetchSnapshot();
    const t = setInterval(fetchSnapshot, POLL_MS);
    return () => clearInterval(t);
  }, [fetchSnapshot]);

  const myMember = useMemo(() => {
    if (!guestId) return null;
    return members.find((m) => m.user_id === guestId) ?? null;
  }, [guestId, members]);

  const closed = meetup?.status === 'ended' || meetup?.status === 'cancelled';

  const onSaveBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!guestId) {
      setError('게스트 정보가 없습니다. /meet/join 에서 다시 참가해 주세요.');
      return;
    }
    if (closed) {
      setError('종료된 모임입니다.');
      return;
    }
    const t = bookTitle.trim();
    if (!t) {
      setError('책 제목을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetups/${meetupId}/me/book`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-seoro-guest-id': guestId,
        },
        body: JSON.stringify({ book_title: t, author: author.trim() || null }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(text || `오류 (${res.status})`);
        return;
      }
      setBookTitle('');
      setAuthor('');
      await fetchSnapshot();
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const onLeave = async () => {
    const gid = guestId || '';
    try {
      if (gid) {
        await fetch(`/api/meetups/${meetupId}`, {
          method: 'DELETE',
          headers: { 'x-seoro-guest-id': gid },
        });
      }
    } catch {
      // best effort
    }
    try {
      window.localStorage.removeItem(GUEST_KEY);
    } catch {
      // ignore
    }
    setGuestId(null);
    window.location.href = '/meet/join';
  };

  if (!meetupId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1613] text-sm text-red-300">
        잘못된 주소입니다.
      </main>
    );
  }

  const statusMeta = meetup ? STATUS_META[meetup.status] : null;

  return (
    <main className="min-h-screen bg-[#0f1613] text-[#e5efe9]">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/meet/join"
            className="text-xs font-semibold text-[#7a8a82] transition hover:text-[#06d6a0]"
          >
            ← 참가 화면
          </Link>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
          >
            나가기
          </button>
        </div>

        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {meetup?.title ?? '…'}
            </h1>
            {statusMeta && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.tone}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#506258]">
            실시간 · {POLL_MS / 1000}초마다 갱신
          </p>
        </header>

        {closed && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            모임이 종료되었습니다. 다시 참가하려면 새 초대코드로 입장해 주세요.
          </div>
        )}

        {!guestId && (
          <div className="mb-6 rounded-lg border border-[#facc15]/30 bg-[#facc15]/10 px-4 py-3 text-sm text-[#fde68a]">
            이 기기에 게스트 ID가 없습니다.{' '}
            <Link href="/meet/join" className="font-semibold underline decoration-dotted">
              참가하기
            </Link>
            에서 다시 입장해 주세요.
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
          {/* Left: my book form */}
          <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#7a8a82]">
              내가 읽는 책
            </div>
            <div className="mb-4 text-[11px] text-[#506258]">제목과 작가를 적어 두면 다른 참여자에게 보여요.</div>
            <form onSubmit={onSaveBook} className="flex flex-col gap-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-[#0a1310] px-3.5 py-2.5 text-[#e5efe9] placeholder:text-[#364d44] focus:border-[#06d6a0]/60 focus:outline-none disabled:opacity-50"
                placeholder="책 제목"
                value={bookTitle}
                onChange={(ev) => setBookTitle(ev.target.value)}
                disabled={closed || !guestId}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-[#0a1310] px-3.5 py-2.5 text-[#e5efe9] placeholder:text-[#364d44] focus:border-[#06d6a0]/60 focus:outline-none disabled:opacity-50"
                placeholder="작가 (선택)"
                value={author}
                onChange={(ev) => setAuthor(ev.target.value)}
                disabled={closed || !guestId}
              />
              <button
                type="submit"
                disabled={saving || !guestId || closed}
                className="rounded-lg bg-[#06d6a0] px-4 py-2.5 text-sm font-semibold text-[#0f1613] transition hover:brightness-110 disabled:opacity-50"
              >
                {saving ? '저장 중…' : '저장'}
              </button>
              {myMember?.book_title && (
                <p className="mt-1 text-xs text-[#7a8a82]">
                  현재 내 책:{' '}
                  <span className="text-[#06d6a0]">
                    {myMember.book_title}
                    {myMember.author ? ` / ${myMember.author}` : ''}
                  </span>
                </p>
              )}
            </form>

            {error && (
              <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
                {error}
              </p>
            )}
          </section>

          {/* Right: presence list */}
          <aside className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#7a8a82]">
                참여자
              </div>
              <span className="font-mono text-[11px] text-[#506258]">
                {loading ? '…' : `${members.length}`}
              </span>
            </div>
            {loading && members.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#506258]">불러오는 중…</p>
            ) : members.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#506258]">아직 참여자가 없어요.</p>
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <MemberRow key={m.member_id} member={m} isMe={m.user_id === guestId} />
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function MemberRow({ member, isMe }: { member: MeetupMember; isMe: boolean }) {
  const initial = member.nickname.trim().charAt(0).toUpperCase() || '?';
  const roleBadge =
    member.role === 'host' ? (
      <span className="rounded-sm bg-[#06d6a0]/15 px-1 py-[1px] text-[9px] font-semibold uppercase tracking-wider text-[#06d6a0]">
        HOST
      </span>
    ) : member.role === 'guest' ? (
      <span className="rounded-sm bg-white/5 px-1 py-[1px] text-[9px] font-semibold uppercase tracking-wider text-[#7a8a82]">
        GUEST
      </span>
    ) : null;

  return (
    <li
      className={
        'flex items-center gap-3 rounded-lg px-2 py-2 transition ' +
        (isMe ? 'bg-[#06d6a0]/10' : 'hover:bg-white/[0.03]')
      }
    >
      <div className="relative">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#06d6a0]/80 to-[#0a8766] text-xs font-bold text-[#0f1613]">
          {initial}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-[#0f1613] bg-[#06d6a0]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate text-sm font-semibold text-[#e5efe9]">
            {member.nickname}
          </span>
          {roleBadge}
          {isMe && (
            <span className="text-[10px] font-semibold text-[#06d6a0]">· 나</span>
          )}
        </div>
        <div className="truncate text-[11px] text-[#7a8a82]">
          {member.book_title ? (
            <>
              📖 {member.book_title}
              {member.author && <span className="text-[#506258]"> · {member.author}</span>}
            </>
          ) : (
            <span className="text-[#506258]">책 미지정</span>
          )}
        </div>
      </div>
    </li>
  );
}

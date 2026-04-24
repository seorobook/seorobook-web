'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const GUEST_KEY = 'seorobook_guest_id';

/**
 * Guest join — matches the app's dark/mint aesthetic.
 *
 * The backend normalizes invite codes to uppercase + strips whitespace.
 * We mirror that client-side for a live preview while the user types so
 * it's obvious that "abcd-1234" is the same as "ABCD1234".
 */
export default function MeetGuestJoinPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedCode = inviteCode.replace(/\s+/g, '').toUpperCase();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const nick = nickname.trim();
    if (!normalizedCode) {
      setError('초대코드를 입력해 주세요.');
      return;
    }
    if (nick.length < 2 || nick.length > 12) {
      setError('닉네임은 2~12자로 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/meetups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: normalizedCode, nickname: nick }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(text || `오류 (${res.status})`);
        return;
      }
      const data = JSON.parse(text) as { meetupId: string; guestId: string };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(GUEST_KEY, data.guestId);
      }
      router.push(`/meet/${data.meetupId}/room`);
    } catch {
      setError('참가 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1613] px-4 py-10 text-[#e5efe9]">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#06d6a0]/30 bg-[#06d6a0]/10 px-3 py-1 text-xs font-semibold text-[#06d6a0]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#06d6a0]" />
            게스트 참가
          </div>
          <h1 className="text-2xl font-bold tracking-tight">독서모임에 들어가기</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#7a8a82]">
            앱 설치 없이 웹에서만 참가합니다. 회원 전용 기능은 모바일 앱에서 로그인 후 이용해 주세요.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-white/5 bg-white/[0.03] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7a8a82]">
              초대코드
            </span>
            <input
              className="w-full rounded-lg border border-white/10 bg-[#0a1310] px-4 py-3 font-mono text-lg tracking-[0.3em] text-[#06d6a0] placeholder:text-[#364d44] focus:border-[#06d6a0]/60 focus:outline-none"
              value={inviteCode}
              onChange={(ev) => setInviteCode(ev.target.value)}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder="ABCD1234"
              maxLength={16}
            />
            {normalizedCode && normalizedCode !== inviteCode && (
              <span className="font-mono text-[10px] text-[#7a8a82]">
                서버 전송값: {normalizedCode}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7a8a82]">
              닉네임 <span className="text-[#506258]">(2~12자)</span>
            </span>
            <input
              className="w-full rounded-lg border border-white/10 bg-[#0a1310] px-4 py-3 text-base text-[#e5efe9] placeholder:text-[#364d44] focus:border-[#06d6a0]/60 focus:outline-none"
              value={nickname}
              onChange={(ev) => setNickname(ev.target.value)}
              placeholder="방에서 보일 이름"
              maxLength={12}
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#06d6a0] px-4 py-3 text-sm font-semibold text-[#0f1613] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? '참가 중…' : '참가하기'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-[#506258]">
          참가 후 24시간 안에 모임이 끝나면 게스트 데이터는 자동 삭제됩니다.
        </p>
      </div>
    </main>
  );
}

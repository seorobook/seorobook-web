import { redirect } from 'next/navigation';

import { listAssetsForUser } from '@/data/assets';
import { getRoomLayout } from '@/data/rooms';
import { auth } from '@/lib/auth';

import { EditorClient } from './editor-client';

/**
 * /home — 내 방 배치 에디터.
 *
 * The pixel art itself is authored externally (designer uploads,
 * marketplace purchases). This page is just the *composition* surface:
 * drop sprites from your inventory onto the iso floor, save, done.
 *
 * Mobile consumes the compiled manifest at /api/rooms/me.
 */
export default async function HomePage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/signin');

  const [assets, initialLayout] = await Promise.all([
    listAssetsForUser(session.user.id),
    getRoomLayout(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 text-[#e5efe9]">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[#06d6a0]/30 bg-[#06d6a0]/10 px-3 py-1 text-[11px] font-semibold text-[#06d6a0]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#06d6a0]" />
            내 방 에디터
          </div>
          <h1 className="text-2xl font-bold tracking-tight">서로북 룸 에디터</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#7a8a82]">
            외부 도구로 만든 픽셀 스프라이트 / 마켓에서 구매한 자산을 아이소메트릭 방에 배치하는 에디터.
            저장하면 모바일 홈에 바로 반영돼요.
          </p>
        </div>
      </header>

      <EditorClient assets={assets} initialLayout={initialLayout} />
    </div>
  );
}

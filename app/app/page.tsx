import React from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ensureProfile } from '@/data/profiles'

export const dynamic = 'force-dynamic'

export default async function App() {
  const { data: session } = await auth.getSession()
  if (!session?.user) return redirect('/signin')

  await ensureProfile({
    id: session.user.id,
    kind: 'member',
    nickname: session.user.email?.split('@')[0] ?? '사용자',
  })

  return (
    <div className="h-full w-full bg-primary text-white flex items-center justify-center">
      <div className="max-w-md px-6 text-center space-y-2">
        <h1 className="text-xl font-semibold">SeoroBook (Web)</h1>
        <p className="text-sm text-white/80">
          웹 앱은 현재 축소 중이며, 모바일 중심 Meetup MVP 개발로 전환했습니다.
        </p>
      </div>
    </div>
  )
}
import React from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ensureProfile, getProfileById } from '@/data/profiles'
import { getOrCreateDefaultLibrary } from '@/data/libraries'
import { formatEmailToName } from '@/utils/formatEmailToName'
import HeaderControls from './HeaderControls'
import BottomNavWrapper from './BottomNavWrapper'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return redirect('/signin')

  await ensureProfile(session.user.id)
  const [profile, defaultLibrary] = await Promise.all([
    getProfileById(session.user.id),
    getOrCreateDefaultLibrary(session.user.id),
  ])

  const displayName =
    profile?.nickname?.trim() || (session.user.email ? formatEmailToName(session.user.email) : '게스트')

  return (
    <div className="w-full h-screen flex flex-col bg-primary text-white">
      {/* Top header line */}
      <header className="h-14 px-4 flex items-center border-b border-primary/30 bg-primary/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/app" className="font-semibold truncate hover:underline">
            SeoroBook
          </a>
          <span className="text-sm text-secondary truncate">{displayName}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <HeaderControls />
        </div>
      </header>

      {/* Main content area */}
      <div className="relative grow min-h-0">
        <div className="h-full overflow-y-auto">{children}</div>
      </div>

      {/* Bottom navigation */}
      <div className="shrink-0">
        <BottomNavWrapper />
      </div>
    </div>
  )
}


import React from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ensureProfile, getProfileById } from '@/data/profiles'
import { getOrCreateDefaultLibrary } from '@/data/libraries'
import { formatEmailToName } from '@/utils/formatEmailToName'
import { defaultSkin } from '@/utils/pixi/Player/skins'
import LeftNav from './LeftNav'
import SpaceClient from './SpaceClient'

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

  const skin = profile?.skin ?? defaultSkin
  const mapData = defaultLibrary.map_data

  return (
    <div className="w-full h-screen flex flex-row">
      <LeftNav />
      <div className="grow flex flex-row min-w-0">
        {/* Center space (desktop-first). Mobile can hide via CSS later. */}
        <div className="hidden lg:block w-[55%] min-w-[520px] border-r border-primary/30 bg-black">
          <SpaceClient
            mapData={mapData}
            username={displayName}
            libraryId={defaultLibrary.id}
            uid={session.user.id}
            initialSkin={skin}
          />
        </div>
        {/* Right panel */}
        <div className="grow min-w-0 bg-primary text-white overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}


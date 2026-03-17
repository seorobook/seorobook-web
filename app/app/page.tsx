import React from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ensureProfile, getProfileById } from '@/data/profiles'
import { getOrCreateDefaultLibrary } from '@/data/libraries'
import { formatEmailToName } from '@/utils/formatEmailToName'
import { defaultSkin } from '@/utils/pixi/Player/skins'
import SpaceClient from './SpaceClient'

export const dynamic = 'force-dynamic'

export default async function App() {
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

  return (
    <div className="h-full w-full bg-black">
      {/* Desktop-only canvas. Mobile assumes no canvas. */}
      <div className="hidden md:block h-full w-full">
        <SpaceClient
          mapData={defaultLibrary.map_data}
          username={displayName}
          libraryId={defaultLibrary.id}
          uid={session.user.id}
          initialSkin={skin}
        />
      </div>
      <div className="md:hidden h-full w-full bg-primary" />
    </div>
  )
}
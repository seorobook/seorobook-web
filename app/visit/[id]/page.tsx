import React from 'react'
import NotFound from '@/app/not-found'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ensureProfile, getProfileById } from '@/data/profiles'
import { defaultSkin } from '@/utils/pixi/Player/skins'
import { getVisitById, getVisitInvitee } from '@/data/visits'
import { getLibraryById } from '@/data/libraries'
import { formatEmailToName } from '@/utils/formatEmailToName'
import PlayClient from '@/app/play/PlayClient'

export default async function VisitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return redirect('/signin')

  await ensureProfile(session.user.id)
  const { data: access } = await auth.getAccessToken().catch(() => ({ data: null as any }))
  const accessToken = (access as any)?.accessToken || (access as any)?.access_token || ''

  const { id: visitId } = await params
  const visit = await getVisitById(visitId)
  if (!visit) return <NotFound />

  const [profile, invitee] = await Promise.all([
    getProfileById(session.user.id),
    getVisitInvitee({ visitId, userId: session.user.id }),
  ])

  const canJoin = session.user.id === visit.host_id || invitee?.status === 'accepted'
  if (!canJoin) {
    return <NotFound specialMessage="방문 초대가 필요해요." />
  }

  const library = await getLibraryById(visit.library_id)
  if (!library) return <NotFound />

  const skin = profile?.skin ?? defaultSkin
  const username = profile?.nickname?.trim() || (session.user.email ? formatEmailToName(session.user.email) : '게스트')

  const isOwner = library.owner_id === session.user.id

  return (
    <PlayClient
      mapData={library.map_data}
      username={username}
      access_token={accessToken}
      libraryId={library.id}
      uid={session.user.id}
      shareId={''}
      initialSkin={skin}
      name={library.name}
      isOwner={isOwner}
      libraryOwnerId={library.owner_id}
      enableVoice
      showIntro={false}
    />
  )
}


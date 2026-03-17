import React from 'react'
import NotFound from '@/app/not-found'
import { redirect } from 'next/navigation'
import PlayClient from '../PlayClient'
import { formatEmailToName } from '@/utils/formatEmailToName'
import { auth } from '@/lib/auth'
import { getLibraryById, getLibraryByShareId } from '@/data/libraries'
import { getProfileById, ensureProfile } from '@/data/profiles'
import { defaultSkin } from '@/utils/pixi/Player/skins'
import { addVisitedLibrary } from '@/data/visitedLibraries'

export default async function Play({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ shareId?: string }>
}) {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
        return redirect('/signin')
    }

    await ensureProfile(session.user.id)
    const accessToken = ''

    const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
    const library = resolvedSearch.shareId
        ? await getLibraryByShareId(resolvedSearch.shareId)
        : await getLibraryById(resolvedParams.id)

    const profile = await getProfileById(session.user.id)

    if (!library || !profile) {
        return <NotFound specialMessage={undefined}/>
    }

    const map_data = library.map_data
    const skin = profile.skin ?? defaultSkin

    if (resolvedSearch.shareId && library.owner_id !== session.user.id) {
        await addVisitedLibrary(session.user.id, resolvedSearch.shareId)
    }

    const isOwner = library.owner_id === session.user.id

    return (
        <PlayClient
            mapData={map_data}
            username={formatEmailToName(session.user.email)}
            access_token={accessToken}
            libraryId={resolvedParams.id}
            uid={session.user.id}
            shareId={resolvedSearch.shareId || ''}
            initialSkin={skin}
            name={library.name}
            isOwner={isOwner}
            libraryOwnerId={library.owner_id}
        />
    )
}
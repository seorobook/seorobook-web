import React from 'react'
import NotFound from '@/app/not-found'
import { redirect } from 'next/navigation'
import PlayClient from '../PlayClient'
import { formatEmailToName } from '@/utils/formatEmailToName'
import { auth } from '@/lib/auth'
import { getRealmById, getRealmByShareId } from '@/data/realms'
import { getProfileById } from '@/data/profiles'
import { addVisitedRealm } from '@/data/visitedRealms'

export default async function Play({ params, searchParams }: { params: { id: string }, searchParams: { shareId: string } }) {

    const { data: session } = await auth.getSession()
    if (!session?.user) {
        return redirect('/signin')
    }

    const realm = searchParams.shareId
      ? await getRealmByShareId(searchParams.shareId)
      : await getRealmById(params.id)

    const profile = await getProfileById(session.user.id)

    // Show not found page if no data is returned
    if (!realm || !profile) {
        return <NotFound specialMessage={undefined}/>
    }

    const map_data = realm.map_data
    const skin = profile.skin ?? null

    if (searchParams.shareId && realm.owner_id !== session.user.id) {
        await addVisitedRealm(session.user.id, searchParams.shareId)
    }

    return (
        <PlayClient 
            mapData={map_data} 
            username={formatEmailToName(session.user.email)} 
            access_token={''} 
            realmId={params.id} 
            uid={session.user.id} 
            shareId={searchParams.shareId || ''} 
            initialSkin={skin}
            name={realm.name}
        />
    )
}
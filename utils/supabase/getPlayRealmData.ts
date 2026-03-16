'use server'
import 'server-only'
import { auth } from '../../lib/auth'
import { getRealmByShareId } from '../../data/realms'

type PlayRealmData = {
  map_data: any
  owner_id: string
  only_owner: boolean | null
  name: string
}

export async function getPlayRealmData(_accessToken: string, shareId: string) {
  const { data: session } = await auth.getSession()

  if (!session?.user) {
    return { data: null, error: { message: 'Unauthorized' } }
  }

  const realm = await getRealmByShareId(shareId)

  if (!realm) {
    return { data: null, error: { message: 'Realm not found' } }
  }

  const data: PlayRealmData = {
    map_data: realm.map_data,
    owner_id: realm.owner_id,
    only_owner: realm.only_owner,
    name: realm.name,
  }

  if (realm.owner_id === session.user.id) {
    return { data, error: null }
  }

  if (realm.only_owner) {
    return { data: null, error: { message: 'only owner' } }
  }

  return { data, error: null }
}


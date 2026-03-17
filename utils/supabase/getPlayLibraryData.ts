'use server'
import 'server-only'
import { auth } from '../../lib/auth'
import { getLibraryByShareId } from '../../data/libraries'

type PlayLibraryData = {
  map_data: any
  owner_id: string
  only_owner: boolean | null
  name: string
}

export async function getPlayLibraryData(_accessToken: string, shareId: string) {
  const { data: session } = await auth.getSession()

  if (!session?.user) {
    return { data: null, error: { message: 'Unauthorized' } }
  }

  const library = await getLibraryByShareId(shareId)

  if (!library) {
    return { data: null, error: { message: 'Library not found' } }
  }

  const data: PlayLibraryData = {
    map_data: library.map_data,
    owner_id: library.owner_id,
    only_owner: library.only_owner,
    name: library.name,
  }

  if (library.owner_id === session.user.id) {
    return { data, error: null }
  }

  if (library.only_owner) {
    return { data: null, error: { message: 'only owner' } }
  }

  return { data, error: null }
}

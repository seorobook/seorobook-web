'use server'
import 'server-only'
import { RealmData } from '../pixi/types'
import { RealmDataSchema } from '../pixi/zod'
import { formatForComparison, removeExtraSpaces } from '../removeExtraSpaces'
import { auth } from '../../lib/auth'
import { updateRealmMapData } from '../../data/realms'

export async function saveRealm(_access_token: string, realmData: RealmData, id: string) {
  const result = RealmDataSchema.safeParse(realmData)
  if (result.success === false) {
    return { error: { message: 'Invalid realm data.' } }
  }

  if (realmData.rooms.length === 0) {
    return { error: { message: 'A realm must have at least one room.' } }
  }

  if (realmData.rooms.length > 50) {
    return { error: { message: 'A realm cannot have more than 50 rooms.' } }
  }

  const roomNames = new Set<string>()
  for (const room of realmData.rooms) {
    if (Object.keys(room.tilemap).length > 10_000) {
      return { error: { message: 'This room is too big to save!' } }
    }

    const roomName = formatForComparison(room.name)

    if (roomNames.has(roomName)) {
      return { error: { message: 'Room names must be unique.' } }
    }
    if (roomName.trim() === '') {
      return { error: { message: 'Room name cannot be empty.' } }
    }
    if (roomName.length > 32) {
      return { error: { message: 'Room names cannot be longer than 32 characters.' } }
    }
    roomNames.add(roomName)

    room.name = removeExtraSpaces(room.name, true)
  }

  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return { error: { message: 'Unauthorized' } }
    }

    await updateRealmMapData(id, session.user.id, realmData)
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save realm.'
    return { error: { message } }
  }
}


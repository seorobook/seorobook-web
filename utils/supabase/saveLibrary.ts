'use server'
import 'server-only'
import { LibraryData } from '../pixi/types'
import { LibraryDataSchema } from '../pixi/zod'
import { formatForComparison, removeExtraSpaces } from '../removeExtraSpaces'
import { auth } from '../../lib/auth'
import { updateLibraryMapData } from '../../data/libraries'

export async function saveLibrary(_access_token: string, libraryData: LibraryData, id: string) {
  const result = LibraryDataSchema.safeParse(libraryData)
  if (result.success === false) {
    return { error: { message: 'Invalid library data.' } }
  }

  if (libraryData.rooms.length === 0) {
    return { error: { message: 'A library must have at least one room.' } }
  }

  if (libraryData.rooms.length > 50) {
    return { error: { message: 'A library cannot have more than 50 rooms.' } }
  }

  const roomNames = new Set<string>()
  for (const room of libraryData.rooms) {
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

    await updateLibraryMapData(id, session.user.id, libraryData)
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save library.'
    return { error: { message } }
  }
}

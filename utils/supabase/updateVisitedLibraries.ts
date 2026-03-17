'use server'
import 'server-only'
import { auth } from '../../lib/auth'
import revalidate from '../revalidate'
import { addVisitedLibrary } from '../../data/visitedLibraries'

export async function updateVisitedLibraries(_accessToken: string, shareId: string) {
  const { data: session } = await auth.getSession()

  if (!session?.user) {
    return
  }

  await addVisitedLibrary(session.user.id, shareId)

  revalidate('/app')
}

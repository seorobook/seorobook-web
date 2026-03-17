'use server'
import 'server-only'
import { auth } from '../../lib/auth'
import { listVisitedLibraries } from '../../data/visitedLibraries'

export async function getVisitedLibraries(_access_token: string) {
  const { data: session } = await auth.getSession()

  if (!session?.user) {
    return { data: [], error: null }
  }

  const visitedLibraries = await listVisitedLibraries(session.user.id)

  return { data: visitedLibraries, error: null }
}

'use server'
import 'server-only'
import { auth } from '../../lib/auth'
import { listVisitedRealms } from '../../data/visitedRealms'

export async function getVisitedRealms(_access_token: string) {
  const { data: session } = await auth.getSession()

  if (!session?.user) {
    return { data: null, error: { message: 'Unauthorized' } }
  }

  const visitedRealms = await listVisitedRealms(session.user.id)

  return { data: visitedRealms, error: null }
}

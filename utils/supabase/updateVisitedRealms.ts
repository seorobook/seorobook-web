'use server'
import 'server-only'
import { auth } from '../../lib/auth'
import revalidate from '../revalidate'
import { addVisitedRealm } from '../../data/visitedRealms'

export async function updateVisitedRealms(_accessToken: string, shareId: string) {
  const { data: session } = await auth.getSession()

  if (!session?.user) {
    return
  }

  await addVisitedRealm(session.user.id, shareId)

  revalidate('/app')
}

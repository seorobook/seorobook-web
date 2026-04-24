import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

/**
 * Landing → redirect based on auth state.
 *   logged in  → /home (room editor)
 *   logged out → /signin
 *
 * Guests entering via an invite code go directly to /meet/join, which
 * lives outside the authenticated (tabs) group.
 */
export default async function RootPage() {
  const { data: session } = await auth.getSession();
  redirect(session?.user ? '/home' : '/signin');
}

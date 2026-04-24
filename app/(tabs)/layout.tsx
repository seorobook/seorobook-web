import { redirect } from 'next/navigation';

import { Navbar } from '@/components/Navbar/Navbar';
import { auth } from '@/lib/auth';

/**
 * Auth gate for the (tabs) group. Guests never see /home or /setting.
 * They use /meet/* (standalone, outside this group).
 */
export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/signin');

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl">{children}</main>
    </>
  );
}

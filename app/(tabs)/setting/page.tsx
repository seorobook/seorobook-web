import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

import { SignOutButton } from './sign-out-button';

export default async function SettingPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/signin');

  return (
    <div className="px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">설정</h1>

      <section className="space-y-2 rounded-lg border border-white/5 bg-white/[0.02] p-5">
        <div className="text-xs uppercase tracking-wide text-[#7a8a82]">계정</div>
        <div className="font-mono text-sm">{session.user.email ?? session.user.id}</div>
      </section>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}

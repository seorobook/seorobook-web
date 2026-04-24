'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Top nav for the authenticated (tabs) group. Only two tabs: 홈 / 설정.
 * Meetup lives outside this nav — guests reach it via invite-code links.
 */
const TABS = [
  { href: '/home', label: '홈' },
  { href: '/setting', label: '설정' },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0f1613]/90 backdrop-blur">
      <nav className="mx-auto flex h-12 max-w-6xl items-center gap-1 px-4">
        <span className="mr-4 font-mono text-sm font-semibold text-[#06d6a0]">seorobook</span>
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                'rounded-md px-3 py-1.5 text-sm transition ' +
                (active
                  ? 'bg-[#06d6a0]/15 text-[#06d6a0]'
                  : 'text-[#9fb3aa] hover:bg-white/5 hover:text-[#e9f2ed]')
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

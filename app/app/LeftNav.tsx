'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Package, Sparkle, Newspaper } from '@phosphor-icons/react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

const items: NavItem[] = [
  { href: '/app', label: '서재', icon: <House className="h-6 w-6" /> },
  { href: '/app/items', label: '아이템', icon: <Package className="h-6 w-6" /> },
  { href: '/app/butler', label: '집사', icon: <Sparkle className="h-6 w-6" /> },
  { href: '/app/feed', label: '피드', icon: <Newspaper className="h-6 w-6" /> },
]

export default function LeftNav() {
  const pathname = usePathname()

  return (
    <nav className="h-full w-[88px] shrink-0 bg-secondary border-r border-primary/30 flex flex-col items-center py-4 gap-2 select-none">
      {items.map((it) => {
        const active = pathname === it.href
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`w-[72px] h-[72px] rounded-xl grid place-items-center hover:bg-light-secondary animate-colors ${
              active ? 'bg-light-secondary' : ''
            }`}
            aria-label={it.label}
            title={it.label}
          >
            <div className="flex flex-col items-center gap-1 text-white">
              {it.icon}
              <span className="text-[11px]">{it.label}</span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}


'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Users, Newspaper, Storefront, Gear } from '@phosphor-icons/react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

const items: NavItem[] = [
  { href: '/app', label: '서재', icon: <House className="h-6 w-6" /> },
  { href: '/app/sero', label: '서로', icon: <Users className="h-6 w-6" /> },
  { href: '/app/feed', label: '피드', icon: <Newspaper className="h-6 w-6" /> },
  { href: '/app/shop', label: '상점', icon: <Storefront className="h-6 w-6" /> },
  { href: '/app/settings', label: '설정', icon: <Gear className="h-6 w-6" /> },
]

export default function LeftNav() {
  const pathname = usePathname()

  return (
    <nav className="h-16 w-full bg-secondary border-t border-primary/30 flex items-center justify-around px-2 select-none">
      {items.map((it) => {
        const active = pathname === it.href
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`h-12 w-16 rounded-xl grid place-items-center hover:bg-light-secondary animate-colors ${
              active ? 'bg-light-secondary' : ''
            }`}
            aria-label={it.label}
            title={it.label}
          >
            <div className="flex flex-col items-center gap-1 text-white">
              {it.icon}
              <span className="text-[10px] leading-none">{it.label}</span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}


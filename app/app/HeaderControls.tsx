'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default function HeaderControls() {
  const pathname = usePathname()
  const isSubApp = pathname.startsWith('/app/books')

  if (isSubApp) {
    return (
      <Link href="/app" className="text-sm text-secondary hover:text-white hover:underline">
        서재로 돌아가기
      </Link>
    )
  }

  return <LogoutButton />
}


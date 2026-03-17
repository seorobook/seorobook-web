'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import LeftNav from './LeftNav'

export default function BottomNavWrapper() {
  const pathname = usePathname()
  const hide = pathname.startsWith('/app/books')
  if (hide) return null
  return <LeftNav />
}


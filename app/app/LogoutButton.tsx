'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function LogoutButton() {
  const router = useRouter()

  const onLogout = async () => {
    try {
      await authClient.signOut()
    } finally {
      router.push('/signin')
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="text-sm text-secondary hover:text-white hover:underline"
    >
      로그아웃
    </button>
  )
}


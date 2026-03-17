import React from 'react'
import { NavbarChild } from './NavbarChild'
import { formatEmailToName } from '@/utils/formatEmailToName'
import { auth } from '@/lib/auth'

type NavbarProps = {
  defaultLibraryId?: string
  /** 서버에서 이미 계산한 표시 이름(닉네임 우선). 없으면 이메일 기반으로 계산 */
  displayName?: string
}

export const Navbar: React.FC<NavbarProps> = async ({ defaultLibraryId, displayName }) => {
    const { data: session } = await auth.getSession()
    const name =
        displayName ??
        (session?.user?.email ? formatEmailToName(session.user.email) : '게스트')

    return (
        <NavbarChild
          name={name}
          avatar_url={undefined}
          defaultLibraryId={defaultLibraryId}
        />
    )
}

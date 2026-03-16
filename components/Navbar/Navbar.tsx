import React from 'react'
import { NavbarChild } from './NavbarChild'
import { formatEmailToName } from '@/utils/formatEmailToName'
import { auth } from '@/lib/auth'

export const Navbar:React.FC = async () => {

    const { data: session } = await auth.getSession()

    return (
        <NavbarChild
          name={session?.user?.email ? formatEmailToName(session.user.email) : '게스트'}
          avatar_url={undefined}
        />
    )
}

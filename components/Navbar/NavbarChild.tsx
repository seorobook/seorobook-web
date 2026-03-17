'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { useModal } from '@/app/hooks/useModal'
import BasicButton from '../BasicButton'

type NavbarChildProps = {
    name: string
    avatar_url?: string
    defaultLibraryId?: string
}

export const NavbarChild: React.FC<NavbarChildProps> = ({ name, avatar_url, defaultLibraryId }) => {
    const { setModal } = useModal()

    return (
        <div className='h-16'>
            <div className='w-full fixed bg-secondary flex flex-row items-center p-2 pl-8 justify-end sm:justify-between z-10'>
                {defaultLibraryId ? (
                    <div className="hidden sm:flex items-center gap-2">
                        <Link href={`/editor/${defaultLibraryId}`}>
                            <BasicButton className="flex flex-row items-center gap-2 py-[10px]">
                                서재로 돌아가기
                                <PencilSquareIcon className="h-5 w-5" />
                            </BasicButton>
                        </Link>
                        <Link href="/app/books" className="text-sm hover:underline py-2">
                            독서 기록
                        </Link>
                    </div>
                ) : null}
                <div className="flex flex-row items-center gap-4 hover:bg-light-secondary animate-colors rounded-full cursor-pointer py-1 px-1 select-none" onClick={() => setModal('Account Dropdown')}>
                    <p className="text-white">{name}</p>
                    {avatar_url ? (
                        <Image alt="avatar" src={avatar_url} width={48} height={48} className="aspect-square rounded-full" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-lg text-white shrink-0">
                            {name.trim()[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                </div>
            </div>
        </div> 
    )
}
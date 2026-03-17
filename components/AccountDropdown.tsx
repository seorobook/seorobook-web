'use client'
import React, { Fragment, useEffect, useState } from 'react'
import { useModal } from '@/app/hooks/useModal'
import { Dialog, Transition } from '@headlessui/react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

const AccountDropdown: React.FC = () => {
    const { modal, setModal } = useModal()
    const router = useRouter()
    const [nickname, setNickname] = useState('')
    const [nicknameSaving, setNicknameSaving] = useState(false)
    const [nicknameLoaded, setNicknameLoaded] = useState(false)

    const isOpen = modal === 'Account Dropdown'

    useEffect(() => {
        if (!isOpen) return
        let cancelled = false
        fetch('/api/profile', { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data) setNickname(data.nickname ?? '')
            })
            .finally(() => {
                if (!cancelled) setNicknameLoaded(true)
            })
        return () => {
            cancelled = true
        }
    }, [isOpen])

    async function handleSaveNickname() {
        setNicknameSaving(true)
        try {
            const res = await fetch('/api/profile/nickname', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: nickname.trim() || null }),
            })
            if (res.ok) {
                setModal('None')
                router.refresh()
            }
        } finally {
            setNicknameSaving(false)
        }
    }

    async function handleSignOut() {
        setModal('None')
        try {
            await authClient.signOut()
        } finally {
            router.push('/signin')
        }
    }

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={() => setModal('None')}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full justify-center text-center items-center p-0 relative">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 translate-y-0 scale-95"
                            enterTo="opacity-100 translate-y-0 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 scale-100"
                            leaveTo="opacity-0 translate-y-4 translate-y-0 scale-95"
                        >
                            <Dialog.Panel className="absolute top-[78px] right-[8px] transform overflow-hidden text-left shadow-xl transition-all bg-secondary rounded-md p-3 min-w-[200px]">
                                <div className="mb-2">
                                    <label className="block text-sm mb-1">닉네임</label>
                                    <input
                                        type="text"
                                        className="w-full bg-primary text-primary rounded px-2 py-1 text-sm border border-secondary"
                                        placeholder="표시 이름"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        maxLength={32}
                                        disabled={!nicknameLoaded}
                                    />
                                    <button
                                        type="button"
                                        className="mt-1 w-full bg-light-secondary hover:opacity-90 rounded py-1 text-sm disabled:opacity-50"
                                        onClick={handleSaveNickname}
                                        disabled={nicknameSaving || !nicknameLoaded}
                                    >
                                        {nicknameSaving ? '저장 중...' : '저장'}
                                    </button>
                                </div>
                                <button
                                    className="w-full bg-secondary hover:bg-light-secondary animate-colors rounded-md py-1 outline-none text-sm"
                                    onClick={handleSignOut}
                                >
                                    Sign Out
                                </button>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default AccountDropdown

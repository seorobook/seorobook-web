'use client'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import BasicButton from '@/components/BasicButton'
import DesktopLibraryItem from './DesktopLibraryItem'
import { useRouter } from 'next/navigation'
import revalidate from '@/utils/revalidate'

type Library = {
    id: string
    name: string
    share_id: string | null
    shared?: boolean
}

type LibrariesMenuProps = {
    libraries: Library[]
    errorMessage: string
}

const LibrariesMenu:React.FC<LibrariesMenuProps> = ({ libraries, errorMessage }) => {

    const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null)
    const router = useRouter()

    useEffect(() => {
        if (errorMessage) {
            toast.error(errorMessage)
        }
    }, [errorMessage])

    function getLink() {
        if (selectedLibrary?.share_id) {
            return `/play/${selectedLibrary.id}?shareId=${selectedLibrary.share_id}`
        } else {
            return `/play/${selectedLibrary?.id}`
        }
    }

    return (
        <>
            {/* Mobile View */}
            <div className='flex flex-col items-center p-4 gap-2 sm:hidden'>
                {libraries.length === 0 && <p className='text-center'>You have no libraries you can join. Create one on desktop to get started!</p>}
                {libraries.map((lib, index) => {

                    function selectLibrary() {
                        setSelectedLibrary(lib)
                    }

                    return (
                        <BasicButton key={lib.id} className={`w-full h-12 border-4 border-transparent flex flex-row items-center justify-between ${selectedLibrary?.id === lib.id ? 'border-white' : ''}`} onClick={selectLibrary}>
                            <p className='text-button text-xl text-left'>{lib.name}</p>
                        </BasicButton>
                    )
                })}
                <div className='fixed bottom-0 w-full bg-primary grid place-items-center p-2'>
                     <BasicButton className='w-[90%] text-xl px-0 py-0' disabled={selectedLibrary === null} onClick={() => router.push(getLink())}>
                        Join Library
                    </BasicButton>
                </div>
            </div>

            {/* Desktop View */}
            <div className='flex-col items-center w-full p-8 hidden sm:flex'>
                {libraries.length === 0 && <p className='text-center'>You have no libraries you can join. Create a library to get started!</p>}
                <div className='hidden sm:grid grid-cols-2 md:grid-cols-3 gap-8 w-full'>
                    {libraries.map((lib, index) => {
                        return (
                            <DesktopLibraryItem key={lib.id} name={lib.name} id={lib.id} shareId={lib.share_id} shared={lib.shared}/>
                        )
                    })}
                </div>
            </div>
            
        </>
        
    )
}

export default LibrariesMenu

'use client'
import React, { useState } from 'react'
import Modal from './Modal'
import { useModal } from '@/app/hooks/useModal'
import BasicButton from '../BasicButton'
import BasicInput from '../BasicInput'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation' 
import revalidate from '@/utils/revalidate'
import { removeExtraSpaces } from '@/utils/removeExtraSpaces'
import defaultMap from '@/utils/defaultmap.json'

const CreateLibraryModal:React.FC = () => {
    
    const { modal, setModal } = useModal()
    const [libraryName, setLibraryName] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)

    const [useDefaultMap, setUseDefaultMap] = useState<boolean>(true)

    const router = useRouter()

    async function createLibrary() {
        setLoading(true)

        const body: any = {
            name: libraryName,
        }
        if (useDefaultMap) {
            body.map_data = defaultMap
        }

        try {
            const res = await fetch('/api/libraries', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                const message = await res.text().catch(() => '')
                toast.error(message || 'Failed to create library')
                if (res.status === 409) {
                    setModal('None')
                    revalidate('/app')
                    router.refresh()
                }
                setLoading(false)
                return
            }

            const { library } = await res.json()

            setLibraryName('')
            revalidate('/app')
            setModal('None')
            toast.success('Your library has been created!')
            router.push(`/editor/${library.id}`)
        } finally {
            setLoading(false)
        }
    }

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = removeExtraSpaces(e.target.value)
        setLibraryName(value)
    }

    return (
        <Modal open={modal === 'Create Library'} closeOnOutsideClick>
            <div className='flex flex-col items-center p-4 w-[400px] gap-4'>
                <h1 className='text-2xl'>Create a Library</h1>
                <BasicInput label={'Library Name'} className='w-[280px]' value={libraryName} onChange={onChange} maxLength={32}/>
                <div className='flex items-center gap-2 w-[280px]'>
                    <input
                        type="checkbox"
                        id="useDefaultMap"
                        checked={useDefaultMap}
                        onChange={(e) => setUseDefaultMap(e.target.checked)}
                    />
                    <label htmlFor="useDefaultMap">Use starter map</label>
                </div>
                <BasicButton disabled={libraryName.length <= 0 || loading} onClick={createLibrary} className='text-lg'>
                    Create
                </BasicButton>
            </div>
        </Modal>
    )
}

export default CreateLibraryModal

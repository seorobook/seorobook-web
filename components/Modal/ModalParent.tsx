'use client'
import React from 'react'
import AccountDropdown from '../AccountDropdown'
import LoadingModal from './LoadingModal'
import DeleteRoomModal from './DeleteRoomModal'
import TeleportModal from './TeleportModal'
import DeleteLibraryModal from './DeleteLibraryModal'
import FailedToConnectModal from './FailedToConnectModal'
import SkinMenu from '@/app/play/SkinMenu/SkinMenu'
import DisconnectedModal from './DisconnectedModal'
import { useModal } from '@/app/hooks/useModal'

const ModalParent: React.FC = () => {
    const { errorModal } = useModal()

    return (
        <div>
            {errorModal === 'None' && (
                <>
                    <AccountDropdown />
                    <LoadingModal />
                    <DeleteRoomModal />
                    <TeleportModal />
                    <DeleteLibraryModal />
                    <SkinMenu />
                </>
            )}
            <FailedToConnectModal />
            <DisconnectedModal />
        </div>
    )
}
export default ModalParent;
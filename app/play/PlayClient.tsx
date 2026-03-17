'use client'
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import PixiApp from './PixiApp'
import { LibraryData } from '@/utils/pixi/types'
import PlayNavbar from './PlayNavbar'
import { useModal } from '../hooks/useModal'
import signal from '@/utils/signal'
import BooksOverlay from './BooksOverlay'
import FeedOverlay from './FeedOverlay'

const VideoBar = dynamic(() => import('@/components/VideoChat/VideoBar'), { ssr: false })
const AgoraVideoChatProvider = dynamic(
    () => import('../hooks/useVideoChat').then((m) => m.AgoraVideoChatProvider),
    { ssr: false },
)
const IntroScreen = dynamic(() => import('./IntroScreen'), { ssr: false })

type PlayClientProps = {
    mapData: LibraryData
    username: string
    access_token: string
    libraryId: string
    uid: string
    shareId: string
    initialSkin: string
    name: string
    isOwner?: boolean
    libraryOwnerId: string
    enableVoice?: boolean
    showIntro?: boolean
    multiplayer?: boolean
}

const PlayClient: React.FC<PlayClientProps> = ({
    mapData,
    username,
    access_token,
    libraryId,
    uid,
    shareId,
    initialSkin,
    name,
    isOwner = false,
    libraryOwnerId,
    enableVoice = false,
    showIntro = true,
    multiplayer = false,
}) => {
    const { setErrorModal, setDisconnectedMessage } = useModal()

    const [showIntroScreen, setShowIntroScreen] = useState(showIntro)
    const [showBooksOverlay, setShowBooksOverlay] = useState(false)
    const [showFeedOverlay, setShowFeedOverlay] = useState(false)
    const [skin, setSkin] = useState(initialSkin)

    useEffect(() => {
        const onShowKickedModal = (message: string) => {
            setErrorModal('Disconnected')
            setDisconnectedMessage(message)
        }

        const onShowDisconnectModal = () => {
            setErrorModal('Disconnected')
            setDisconnectedMessage('You have been disconnected from the server.')
        }

        const onSwitchSkin = (skin: string) => {
            setSkin(skin)
        }

        const onOpenBooksOverlay = () => {
            setShowBooksOverlay(true)
        }

        const onOpenFeedOverlay = () => {
            setShowFeedOverlay(true)
        }

        signal.on('showKickedModal', onShowKickedModal)
        signal.on('showDisconnectModal', onShowDisconnectModal)
        signal.on('switchSkin', onSwitchSkin)
        signal.on('openBooksOverlay', onOpenBooksOverlay)
        signal.on('openFeedOverlay', onOpenFeedOverlay)

        return () => {
            signal.off('showKickedModal', onShowKickedModal)
            signal.off('showDisconnectModal', onShowDisconnectModal)
            signal.off('switchSkin', onSwitchSkin)
            signal.off('openBooksOverlay', onOpenBooksOverlay)
            signal.off('openFeedOverlay', onOpenFeedOverlay)
        }
    }, [setErrorModal, setDisconnectedMessage])

    const content = (
        <>
            {!showIntroScreen && (
                <div className="relative w-full h-screen flex flex-col-reverse sm:flex-col">
                    {enableVoice && <VideoBar />}
                    <PixiApp
                        mapData={mapData}
                        className="w-full grow sm:h-full sm:flex-grow-0"
                        username={username}
                        access_token={access_token}
                        libraryId={libraryId}
                        uid={uid}
                        shareId={shareId}
                        initialSkin={skin}
                        multiplayer={multiplayer}
                    />
                    <PlayNavbar username={username} skin={skin} />
                    {showBooksOverlay && (
                        <BooksOverlay
                            isOwner={isOwner}
                            onClose={() => setShowBooksOverlay(false)}
                        />
                    )}
                    {showFeedOverlay && (
                        <FeedOverlay
                            ownerUserId={libraryOwnerId}
                            isOwner={isOwner}
                            onClose={() => setShowFeedOverlay(false)}
                        />
                    )}
                </div>
            )}
            {showIntroScreen && (
                <IntroScreen
                    libraryName={name}
                    skin={skin}
                    username={username}
                    setShowIntroScreen={setShowIntroScreen}
                />
            )}
        </>
    )

    if (!enableVoice) return content

    return <AgoraVideoChatProvider uid={uid}>{content}</AgoraVideoChatProvider>
}
export default PlayClient
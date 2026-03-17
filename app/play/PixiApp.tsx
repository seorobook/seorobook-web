'use client'
import React, { useRef } from 'react'
import { PlayApp } from '@/utils/pixi/PlayApp'
import { useEffect } from 'react'
import { LibraryData } from '@/utils/pixi/types'
import { useModal } from '../hooks/useModal'
import { server } from '@/utils/backend/server'

type PixiAppProps = {
    className?: string
    mapData: LibraryData
    username: string
    access_token: string
    libraryId: string
    uid: string
    shareId: string
    initialSkin: string
    multiplayer?: boolean
}

const PixiApp:React.FC<PixiAppProps> = ({ className, mapData, username, access_token, libraryId, uid, shareId, initialSkin, multiplayer = false }) => {

    const appRef = useRef<PlayApp | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const { setModal, setLoadingText, setFailedConnectionMessage, setErrorModal } = useModal()

    useEffect(() => {
        const mount = async () => {
            const app = new PlayApp(uid, libraryId, mapData, username, initialSkin, { multiplayer })
            appRef.current = app
            setModal('Loading')
            if (multiplayer) {
                setLoadingText('Connecting to server...')
                const { success, errorMessage } = await server.connect(libraryId, uid, shareId, access_token)
                if (!success) {
                    setErrorModal('Failed To Connect')
                    setFailedConnectionMessage(errorMessage)
                    return
                }
            }

            setLoadingText('Loading game...')
            await app.init()
            setModal('None')
            const pixiApp = app.getApp()

            const container = document.getElementById('app-container')
            if (container) {
                container.replaceChildren(pixiApp.canvas)
                canvasRef.current = pixiApp.canvas
            }
        }

        if (!appRef.current) {
            mount()
        }
        
        return () => {
            if (appRef.current) {
                const canvas = canvasRef.current
                if (canvas?.parentElement?.id === 'app-container') {
                    try {
                        canvas.parentElement.removeChild(canvas)
                    } catch {}
                }
                appRef.current.destroy()
            }
            canvasRef.current = null
        }
    }, [])

    return (
        <div id='app-container' className={`overflow-hidden ${className}`}>
            
        </div>
    )
}

export default PixiApp

'use client'

import React, { useEffect, useRef } from 'react'
import { PlayApp } from '@/utils/pixi/PlayApp'
import { LibraryData } from '@/utils/pixi/types'
import { useModal } from '@/app/hooks/useModal'

type SpaceClientProps = {
  mapData: LibraryData
  username: string
  libraryId: string
  uid: string
  initialSkin: string
}

export default function SpaceClient({ mapData, username, libraryId, uid, initialSkin }: SpaceClientProps) {
  const appRef = useRef<PlayApp | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { setModal, setLoadingText } = useModal()

  useEffect(() => {
    const mount = async () => {
      setModal('Loading')
      setLoadingText('Loading space...')

      const app = new PlayApp(uid, libraryId, mapData, username, initialSkin, { multiplayer: false })
      appRef.current = app
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
      const canvas = canvasRef.current
      if (canvas?.parentElement?.id === 'app-container') {
        try {
          canvas.parentElement.removeChild(canvas)
        } catch {}
      }
      appRef.current?.destroy()
      appRef.current = null
      canvasRef.current = null
    }
  }, [initialSkin, libraryId, mapData, setLoadingText, setModal, uid, username])

  return <div id="app-container" className="h-full w-full overflow-hidden" />
}


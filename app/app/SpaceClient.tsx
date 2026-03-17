'use client'

import React, { useEffect, useRef, useState } from 'react'
import { PlayApp } from '@/utils/pixi/PlayApp'
import { LibraryData } from '@/utils/pixi/types'
import { useModal } from '@/app/hooks/useModal'
import signal from '@/utils/signal'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [bookshelfPrompt, setBookshelfPrompt] = useState(false)

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

  useEffect(() => {
    const onShow = () => setBookshelfPrompt(true)
    const onHide = () => setBookshelfPrompt(false)
    signal.on('showBookshelfPrompt', onShow)
    signal.on('hideBookshelfPrompt', onHide)
    return () => {
      signal.off('showBookshelfPrompt', onShow)
      signal.off('hideBookshelfPrompt', onHide)
    }
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div id="app-container" className="h-full w-full overflow-hidden" />
      {bookshelfPrompt && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-secondary/95 border border-primary/30 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
            <div className="min-w-0">
              <p className="text-sm font-semibold">책장</p>
              <p className="text-xs text-secondary">읽은 책 기록을 열 수 있어요</p>
            </div>
            <button
              type="button"
              className="bg-emerald-400 text-black rounded-lg px-3 py-2 text-sm font-medium hover:opacity-90"
              onClick={() => router.push('/app/books')}
            >
              열기
            </button>
            <button
              type="button"
              className="text-sm text-secondary hover:text-white"
              onClick={() => setBookshelfPrompt(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


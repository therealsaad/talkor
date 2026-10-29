'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Expand, Maximize2, RotateCw } from 'lucide-react'
import { requestClass1Fullscreen } from './class1-fullscreen'
import './class1-immersion.css'

/** Classroom wrapper: no changes to activity IDs, voice sessions or progress. */
export function Class1Immersion({ children, voiceOnly = false }: { children: ReactNode; voiceOnly?: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  const [fullscreenUnavailable, setFullscreenUnavailable] = useState(false)

  const refreshViewport = useCallback(() => {
    setIsFullscreen(document.fullscreenElement === frame.current)
    setIsPortrait(window.innerHeight > window.innerWidth)
  }, [])

  useEffect(() => {
    refreshViewport()
    window.addEventListener('resize', refreshViewport)
    window.addEventListener('orientationchange', refreshViewport)
    document.addEventListener('fullscreenchange', refreshViewport)
    return () => {
      window.removeEventListener('resize', refreshViewport)
      window.removeEventListener('orientationchange', refreshViewport)
      document.removeEventListener('fullscreenchange', refreshViewport)
    }
  }, [refreshViewport])

  async function enterLandscape() {
    if (!frame.current) return
    const entered = await requestClass1Fullscreen(frame.current)
    setFullscreenUnavailable(!entered)
    refreshViewport()
  }

  return (
    <div ref={frame} className="tk-class1-immersion" data-class1-immersion="true">
      {children}
      {!voiceOnly && !isPortrait && !isFullscreen && (
        <button
          type="button"
          className="tk-class1-fullscreen-action"
          onClick={() => void enterLandscape()}
          aria-label="Enter full screen Class 1 lesson"
        >
          <Maximize2 size={17} aria-hidden="true" />
          <span>Full screen</span>
        </button>
      )}
      {isPortrait && (
        <div className="tk-class1-rotate-screen" role="dialog" aria-modal="true" aria-label="Landscape learning mode">
          <div className="tk-class1-rotate-card">
            <RotateCw size={43} strokeWidth={1.8} aria-hidden="true" />
            <strong>Let's turn our screen sideways!</strong>
            <p>Miss Julie teaches Class 1 in landscape. Rotate your phone or tablet, then continue your lesson.</p>
            {!voiceOnly ? <button type="button" onClick={() => void enterLandscape()}>
              <Expand size={18} aria-hidden="true" /> Try landscape full screen
            </button> : null}
            {fullscreenUnavailable && <small>Screen rotation is controlled by your device. Turn on Auto-rotate or ask your teacher for help.</small>}
          </div>
        </div>
      )}
    </div>
  )
}

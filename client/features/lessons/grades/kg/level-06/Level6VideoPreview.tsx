'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const VIDEO_URL = '/lessons/kg/level-06/vowels.MOV'
type PlaybackStatus = 'loading' | 'playing' | 'blocked' | 'error'

export function Level6VideoPreview({ onComplete }: { onComplete: () => void }) {
  const frameRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<PlaybackStatus>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const finishedRef = useRef(false)

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let active = true
    const play = () => {
      void video.play().then(
        () => { if (active) setStatus('playing') },
        (error: unknown) => {
          if (!active) return
          setStatus(error instanceof DOMException && error.name === 'NotAllowedError' ? 'blocked' : 'error')
        },
      )
    }
    const handleError = () => { if (active) setStatus('error') }
    video.addEventListener('canplay', play, { once: true })
    video.addEventListener('error', handleError)
    video.load()
    return () => {
      active = false
      video.removeEventListener('canplay', play)
      video.removeEventListener('error', handleError)
      video.pause()
    }
  }, [retryCount])

  const tapVideoToPlay = () => {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      void frameRef.current?.requestFullscreen().catch(() => undefined)
    }
    if (status === 'error') {
      finishedRef.current = false
      setStatus('loading')
      setRetryCount((count) => count + 1)
      return
    }
    void video.play().then(() => setStatus('playing'), () => setStatus('blocked'))
  }

  return (
    <section ref={frameRef} aria-labelledby="kg-level-6-video-title" style={{ position: 'fixed', inset: 0, zIndex: 9999, width: '100vw', height: '100dvh', overflow: 'hidden', background: '#000' }}>
      <h2 id="kg-level-6-video-title" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>Level 6 · Vowel Garden introduction</h2>
      <video
        ref={videoRef}
        src={VIDEO_URL}
        playsInline
        preload="metadata"
        muted={false}
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(event) => event.preventDefault()}
        aria-label="KG Level 6 vowel introduction video. Tap the video to start if playback is blocked."
        onClick={tapVideoToPlay}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tapVideoToPlay() } }}
        onPlay={() => setStatus('playing')}
        onEnded={finish}
        tabIndex={0}
        style={{ display: 'block', width: '100vw', height: '100dvh', objectFit: 'cover', background: '#000', cursor: 'pointer' }}
      >
        Your browser does not support video playback.
      </video>
      {status === 'loading' && <p role="status" style={{ position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)', color: '#fff', textAlign: 'center' }}>Loading Miss Julie’s video…</p>}
      {status === 'blocked' && <p role="status" style={{ position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)', color: '#fff', textAlign: 'center' }}>Tap the video to start Miss Julie’s lesson.</p>}
      {status === 'error' && <p role="alert" style={{ position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)', color: '#fff', textAlign: 'center' }}>The video could not load. Tap it to try again.</p>}
    </section>
  )
}

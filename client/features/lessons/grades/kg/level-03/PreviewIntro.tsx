'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCw } from 'lucide-react'
import { canCompleteIntroVideo } from './level3-flow'
import './level-03.css'

const INTRO_VIDEO =
  '/lessons/kg/level-03/K%20to%20P%20Untitled_Scene_10-16_08_25_20_20261016142423.mp4'
const VIDEO_BUFFER_TIMEOUT_MS = 15_000
type PlaybackState = 'loading' | 'playing' | 'paused' | 'blocked' | 'error'

export function Level3PreviewIntro({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [playback, setPlayback] = useState<PlaybackState>('loading')
  const [videoError, setVideoError] = useState('')
  const [videoAttempt, setVideoAttempt] = useState(0)
  const [fullscreenFallback, setFullscreenFallback] = useState(false)
  const frameRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playbackRef = useRef<PlaybackState>('loading')
  const completionHandledRef = useRef(false)
  const playbackAttemptRef = useRef(0)
  const maximumTimeRef = useRef(0)
  const lastValidTimeRef = useRef(0)
  const bufferTimerRef = useRef<number | undefined>(undefined)

  const updatePlayback = useCallback((next: PlaybackState) => {
    playbackRef.current = next
    setPlayback(next)
  }, [])

  const clearBufferTimeout = useCallback(() => {
    if (bufferTimerRef.current !== undefined) window.clearTimeout(bufferTimerRef.current)
    bufferTimerRef.current = undefined
  }, [])

  const scheduleBufferTimeout = useCallback(() => {
    if (bufferTimerRef.current !== undefined) return
    bufferTimerRef.current = window.setTimeout(() => {
      bufferTimerRef.current = undefined
      if (playbackRef.current !== 'loading') return
      setVideoError('The introduction is taking a while to load. Check your connection and try again.')
      updatePlayback('error')
    }, VIDEO_BUFFER_TIMEOUT_MS)
  }, [updatePlayback])

  const startVideo = useCallback(async () => {
    const frame = frameRef.current
    const video = videoRef.current
    if (!frame || !video || completionHandledRef.current) return

    const attempt = ++playbackAttemptRef.current
    setVideoError('')
    updatePlayback('loading')
    clearBufferTimeout()
    scheduleBufferTimeout()

    if (frame.requestFullscreen && document.fullscreenElement !== frame) {
      try {
        void frame.requestFullscreen({ navigationUI: 'hide' })
          .catch(() => setFullscreenFallback(true))
      } catch {
        setFullscreenFallback(true)
      }
    } else if (!frame.requestFullscreen) {
      setFullscreenFallback(true)
    }

    try {
      await video.play()
      if (attempt === playbackAttemptRef.current && !completionHandledRef.current) {
        clearBufferTimeout()
        updatePlayback('playing')
      }
    } catch {
      if (attempt === playbackAttemptRef.current && !completionHandledRef.current) {
        setVideoError('Your browser needs a tap before it can play this introduction.')
        updatePlayback('blocked')
      }
    }
  }, [clearBufferTimeout, scheduleBufferTimeout, updatePlayback])

  useEffect(() => {
    void startVideo()
  }, [startVideo, videoAttempt])

  useEffect(() => {
    const htmlOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
    }
  }, [])

  useEffect(() => () => {
    clearBufferTimeout()
    videoRef.current?.pause()
    if (document.fullscreenElement === frameRef.current) {
      void document.exitFullscreen?.().catch(() => undefined)
    }
  }, [clearBufferTimeout])

  const retryVideo = () => {
    playbackAttemptRef.current++
    completionHandledRef.current = false
    maximumTimeRef.current = 0
    lastValidTimeRef.current = 0
    clearBufferTimeout()
    setVideoError('')
    updatePlayback('loading')
    setVideoAttempt((attempt) => attempt + 1)
  }

  const handleWaiting = () => {
    updatePlayback('loading')
    scheduleBufferTimeout()
  }

  return (
    <main
      className="kg-intro-cinema kg-level3-intro"
      ref={frameRef}
      aria-label="Level 3 introductory video"
    >
      <div className="kg-level3-intro__video-frame">
        <video
            key={videoAttempt}
            ref={videoRef}
            src={INTRO_VIDEO}
            playsInline
            preload="metadata"
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload noplaybackrate noremoteplayback"
            onContextMenu={(event) => event.preventDefault()}
            onSeeking={() => {
              const video = videoRef.current
              if (video && video.currentTime > maximumTimeRef.current + 1.25) {
                video.currentTime = lastValidTimeRef.current
              }
            }}
            onRateChange={() => {
              if (videoRef.current && videoRef.current.playbackRate !== 1) videoRef.current.playbackRate = 1
            }}
            onTimeUpdate={() => {
              const video = videoRef.current
              if (!video || video.seeking) return
              if (video.currentTime > maximumTimeRef.current + 1.25) {
                video.currentTime = lastValidTimeRef.current
                return
              }
              maximumTimeRef.current = Math.max(maximumTimeRef.current, video.currentTime)
              lastValidTimeRef.current = video.currentTime
            }}
            onPlay={() => updatePlayback('playing')}
            onPlaying={() => {
              clearBufferTimeout()
              setVideoError('')
              updatePlayback('playing')
            }}
            onWaiting={handleWaiting}
            onStalled={handleWaiting}
            onPause={() => {
              const video = videoRef.current
              if (video && !video.ended && playbackRef.current === 'playing') updatePlayback('paused')
            }}
            onEnded={() => {
              const video = videoRef.current
              if (completionHandledRef.current || !video ||
                  !canCompleteIntroVideo(video, maximumTimeRef.current)) {
                if (!completionHandledRef.current) {
                  setVideoError('The introduction did not finish. Replay it to continue.')
                  updatePlayback('error')
                }
                return
              }
              completionHandledRef.current = true
              clearBufferTimeout()
              if (document.fullscreenElement === frameRef.current) {
                void document.exitFullscreen?.().catch(() => undefined)
              }
              onComplete()
            }}
            onError={() => {
              clearBufferTimeout()
              setVideoError('The lesson video could not load. Check the connection and try again.')
              updatePlayback('error')
            }}
            aria-label="Introduction video for letters K to P"
        />
      </div>
      {playback !== 'playing' || videoError ? (
        <div className="kg-level3-intro__recovery" aria-live="polite">
          {videoError ? <p role="alert">{videoError}</p> :
            playback === 'paused' ? <p>The introduction is paused. Resume to continue watching.</p> :
              playback === 'loading' ? <p role="status">Loading the introduction…</p> : null}
          {fullscreenFallback ? <p role="status">Continuing in the full-screen page view; browser fullscreen is unavailable.</p> : null}
          {playback === 'blocked' || playback === 'paused'
            ? <button type="button" onClick={() => void startVideo()}><RotateCw size={18} /> {playback === 'paused' ? 'Resume introduction' : 'Play introduction'}</button>
            : null}
          {playback === 'error'
            ? <button type="button" onClick={retryVideo}><RotateCw size={18} /> Try video again</button>
            : null}
        </div>
      ) : null}
    </main>
  )
}

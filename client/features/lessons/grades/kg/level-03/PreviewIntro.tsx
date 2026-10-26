'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, RotateCw, Sparkles } from 'lucide-react'
import { canCompleteIntroVideo, LEVEL3_LETTERS, type Letter } from './level3-flow'
import './level-03.css'

const INTRO_VIDEO =
  '/lessons/kg/level-03/K%20to%20P%20Untitled_Scene_10-16_08_25_20_20261016142423.mp4'
const VIDEO_BUFFER_TIMEOUT_MS = 15_000
type PlaybackState = 'loading' | 'playing' | 'paused' | 'blocked' | 'error'

export function Level3PreviewIntro({
  onSelectLetter,
  onPreviewBack,
}: {
  onSelectLetter: (letter: Letter) => void
  onPreviewBack?: () => void
}) {
  const [view, setView] = useState<'story' | 'selection'>('story')
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

  const startVideo = useCallback(async (userInitiated = false) => {
    const frame = frameRef.current
    const video = videoRef.current
    if (!frame || !video || completionHandledRef.current) return

    const attempt = ++playbackAttemptRef.current
    setVideoError('')
    updatePlayback('loading')
    clearBufferTimeout()
    scheduleBufferTimeout()

    if (userInitiated && frame.requestFullscreen && document.fullscreenElement !== frame) {
      try {
        void frame.requestFullscreen({ navigationUI: 'hide' })
          .catch(() => setFullscreenFallback(true))
      } catch {
        setFullscreenFallback(true)
      }
    } else if (userInitiated && !frame.requestFullscreen) {
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

  if (view === 'story') {
    return (
      <main
        className={`kg-intro-cinema kg-level3-intro ${playback === 'playing' ? 'is-video-playing' : ''}`}
        ref={frameRef}
        aria-label="Level 3 staff preview introduction"
      >
        <header className="kg-level3-intro__header">
          <span><Sparkles size={18} /> TALKORA · STAFF PREVIEW</span>
          <span>LEVEL 3 · LETTERS K–P</span>
        </header>
        <div className="kg-level3-intro__title">
          <span>FULL INTRODUCTION</span>
          <h1>Letters K to P</h1>
          <p>Watch Miss Julie&apos;s complete introduction before choosing a letter.</p>
        </div>
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
                  setVideoError('The full introduction did not finish. Replay it to unlock the letters.')
                  updatePlayback('error')
                }
                return
              }
              completionHandledRef.current = true
              clearBufferTimeout()
              setView('selection')
              if (document.fullscreenElement === frameRef.current) {
                void document.exitFullscreen?.().catch(() => undefined)
              }
            }}
            onError={() => {
              clearBufferTimeout()
              setVideoError('The lesson video could not load. Check the connection and try again.')
              updatePlayback('error')
            }}
            aria-label="Full-screen introduction video for letters K to P"
          />
        </div>
        {playback !== 'playing' || videoError ? (
          <div className="kg-level3-intro__recovery" aria-live="polite">
            {videoError ? <p role="alert">{videoError}</p> :
              playback === 'paused' ? <p>The introduction is paused. Resume to continue watching.</p> :
                playback === 'loading' ? <p role="status">Loading the introduction…</p> : null}
            {fullscreenFallback ? <p role="status">Continuing in the full-screen page view; browser fullscreen is unavailable.</p> : null}
            {playback === 'blocked' || playback === 'paused'
              ? <button type="button" onClick={() => void startVideo(true)}><RotateCw size={18} /> {playback === 'paused' ? 'Resume introduction' : 'Play introduction'}</button>
              : null}
            {playback === 'error'
              ? <button type="button" onClick={retryVideo}><RotateCw size={18} /> Try video again</button>
              : null}
          </div>
        ) : null}
      </main>
    )
  }

  return (
    <main className="kg-level3-selection" aria-label="Choose a Level 3 letter">
      <header className="kg-level3-selection__header">
        {onPreviewBack
          ? <button type="button" onClick={onPreviewBack}><ArrowLeft size={17} /> Preview list</button>
          : <span />}
        <span><Sparkles size={15} /> STAFF-ONLY DRAFT</span>
      </header>
      <section className="kg-level3-selection__card" aria-label="Select a letter activity">
        <span className="kg-level3-selection__eyebrow"><Sparkles size={17} /> INTRODUCTION COMPLETE</span>
        <h1>Which letter would you like to explore?</h1>
        <p>Choose a letter. Miss Julie will introduce it and then ask you to say its name.</p>
        <div className="kg-level3-letter-options">
          {LEVEL3_LETTERS.map((letter, index) => (
            <button type="button" key={letter} onClick={() => onSelectLetter(letter)} aria-label={`Open letter ${letter} activity`}>
              <span>{letter}</span>
              <small>{index + 1} of {LEVEL3_LETTERS.length}</small>
            </button>
          ))}
        </div>
        <p className="kg-level3-selection__note">No student progress or speech attempts are saved in this preview.</p>
      </section>
    </main>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, RotateCcw, Sparkles } from 'lucide-react'
import { requestClass1Fullscreen } from './class1-fullscreen'
import { voiceService } from '@/services/voice-service'

/** This reviewed 90-second video is delivered separately from the application. */
export const CLASS1_FIRST_DAY_VIDEO = process.env.NEXT_PUBLIC_TALKORA_CLASS1_INTRO_URL?.trim() ||
  '/lessons/class-01/level-01/miss-julie-first-day-intro.mp4'

export const CLASS1_FIRST_DAY_VIDEO_BUNDLED = '/lessons/class-01/level-01/miss-julie-first-day-intro.mp4'

const MIN_DURATION_SECONDS = 87
const MAX_DURATION_SECONDS = 93
const REQUIRED_WATCH_SECONDS = 85

export function Class1LessonIntro({ onAvailable, onDone, firstDayOnly = false, approvedVideoUrl }: {
  onAvailable: () => void
  onDone: () => void
  firstDayOnly?: boolean
  approvedVideoUrl?: string
}) {
  // The reviewed video source can travel with the authenticated v3/v4
  // lesson, avoiding a new Next.js build or an administrator permission gate.
  // A video explicitly reviewed and pinned by the developer may use
  // our *exact* same-origin shipped MP4. Keep all other relative paths
  // forbidden so an old/placeholder chapter cannot silently sneak in.
  const candidate = approvedVideoUrl?.trim() ||
    process.env.NEXT_PUBLIC_TALKORA_CLASS1_INTRO_URL?.trim() || ''
  const reviewedSource = candidate === CLASS1_FIRST_DAY_VIDEO_BUNDLED ||
    /^https:\/\//.test(candidate)
    ? candidate : ''
  const sourceReady = !firstDayOnly || Boolean(reviewedSource)
  const videoSource = firstDayOnly ? reviewedSource : CLASS1_FIRST_DAY_VIDEO
  const frame = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const watchedUntil = useRef(0)
  const fullscreenActive = useRef(false)
  const [canPlay, setCanPlay] = useState(false)
  const [needsTap, setNeedsTap] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sourceReady) {
      setLoading(false)
      setCanPlay(false)
      setError("Miss Julie's First Day story is not available yet. Please check again after the Talkora media update.")
    }
  }, [sourceReady])

  useEffect(() => {
    function pauseWhenHidden() {
      if (document.hidden) {
        video.current?.pause()
        setNeedsTap(true)
      }
    }

    function pauseWhenFullscreenEnds() {
      const fullscreenTarget = frame.current?.closest<HTMLElement>('[data-class1-immersion]') || frame.current
      const isFullscreen = document.fullscreenElement === fullscreenTarget
      if (isFullscreen) {
        fullscreenActive.current = true
      } else if (fullscreenActive.current) {
        fullscreenActive.current = false
        video.current?.pause()
        setNeedsTap(true)
      }
    }

    document.addEventListener('visibilitychange', pauseWhenHidden)
    document.addEventListener('fullscreenchange', pauseWhenFullscreenEnds)
    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden)
      document.removeEventListener('fullscreenchange', pauseWhenFullscreenEnds)
      video.current?.pause()
    }
  }, [])

  function validateVideo() {
    const duration = video.current?.duration ?? NaN
    if (!Number.isFinite(duration) || duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS) {
      setError('The First Day introduction must be a complete 90-second video with sound.')
      setCanPlay(false)
      setLoading(false)
      return
    }
    if (watchedUntil.current > 0 && video.current) {
      video.current.currentTime = Math.min(watchedUntil.current, duration)
    }
    setCanPlay(true)
    setLoading(false)
    setError('')
    onAvailable()
  }

  async function begin() {
    if (!canPlay || !video.current || !frame.current) return
    try {
      // Fullscreen is an enhancement; school browser policies can reject it.
      // Request it for the WHOLE lesson, so fullscreen survives the intro video.
      const fullscreenTarget = frame.current.closest<HTMLElement>('[data-class1-immersion]') || frame.current
      // All gesture-sensitive calls begin before any await. A fullscreen
      // promise may otherwise consume the activation needed by speech audio.
      const fullscreen = requestClass1Fullscreen(fullscreenTarget)
      const unlockAudio = voiceService.unlockPlayback()
      video.current.muted = false
      const startedVideo = video.current.play()
      fullscreenActive.current = await fullscreen
      await startedVideo
      await unlockAudio.catch(() => false)
      setNeedsTap(false)
      setError('')
    } catch {
      video.current?.pause()
      setNeedsTap(true)
      setError('The story could not start. Check sound permissions on this computer and tap Play again.')
    }
  }

  function finish() {
    if (video.current?.muted || watchedUntil.current < REQUIRED_WATCH_SECONDS) {
      video.current?.pause()
      setNeedsTap(true)
      setError("Let's finish the complete story with sound before we start practising.")
      return
    }
    if (document.fullscreenElement === frame.current) void document.exitFullscreen?.().catch(() => undefined)
    onDone()
  }

  function retryVideo() {
    if (!video.current) return
    setError('')
    setCanPlay(false)
    setLoading(true)
    setNeedsTap(true)
    video.current.load()
  }

  return <div ref={frame} className="class1-intro-overlay" role="dialog" aria-modal="true" aria-label="Miss Julie Class 1 first day story">
    <div className="class1-intro-card">
      <div className="class1-intro-heading">
        <span><Sparkles size={20} aria-hidden="true" /> First, a little story with Miss Julie</span>
        <small>90-second welcome</small>
      </div>
      <video
        ref={video}
        className="class1-intro-video"
        src={videoSource || undefined}
        playsInline preload="metadata" controls={false}
        disablePictureInPicture controlsList="nodownload noplaybackrate noremoteplayback"
        aria-label="Reviewed 90-second Balbharati My First Day introduction"
        onLoadedMetadata={validateVideo}
        onTimeUpdate={(event) => {
          const player = event.currentTarget
          if (document.hidden || player.muted || player.seeking || player.paused) return
          if (player.currentTime <= watchedUntil.current + 1.5) {
            watchedUntil.current = Math.max(watchedUntil.current, player.currentTime)
          }
        }}
        onSeeking={(event) => {
          if (event.currentTarget.currentTime > watchedUntil.current + 0.5) {
            event.currentTarget.currentTime = watchedUntil.current
          }
        }}
        onEnded={finish}
        onError={() => {
          setCanPlay(false)
          setLoading(false)
          setError("Miss Julie's First Day video could not load. Please try again after checking the internet connection.")
        }}
      />
      {loading ? <p className="class1-intro-status" role="status">Getting Miss Julie's story ready...</p> : null}
      {error ? <div className="class1-intro-error" role="alert"><p>{error}</p><button type="button" onClick={retryVideo} disabled={!sourceReady}><RotateCcw size={16} /> Try loading again</button></div> : null}
      {needsTap && canPlay ? <div className="class1-intro-play-prompt">
        <p>Watch the whole story with sound. Then we will practise school actions and English with Miss Julie.</p>
        <button type="button" onClick={() => void begin()}><Play size={18} fill="currentColor" /> Play story</button>
      </div> : null}
    </div>
  </div>
}

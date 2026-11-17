'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, RotateCcw, Sparkles } from 'lucide-react'
import { voiceService } from '@/services/voice-service'
import { beginFirstDayIntro, completeFirstDayIntro } from '@/services/class1-intro-service'

/** The bundled introduction can be overridden by a reviewed hosted video. */
export const CLASS1_FIRST_DAY_VIDEO = process.env.NEXT_PUBLIC_TALKORA_CLASS1_INTRO_URL?.trim() ||
  '/lessons/class-01/level-01/miss-julie-first-day-intro.mp4'

export const CLASS1_FIRST_DAY_VIDEO_BUNDLED = '/lessons/class-01/level-01/miss-julie-first-day-intro.mp4'

const MIN_DURATION_SECONDS = 87
const BUNDLED_DURATION_SECONDS = 40.908798
const MAX_DURATION_SECONDS = 93
const REQUIRED_WATCH_SECONDS = 85

export function Class1LessonIntro({ onAvailable, onDone, firstDayOnly = false, approvedVideoUrl, lessonId }: {
  onAvailable: () => void
  onDone: () => void
  firstDayOnly?: boolean
  approvedVideoUrl?: string
  lessonId?: string
}) {
  // The reviewed video source can travel with the authenticated v3/v4
  // lesson, avoiding a new Next.js build or an administrator permission gate.
  // A video explicitly reviewed and pinned by the developer may use
  // our *exact* same-origin shipped MP4. Keep all other relative paths
  // forbidden so an old/placeholder chapter cannot silently sneak in.
  const candidate = approvedVideoUrl?.trim() ||
    process.env.NEXT_PUBLIC_TALKORA_CLASS1_INTRO_URL?.trim() || CLASS1_FIRST_DAY_VIDEO_BUNDLED
  const reviewedSource = candidate === CLASS1_FIRST_DAY_VIDEO_BUNDLED ||
    /^https:\/\//.test(candidate)
    ? candidate : ''
  const sourceReady = !firstDayOnly || Boolean(reviewedSource)
  const videoSource = firstDayOnly ? reviewedSource : CLASS1_FIRST_DAY_VIDEO
  const bundledVideo = videoSource === CLASS1_FIRST_DAY_VIDEO_BUNDLED
  const frame = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const watchedUntil = useRef(0)
  const fullscreenActive = useRef(false)
  const [canPlay, setCanPlay] = useState(false)
  // Show a tap only when the browser actually blocks sound-on autoplay.
  const [needsTap, setNeedsTap] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playbackId, setPlaybackId] = useState<string | null>(null)
  const [introRetry, setIntroRetry] = useState(0)
  const completing = useRef(false)

  useEffect(() => {
    if (!firstDayOnly || !sourceReady) return
    let live = true
    setPlaybackId(null)
    void beginFirstDayIntro(lessonId || '').then(result => {
      if (live) setPlaybackId(result.playbackId)
    }).catch(() => {
      if (live) { setError('Your story could not open. Please try again.'); setLoading(false) }
    })
    return () => { live = false }
  }, [firstDayOnly, lessonId, sourceReady, introRetry])

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
      } else {
        void video.current?.play().catch(() => setNeedsTap(true))
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
    if (!Number.isFinite(duration) || (bundledVideo
      ? Math.abs(duration - BUNDLED_DURATION_SECONDS) > 1
      : duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS)) {
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
    onAvailable()
  }

  // Wait for media validation and the server ticket before autoplay.
  useEffect(() => {
    if (!sourceReady || !canPlay || error || (firstDayOnly && !playbackId)) return
    const player = video.current
    if (!player) return
    if (document.hidden) {
      setNeedsTap(true)
      return
    }
    let cancelled = false
    player.muted = false
    player.volume = 1
    void player.play().then(() => {
      if (!cancelled && !player.paused && !document.hidden) setNeedsTap(false)
    }).catch(async () => {
      if (cancelled) return
      // Browsers allow muted autoplay even when sound needs a gesture.
      player.muted = true
      try {
        await player.play()
        if (!cancelled) setNeedsTap(true)
      } catch {
        if (!cancelled) setError('The story could not start. Please try loading again.')
      }
    })
    return () => { cancelled = true }
  }, [canPlay, error, firstDayOnly, playbackId, sourceReady, videoSource, introRetry])

  async function enableSound() {
    if (!video.current) return
    video.current.muted = false
    void voiceService.unlockPlayback().catch(() => false)
    try {
      await video.current.play()
      setNeedsTap(false)
    } catch {
      video.current.muted = true
      void video.current.play().catch(() => undefined)
    }
  }

  async function finish() {
    if (completing.current) return
    if (watchedUntil.current < (bundledVideo ? BUNDLED_DURATION_SECONDS - 1 : REQUIRED_WATCH_SECONDS)) {
      video.current?.pause()
      setNeedsTap(true)
      setError("Let's finish the complete story before we start practising.")
      return
    }
    completing.current = true
    setLoading(true)
    try {
      if (firstDayOnly) await completeFirstDayIntro(lessonId || '', playbackId || '')
      if (document.fullscreenElement === frame.current) void document.exitFullscreen?.().catch(() => undefined)
      onDone()
    } catch {
      completing.current = false
      setNeedsTap(true)
      setError('Your completed story could not be saved. Please try again before we practise.')
    } finally { setLoading(false) }
  }

  function retryVideo() {
    if (!video.current) return
    setError('')
    setCanPlay(false)
    setLoading(true)
    setNeedsTap(false)
    watchedUntil.current = 0
    completing.current = false
    setPlaybackId(null)
    setIntroRetry(attempt => attempt + 1)
    video.current.load()
  }

  return <div ref={frame} className="class1-intro-overlay" role="dialog" aria-modal="true" aria-label="Miss Julie Class 1 first day story">
    <div className="class1-intro-card">
      <div className="class1-intro-heading">
        <span><Sparkles size={20} aria-hidden="true" /> First, a little story with Miss Julie</span>
        <small>Welcome story</small>
      </div>
      <video
        ref={video}
        className="class1-intro-video"
        src={videoSource || undefined}
        playsInline preload="auto" controls={false}
        disablePictureInPicture controlsList="nodownload noplaybackrate noremoteplayback"
        aria-label="Balbharati My First Day introduction"
        onLoadedMetadata={validateVideo}
        onTimeUpdate={(event) => {
          const player = event.currentTarget
          if (document.hidden || player.seeking || player.paused) return
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
      {loading || (firstDayOnly && !playbackId && !error) ? <p className="class1-intro-status" role="status">Getting Miss Julie's story ready...</p> : null}
      {error ? <div className="class1-intro-error" role="alert"><p>{error}</p><button type="button" onClick={retryVideo} disabled={!sourceReady}><RotateCcw size={16} /> Try loading again</button></div> : null}
      {needsTap && canPlay && (!firstDayOnly || playbackId) ? <div className="class1-intro-play-prompt">
        <p>The story is playing. Tap to turn on sound.</p>
        <button type="button" onClick={() => void enableSound()}><Volume2 size={18} /> Turn on sound</button>
      </div> : null}
    </div>
  </div>
}

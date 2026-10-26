'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, SkipForward, Sparkles } from 'lucide-react'

const lessonKeyPattern = /^kg-g0-u[1-8]-l[1-3]$/

const MANDATORY_FIRST_LESSON = 'kg-g0-u1-l1'
const LEVEL_4_LESSON_KEY = 'kg-g0-u4-l1'

const FULL_VIDEO = '/kg/videos/fullkg.mp4'
const LEVEL_4_VIDEO =
  '/lessons/kg/level-04/animal-sounds-intro.mp4'

const REQUIRED_WATCH_SECONDS = 60
const LEVEL_4_REQUIRES_FULLSCREEN = false

function isMandatoryIntro(lessonKey: string) {
  return (
    lessonKey === MANDATORY_FIRST_LESSON ||
    lessonKey === LEVEL_4_LESSON_KEY
  )
}


async function findAvailableSources(lessonKey: string): Promise<string[]> {
  const extensions = ['webm', 'mp4']

  const checks = await Promise.all(
    extensions.map(async (extension) => {
      const controller = new AbortController()
      const timeout = window.setTimeout(
        () => controller.abort(),
        1100,
      )

      try {
        const source = `/kg/lesson-intros/${lessonKey}.${extension}`

        const response = await fetch(source, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        })

        return response.ok ? source : null
      } catch {
        return null
      } finally {
        window.clearTimeout(timeout)
      }
    }),
  )

  return checks.filter(
    (source): source is string => Boolean(source),
  )
}


/** Legacy/general lesson introductions. KG Level 1 always requires the complete
 * 60+ second clip in fullscreen, without an in-app skip. Actual ABCD progression
 * is separately verified by the /kg-alphabet authenticated controller.
 * F11/Esc cannot be locked by webpages: deploy managed browser kiosk mode.
 */
export function KGLessonIntro({
  lessonKey, replayRequest, onAvailable, onDone,
}: {
  lessonKey: string
  replayRequest: number
  onAvailable: () => void
  onDone: () => void
}) {
const mandatory = isMandatoryIntro(lessonKey)
  const frame = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const maxWatched = useRef(0)
  const [sources, setSources] = useState<string[]>([])
  const [sourceIndex, setSourceIndex] = useState(0)
  const [needsTap, setNeedsTap] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    maxWatched.current = 0
    if (!lessonKeyPattern.test(lessonKey)) {
      onDone()
      return () => { alive = false }
    }
    async function prepare() {
      let seen = false
      if (!mandatory) {
        try { seen = replayRequest === 0 && localStorage.getItem(`talkora:kg-intro:${lessonKey}`) === 'seen' } catch { /* storage optional */ }
      }

const available =
  lessonKey === LEVEL_4_LESSON_KEY
    ? [LEVEL_4_VIDEO]
    : mandatory
      ? [FULL_VIDEO]
      : await findAvailableSources(lessonKey)

      if (!alive) return
      if (!available.length) { onDone(); return } // Only OPTIONAL intros can be absent.
      onAvailable()
      if (seen) { onDone(); return }
      setError(''); setSources(available); setSourceIndex(0); setNeedsTap(mandatory)
    }
    void prepare()
    return () => { alive = false }
  }, [lessonKey, replayRequest, onAvailable, onDone, mandatory])

  useEffect(() => {
    if (!sources.length || !video.current || mandatory) return
    void video.current.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true))
  }, [sources, sourceIndex, mandatory])

  useEffect(() => {
    if (!mandatory) return
    const pauseWithoutFullscreen = () => {
      if (document.fullscreenElement !== frame.current && video.current && !video.current.paused) {
        video.current.pause()
        setNeedsTap(true)
        setError('Return to fullscreen to finish Miss Julie’s story.')
      }
    }
    const pauseWhenHidden = () => {
      if (document.hidden) { video.current?.pause(); setNeedsTap(true) }
    }
    document.addEventListener('fullscreenchange', pauseWithoutFullscreen)
    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => {
      document.removeEventListener('fullscreenchange', pauseWithoutFullscreen)
      document.removeEventListener('visibilitychange', pauseWhenHidden)
    }
  }, [mandatory])

  function markIntroSeen() {
    if (mandatory) return // No local storage bypass for KG1.
    try { localStorage.setItem(`talkora:kg-intro:${lessonKey}`, 'seen') } catch { /* optional */ }
  }
  function finishIntro() {

const requiresFullscreen =
  lessonKey === MANDATORY_FIRST_LESSON ||
  (mandatory && LEVEL_4_REQUIRES_FULLSCREEN)

if (mandatory) {
  const watchedEnough =
    lessonKey === LEVEL_4_LESSON_KEY
      ? video.current?.ended === true
      : maxWatched.current >= REQUIRED_WATCH_SECONDS

  const fullscreenOkay =
    !requiresFullscreen ||
    document.fullscreenElement === frame.current

  if (!watchedEnough || !fullscreenOkay) {
    setError(
      lessonKey === LEVEL_4_LESSON_KEY
        ? 'Please watch the complete video before starting your lesson.'
        : 'Watch the full story in fullscreen before starting your lesson.',
    )
    video.current?.pause()
    setNeedsTap(true)
    return
  }
}

    video.current?.pause()
    markIntroSeen()
    onDone()
    if (mandatory && document.fullscreenElement === frame.current) void document.exitFullscreen?.().catch(() => undefined)
  }
  async function startVideo() {
    const player = video.current
    if (!player) return
    try {
      if (mandatory) {
        if (!frame.current?.requestFullscreen) throw new Error('Fullscreen is unavailable in this browser')
        if (document.fullscreenElement !== frame.current) await frame.current.requestFullscreen()
      }
      await player.play()
      setNeedsTap(false); setError('')
    } catch {
      setNeedsTap(true)
      setError(mandatory ? 'Fullscreen playback is required. Use a supported browser or school kiosk.' : 'Tap Play to try again.')
    }
  }
  function handleVideoError() {
    if (mandatory) {
      setError('The compulsory story video is unavailable. Ask your teacher for help.')
      setNeedsTap(false)
      return // Fail closed. Do not open the lesson if the intro fails.
    }
    if (sourceIndex + 1 < sources.length) { setSourceIndex((current) => current + 1); setNeedsTap(false) }
    else finishIntro()
  }

  return <div ref={frame} className="kg-intro-overlay" role="dialog" aria-modal="true" aria-label="Miss Julie lesson introduction">
    <div className="kg-intro-card">
      <div className="kg-intro-heading">
        <span><Sparkles size={18} aria-hidden="true" /> {mandatory ? 'Watch the complete ABCD story' : 'A little story with Miss Julie'}</span>
        {!mandatory ? <button type="button" onClick={finishIntro} aria-label="Skip optional introduction"><SkipForward size={17} /> Skip</button> : null}
      </div>
      {sources.length ? <video
        ref={video} key={sources[sourceIndex]} className="kg-intro-video"
        src={sources[sourceIndex]} playsInline preload={mandatory ? 'auto' : 'metadata'}
        controls={false} disablePictureInPicture controlsList="nodownload noplaybackrate noremoteplayback"
        onTimeUpdate={(event) => {
          if (!mandatory) return
          const player = event.currentTarget
          if (document.fullscreenElement === frame.current && !player.seeking && player.currentTime <= maxWatched.current + 1.4) {
            maxWatched.current = Math.max(maxWatched.current, player.currentTime)
          }
        }}
        onSeeking={(event) => {
          if (mandatory && event.currentTarget.currentTime > maxWatched.current + 0.5) event.currentTarget.currentTime = maxWatched.current
        }}
        onEnded={finishIntro} onError={handleVideoError}
        aria-label="Short lesson story with Miss Julie"
      /> : <div className="kg-intro-checking" role="status"><Sparkles size={24} /> Miss Julie is getting ready…</div>}
      {error ? <p role="alert" style={{ color: '#b91c1c', padding: 12 }}>{error}</p> : null}
      {needsTap && sources.length ? <div className="kg-intro-play-prompt"><p>{mandatory ? 'Tap to watch all 60 seconds in fullscreen.' : 'Tap to play the short story.'}</p>
        <button type="button" onClick={() => void startVideo()}><Play size={18} fill="currentColor" /> {mandatory ? 'Enter fullscreen and play' : 'Play intro'}</button>
      </div> : null}
    </div>
  </div>
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { LoaderCircle, Mic, Play, RotateCw, Sparkles } from 'lucide-react'
import { requestKGMicrophone } from '@/lib/kg-microphone'
import { watchVoiceActivity } from '@/lib/voice-activity'
import { AnimatedMissJulie } from '../level-01/components/AnimatedMissJulie'
import '../level-01/styles/kg-alphabet.css'
import '../level-01/styles/kg-level1-polish.css'
import '../level-03/level-03.css'
import './level-04.css'
import type { LevelExperienceProps } from '../../../registry'
import {
  canCompleteIntroVideo,
  createSubmissionGate,
  LEVEL4_LETTERS,
  microphoneFailureMessage,
  resolveLevel4Attempt,
  type Level4Letter,
} from './level4-flow'
import { kgLevel4PreviewService } from './services/kg-level4-preview-service'

const INTRO_VIDEO = '/lessons/kg/level-04/animal-sounds-intro.mp4'
const WORDS: Record<Level4Letter, string> = {
  Q: 'Queen', R: 'Rabbit', S: 'Sun', T: 'Tiger', U: 'Umbrella', V: 'Van',
}
const PICTURES: Record<Level4Letter, string> = {
  Q: '👑', R: '🐇', S: '☀️', T: '🐯', U: '☂️', V: '🚐',
}
type VideoState = 'ready' | 'loading' | 'playing' | 'paused' | 'blocked' | 'error' | 'complete'
type Phase = 'narrating' | 'requesting' | 'listening' | 'checking' | 'feedback' | 'error' | 'finished'

export default function LevelExperience({ preview = false }: LevelExperienceProps) {
  const reducedMotion = useReducedMotion()
  const [videoState, setVideoState] = useState<VideoState>('ready')
  const [videoError, setVideoError] = useState('')
  const [videoAttempt, setVideoAttempt] = useState(0)
  const [letter, setLetter] = useState<Level4Letter>('Q')
  const [phase, setPhase] = useState<Phase>('narrating')
  const [feedback, setFeedback] = useState('')
  const [outcome, setOutcome] = useState<'correct' | 'incorrect' | 'unclear' | ''>('')
  const [attemptCycle, setAttemptCycle] = useState(0)
  const [fullscreenFallback, setFullscreenFallback] = useState(false)
  const frameRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const maximumTimeRef = useRef(0)
  const lastValidTimeRef = useRef(0)
  const completionRef = useRef(false)
  const playbackAttemptRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  const startVideo = useCallback(async () => {
    const video = videoRef.current
    const frame = frameRef.current
    if (!video || completionRef.current) return
    const attempt = ++playbackAttemptRef.current
    setVideoError('')
    setVideoState('loading')
    if (frame?.requestFullscreen && document.fullscreenElement !== frame) {
      try {
        void frame.requestFullscreen({ navigationUI: 'hide' }).catch(() => setFullscreenFallback(true))
      } catch { setFullscreenFallback(true) }
    } else if (!frame?.requestFullscreen) setFullscreenFallback(true)
    try {
      video.playbackRate = 1
      video.muted = false
      await video.play()
      if (attempt === playbackAttemptRef.current && !completionRef.current) setVideoState('playing')
    } catch {
      if (attempt === playbackAttemptRef.current && !completionRef.current) {
        setVideoError('Tap Play introduction to start the video with sound.')
        setVideoState('blocked')
      }
    }
  }, [])

  useEffect(() => {
    if (videoState === 'complete') return
    const handleFullscreenChange = () => {
      const video = videoRef.current
      if (!video || video.ended) return
      if (document.fullscreenElement !== frameRef.current && !video.paused) {
        video.pause()
        setVideoState('paused')
        setVideoError('Fullscreen was exited. Resume the introduction to continue.')
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [videoState])

  const beginTurn = useCallback(async () => {
    const controller = new AbortController()
    let active = true
    let stream: MediaStream | null = null
    let recorder: MediaRecorder | null = null
    let watcher: (() => void) | null = null
    let hardStop: number | undefined
    let speechDetected = false
    let vadAvailable = true
    let startedAt = 0
    const claimSubmission = createSubmissionGate()

    const release = () => {
      watcher?.()
      watcher = null
      if (hardStop !== undefined) window.clearTimeout(hardStop)
      stream?.getTracks().forEach((track) => track.stop())
      stream = null
    }
    const fail = (error: unknown) => {
      if (!active || controller.signal.aborted) return
      const message = error instanceof Error && error.message.includes('narration')
        ? 'Miss Julie could not play the prompt. Tap Try again.'
        : error instanceof Error && error.message.includes('feedback')
          ? 'Miss Julie could not play the feedback. Tap Try again.'
          : error instanceof Error && error.message.includes('recording failed')
            ? 'The recording stopped unexpectedly. Check the microphone and tap Try again.'
          : error instanceof Error && ['NotAllowedError', 'SecurityError', 'NotFoundError', 'NotReadableError', 'AbortError', 'NotSupportedError'].includes(error.name)
            ? microphoneFailureMessage(error)
            : 'The connection was interrupted. Check it, then tap Try again.'
      setFeedback(message)
      setPhase('error')
    }

    try {
      setFeedback('')
      setOutcome('')
      setPhase('narrating')
      if (!audioRef.current) audioRef.current = new Audio()
      await kgLevel4PreviewService.playIntroduction(letter, audioRef.current, controller.signal)
      if (!active) return () => undefined
      setPhase('requesting')
      stream = await requestKGMicrophone(controller.signal)
      if (!active) return () => undefined
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
        .find((type) => MediaRecorder.isTypeSupported(type)) || ''
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      const chunks: Blob[] = []
      speechDetected = false
      startedAt = performance.now()
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => {
        if (recorder) {
          recorder.onstop = null
          if (recorder.state === 'recording') recorder.stop()
        }
        release()
        recorderRef.current = null
        fail(new Error('Microphone recording failed'))
      }
      recorder.onstop = () => {
        if (!claimSubmission()) return
        const durationMs = Math.min(11900, Math.max(250, Math.round(performance.now() - startedAt)))
        const blob = new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' })
        release()
        recorderRef.current = null
        if (!active) return
        setPhase('checking')
        const noSpeech = (!speechDetected && vadAvailable) || blob.size < 800
        void kgLevel4PreviewService.submitAttempt({
          letter,
          audio: noSpeech ? undefined : blob,
          durationMs,
          noSpeech,
          signal: controller.signal,
        }).then(async (result) => {
          if (!active) return
          const transition = resolveLevel4Attempt(letter, result.outcome)
          setOutcome(result.outcome)
          setFeedback(transition.retry
            ? result.outcome === 'unclear' ? 'I could not hear that clearly. Let’s try again!' : `Good try! Say the letter ${letter} once more.`
            : transition.complete ? 'Wonderful! You explored Q through V!' : `Great job! Let’s meet the next letter.`)
          setPhase('feedback')
          if (!audioRef.current) audioRef.current = new Audio()
          await kgLevel4PreviewService.playFeedback(
            result.outcome === 'correct' ? 'great' : result.outcome === 'unclear' ? 'repeat' : 'try-again',
            audioRef.current,
            controller.signal,
          )
          if (!active) return
          if (transition.retry) setAttemptCycle((cycle) => cycle + 1)
          else if (transition.complete) setPhase('finished')
          else { setLetter(transition.letter); setAttemptCycle(0) }
        }).catch(fail)
      }
      recorder.start()
      setPhase('listening')
      watcher = watchVoiceActivity(stream, () => {
        if (recorder?.state === 'recording') recorder.stop()
      }, {
        silenceMs: 1100, minimumSpeechMs: 350, noSpeechTimeoutMs: 6500,
        speechThreshold: .017, resumeContext: true, sampleIntervalMs: 50,
        onSpeech: () => { speechDetected = true },
        onUnavailable: () => { vadAvailable = false },
      })
      hardStop = window.setTimeout(() => { if (recorder?.state === 'recording') recorder.stop() }, 12_000)
    } catch (error) {
      fail(error)
    }

    return () => {
      active = false
      controller.abort()
      if (recorder?.state === 'recording') recorder.stop()
      release()
      audioRef.current?.pause()
    }
  }, [attemptCycle, letter])

  useEffect(() => {
    if (videoState !== 'complete') return
    let cleanup: (() => void) | undefined
    let disposed = false
    void beginTurn().then((release) => {
      if (disposed) release()
      else cleanup = release
    })
    return () => {
      disposed = true
      cleanup?.()
    }
  }, [beginTurn, videoState])

  if (!preview) return <main className="kg-alpha kg-level3-blocked"><strong>Staff-only draft preview.</strong><span>This Level 4 lesson is not available to students.</span></main>
  if (videoState !== 'complete') {
    return <main className="kg-level3-intro kg-level4-intro" ref={frameRef} aria-label="Level 4 introductory video">
      <div className="kg-level3-intro__video-frame">
        <video
          key={videoAttempt} ref={videoRef} src={INTRO_VIDEO} playsInline preload="auto" controls={false}
          disablePictureInPicture disableRemotePlayback controlsList="nodownload noplaybackrate noremoteplayback"
          onContextMenu={(event) => event.preventDefault()} onKeyDown={(event) => event.preventDefault()}
          onRateChange={() => { if (videoRef.current) videoRef.current.playbackRate = 1 }}
          onTimeUpdate={() => {
            const video = videoRef.current
            if (!video || video.seeking) return
            if (video.currentTime > maximumTimeRef.current + 1.25) { video.currentTime = lastValidTimeRef.current; return }
            maximumTimeRef.current = Math.max(maximumTimeRef.current, video.currentTime)
            lastValidTimeRef.current = video.currentTime
          }}
          onPlaying={() => setVideoState('playing')}
          onWaiting={() => setVideoState('loading')}
          onPause={() => { if (videoRef.current && !videoRef.current.ended && videoState === 'playing') setVideoState('paused') }}
          onSeeking={() => { if (videoRef.current && videoRef.current.currentTime > maximumTimeRef.current + 1.25) videoRef.current.currentTime = lastValidTimeRef.current }}
          onEnded={() => {
            const video = videoRef.current
            if (!video || !canCompleteIntroVideo(video, maximumTimeRef.current)) {
              setVideoError('The introduction did not finish. Please play it again.')
              setVideoState('error')
              return
            }
            completionRef.current = true
            setVideoState('complete')
            if (document.fullscreenElement === frameRef.current) void document.exitFullscreen?.().catch(() => undefined)
          }}
          onError={() => { setVideoError('The lesson video could not load. Check the connection and try again.'); setVideoState('error') }}
          aria-label="Introduction video for letters Q to V"
        />
      </div>
      {videoState !== 'playing' || videoError ? <div className="kg-level3-intro__recovery" aria-live="polite">
        {videoError ? <p role="alert">{videoError}</p> : videoState === 'ready' ? <p>Watch the complete introduction with Miss Julie before practising Q–V.</p> : videoState === 'paused' ? <p>The introduction is paused. Resume it to continue.</p> : videoState === 'loading' ? <p role="status">Loading the introduction…</p> : null}
        {fullscreenFallback ? <p role="status">Fullscreen is unavailable; continuing in the full-screen page view.</p> : null}
        {videoState === 'ready' || videoState === 'blocked' || videoState === 'paused' ? <button type="button" onClick={() => void startVideo()}><Play size={18} /> Play introduction</button> : null}
        {videoState === 'error' ? <button type="button" onClick={() => { completionRef.current = false; maximumTimeRef.current = 0; lastValidTimeRef.current = 0; setVideoState('ready'); setVideoAttempt((value) => value + 1) }}><RotateCw size={18} /> Try video again</button> : null}
      </div> : null}
    </main>
  }

  const selectedIndex = LEVEL4_LETTERS.indexOf(letter)
  const characterState = phase === 'listening' ? 'listening' : phase === 'checking' ? 'thinking' : phase === 'finished' ? 'celebrating' : phase === 'feedback' ? outcome === 'correct' ? 'celebrating' : 'encouraging' : phase === 'error' ? 'encouraging' : 'speaking'
  return <main className="kg-alpha kg-alpha-play kg-level3-play kg-level4-play" data-phase={phase} aria-label="Staff preview of Level 4 letters Q to V">
    <header className="kg-alpha-play-top"><span /><div className="kg-alpha-progress-wrap" aria-label={`Letter ${selectedIndex + 1} of ${LEVEL4_LETTERS.length}`}><span>LEVEL 4 · Q–V</span><div className="kg-alpha-step-bar">{LEVEL4_LETTERS.map((item, index) => <i key={item} className={index < selectedIndex ? 'done' : index === selectedIndex ? 'current' : ''} />)}</div></div><span className="kg-alpha-level-pill"><Sparkles size={15} /> STAFF-ONLY DRAFT</span></header>
    <div className="kg-alpha-scene">
      <aside className="kg-alpha-teacher"><div className="kg-alpha-teacher-glow" aria-hidden="true" /><AnimatedMissJulie state={characterState} reducedMotion={Boolean(reducedMotion)} /><div className="kg-alpha-speech" role={phase === 'error' ? 'alert' : 'status'} aria-live="polite">{phase === 'finished' ? 'Wonderful! You explored letters Q through V.' : phase === 'feedback' ? feedback : phase === 'listening' ? `Your turn! Say the letter ${letter}.` : phase === 'checking' ? 'Let me hear that…' : phase === 'error' ? feedback : `Say the letter ${letter}.`}</div></aside>
      <section className="kg-alpha-quest kg-alpha-teaching-board"><AnimatePresence mode="wait"><motion.div key={letter} className="kg-alpha-learning kg-level3-learning" initial={reducedMotion ? false : { opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: .46 }}>
        <span className="kg-alpha-activity-label"><Sparkles size={17} /> EXPLORE THE LETTERS</span>
        <div className="kg-level4-letter-display"><div className="kg-alpha-letter-orb kg-level3-letter-orb" aria-label={`Letter ${letter}`}><span>{letter}</span><small>LETTER {letter}</small></div><div className="kg-level4-picture" aria-label={`${WORDS[letter]} picture`} role="img">{PICTURES[letter]}</div></div>
        <h1>Meet letter <strong>{letter}</strong></h1><p>{letter} for {WORDS[letter]}.</p><span className="kg-level3-letter-count">{selectedIndex + 1} of {LEVEL4_LETTERS.length}</span>
        {phase === 'narrating' || phase === 'requesting' || phase === 'checking' ? <div className="kg-alpha-status"><LoaderCircle className="kg-spin" size={19} /> {phase === 'narrating' ? 'Miss Julie is speaking…' : phase === 'requesting' ? 'Starting microphone…' : 'Checking your answer…'}</div> : null}
        {phase === 'listening' ? <button type="button" className="kg-mic-pulse" onClick={() => { if (recorderRef.current?.state === 'recording') recorderRef.current.stop() }} aria-label="Finish recording my answer"><Mic size={22} /><span>Done speaking</span></button> : null}
        {phase === 'error' ? <button type="button" className="kg-story-play" onClick={() => setAttemptCycle((value) => value + 1)}><RotateCw size={18} /> Try again</button> : null}
        {phase === 'feedback' || phase === 'finished' ? <div className="kg-alpha-status is-feedback" role="status">{feedback}</div> : null}
      </motion.div></AnimatePresence></section>
    </div>
  </main>
}

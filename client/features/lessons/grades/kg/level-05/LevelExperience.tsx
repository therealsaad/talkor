'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Check, LoaderCircle, Mic, Play, RotateCw, Sparkles, Volume2 } from 'lucide-react'
import { AnimatedMissJulie } from '../level-01/components/AnimatedMissJulie'
import { requestKGMicrophone } from '@/lib/kg-microphone'
import { watchVoiceActivity } from '@/lib/voice-activity'
import { createSubmissionGate, LEVEL5_LETTERS, microphoneFailureMessage, resolveLevel5Attempt, type Level5Letter } from './level5-flow'
import { kgLevel5PreviewService } from './services/kg-level5-preview-service'
import type { LevelExperienceProps } from '../../../registry'
import '../level-01/styles/kg-alphabet.css'
import '../level-01/styles/kg-level1-polish.css'
import './level-05.css'

const VIDEO = '/lessons/kg/level-05/W to Z Untitled_Scene_10-16_10_07_17_20261016160313.mp4'
const LESSONS: Record<Level5Letter, { word: string; picture: string; color: string }> = {
  W: { word: 'Wolf', picture: '/kg/pictures/level-5/wolf.jpg', color: '#4d9ed8' },
  X: { word: 'Xylophone', picture: '/kg/pictures/level-5/xylophone.jpg', color: '#e76b62' },
  Y: { word: 'Yak', picture: '/kg/pictures/level-5/Yak.jpg', color: '#d84e70' },
  Z: { word: 'Zebra', picture: '/kg/pictures/level-5/zebra.jpg', color: '#506b86' },
}
type Phase = 'narrating' | 'requesting' | 'listening' | 'checking' | 'feedback' | 'error' | 'finished'

export default function LevelExperience({ preview = false, previewStartLevel5Letter = 'W', onPreviewBack }: LevelExperienceProps) {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const initial = LEVEL5_LETTERS.includes(previewStartLevel5Letter as Level5Letter) ? previewStartLevel5Letter as Level5Letter : 'W'
  const [letter, setLetter] = useState<Level5Letter>(initial)
  const [phase, setPhase] = useState<Phase>('narrating')
  const [feedback, setFeedback] = useState('')
  const [outcome, setOutcome] = useState<'correct' | 'incorrect' | 'unclear' | ''>('')
  const [attemptCycle, setAttemptCycle] = useState(0)
  const [introComplete, setIntroComplete] = useState(false)
  const [introStatus, setIntroStatus] = useState<'loading' | 'ready' | 'playing' | 'blocked' | 'error'>('loading')
  const [introError, setIntroError] = useState('')
  const introCompletedRef = useRef(false)
  const introPlaybackAttemptRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const introVideoRef = useRef<HTMLVideoElement>(null)
  const lesson = LESSONS[letter]
  const index = LEVEL5_LETTERS.indexOf(letter)

  const startIntroduction = useCallback(async () => {
    const video = introVideoRef.current
    if (!video || introCompletedRef.current) return
    const attempt = ++introPlaybackAttemptRef.current
    setIntroError('')
    setIntroStatus('loading')
    try {
      video.muted = false
      await video.play()
      if (attempt === introPlaybackAttemptRef.current && !introCompletedRef.current) setIntroStatus('playing')
    } catch {
      if (attempt === introPlaybackAttemptRef.current && !introCompletedRef.current) setIntroStatus('blocked')
    }
  }, [])

  useEffect(() => {
    if (!preview || introComplete) return
    const video = introVideoRef.current
    if (video) void startIntroduction()
  }, [preview, introComplete, startIntroduction])

  const beginTurn = useCallback(async () => {
    const controller = new AbortController(); let active = true; let stream: MediaStream | null = null; let recorder: MediaRecorder | null = null
    let stopWatcher: (() => void) | null = null; let timer: number | undefined; let speechDetected = false; let vadAvailable = true; let startedAt = 0
    const claimSubmission = createSubmissionGate()
    const release = () => { stopWatcher?.(); stopWatcher = null; if (timer !== undefined) window.clearTimeout(timer); stream?.getTracks().forEach((track) => track.stop()); stream = null }
    const fail = (error: unknown) => {
      if (!active) return
      setFeedback(error instanceof Error && ['NotAllowedError','SecurityError','NotFoundError','NotReadableError','AbortError','NotSupportedError'].includes(error.name) ? microphoneFailureMessage(error) : 'Miss Julie could not finish that turn. Please try again.')
      setPhase('error')
    }
    try {
      setFeedback(''); setOutcome(''); setPhase('narrating'); if (!audioRef.current) audioRef.current = new Audio()
      await kgLevel5PreviewService.playIntroduction(letter, audioRef.current, controller.signal); if (!active) return () => undefined
      setPhase('requesting'); stream = await requestKGMicrophone(controller.signal); if (!active) return () => undefined
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type)) || ''
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); recorderRef.current = recorder; const chunks: Blob[] = []; startedAt = performance.now()
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => { if (recorder?.state === 'recording') recorder.stop(); release(); fail(new Error('Microphone recording failed')) }
      recorder.onstop = () => {
        if (!claimSubmission()) return
        const durationMs = Math.min(11900, Math.max(250, Math.round(performance.now() - startedAt))); const blob = new Blob(chunks, { type: recorder?.mimeType || mime || 'audio/webm' }); release(); recorderRef.current = null
        if (!active) return; setPhase('checking'); const noSpeech = (!speechDetected && vadAvailable) || blob.size < 800
        void kgLevel5PreviewService.submitAttempt({ letter, audio: noSpeech ? undefined : blob, durationMs, noSpeech, signal: controller.signal }).then(async (result) => {
          if (!active) return; const transition = resolveLevel5Attempt(letter, result.outcome); setOutcome(result.outcome)
          setFeedback(transition.retry ? (result.outcome === 'unclear' ? 'I could not hear clearly. Let’s try again!' : `Good try! Say the letter ${letter} once more.`) : letter === 'Z' ? 'Wonderful! You completed W through Z!' : `Great listening! Next we meet ${LEVEL5_LETTERS[index + 1]}.`)
          setPhase('feedback')
          await kgLevel5PreviewService.playFeedback(result.outcome === 'correct' ? 'great' : result.outcome === 'unclear' ? 'repeat' : 'try-again', audioRef.current!, controller.signal)
          if (!active) return
          if (transition.retry) { setAttemptCycle((value) => value + 1); return }
          if (transition.complete) timer = window.setTimeout(() => {
            if (!active) return
            setPhase('finished')
            if (preview) router.replace('/school/kg-preview')
          }, reducedMotion ? 0 : 700)
          else timer = window.setTimeout(() => active && setLetter(LEVEL5_LETTERS[index + 1]), reducedMotion ? 0 : 900)
        }).catch(fail)
      }
      recorder.start(); setPhase('listening')
      stopWatcher = watchVoiceActivity(stream, () => { if (recorder?.state === 'recording') recorder.stop() }, {
        onSpeech: () => { speechDetected = true },
        onUnavailable: () => { vadAvailable = false },
      })
      timer = window.setTimeout(() => { if (recorder?.state === 'recording') recorder.stop() }, 12000)
    } catch (error) { fail(error) }
    return () => { active = false; controller.abort(); release() }
  }, [letter, index, preview, reducedMotion, router])

  useEffect(() => {
    if (!introComplete) return
    let cleanup: (() => void) | undefined
    let disposed = false
    void beginTurn().then((release) => { if (disposed) release(); else cleanup = release })
    return () => { disposed = true; cleanup?.() }
  }, [beginTurn, attemptCycle, introComplete])
  const stopRecording = () => { if (recorderRef.current?.state === 'recording') recorderRef.current.stop() }
  const restartTurn = () => { stopRecording(); setAttemptCycle((value) => value + 1) }
  if (!preview) return <main className="kg-level5 blocked"><strong>Staff-only Level 05 preview</strong><span>This lesson is not available to students yet.</span></main>

  const finishIntroduction = () => {
    if (introCompletedRef.current) return
    introCompletedRef.current = true
    sessionStorage.setItem('talkora:kg-level5-introduction-completed', 'true')
    setIntroStatus('ready')
    setIntroComplete(true)
    setLetter('W')
  }

  if (!introComplete) return <main className="kg-level5-introduction" aria-label="Level 5 W to Z introduction">
    <video
      ref={introVideoRef}
      src={VIDEO}
      autoPlay
      muted={false}
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload noplaybackrate noremoteplayback"
      onContextMenu={(event) => event.preventDefault()}
      onLoadedData={() => { if (introStatus === 'loading') setIntroStatus('ready') }}
      onPlaying={() => setIntroStatus('playing')}
      onError={() => { setIntroStatus('error'); setIntroError('The introduction could not load. Please try again.') }}
      onEnded={finishIntroduction}
      aria-label="Introduction video for letters W to Z"
    />
    {introStatus !== 'playing' ? <div className="kg-level5-introduction__action" role="status">
      {introStatus === 'error' ? <p role="alert">{introError}</p> : <p>Let’s begin our W–Z adventure!</p>}
      {introStatus !== 'error' ? <button type="button" onClick={() => void startIntroduction()}><Play size={22} /> Start Video</button> : <button type="button" onClick={() => window.location.reload()}><RotateCw size={20} /> Try Again</button>}
    </div> : null}
  </main>

  const julieState = phase === 'listening' ? 'listening' : phase === 'checking' ? 'thinking' : phase === 'feedback' && outcome === 'correct' ? 'celebrating' : phase === 'error' ? 'encouraging' : 'speaking'
  return <main className="kg-level5" data-phase={phase} aria-label={`Level 5 letter ${letter}`}>
    <header className="kg-level5-header"><button type="button" className="kg-level5-back" onClick={onPreviewBack} aria-label="Back to Level 5 map"><ArrowLeft size={19} /> Letters</button><div className="kg-level5-progress" aria-label={`Letter ${index + 1} of 4`}><span>LEVEL 5 · W–Z</span><div>{LEVEL5_LETTERS.map((item, itemIndex) => <i key={item} className={itemIndex < index ? 'done' : itemIndex === index ? 'current' : ''} />)}</div></div><span className="kg-level5-staff"><Sparkles size={15} /> Staff preview</span></header>
    <div className="kg-level5-stage">
      <motion.aside className="kg-level5-teacher" aria-label="Miss Julie" initial={reducedMotion ? false : { opacity: 0, x: -28, y: 14 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}><div className="kg-level5-teacher-halo" /><AnimatedMissJulie state={julieState} reducedMotion={Boolean(reducedMotion)} /><div className="kg-level5-speech" role="status" aria-live="polite">{phase === 'finished' ? 'You learned all four letters!' : phase === 'listening' ? `Say the letter ${letter}.` : phase === 'checking' ? 'Let me hear that…' : phase === 'error' ? feedback : feedback || `Look at ${lesson.word}. It starts with ${letter}!`}</div></motion.aside>
      <section className="kg-level5-board">
        <AnimatePresence mode="wait"><motion.div key={letter} className="kg-level5-letter-card" style={{ '--letter-color': lesson.color } as React.CSSProperties} initial={reducedMotion ? false : { opacity: 0, y: 22, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, y: -12 }} transition={{ duration: .42, ease: [0.22, 1, 0.36, 1] }}>
          <div className="kg-level5-kicker"><Sparkles size={16} /> LETTER {index + 1} OF 4</div>
          <div className="kg-level5-main"><motion.div className="kg-level5-letter" aria-label={`Uppercase and lowercase ${letter}`} animate={reducedMotion ? undefined : { y: [0, -7, 0], rotate: [0, -1.5, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}><strong>{letter}</strong><span>{letter.toLowerCase()}</span></motion.div><div className="kg-level5-word"><span>W–Z Word</span><h1>{lesson.word}</h1><div className="kg-level5-picture"><motion.img src={lesson.picture} alt={`${lesson.word} for letter ${letter}`} animate={reducedMotion ? { y: 0 } : { y: [0, -4, 0] }} transition={reducedMotion ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} /></div></div></div>
          <div className="kg-level5-sound"><Volume2 size={18} /><span><strong>{letter}</strong> is in <strong>{lesson.word}</strong></span></div>
          {phase === 'narrating' || phase === 'requesting' || phase === 'checking' ? <div className="kg-level5-status" role="status"><LoaderCircle className="kg-spin" size={19} /> {phase === 'narrating' ? 'Miss Julie is speaking…' : phase === 'requesting' ? 'Starting microphone…' : 'Checking your answer…'}</div> : null}
          {phase === 'listening' ? <button className="kg-level5-mic" type="button" onClick={stopRecording}><Mic size={23} /><span>Done speaking</span></button> : null}
          {phase === 'error' ? <button className="kg-level5-action" type="button" onClick={restartTurn}><RotateCw size={18} /> Try again</button> : null}
          {phase === 'feedback' ? <div className={`kg-level5-feedback ${outcome}`}><Check size={20} /> {feedback}</div> : null}
        </motion.div></AnimatePresence>
      </section>
    </div>
  </main>
}

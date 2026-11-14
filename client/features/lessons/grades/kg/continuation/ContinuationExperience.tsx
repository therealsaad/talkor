'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, LoaderCircle, Mic, RotateCw, Sparkles } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { requestKGMicrophone } from '@/lib/kg-microphone'
import { watchVoiceActivity } from '@/lib/voice-activity'
import { lessonTurnTelemetry } from '@/lib/lesson-turn-telemetry'
import { nextKGStudentRoute } from '@/services/kg-resume-service'
import { LatencyReportButton } from '@/components/latency-report-button'
import { AnimatedMissJulie } from '../level-01/components/AnimatedMissJulie'
import { KindergartenWorld } from '../components/KindergartenWorld'
import { LetterWordPicture } from '../components/LetterWordPicture'
import { microphoneFailureMessage } from '../level-02/level2-flow'
import { kgContinuationStudentService, type KGContinuationState, type KGContinuationLevel } from './continuation-service'
import '../level-01/styles/kg-alphabet.css'
import '../level-01/styles/kg-level1-polish.css'
import '../components/kindergarten-world.css'
import '../level-02/level-02.css'

const WORDS: Record<string, string> = {
  K: 'kite', L: 'lion', M: 'monkey', N: 'nest', O: 'orange', P: 'parrot',
  Q: 'queen', R: 'rabbit', S: 'sun', T: 'tiger', U: 'umbrella', V: 'van',
  W: 'wolf', X: 'xylophone', Y: 'yak', Z: 'zebra',
}
const PICTURES: Record<string, string> = {
  K: '/kg/pictures/level-3/kite.svg', L: '/kg/pictures/level-3/lion.svg',
  M: '/kg/pictures/level-3/monkey.svg', N: '/kg/pictures/level-3/nest.svg',
  O: '/kg/pictures/level-3/orange.svg', P: '/kg/pictures/level-3/parrot.svg',
  W: '/kg/pictures/level-5/wolf.jpg', X: '/kg/pictures/level-5/xylophone.jpg',
  Y: '/kg/pictures/level-5/Yak.jpg', Z: '/kg/pictures/level-5/zebra.jpg',
}
const EMOJI: Record<string, string> = { Q: '👑', R: '🐇', S: '☀️', T: '🐅', U: '☂️', V: '🚐' }
const LEVEL_SETS: Record<KGContinuationLevel, readonly string[]> = {
  3: ['K','L','M','N','O','P'], 4: ['Q','R','S','T','U','V'], 5: ['W','X','Y','Z'],
}
type Phase = 'narrating' | 'requesting' | 'listening' | 'checking' | 'feedback' | 'error' | 'finished'

export function KGContinuationStudentExperience({ initial }: { initial: KGContinuationState }) {
  const router = useRouter()
  const LEVEL_LETTERS = LEVEL_SETS[initial.level]
  const reduceMotion = useReducedMotion()
  const [state, setState] = useState(initial)
  const [phase, setPhase] = useState<Phase>(initial.completed ? 'finished' : 'narrating')
  const [message, setMessage] = useState('')
  const [cycle, setCycle] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const letter = state.activity?.letter
  const index = state.currentIndex
  const pendingId = state.pendingFeedback?.submissionId

  useEffect(() => {
    if (state.completed || !letter) { setPhase('finished'); return }
    // Capture the guarded letter before nested async recording callbacks.
    const currentLetter: string = letter
    const controller = new AbortController()
    let live = true
    let stream: MediaStream | undefined
    let recorder: MediaRecorder | undefined
    let stopWatcher: (() => void) | undefined
    let stopTimer: ReturnType<typeof setTimeout> | undefined
    const audio = new Audio()
    function releaseMicrophone() {
      stopWatcher?.()
      stopWatcher = undefined
      if (stopTimer) clearTimeout(stopTimer)
      stopTimer = undefined
      stream?.getTracks().forEach((track) => track.stop())
      stream = undefined
      recorderRef.current = null
    }
    async function deliverFeedback(submissionId: string, words: string) {
      if (!live || controller.signal.aborted) return
      setMessage(words)
      setPhase('feedback')
      await kgContinuationStudentService.playFeedback(state.level, submissionId, audio, controller.signal)
      if (!live || controller.signal.aborted) return
      const updated = await kgContinuationStudentService.acknowledge(state.level, submissionId, controller.signal)
      if (!live || controller.signal.aborted) return
      setState(updated)
      if (updated.completed) {
        try { router.replace(await nextKGStudentRoute()) }
        catch { setMessage('Your progress is saved. Tap Continue when your connection returns.') }
        return
      }
      setCycle((n) => n + 1)
    }
    function fail(cause: unknown) {
      if (!live || controller.signal.aborted) return
      releaseMicrophone()
      const error = cause as { name?: string; message?: string }
      setMessage(error.name && ['NotAllowedError','SecurityError','NotFoundError','NotReadableError','AbortError','NotSupportedError','TimeoutError'].includes(error.name)
        ? microphoneFailureMessage(cause) : error.message?.includes('microphone')
          ? 'Please check your microphone and try again.'
          : 'Miss Julie could not finish that turn. Tap Try again to resume your saved lesson.')
      setPhase('error')
    }
    async function beginListening() {
      setPhase('requesting')
      stream = await requestKGMicrophone(controller.signal)
      if (!live || controller.signal.aborted) { releaseMicrophone(); return }
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
      const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || ''
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      const chunks: Blob[] = []
      let heardSpeech = false
      let vadAvailable = true
      let submitted = false
      const started = performance.now()
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => {
        if (recorder) recorder.onstop = null
        releaseMicrophone()
        fail(Error('Microphone recording failed'))
      }
      recorder.onstop = () => {
        if (submitted) return
        submitted = true
        lessonTurnTelemetry.mark('recorderStop', 'kg' + state.level)
        const durationMs = Math.min(11900, Math.max(250, Math.round(performance.now() - started)))
        const blob = new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' })
        releaseMicrophone()
        if (!live || controller.signal.aborted) return
        setPhase('checking')
        void kgContinuationStudentService.submit(state.level, {
          letter: currentLetter, submissionId: window.crypto.randomUUID(), audio: blob, durationMs,
          noSpeech: (vadAvailable && !heardSpeech) || blob.size < 800,
          signal: controller.signal,
        }).then((result) => deliverFeedback(result.submissionId, result.feedbackText)).catch(fail)
      }
      recorder.start()
      setPhase('listening')
      stopWatcher = watchVoiceActivity(stream, (info) => {
        if (info?.heardVoice) lessonTurnTelemetry.mark('speechEnd', 'kg' + state.level, info.lastVoiceAt)
        if (recorder?.state === 'recording') recorder.stop()
      }, {
        silenceMs: 1100, minimumSpeechMs: 350, noSpeechTimeoutMs: 6500,
        speechThreshold: .017, resumeContext: true, sampleIntervalMs: 50,
        onSpeech: () => { heardSpeech = true },
        onUnavailable: () => { vadAvailable = false },
      })
      stopTimer = setTimeout(() => { if (recorder?.state === 'recording') recorder.stop() }, 9800)
    }
    async function run() {
      if (state.pendingFeedback) {
        await deliverFeedback(state.pendingFeedback.submissionId, state.pendingFeedback.feedbackText)
      } else {
        setPhase('narrating')
        setMessage('Listen, then say the letter ' + letter + '!')
        await kgContinuationStudentService.playNarration(state.level, currentLetter, audio, controller.signal)
        if (!live || controller.signal.aborted) return
        await beginListening()
      }
    }
    void run().catch(fail)
    return () => {
      live = false
      controller.abort()
      if (recorder?.state === 'recording') {
        recorder.onstop = null
        recorder.onerror = null
        recorder.stop()
      }
      releaseMicrophone()
      audio.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, pendingId, cycle, state.completed, letter])

  async function retry() {
    setPhase('requesting')
    setMessage('')
    try {
      // Retry saved feedback rather than submitting an answer twice.
      const fresh = await kgContinuationStudentService.state(state.level)
      setState(fresh)
      setCycle((old) => old + 1)
    } catch {
      setMessage('Could not reconnect. Check your connection and try again.')
      setPhase('error')
    }
  }
  async function continueToNextLesson() {
    setMessage('Opening your next lesson…')
    try { router.replace(await nextKGStudentRoute()) }
    catch { setMessage('Your progress is saved. Check your connection and try again.') }
  }
  const busy = phase === 'narrating' || phase === 'requesting' || phase === 'checking'
  const display = state.completed ? 'Wonderful! You finished Level ' + state.level + '!'
    : phase === 'listening' ? 'Your turn! Say ' + letter + '!'
    : phase === 'narrating' ? 'Listen to Miss Julie first.'
    : phase === 'checking' ? 'Miss Julie is checking your answer.'
    : phase === 'requesting' ? 'Opening your microphone…' : message
  return (
    <main className="kg-level2-play" data-phase={phase} aria-label={'Kindergarten Level ' + state.level + ' ' + state.title}>
      <KindergartenWorld />
      <header className="kg-level2-play__top">
        <Link className="kg-level2-play__back" href="/student/kg/map">My garden</Link>
        <div className="kg-level2-play__progress" aria-label={'Level ' + state.level + ', ' + index + ' of ' + state.totalActivities + ' letters complete'}>
          <span>LEVEL {state.level} · {state.title}</span>
          <div className="kg-level2-play__steps">
            {LEVEL_LETTERS.map((name, i) => <i key={name} className={i < index ? 'done' : i === index ? 'current' : ''} />)}
          </div>
        </div>
        <span className="kg-level2-play__badge"><Sparkles size={15} /> Miss Julie&apos;s class</span>
      </header>
      <div className="kg-level2-play__scene">
        <aside className="kg-level2-play__teacher">
          <AnimatedMissJulie state={phase === 'listening' ? 'listening' : busy ? 'speaking' : state.completed ? 'celebrating' : phase === 'feedback' ? 'encouraging' : 'idle'}
            reducedMotion={Boolean(reduceMotion)} />
          <div className="kg-level2-play__speech" role={phase === 'error' ? 'alert' : 'status'} aria-live="polite">{display}</div>
        </aside>
        <section className="kg-level2-play__board" aria-label={"Miss Julie's Level " + state.level + ' teaching board'}>
          <span className="kg-level2-play__eyebrow"><Sparkles size={17} /> LISTEN · LEARN · SPEAK</span>
          {state.completed ? (
            <div className="kg-level2-play__finished">
              <div className="kg-level2-play__letter">{state.title}</div>
              <h1>Level {state.level} complete!</h1>
              <p>Miss Julie is proud of your speaking practice!</p>
              <p>Your progress is saved. Your next adventure will appear when it is ready.</p>
              <button type="button" className="kg-level2-play__action" onClick={() => void continueToNextLesson()}>
                <CheckCircle2 size={18} /> Continue to next lesson
              </button>
              {message ? <p role="status">{message}</p> : null}
            </div>
          ) : letter ? (
            <>
              {PICTURES[letter] ? <LetterWordPicture letter={letter} word={WORDS[letter]} pictureSrc={PICTURES[letter]} reducedMotion={Boolean(reduceMotion)} className="kg-level2-letter-word-picture" /> : (
                <div className="kg-level2-play__finished" aria-label={letter + ' for ' + WORDS[letter]}>
                  <div className="kg-level2-play__letter">{letter}</div>
                  <span style={{ fontSize: 86 }} role="img" aria-label={WORDS[letter]}>{EMOJI[letter]}</span>
                  <h1>{WORDS[letter]}</h1>
                </div>
              )}
              <span>{index + 1} of {LEVEL_LETTERS.length}</span>
              {busy ? <span className="kg-level2-play__status"><LoaderCircle className="kg-spin" size={19} /> {display}</span> : null}
              {phase === 'listening' ? (
                <button type="button" className="kg-level2-play__action" onClick={() => {
                  if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
                }}><Mic size={22} /> Done speaking</button>
              ) : null}
              {phase === 'feedback' ? <p className="kg-level2-play__status">{message}</p> : null}
              {phase === 'error' ? <button type="button" className="kg-level2-play__action" onClick={() => void retry()}>
                <RotateCw size={18} /> Try again
              </button> : null}
            </>
          ) : null}
        </section>
      </div>
      <LatencyReportButton />
    </main>
  )
}

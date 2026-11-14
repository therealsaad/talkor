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
import { LEVEL2_LETTERS, microphoneFailureMessage, type Level2Letter } from './level2-flow'
import { kgLevel2StudentService, type KGLevel2State } from './services/kg-level2-student-service'
import '../level-01/styles/kg-alphabet.css'
import '../level-01/styles/kg-level1-polish.css'
import '../components/kindergarten-world.css'
import './level-02.css'

const WORDS: Record<Level2Letter, string> = {
  E: 'elephant', F: 'fish', G: 'goat', H: 'hat', I: 'igloo', J: 'jam',
}
const PICTURES: Record<Level2Letter, string> = {
  E: '/kg/pictures/level-2/elephant.svg',
  F: '/kg/pictures/level-2/fish.svg',
  G: '/kg/pictures/level-2/goat.svg',
  H: '/kg/pictures/level-2/hat.svg',
  I: '/kg/pictures/level-2/igloo.svg',
  J: '/kg/pictures/level-2/jam.svg',
}
type Phase = 'narrating' | 'requesting' | 'listening' | 'checking' | 'feedback' | 'error' | 'finished'

export function KGLevel2StudentExperience({ initial }: { initial: KGLevel2State }) {
  const router = useRouter()
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
    const currentLetter: Level2Letter = letter
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
      await kgLevel2StudentService.playFeedback(submissionId, audio, controller.signal)
      if (!live || controller.signal.aborted) return
      const updated = await kgLevel2StudentService.acknowledge(submissionId, controller.signal)
      if (!live || controller.signal.aborted) return
      setState(updated)
      // After the persisted final J acknowledgement, automatically resolve
      // the next permitted lesson; never send the child back to a completed map.
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
        lessonTurnTelemetry.mark('recorderStop', 'kg2')
        const durationMs = Math.min(11900, Math.max(250, Math.round(performance.now() - started)))
        const blob = new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' })
        releaseMicrophone()
        if (!live || controller.signal.aborted) return
        setPhase('checking')
        void kgLevel2StudentService.submit({
          letter: currentLetter, submissionId: window.crypto.randomUUID(), audio: blob, durationMs,
          noSpeech: (vadAvailable && !heardSpeech) || blob.size < 800,
          signal: controller.signal,
        }).then((result) => deliverFeedback(result.submissionId, result.feedbackText)).catch(fail)
      }
      recorder.start()
      setPhase('listening')
      stopWatcher = watchVoiceActivity(stream, (info) => {
        if (info?.heardVoice) lessonTurnTelemetry.mark('speechEnd', 'kg2', info.lastVoiceAt)
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
        await kgLevel2StudentService.playNarration(currentLetter, audio, controller.signal)
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
      const fresh = await kgLevel2StudentService.state()
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
  const display = state.completed ? 'Wonderful! You finished Level 2!'
    : phase === 'listening' ? 'Your turn! Say ' + letter + '!'
    : phase === 'narrating' ? 'Listen to Miss Julie first.'
    : phase === 'checking' ? 'Miss Julie is checking your answer.'
    : phase === 'requesting' ? 'Opening your microphone…' : message
  return (
    <main className="kg-level2-play" data-phase={phase} aria-label="Kindergarten Level 2 letters E to J">
      <KindergartenWorld />
      <header className="kg-level2-play__top">
        <Link className="kg-level2-play__back" href="/student/kg/map">My garden</Link>
        <div className="kg-level2-play__progress" aria-label={'Level 2, ' + index + ' of 6 letters complete'}>
          <span>LEVEL 2 · LETTERS E–J</span>
          <div className="kg-level2-play__steps">
            {LEVEL2_LETTERS.map((name, i) => <i key={name} className={i < index ? 'done' : i === index ? 'current' : ''} />)}
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
        <section className="kg-level2-play__board" aria-label="Miss Julie's Level 2 teaching board">
          <span className="kg-level2-play__eyebrow"><Sparkles size={17} /> LISTEN · LEARN · SPEAK</span>
          {state.completed ? (
            <div className="kg-level2-play__finished">
              <div className="kg-level2-play__letter">E–J</div>
              <h1>Level 2 complete!</h1>
              <p>You said all six letters with Miss Julie. Hooray!</p>
              <p>Your progress is saved. Your next adventure will appear when it is ready.</p>
              <button type="button" className="kg-level2-play__action" onClick={() => void continueToNextLesson()}>
                <CheckCircle2 size={18} /> Continue to next lesson
              </button>
              {message ? <p role="status">{message}</p> : null}
            </div>
          ) : letter ? (
            <>
              <LetterWordPicture letter={letter} word={WORDS[letter]} pictureSrc={PICTURES[letter]} reducedMotion={Boolean(reduceMotion)} className="kg-level2-letter-word-picture" />
              <span>{index + 1} of {LEVEL2_LETTERS.length}</span>
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

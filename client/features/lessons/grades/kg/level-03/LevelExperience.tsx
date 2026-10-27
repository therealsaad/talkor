
'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, LoaderCircle, Mic, RotateCw, Sparkles } from 'lucide-react'
import { createSubmissionGate, LEVEL3_LETTERS, microphoneFailureMessage, resolveLevel3Attempt, type Letter } from './level3-flow'
import { AnimatedMissJulie } from '../level-01/components/AnimatedMissJulie'
import '../level-01/styles/kg-alphabet.css'
import '../level-01/styles/kg-level1-polish.css'
import './level-03.css'
import type { LevelExperienceProps } from '../../../registry'

const LETTERS = LEVEL3_LETTERS

const LETTER_PICTURES: Record<Letter, { src: string; word: string }> = {
  K: { src: '/kg/pictures/level-3/kite.svg', word: 'kite' },
  L: { src: '/kg/pictures/level-3/lion.svg', word: 'lion' },
  M: { src: '/kg/pictures/level-3/monkey.svg', word: 'monkey' },
  N: { src: '/kg/pictures/level-3/nest.svg', word: 'nest' },
  O: { src: '/kg/pictures/level-3/orange.svg', word: 'orange' },
  P: { src: '/kg/pictures/level-3/parrot.svg', word: 'parrot' },
}

const LETTER_TRANSITION_PAUSE_MS = 900
export default function LevelExperience({ preview = false, previewStartLetter = 'K', onPreviewBack }: LevelExperienceProps) {
  const reduceMotion = useReducedMotion()
  const [selected, setSelected] = useState<Letter>(previewStartLetter)
  const [julieState, setJulieState] = useState<'idle' | 'speaking'>('idle')
  const [phase, setPhase] = useState<'narrating' | 'requesting' | 'listening' | 'checking' | 'feedback' | 'error' | 'finished'>('narrating')
  const [feedback, setFeedback] = useState('')
  const [feedbackOutcome, setFeedbackOutcome] = useState<'correct' | 'incorrect' | 'unclear' | ''>('')
  const [retryAvailable, setRetryAvailable] = useState(false)
  const [attemptCycle, setAttemptCycle] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const selectedIndex = LETTERS.indexOf(selected)
  const picture = LETTER_PICTURES[selected]

  useEffect(() => {
    if (!preview) return

    const controller = new AbortController()
    let active = true
    let stream: MediaStream | null = null
    let recorder: MediaRecorder | null = null
    let stopWatcher: (() => void) | null = null
    let hardStop: number | undefined
    let transitionTimer: number | undefined
    let speechDetected = false
    let vadAvailable = true
    let startedAt = 0
    let previewService: typeof import('./services/kg-level3-preview-service').kgLevel3PreviewService | null = null
    const claimSubmission = createSubmissionGate()

    const releaseMicrophone = () => {
      stopWatcher?.()
      stopWatcher = null
      if (hardStop !== undefined) window.clearTimeout(hardStop)
      hardStop = undefined
      stream?.getTracks().forEach((track) => track.stop())
      stream = null
    }

    const fail = (error: unknown) => {
      if (!active || controller.signal.aborted) return
      setJulieState('idle')
      if (error instanceof Error && error.message.includes('narration playback')) {
        setFeedback('Audio playback was blocked. Tap Try again to replay the narration.')
      } else if (error instanceof Error && error.message.includes('feedback playback')) {
        setFeedback('Miss Julie could not play the feedback. Tap Try again to stay on this letter.')
      } else if (error instanceof Error && error.message.includes('Speech recognition')) {
        setFeedback('Speech recognition is temporarily unavailable. Please try again.')
      } else if (error instanceof Error && error.message.includes('recording failed')) {
        setFeedback('The microphone recording stopped unexpectedly. Check the microphone and tap Try again.')
      } else if (error instanceof Error && [
        'NotAllowedError', 'SecurityError', 'NotFoundError', 'NotReadableError',
        'AbortError', 'NotSupportedError', 'TimeoutError',
      ].includes(error.name)) {
        setFeedback(microphoneFailureMessage(error))
      } else {
        setFeedback('The connection was interrupted. Check your connection and tap Try again.')
      }
      setRetryAvailable(true)
      setPhase('error')
    }

    const beginListening = async () => {
      setPhase('requesting')
      const [{ requestKGMicrophone }, { watchVoiceActivity }] = await Promise.all([
        import('@/lib/kg-microphone'),
        import('@/lib/voice-activity'),
      ])
      const microphone = await requestKGMicrophone(controller.signal)
      if (!active || controller.signal.aborted) {
        microphone.getTracks().forEach((track) => track.stop())
        return
      }
      stream = microphone
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
      const mimeType = types.find((type) => MediaRecorder.isTypeSupported(type)) || ''
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      const chunks: Blob[] = []
      speechDetected = false
      vadAvailable = true
      startedAt = performance.now()

      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => {
        if (recorder) {
          recorder.onstop = null
          if (recorder.state === 'recording') recorder.stop()
        }
        releaseMicrophone()
        recorderRef.current = null
        fail(new Error('Microphone recording failed'))
      }
      recorder.onstop = () => {
        if (!claimSubmission()) return
        const durationMs = Math.min(11900, Math.max(250, Math.round(performance.now() - startedAt)))
        const blob = new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' })
        releaseMicrophone()
        recorderRef.current = null
        if (!active || controller.signal.aborted) return
        setJulieState('idle')
        setPhase('checking')
        const service = previewService
        if (!service) {
          fail(new Error('Speech recognition service was not initialized'))
          return
        }
        void service.submitAttempt({
          letter: selected,
          audio: (!speechDetected && vadAvailable) || blob.size < 800 ? undefined : blob,
          durationMs,
          noSpeech: (!speechDetected && vadAvailable) || blob.size < 800,
          signal: controller.signal,
        }).then(async (result) => {
          if (!active || controller.signal.aborted) return
          const transition = resolveLevel3Attempt(selected, result.outcome)
          setFeedbackOutcome(result.outcome)
          setFeedback(transition.retry
            ? result.outcome === 'unclear'
              ? 'I could not hear the letter clearly. Let’s try again!'
              : `Good try! Listen once more and say the letter ${selected}.`
            : selected === 'P'
              ? 'Wonderful! You explored all six letters!'
              : 'Great job! Let’s meet the next letter.')
          setRetryAvailable(false)
          setJulieState('speaking')
          setPhase('feedback')
          try {
            if (!audioRef.current) audioRef.current = new Audio()
            await service.playFeedback(
              result.outcome === 'correct' ? 'great' : result.outcome === 'unclear' ? 'repeat' : 'try-again',
              audioRef.current,
              controller.signal,
            )
          } catch (error) {
            fail(error)
            return
          }
          if (!active || controller.signal.aborted) return
          setJulieState('idle')
          if (transition.retry) {
            setAttemptCycle((cycle) => cycle + 1)
            return
          }
          if (transition.complete) {
            transitionTimer = window.setTimeout(() => { if (active) setPhase('finished') }, LETTER_TRANSITION_PAUSE_MS)
          } else {
            transitionTimer = window.setTimeout(() => {
              if (!active) return
              setSelected(transition.letter)
              setAttemptCycle(0)
            }, LETTER_TRANSITION_PAUSE_MS)
          }
        }).catch(fail)
      }

      recorder.start()
      setPhase('listening')
      stopWatcher = watchVoiceActivity(stream, () => {
        if (recorder?.state === 'recording') recorder.stop()
      }, {
        silenceMs: 1100,
        minimumSpeechMs: 350,
        noSpeechTimeoutMs: 6500,
        speechThreshold: .017,
        resumeContext: true,
        sampleIntervalMs: 50,
        onSpeech: () => { speechDetected = true },
        onUnavailable: () => { vadAvailable = false },
      })
      hardStop = window.setTimeout(() => {
        if (recorder?.state === 'recording') recorder.stop()
      }, 9800)
    }

    const startTurn = async () => {
      setFeedback('')
      setFeedbackOutcome('')
      setRetryAvailable(false)
      setJulieState('speaking')
      setPhase('narrating')
      const { kgLevel3PreviewService } = await import('./services/kg-level3-preview-service')
      previewService = kgLevel3PreviewService
      if (!audioRef.current) audioRef.current = new Audio()
      await previewService.playIntroduction(selected, audioRef.current, controller.signal)
      if (!active || controller.signal.aborted) return
      setJulieState('idle')
      await beginListening()
    }

    void startTurn().catch(fail)

    return () => {
      active = false
      controller.abort()
      if (transitionTimer !== undefined) window.clearTimeout(transitionTimer)
      if (recorder) {
        recorder.ondataavailable = null
        recorder.onstop = null
        recorder.onerror = null
        if (recorder.state === 'recording') recorder.stop()
      }
      recorderRef.current = null
      releaseMicrophone()
      audioRef.current?.pause()
    }
  }, [attemptCycle, preview, selected])

  useEffect(() => () => {
    audioRef.current?.pause()
  }, [])

  const retryTurn = () => {
    setFeedback('')
    setFeedbackOutcome('')
    setRetryAvailable(false)
    setAttemptCycle((cycle) => cycle + 1)
  }

  if (!preview) {
    return <main className="kg-alpha kg-level3-blocked"><strong>Staff-only draft preview.</strong><span>This Level 3 lesson is not available to students.</span></main>
  }

  const characterState = phase === 'listening'
    ? 'listening'
    : phase === 'checking'
      ? 'thinking'
      : phase === 'finished'
        ? 'celebrating'
        : phase === 'error'
          ? 'encouraging'
          : phase === 'feedback'
            ? feedbackOutcome === 'correct' ? 'celebrating' : 'encouraging'
            : julieState

  return (
    <main
      className="kg-alpha kg-alpha-play kg-level3-play"
      data-phase={phase}
      data-outcome={feedbackOutcome}
      aria-label="Staff preview of Level 3 letters K to P"
    >
      <div className="kg-level3-sky" aria-hidden="true">
        <span className="kg-level3-sky__cloud kg-level3-sky__cloud--one" />
        <span className="kg-level3-sky__cloud kg-level3-sky__cloud--two" />
        <span className="kg-level3-sky__star kg-level3-sky__star--one" />
        <span className="kg-level3-sky__star kg-level3-sky__star--two" />
        <span className="kg-level3-sky__bubble kg-level3-sky__bubble--one" />
        <span className="kg-level3-sky__bubble kg-level3-sky__bubble--two" />
      </div>
      <header className="kg-alpha-play-top">
        {onPreviewBack ? <button type="button" className="kg-alpha-map-link" onClick={onPreviewBack}><ArrowLeft size={18} /> Choose a letter</button> : <span />}
        <div className="kg-alpha-progress-wrap" aria-label={`Letter ${selectedIndex + 1} of ${LETTERS.length}`}>
          <span>LEVEL 3 · K–P</span>
          <div className="kg-alpha-step-bar">{LETTERS.map((letter, index) => <i key={letter} className={index < selectedIndex ? 'done' : index === selectedIndex ? 'current' : ''} />)}</div>
        </div>
        <span className="kg-alpha-level-pill"><Sparkles size={15} /> STAFF-ONLY DRAFT</span>
      </header>

      <div className="kg-alpha-scene">
        <aside className={`kg-alpha-teacher ${julieState === 'speaking' ? 'is-speaking' : ''}`}>
          <div className="kg-alpha-teacher-glow" aria-hidden="true" />
          <AnimatedMissJulie state={characterState} reducedMotion={Boolean(reduceMotion)} />
          <div className="kg-alpha-speech" role={phase === 'error' ? 'alert' : 'status'} aria-live="polite">
            {phase === 'finished' ? 'Wonderful! You explored letters K through P.' :
              phase === 'feedback' ? feedback :
                julieState === 'speaking' ? `Say the letter ${selected}.` :
                phase === 'listening' ? `Your turn! Say the letter ${selected} to Miss Julie.` :
                  phase === 'checking' ? 'Let me hear that…' :
                    phase === 'error' ? feedback : 'Miss Julie is ready to explore the letters.'}
          </div>
        </aside>

        <section className="kg-alpha-quest kg-alpha-teaching-board" aria-label="Level 3 letter preview board">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              className="kg-alpha-learning kg-level3-learning"
              initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="kg-alpha-activity-label"><Sparkles size={17} /> EXPLORE THE LETTERS</span>
              <div className="kg-level3-letter-display">
                <div className="kg-alpha-letter-orb kg-level3-letter-orb" aria-label={`Letter ${selected}`}>
                  <span>{selected}</span><small>LETTER {selected}</small>
                </div>
                <img className="kg-level3-letter-picture" src={picture.src} alt={`${picture.word} for letter ${selected}`} />
              </div>
              <h1>Meet letter <strong>{selected}</strong></h1>
              <p>{selected} for {picture.word[0].toUpperCase()}{picture.word.slice(1)}.</p>
              <span className="kg-level3-letter-count" aria-label={`Letter ${selectedIndex + 1} of ${LETTERS.length}`}>{selectedIndex + 1} of {LETTERS.length}</span>
              <p className="kg-level3-preview-note">Design preview only. No student progress or scoring is recorded.</p>
              {phase === 'narrating' || phase === 'requesting' || phase === 'checking'
                ? <div className="kg-alpha-status"><LoaderCircle className="kg-spin" size={19} /> {phase === 'narrating' ? 'Miss Julie is speaking…' : phase === 'requesting' ? 'Starting microphone…' : 'Checking your answer…'}</div>
                : null}
              {phase === 'listening'
                ? <button type="button" className="kg-mic-pulse" onClick={() => {
                    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
                  }} aria-label="Finish recording my answer"><Mic size={22} /><span>Done speaking</span></button>
                : null}
              {retryAvailable
                ? <button type="button" className="kg-story-play" onClick={retryTurn}><RotateCw size={18} /> Try again</button>
                : null}
              {phase === 'feedback' ? <div className="kg-alpha-status is-feedback" role="status">{feedback}</div> : null}
              {phase === 'finished' ? <div className="kg-alpha-status is-feedback" role="status">{feedback}</div> : null}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  )
}

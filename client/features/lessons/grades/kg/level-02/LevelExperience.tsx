'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, LoaderCircle, Mic, RotateCw, Sparkles } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { requestKGMicrophone } from '@/lib/kg-microphone'
import { watchVoiceActivity } from '@/lib/voice-activity'
import { AnimatedMissJulie } from '../level-01/components/AnimatedMissJulie'
import '../level-01/styles/kg-alphabet.css'
import '../level-01/styles/kg-level1-polish.css'
import '../components/kindergarten-world.css'
import './level-02.css'
import { KindergartenWorld } from '../components/KindergartenWorld'
import { LetterWordPicture } from '../components/LetterWordPicture'
import type { LevelExperienceProps } from '../../../registry'
import {
  createSubmissionGate,
  LEVEL2_LETTERS,
  microphoneFailureMessage,
  resolveLevel2Attempt,
  type Level2Letter,
} from './level2-flow'

const LETTER_WORDS: Record<Level2Letter, string> = {
  E: 'elephant',
  F: 'fish',
  G: 'goat',
  H: 'hat',
  I: 'igloo',
  J: 'jam',
}
const LETTER_PICTURES: Record<Level2Letter, string> = {
  E: '/kg/pictures/level-2/elephant.svg',
  F: '/kg/pictures/level-2/fish.svg',
  G: '/kg/pictures/level-2/goat.svg',
  H: '/kg/pictures/level-2/hat.svg',
  I: '/kg/pictures/level-2/igloo.svg',
  J: '/kg/pictures/level-2/jam.svg',
}

const LETTER_TRANSITION_PAUSE_MS = 900

type Phase = 'narrating' | 'requesting' | 'listening' | 'checking' | 'feedback' | 'error' | 'finished'

export default function LevelExperience({ preview = false, onPreviewBack }: LevelExperienceProps) {
  const reduceMotion = useReducedMotion()
  const [selected, setSelected] = useState<Level2Letter>('E')
  const [julieState, setJulieState] = useState<'idle' | 'speaking'>('idle')
  const [phase, setPhase] = useState<Phase>('narrating')
  const [feedback, setFeedback] = useState('')
  const [retryAvailable, setRetryAvailable] = useState(false)
  const [attemptCycle, setAttemptCycle] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const selectedIndex = LEVEL2_LETTERS.indexOf(selected)

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
    let previewService: typeof import('./services/kg-level2-preview-service').kgLevel2PreviewService | null = null
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
        setFeedback('Miss Julie could not play the letter narration. Check the voice service and tap Try again.')
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
        const noSpeech = (!speechDetected && vadAvailable) || blob.size < 800
        void service.submitAttempt({
          letter: selected,
          audio: noSpeech ? undefined : blob,
          durationMs,
          noSpeech,
          signal: controller.signal,
        }).then(async (result) => {
          if (!active || controller.signal.aborted) return
          const transition = resolveLevel2Attempt(selected, result.outcome)
          setFeedback(transition.retry
            ? result.outcome === 'unclear'
              ? 'I could not hear the letter clearly. Let’s try again!'
              : `Good try! Listen once more and say the letter ${selected}.`
            : transition.complete
              ? 'Wonderful! You explored all six letters, E through J!'
              : `Great job! Let’s meet the next letter, ${transition.letter}.`)
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
          } catch (feedbackError) {
            fail(feedbackError)
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
      setRetryAvailable(false)
      setJulieState('speaking')
      setPhase('narrating')
      const { kgLevel2PreviewService } = await import('./services/kg-level2-preview-service')
      previewService = kgLevel2PreviewService
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
    setRetryAvailable(false)
    setAttemptCycle((cycle) => cycle + 1)
  }

  if (!preview) {
    return (
      <main className="kg-level2-play" role="status">
        <strong>Staff-only draft preview.</strong>
        <span>This Level 2 lesson is not available to students.</span>
      </main>
    )
  }

  const busy = phase === 'narrating' || phase === 'requesting' || phase === 'checking'
  const statusText = phase === 'narrating'
    ? 'Miss Julie is speaking…'
    : phase === 'requesting'
      ? 'Starting microphone…'
      : phase === 'checking'
        ? 'Checking your answer…'
        : ''

  return (
    <main className="kg-level2-play" data-phase={phase} aria-label="Staff preview of Level 2 letters E to J">
      <KindergartenWorld />
      <header className="kg-level2-play__top">
        {onPreviewBack
          ? <button type="button" className="kg-level2-play__back" onClick={onPreviewBack}><ArrowLeft size={18} /> Back to introduction</button>
          : <span />}
        <div className="kg-level2-play__progress" aria-label={`Letter ${selectedIndex + 1} of ${LEVEL2_LETTERS.length}`}>
          <span>LEVEL 2 · E–J</span>
          <div className="kg-level2-play__steps">
            {LEVEL2_LETTERS.map((letter, index) => (
              <i key={letter} className={index < selectedIndex ? 'done' : index === selectedIndex ? 'current' : ''} />
            ))}
          </div>
        </div>
        <span className="kg-level2-play__badge"><Sparkles size={15} /> STAFF-ONLY DRAFT</span>
      </header>

      <div className="kg-level2-play__scene">
        <aside className="kg-level2-play__teacher">
          <AnimatedMissJulie state={julieState} reducedMotion={Boolean(reduceMotion)} />
          <div className="kg-level2-play__speech" role={phase === 'error' ? 'alert' : 'status'} aria-live="polite">
            {phase === 'finished' ? 'Wonderful! You explored letters E through J.' :
              phase === 'feedback' ? feedback :
                julieState === 'speaking' ? `Say the letter ${selected}.` :
                  phase === 'listening' ? `Your turn! Say the letter ${selected} to Miss Julie.` :
                    phase === 'checking' ? 'Let me hear that…' :
                      phase === 'error' ? feedback : 'Miss Julie is ready to explore the letters.'}
          </div>
        </aside>

        <section className="kg-level2-play__board" aria-label="Level 2 letter preview board">
          <span className="kg-level2-play__eyebrow"><Sparkles size={17} /> EXPLORE THE LETTERS</span>
          {phase === 'finished' ? (
            <div className="kg-level2-play__finished">
              <div className="kg-level2-play__letter" aria-label="Letters E through J">E–J</div>
              <h1>You did it!</h1>
              <p>{feedback || 'You explored all six letters, E through J!'}</p>
              <p>Design preview only. No student progress or scoring is stored.</p>
            </div>
          ) : (
            <>
              <LetterWordPicture
                letter={selected}
                word={LETTER_WORDS[selected]}
                pictureSrc={LETTER_PICTURES[selected]}
                reducedMotion={Boolean(reduceMotion)}
                className="kg-level2-letter-word-picture"
              />
              <span aria-label={`Letter ${selectedIndex + 1} of ${LEVEL2_LETTERS.length}`}>
                {selectedIndex + 1} of {LEVEL2_LETTERS.length}
              </span>
              {busy ? <div className="kg-level2-play__status" role="status"><LoaderCircle className="kg-spin" size={19} /> {statusText}</div> : null}
              {phase === 'listening'
                ? <button
                    type="button"
                    className="kg-level2-play__action"
                    onClick={() => {
                      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
                    }}
                    aria-label="Finish recording my answer"
                  ><Mic size={22} /> Done speaking</button>
                : null}
              {retryAvailable
                ? <button type="button" className="kg-level2-play__action" onClick={retryTurn}><RotateCw size={18} /> Try again</button>
                : null}
              {phase === 'feedback' ? <div className="kg-level2-play__status" role="status">{feedback}</div> : null}
              {phase === 'error' ? <p className="kg-level2-play__alert" role="alert">{feedback}</p> : null}
            </>
          )}
          <p>Design preview only. No student progress or scoring is stored.</p>
        </section>
      </div>
    </main>
  )
}

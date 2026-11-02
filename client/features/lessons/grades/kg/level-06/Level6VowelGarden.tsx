'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { LoaderCircle, Mic, Sparkles } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { KG_SESSION_END_EVENT, requestKGMicrophone } from '@/lib/kg-microphone'
import { watchVoiceActivity } from '@/lib/voice-activity'
import { playLevel6VowelSpeech } from './services/kg-level6-vowel-service'
import { AnimatedMissJulie } from '../level-01/components/AnimatedMissJulie'
import '../level-01/styles/kg-alphabet.css'
import '../level-01/styles/kg-level1-polish.css'
import '../level-03/level-03.css'
import './level-06.css'
import { Level6VideoPreview } from './Level6VideoPreview'

type Target = {
  activityId: string
  letter: string
  ipa: string
  cue: string
  prompt: string
}

const TARGETS: Target[] = [
  { activityId: 'vowel-a', letter: 'A', ipa: '/æ/', cue: 'Open your mouth wide and keep your tongue low and forward.', prompt: 'The vowel A makes the short sound /æ/. Listen to Miss Julie, then make the same sound.' },
  { activityId: 'vowel-e', letter: 'E', ipa: '/ɛ/', cue: 'Keep your mouth slightly open and your tongue forward.', prompt: 'The vowel E makes the short sound /ɛ/. Listen to Miss Julie, then make the same sound.' },
  { activityId: 'vowel-i', letter: 'I', ipa: '/ɪ/', cue: 'Relax your jaw and keep your tongue high and forward.', prompt: 'The vowel I makes the short sound /ɪ/. Listen to Miss Julie, then make the same sound.' },
  { activityId: 'vowel-o', letter: 'O', ipa: '/ɒ/', cue: 'Open your mouth and round your lips gently.', prompt: 'The vowel O makes the short sound /ɒ/. Listen to Miss Julie, then make the same sound.' },
  { activityId: 'vowel-u', letter: 'U', ipa: '/ʌ/', cue: 'Keep your mouth relaxed and your lips unrounded.', prompt: 'The vowel U makes the short sound /ʌ/. Listen to Miss Julie, then make the same sound.' },
]
const VOWEL_PAUSE_MS = 5_000
const MAX_RECORDING_MS = 9_800
type Outcome = 'correct' | 'incorrect' | 'unclear' | 'silence'
type Phase = 'intro' | 'welcome' | 'teaching' | 'listening' | 'checking' | 'feedback' | 'complete' | 'error'
type AttemptResult = { outcome: Outcome }
type SpeechLine = 'intro' | 'prompt' | 'replay' | Outcome | 'complete' | 'microphone-error' | 'provider-error'

const introText = 'Hello, friend! A vowel is a speech sound we make with an open mouth, without stopping the air. A, E, I, O, and U are the five vowel letters. Each one has its own short sound. Listen to Miss Julie, feel how your mouth moves, then copy each sound.'
const completionText = 'Wonderful work! You learned the five short vowel sounds: A, E, I, O, and U. You listened carefully and made each sound. See you next time in Rainbow Valley!'
function scriptFor(line: SpeechLine, target?: Target) {
  if (line === 'intro') return introText
  if (line === 'complete') return completionText
  if (line === 'microphone-error') return 'I can’t hear you yet. Please ask your teacher or grown-up to turn on the microphone, then try again.'
  if (line === 'provider-error') return 'I couldn’t check your answer just now. That’s not your fault. Let’s try again in a little while, or ask your teacher for help.'
  if (!target) return ''
  const sound = 'the sound ' + target.ipa
  if (line === 'prompt') return target.prompt
  if (line === 'replay') return 'Listen once more: ' + target.letter + ' says ' + sound + '. Now make ' + sound + '.'
  if (line === 'correct') return 'Wonderful! You made ' + sound + '.'
  if (line === 'incorrect') return 'Nice try! Listen to ' + sound + ' once more, then copy it.'
  if (line === 'silence') return 'Take your time. Listen: ' + sound + '. When you’re ready, make the same sound.'
  return 'I didn’t hear that sound clearly. Listen once more: ' + sound + '. Then try it.'
}

function micMessage(error: unknown) {
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Please ask your teacher to allow microphone access so Miss Julie can hear you.'
  if (name === 'NotFoundError') return 'Miss Julie cannot find a microphone. Please ask your teacher for help.'
  if (name === 'NotReadableError' || name === 'AbortError') return 'The microphone is busy. Please ask your teacher to check it.'
  if (name === 'TimeoutError') return 'Miss Julie is still waiting for microphone permission. Please ask your teacher for help.'
  if (name === 'NotSupportedError') return 'This browser cannot use the microphone for this lesson. Please ask your teacher for help.'
  return 'Miss Julie cannot hear you right now. Please ask your teacher for help.'
}

function voiceRequestMessage(error: unknown) {
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : ''
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  const status = error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
    ? error.status
    : 0
  if (status === 401 || status === 403) return 'Please sign in with a teacher account so Miss Julie can speak.'
  if (status) return `Miss Julie’s voice service returned an error (${status}). Please check the backend speech service.`
  if (name === 'TimeoutError' || message.includes('timed out')) return 'Miss Julie’s voice is taking too long. Please check the Azure voice connection, then try again.'
  if (message.includes('narration') || message.includes('audio response')) return 'Miss Julie’s voice could not play. Please check the browser sound and backend voice service.'
  return 'Miss Julie’s voice service could not be reached. Please start the backend, then try again.'
}

function encodeBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

export default function LevelExperience() {
  const reducedMotion = useReducedMotion()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const attemptsRef = useRef(0)
  const [caption, setCaption] = useState('Watch Miss Julie’s vowel lesson.')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const outcomeRef = useRef<Outcome | null>(outcome)
  outcomeRef.current = outcome
  const [error, setError] = useState('')
  const errorRef = useRef(error)
  errorRef.current = error
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const watcherRef = useRef<(() => void) | null>(null)
  const hardStopRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const voiceFailureRef = useRef('')
  const generationRef = useRef(0)
  const effectRunKeyRef = useRef('')
  const micStartingRef = useRef(false)
  const pausedForVisibilityRef = useRef(false)
  const speechFailuresRef = useRef(0)

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', syncFullscreen)
    syncFullscreen()
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  const stopAudio = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    audioRef.current = null
  }, [])

  const releaseMic = useCallback(() => {
    watcherRef.current?.()
    watcherRef.current = null
    if (hardStopRef.current !== null) window.clearTimeout(hardStopRef.current)
    hardStopRef.current = null
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') {
      recorder.onstop = null
      recorder.ondataavailable = null
      recorder.stop()
    }
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    chunksRef.current = []
  }, [])

  useEffect(() => () => {
    generationRef.current++
    abortRef.current?.abort()
    releaseMic()
    stopAudio()
  }, [releaseMic, stopAudio])

  useEffect(() => {
    const stopSession = () => {
      generationRef.current++
      abortRef.current?.abort()
      releaseMic()
      stopAudio()
    }
    const onVisibilityChange = () => {
      if (document.hidden) {
        pausedForVisibilityRef.current = true
        stopSession()
        setError('Miss Julie paused while you were away. She will continue when you return.')
        setCaption('I paused listening so your microphone is not used in the background.')
        setPhase('error')
      } else if (pausedForVisibilityRef.current) {
        pausedForVisibilityRef.current = false
        abortRef.current = new AbortController()
        speechFailuresRef.current = 0
        setError('')
        setPhase('teaching')
      }
    }
    const onSessionEnd = () => stopSession()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', stopSession)
    window.addEventListener(KG_SESSION_END_EVENT, onSessionEnd)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', stopSession)
      window.removeEventListener(KG_SESSION_END_EVENT, onSessionEnd)
    }
  }, [releaseMic, stopAudio])
  const playTeacherLine = useCallback(async (line: SpeechLine, target: Target | undefined, token: number) => {
    const activityId = line === 'intro' ? 'introduction' : target?.activityId || 'completion'
    voiceFailureRef.current = ''
    try {
      // Every teacher line owns the single audio channel; clear any previous source first.
      stopAudio()
      if (!audioRef.current) audioRef.current = new Audio()
      const audio = audioRef.current
      await playLevel6VowelSpeech(line, activityId, audio, abortRef.current?.signal)
      if (generationRef.current !== token) return false
      audioRef.current = audio
      return true
    } catch (error) {
      if (generationRef.current !== token) return false
      voiceFailureRef.current = error instanceof Error && error.name === 'NotAllowedError'
        ? 'Miss Julie’s audio is blocked. Allow sound for this browser tab, then try again.'
        : voiceRequestMessage(error)
    }
    return false
  }, [stopAudio])

  const finishAttempt = useCallback(async (blob: Blob, durationMs: number, mimeType: string, token: number, noSpeech: boolean) => {
    const target = TARGETS[index]
    setPhase('checking')
    setCaption('Miss Julie is listening carefully…')
    setOutcome(null)
    try {
      const body = noSpeech
        ? { activityId: target.activityId, durationMs: Math.max(250, Math.round(durationMs)), noSpeech: true }
        : { activityId: target.activityId, audioBase64: encodeBase64(new Uint8Array(await blob.arrayBuffer())), mimeType, durationMs: Math.max(250, Math.round(durationMs)) }
      const result = await apiClient<AttemptResult>('/kg-level4-preview/vowel/attempt', {
        method: 'POST', cache: 'no-store', signal: abortRef.current?.signal, body: JSON.stringify(body),
      })
      if (generationRef.current !== token) return
      speechFailuresRef.current = 0
      setOutcome(result.outcome)
      setCaption(scriptFor(result.outcome, target))
      setPhase('feedback')
    } catch {
      if (generationRef.current !== token) return
      setError('Miss Julie cannot check the answer right now. She will try again in a moment.')
      setCaption('Let’s have another try together.')
      setPhase('error')
    }
  }, [index])

  const startListening = useCallback(async (token: number) => {
    if (generationRef.current !== token || micStartingRef.current) return
    const target = TARGETS[index]
    micStartingRef.current = true
    try {
      const controller = abortRef.current || new AbortController()
      abortRef.current = controller
      const stream = await requestKGMicrophone(controller.signal)
      if (generationRef.current !== token || controller.signal.aborted) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      const supported = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
      const mimeType = supported.find((type) => MediaRecorder.isTypeSupported(type)) || ''
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      let heardSpeech = false
      let vadAvailable = true
      const startedAt = performance.now()
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data) }
      recorder.onerror = () => {
        if (generationRef.current !== token) return
        releaseMic()
        setError('The microphone stopped working. Miss Julie will try again in a moment.')
        setPhase('error')
      }
      recorder.onstop = () => {
        const elapsed = performance.now() - startedAt
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' })
        watcherRef.current?.()
        watcherRef.current = null
        if (hardStopRef.current !== null) window.clearTimeout(hardStopRef.current)
        hardStopRef.current = null
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        chunksRef.current = []
        if (generationRef.current !== token) return
        const noSpeech = (!heardSpeech && vadAvailable) || blob.size < 800
        void finishAttempt(blob, elapsed, blob.type || 'audio/webm', token, noSpeech)
      }
      recorder.start()
      setPhase('listening')
      setCaption(`Your turn! Make the ${target.ipa} sound for Miss Julie.`)
      watcherRef.current = watchVoiceActivity(stream, () => {
        if (recorder.state === 'recording') recorder.stop()
      }, {
        silenceMs: 1_050,
        minimumSpeechMs: 350,
        noSpeechTimeoutMs: 6_500,
        speechThreshold: 0.017,
        resumeContext: true,
        sampleIntervalMs: 50,
        onSpeech: () => { heardSpeech = true },
        onUnavailable: () => { vadAvailable = false },
      })
      hardStopRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, MAX_RECORDING_MS)
    } catch (cause) {
      if (generationRef.current !== token) return
      setError(micMessage(cause))
      setCaption('Miss Julie needs a little help with the microphone.')
      setPhase('error')
    } finally {
      micStartingRef.current = false
    }
  }, [finishAttempt, index, releaseMic])

  // Miss Julie speaks each prompt, listens automatically, gives feedback, then advances without lesson buttons.
  useEffect(() => {
    if (phase === 'intro') return
    const token = generationRef.current
    const runDetail = phase === 'feedback' ? attemptsRef.current + 1 : phase === 'teaching' ? attemptsRef.current + speechFailuresRef.current : phase === 'error' ? speechFailuresRef.current : 0
    const runKey = String(token) + ':' + phase + ':' + index + ':' + runDetail
    if (effectRunKeyRef.current === runKey) return
    effectRunKeyRef.current = runKey
    const target = TARGETS[index]
    const currentOutcome = outcomeRef.current
    const currentError = errorRef.current
    const run = async () => {
      if (phase === 'welcome') {
        setCaption(introText)
        const spoke = await playTeacherLine('intro', undefined, token)
        if (generationRef.current !== token) return
        if (spoke) setPhase('teaching')
        else {
          setError(voiceFailureRef.current || 'Miss Julie’s voice is unavailable. Please check the voice service, then try again.')
          setPhase('error')
        }
      } else if (phase === 'teaching') {
        setError('')
        setOutcome(null)
        setCaption(target.prompt)
        const speechLine = attemptsRef.current > 0 ? 'replay' : 'prompt'
        const spoke = await playTeacherLine(speechLine, target, token)
        if (generationRef.current !== token) return
        if (spoke) { await new Promise((resolve) => window.setTimeout(resolve, VOWEL_PAUSE_MS)); if (generationRef.current === token) await startListening(token) }
        else {
          setError(voiceFailureRef.current || 'Miss Julie voice is unavailable. Please check the voice service, then try again.')
          setPhase('error')
        }
      } else if (phase === 'feedback' && currentOutcome) {
        const count = attemptsRef.current + 1
        const spoke = await playTeacherLine(currentOutcome, target, token)
        if (generationRef.current !== token) return
        if (!spoke) {
          setError(voiceFailureRef.current || 'Miss Julie voice is unavailable. Please check the voice service, then try again.')
          setPhase('error')
          return
        }
        attemptsRef.current = count
        await new Promise((resolve) => window.setTimeout(resolve, VOWEL_PAUSE_MS))
        if (generationRef.current !== token) return
        if (currentOutcome === 'correct') {
          if (index === TARGETS.length - 1) {
            setCaption(completionText)
            setPhase('complete')
          } else {
            generationRef.current++
            setIndex((current) => current + 1)
            attemptsRef.current = 0
            setPhase('teaching')
          }
        } else {
          // Keep the learner on this card until the server confirms the full phrase.
          setPhase('teaching')
        }
      } else if (phase === 'complete') {
        setCaption(completionText)
        void playTeacherLine('complete', undefined, token)
      } else if (phase === 'error') {
        const micIssue = currentError.toLowerCase().includes('microphone')
        const spoke = await playTeacherLine(micIssue ? 'microphone-error' : 'provider-error', target, token)
        if (generationRef.current !== token) return
        // Wait for Miss Julie to finish the error message before retrying, so voices never overlap.
        await new Promise((resolve) => window.setTimeout(resolve, spoke ? VOWEL_PAUSE_MS : 1_000))
        if (generationRef.current !== token) return
        if (speechFailuresRef.current < 3) {
          speechFailuresRef.current++
          setError('')
          setPhase('teaching')
        }
      }
    }
    void run()
  }, [phase, index, playTeacherLine, startListening])

  const current = TARGETS[index]
  const characterState = phase === 'listening' ? 'listening' : phase === 'checking' ? 'thinking' : phase === 'complete' ? 'celebrating' : phase === 'feedback' ? outcome === 'correct' ? 'celebrating' : 'encouraging' : phase === 'error' ? 'encouraging' : 'speaking'
  const teacherMessage = phase === 'complete'
    ? 'Wonderful work! You learned all five short vowel sounds!'
    : phase === 'error'
      ? error || 'Let’s try that again together.'
      : phase === 'feedback'
        ? caption
        : phase === 'listening'
          ? `Your turn! Make the sound ${current.ipa}.`
          : phase === 'checking'
            ? 'Let me hear that…'
            : phase === 'welcome'
              ? 'Let’s learn the vowel sounds together!'
              : `Listen: ${current.letter} says ${current.ipa}.`

  return (
    <main
      className={`kg-alpha kg-alpha-play kg-level3-play kg-level6-vowel-play${isFullscreen ? ' is-fullscreen' : ''}`}
      data-phase={phase}
      aria-label="Level 6 Vowel Garden learning preview"
    >
      <Image className="kg-alpha-garden-art" src="/lessons/kg/images/level-1-meadow.png" alt="" fill priority sizes="100vw" />
      <div className="kg-alpha-garden-wash" aria-hidden="true" />
      {phase === 'intro' ? (
        <Level6VideoPreview onComplete={() => { generationRef.current++; setIndex(0); attemptsRef.current = 0; setError(''); setPhase('welcome') }} />
      ) : (
        <>
          <header className="kg-alpha-play-top">
            <span aria-hidden="true" />
            <div className="kg-alpha-progress-wrap" aria-label={`Vowel card ${phase === 'complete' ? TARGETS.length : index + 1} of ${TARGETS.length}`}>
              <span>VOWEL GARDEN · A, E, I, O, U</span>
              <div className="kg-alpha-step-bar" aria-hidden="true">
                {TARGETS.map((target, step) => <i key={target.letter} className={step < index || phase === 'complete' ? 'done' : step === index ? 'current' : ''} />)}
              </div>
            </div>
            <span className="kg-alpha-level-pill"><Sparkles size={15} /> STAFF-ONLY PREVIEW</span>
          </header>
          <div className="kg-alpha-scene">
            <aside className="kg-alpha-teacher">
              <div className="kg-alpha-teacher-glow" aria-hidden="true" />
              <AnimatedMissJulie state={characterState} reducedMotion={Boolean(reducedMotion)} />
              <div className="kg-alpha-speech" role={phase === 'error' ? 'alert' : 'status'} aria-live="polite">{teacherMessage}</div>
            </aside>
            <section className="kg-alpha-quest kg-alpha-teaching-board" aria-label="Vowel learning card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase === 'welcome' ? 'definition' : phase === 'complete' ? 'complete' : current.letter}
                  className="kg-alpha-learning kg-level3-learning kg-level6-vowel-learning"
                  initial={reducedMotion ? false : { opacity: 0, y: 18, scale: .97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: .42 }}
                >
                  <span className="kg-alpha-activity-label"><Sparkles size={17} /> {phase === 'complete' ? 'WONDERFUL WORK' : phase === 'welcome' ? 'MEET THE VOWELS' : 'LISTEN · FEEL · SAY THE SOUND'}</span>
                  {phase === 'welcome' ? (
                    <div className="kg-level6-vowel-definition">
                      <h1>What is a vowel?</h1>
                      <p>A vowel is a speech sound made with an open mouth, while the air flows freely.</p>
                      <div className="kg-level6-vowel-letters" aria-label="The five vowel letters">A · E · I · O · U</div>
                      <p>Listen to each short sound, then copy Miss Julie.</p>
                    </div>
                  ) : phase === 'complete' ? (
                    <div className="kg-level6-vowel-complete">
                      <h1>Vowel Garden complete!</h1>
                      <p>{completionText}</p>
                    </div>
                  ) : (
                    <>
                      <div className="kg-level6-vowel-sound-card" aria-label={'Vowel ' + current.letter + ', sound ' + current.ipa}>
                        <span className="kg-level6-vowel-letter">{current.letter}</span>
                        <span className="kg-level6-vowel-ipa">{current.ipa}</span>
                      </div>
                      <h1>Listen to the <strong>{current.letter}</strong> sound</h1>
                      <p className="kg-level6-vowel-cue">{current.cue}</p>
                      <span className="kg-level3-letter-count">{index + 1} of {TARGETS.length}</span>
                    </>
                  )}
                  {phase === 'welcome' || phase === 'teaching' || phase === 'checking' ? (
                    <div className="kg-alpha-status" role="status" aria-live="polite">
                      <LoaderCircle className="kg-spin" size={19} />
                      {phase === 'welcome' ? 'Miss Julie is speaking…' : phase === 'checking' ? 'Checking your sound…' : 'Listen, then copy the sound…'}
                    </div>
                  ) : null}
                  {phase === 'listening' ? <div className="kg-alpha-status kg-level6-vowel-listening" role="status"><Mic size={19} /> Miss Julie is listening</div> : null}
                  {phase === 'feedback' ? <div className="kg-alpha-status is-feedback" role="status">{caption}</div> : null}
                </motion.div>
              </AnimatePresence>
            </section>
          </div>
        </>
      )}
    </main>
  )
}

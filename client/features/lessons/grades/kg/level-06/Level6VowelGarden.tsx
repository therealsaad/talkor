'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { LoaderCircle, Mic, Sparkles } from 'lucide-react'
import { apiClient, apiClientBlob } from '@/lib/api-client'
import { KG_SESSION_END_EVENT, requestKGMicrophone } from '@/lib/kg-microphone'
import { watchVoiceActivity } from '@/lib/voice-activity'
import { AnimatedMissJulie } from '../level-01/components/AnimatedMissJulie'
import '../level-01/styles/kg-alphabet.css'
import '../level-01/styles/kg-level1-polish.css'
import '../level-03/level-03.css'
import './level-06.css'
import { Level6VideoPreview } from './Level6VideoPreview'

type Target = {
  activityId: string
  letter: string
  word: string
  image: string
  alt: string
  width: number
  height: number
  prompt: string
}

const TARGETS: Target[] = [
  { activityId: 'say-a-apple', letter: 'A', word: 'apple', image: '/lessons/kg/level-06/cards/a-apple.png', alt: 'Letter A for apple', width: 480, height: 455, prompt: 'Look at the picture. A for apple. Now you say: A for apple.' },
  { activityId: 'say-e-elephant', letter: 'E', word: 'elephant', image: '/lessons/kg/level-06/cards/e-elephant.png', alt: 'Letter E for elephant', width: 400, height: 500, prompt: 'Look at the picture. E for elephant. Now you say: E for elephant.' },
  { activityId: 'say-i-igloo', letter: 'I', word: 'igloo', image: '/lessons/kg/level-06/cards/i-igloo.png', alt: 'Letter I for igloo', width: 500, height: 540, prompt: 'Look at the picture. I for igloo. Now you say: I for igloo.' },
  { activityId: 'say-o-orange', letter: 'O', word: 'orange', image: '/lessons/kg/level-06/cards/o-orange.png', alt: 'Letter O for orange', width: 430, height: 530, prompt: 'Look at the picture. O for orange. Now you say: O for orange.' },
  { activityId: 'say-u-umbrella', letter: 'U', word: 'umbrella', image: '/lessons/kg/level-06/cards/u-umbrella.png', alt: 'Letter U for umbrella', width: 440, height: 400, prompt: 'Look at the picture. U for umbrella. Now you say: U for umbrella.' },
]
const VOWEL_PAUSE_MS = 5_000
const TEACHING_PLAYBACK_RATE = 0.85
const MAX_RECORDING_MS = 9_800
type Outcome = 'correct' | 'incorrect' | 'unclear' | 'silence'
type Phase = 'intro' | 'welcome' | 'teaching' | 'listening' | 'checking' | 'feedback' | 'complete' | 'error'
type AttemptResult = { outcome: Outcome }
type SpeechLine = 'intro' | 'prompt' | 'replay' | Outcome | 'complete' | 'microphone-error' | 'provider-error'

const introText = 'Hello, friend! Welcome to Vowel Garden in Rainbow Valley. Listen to Miss Julie, look at each picture, and say the letter and word with me. Ready? Let’s begin!'
const completionText = 'You did it! You learned A for apple, E for elephant, I for igloo, O for orange, and U for umbrella. Wonderful work, friend! See you next time in Rainbow Valley!'
function scriptFor(line: SpeechLine, target?: Target) {
  if (line === 'intro') return introText
  if (line === 'complete') return completionText
  if (line === 'microphone-error') return 'I can’t hear you yet. Please ask your teacher or grown-up to turn on the microphone, then try again.'
  if (line === 'provider-error') return 'I couldn’t check your answer just now. That’s not your fault. Let’s try again in a little while, or ask your teacher for help.'
  if (!target) return ''
  if (line === 'prompt') return target.prompt
  const phrase = `${target.letter} for ${target.word}`
  if (line === 'replay') return `Let’s listen once more. ${phrase}. Now you try: ${phrase}.`
  if (line === 'correct') return `You said ${phrase}! Wonderful speaking!`
  if (line === 'incorrect') return `Nice try! The phrase is ${phrase}. Listen: ${phrase}. You can try again when you’re ready.`
  if (line === 'silence') return `Take your time. When you’re ready, say ${phrase} after me.`
  return `I didn’t hear the whole phrase clearly. Listen once more, then try saying ${phrase}.`
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
  const status = error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
    ? error.status
    : 0
  if (status === 401 || status === 403) return 'Please sign in with a teacher account so Miss Julie can speak.'
  if (status) return `Miss Julie’s voice service returned an error (${status}). Please check the backend speech service.`
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
  const audioUrlRef = useRef<string | null>(null)
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
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = null
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
      const blob = await apiClientBlob(`/kg-level4-preview/vowel/speech/${line}/${activityId}`, {
        cache: 'no-store', signal: abortRef.current?.signal,
      })
      if (generationRef.current !== token) return false
      const url = URL.createObjectURL(blob)
      audioUrlRef.current = url
      const audio = new Audio(url)
      audio.muted = false
      audio.volume = 1
      audio.playbackRate = TEACHING_PLAYBACK_RATE
      audio.preservesPitch = true
      audioRef.current = audio
      const played = await new Promise<boolean>((resolve) => {
        audio.onended = () => resolve(true)
        audio.onerror = () => {
          voiceFailureRef.current = 'Miss Julie’s audio could not play. Check that this browser tab is unmuted.'
          resolve(false)
        }
        audio.onpause = () => resolve(false)
        void audio.play().then(() => undefined, () => {
          voiceFailureRef.current = 'Miss Julie’s audio is blocked. Allow sound for this browser tab, then try again.'
          resolve(false)
        })
      })
      if (audioRef.current === audio) audioRef.current = null
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      if (audioUrlRef.current === url) {
        URL.revokeObjectURL(url)
        audioUrlRef.current = null
      }
      if (generationRef.current !== token) return false
      if (played) return true
    } catch (error) {
      if (generationRef.current !== token) return false
      voiceFailureRef.current = voiceRequestMessage(error)
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
      setCaption(`Your turn! Say ${target.letter} for ${target.word} to Miss Julie.`)
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
        setAttempts(count)
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
    ? 'Wonderful work! You learned all five vowel words!'
    : phase === 'error'
      ? error || 'Let’s try that again together.'
      : phase === 'feedback'
        ? caption
        : phase === 'listening'
          ? `Your turn! Say ${current.letter} for ${current.word}.`
          : phase === 'checking'
            ? 'Let me hear that…'
            : phase === 'requesting'
              ? 'Get ready to say it with me!'
              : phase === 'welcome'
                ? 'Let’s learn our vowel words together!'
                : `Listen: ${current.letter} for ${current.word}.`

  return (
    <main
      className={`kg-alpha kg-alpha-play kg-level3-play kg-level6-vowel-play${isFullscreen ? ' is-fullscreen' : ''}`}
      data-phase={phase}
      aria-label="Level 6 Vowel Garden learning preview"
    >
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
                  key={phase === 'complete' ? 'complete' : current.letter}
                  className="kg-alpha-learning kg-level3-learning kg-level6-vowel-learning"
                  initial={reducedMotion ? false : { opacity: 0, y: 18, scale: .97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: .42 }}
                >
                  <span className="kg-alpha-activity-label"><Sparkles size={17} /> {phase === 'complete' ? 'WONDERFUL WORK' : 'LEARN THE VOWELS'}</span>
                  {phase === 'complete' ? (
                    <div className="kg-level6-vowel-complete">
                      <h1>Vowel Garden complete!</h1>
                      <p>{completionText}</p>
                    </div>
                  ) : (
                    <>
                      <div className="kg-level6-vowel-card-frame">
                        <Image
                          src={current.image}
                          alt={current.alt}
                          width={current.width}
                          height={current.height}
                          priority={index === 0}
                          sizes="(max-width: 760px) 88vw, 52vw"
                        />
                      </div>
                      <h1>Meet letter <strong>{current.letter}</strong></h1>
                      <p>{current.letter} for {current.word}.</p>
                      <span className="kg-level3-letter-count">{index + 1} of {TARGETS.length}</span>
                    </>
                  )}
                  {phase === 'welcome' || phase === 'teaching' || phase === 'requesting' || phase === 'checking' ? (
                    <div className="kg-alpha-status" role="status" aria-live="polite">
                      <LoaderCircle className="kg-spin" size={19} />
                      {phase === 'welcome' ? 'Miss Julie is speaking…' : phase === 'requesting' ? 'Starting microphone…' : phase === 'checking' ? 'Checking your answer…' : 'Listen, then say it with Miss Julie…'}
                    </div>
                  ) : null}
                  {phase === 'listening' ? <div className="kg-alpha-status kg-level6-vowel-listening" role="status"><Mic size={19} /> Miss Julie is listening</div> : null}
                  {phase === 'feedback' ? <div className="kg-alpha-status is-feedback" role="status">{caption}</div> : null}
                  {phase === 'error' ? <div className="kg-level6-vowel-error" role="alert">{error}</div> : null}
                </motion.div>
              </AnimatePresence>
            </section>
          </div>
        </>
      )}
    </main>
  )
}

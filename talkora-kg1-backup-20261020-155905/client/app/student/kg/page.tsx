'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Check, Headphones, LoaderCircle, Mic, Play, RotateCcw, RotateCw, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { watchVoiceActivity } from '@/lib/voice-activity'
import { kgAlphabetService, type KGAlphabetState, type KGOutcome, type KGPreparedAttempt, type KGAttemptResponse } from '@/services/kg-alphabet-service'
import { requestKGMicrophone, KG_SESSION_END_EVENT } from '@/lib/kg-microphone'
import { AnimatedMissJulie } from '@/components/student/kg/animated-miss-julie'
import { useKGAmbience } from '@/hooks/use-kg-ambience'
import { AUTH_INVALIDATED_EVENT, ApiError, getStoredToken, handleUnauthorizedResponse } from '@/lib/api-client'
import { makeKGPreviewState } from '@/services/kg-alphabet-preview'
import '@/components/student/kg/kg-alphabet.css'

const INTRO_VIDEO = '/kg/videos/fullkg.mp4'
const STEP_COUNT = 8
const LETTERS = ['A', 'B', 'C', 'D'] as const
const WORDS = ['apple', 'ball', 'cat', 'dog'] as const
const INTRO_PHASES = new Set(['intro', 'intro-playing', 'intro-paused', 'intro-error', 'saving-intro'])

type Phase = 'loading' | 'intro' | 'intro-playing' | 'intro-paused' | 'intro-error' | 'saving-intro' | 'ready' | 'julie' | 'listening' | 'checking' | 'touch' | 'feedback' | 'finished' | 'error'

function stepAt(index: number) {
  const letter = LETTERS[index % LETTERS.length]
  const word = WORDS[index % WORDS.length]
  const mode = index < 4 ? 'speak' as const : 'touch' as const
  return {
    index,
    letter,
    word,
    id: `${mode === 'speak' ? 'say' : 'find'}-${letter.toLowerCase()}`,
    mode,
    mastery: index === STEP_COUNT - 1,
  }
}

function audioForStep(index: number): string[] {
  const step = stepAt(index)
  if (step.mode === 'speak') {
    // One cheerful prompt instead of three slow Azure requests per letter.
    return [step.id]
  }
  return [...(index === 4 ? ['recognize-intro', 'puzzle-intro'] : []), step.id]
}

function friendlyAudioError() {
  return 'Miss Julie’s voice is taking a little rest. Tap Try again.'
}

function friendlyMicrophoneError(error: unknown) {
  const detail = error && typeof error === 'object' ? error as { name?: unknown; error?: { name?: unknown } } : null
  const name = typeof detail?.error?.name === 'string' ? detail.error.name : typeof detail?.name === 'string' ? detail.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Please allow microphone access so Miss Julie can hear you, then tap Try again.'
  if (name === 'NotFoundError') return 'I could not find a microphone. Connect one, then tap Try again.'
  if (name === 'NotReadableError' || name === 'AbortError') return 'The microphone is busy. Close another app using it, then tap Try again.'
  if (name === 'TimeoutError') return 'Please choose Allow for the microphone, then tap Try again.'
  if (name === 'NotSupportedError') return 'Please open the garden in a browser with microphone support.'
  return 'The microphone paused. Check it, then tap Try again when you are ready.'
}

export function KGAlphabetLesson({ preview = false, previewStartIndex = 0, onPreviewBack }: { preview?: boolean; previewStartIndex?: number; onPreviewBack?: () => void } = {}) {
  const params = useSearchParams()
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const replayRequest = params.get('replay')
  const replayIntroRequest = params.get('intro') === 'replay'
  const [data, setData] = useState<KGAlphabetState | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const { musicEnabled, setMusicEnabled, unlockMusic, silenceForMicrophone, beginVoice, stopMusic } = useKGAmbience(phase)
  const [index, setIndex] = useState(0)
  const [replay, setReplay] = useState(false)
  const [replayAll, setReplayAll] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [micError, setMicError] = useState('')
  const [videoError, setVideoError] = useState('')
  const [mapError, setMapError] = useState('')
  const [heardTranscript, setHeardTranscript] = useState('')
  const autoIntroAttemptRef = useRef(-1)
  const [videoAttempt, setVideoAttempt] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const introFrameRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopWatcher = useRef<(() => void) | null>(null)
  const hardStop = useRef<number | null>(null)
  const generation = useRef(0)
  const busy = useRef(false)
  const stateRef = useRef<KGAlphabetState | null>(null)
  const cursorRef = useRef(0)
  const replayRef = useRef(false)
  const replayAllRef = useRef(false)
  const introReplayRef = useRef(false)
  const introEndedRef = useRef(false)
  const introSavingRef = useRef(false)
  const maxVideoTimeRef = useRef(0)
  const lastValidVideoTimeRef = useRef(0)
  const silenceRetriesRef = useRef(0)
  const stepStartedAtRef = useRef(0)
  const retryListeningRef = useRef<(stepIndex: number, token: number) => void>(() => undefined)
  const requestRef = useRef<AbortController | null>(null)
  const micStartingRef = useRef(false)
  const pendingSubmissionRef = useRef<{ prepared: KGPreparedAttempt; stepIndex: number } | null>(null)
  const pendingResultRef = useRef<{ result: KGAttemptResponse; stepIndex: number } | null>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const currentStepTimeMs = () => Math.min(300000, Math.max(0, Math.round(performance.now() - stepStartedAtRef.current)))

  const stopRecording = useCallback(() => {
    stopWatcher.current?.()
    stopWatcher.current = null
    if (hardStop.current !== null) { window.clearTimeout(hardStop.current); hardStop.current = null }
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
  }, [])

  const releaseMic = useCallback(() => {
    stopWatcher.current?.()
    stopWatcher.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
    if (hardStop.current !== null) { window.clearTimeout(hardStop.current); hardStop.current = null }
  }, [])

  useEffect(() => {
    let alive = true
    // A new KG entry or explicit replay must never inherit an old finished-video flag.
    introEndedRef.current = false
    introSavingRef.current = false
    maxVideoTimeRef.current = 0
    lastValidVideoTimeRef.current = 0
    if (preview) {
      const state = makeKGPreviewState(previewStartIndex)
      setData(state); stateRef.current = state
      setIndex(previewStartIndex); cursorRef.current = previewStartIndex
      setReplay(false); replayRef.current = false
      setReplayAll(false); replayAllRef.current = false
      introReplayRef.current = false
      setPhase('intro')
      return () => { alive = false; generation.current++; window.speechSynthesis?.cancel(); stopRecording(); releaseMic() }
    }
    kgAlphabetService.state().then((state) => {
      if (!alive) return
      const letterReplayIndex = LETTERS.indexOf((replayRequest || '').toUpperCase() as typeof LETTERS[number])
      const all = replayRequest === 'all' && state.completed
      const single = letterReplayIndex >= 0 && state.currentIndex > letterReplayIndex
      const initial = all ? 0 : single ? letterReplayIndex : state.currentIndex
      const introReplay = replayIntroRequest && state.introSeen
      setData(state); stateRef.current = state
      setIndex(initial); cursorRef.current = initial
      setReplay(state.introSeen && (all || single)); replayRef.current = state.introSeen && (all || single)
      setReplayAll(state.introSeen && all); replayAllRef.current = state.introSeen && all
      introReplayRef.current = introReplay
      // Wait for the authenticated watch ticket BEFORE attempting automatic playback.
      // Every entry, including a replay, must complete a new server-side intro ticket.
      void kgAlphabetService.beginIntro().then(() => {
        if (alive) setPhase('intro')
      }).catch(() => {
        if (alive) { setVideoError('Could not prepare your full-screen story. Check the connection and reload.'); setPhase('intro-error') }
      })
    }).catch(() => {
      if (alive) { setFeedback('I couldn’t open your letter garden. Check your connection and try again.'); setPhase('error') }
    })
    return () => {
      alive = false
      generation.current++
      requestRef.current?.abort()
      pendingSubmissionRef.current = null; pendingResultRef.current = null
      kgAlphabetService.clearAudioCache()
      audioRef.current?.pause()
      stopMusic()
      window.speechSynthesis?.cancel()
      videoRef.current?.pause()
      if (document.fullscreenElement === introFrameRef.current) void document.exitFullscreen?.().catch(() => undefined)
      stopRecording()
      releaseMic()
    }
  }, [replayRequest, replayIntroRequest, stopRecording, releaseMic, stopMusic, preview, previewStartIndex])

  const isIntro = INTRO_PHASES.has(phase)
  useEffect(() => {
    if (!isIntro) return
    const htmlOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
    }
  }, [isIntro])

  useEffect(() => {
    const stopWhenHidden = () => {
      if (!document.hidden || (!micStartingRef.current && !['julie', 'listening', 'checking', 'feedback'].includes(phaseRef.current))) return
      generation.current++
      requestRef.current?.abort()
      stopRecording()
      releaseMic()
      audioRef.current?.pause()
      stopMusic()
      setFeedback('I paused the microphone when you left the garden. Tap Try again when you are ready.')
      setPhase('error')
    }
    const endSession = () => {
      generation.current++
      requestRef.current?.abort()
      pendingSubmissionRef.current = null; pendingResultRef.current = null
      stopRecording(); releaseMic(); audioRef.current?.pause(); stopMusic()
      window.speechSynthesis?.cancel()
      kgAlphabetService.clearAudioCache()
    }
    document.addEventListener('visibilitychange', stopWhenHidden)
    window.addEventListener('pagehide', endSession)
    window.addEventListener(AUTH_INVALIDATED_EVENT, endSession)
    window.addEventListener(KG_SESSION_END_EVENT, endSession)
    let expiryTimer: ReturnType<typeof setTimeout> | undefined
    if (!preview) {
      try {
        const payload = getStoredToken()?.split('.')[1]
        const exp = payload ? JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).exp : undefined
        if (typeof exp === 'number' && Number.isFinite(exp)) expiryTimer = setTimeout(() => {
          endSession(); handleUnauthorizedResponse(401)
        }, Math.min(2147483647, Math.max(0, exp * 1000 - Date.now())))
      } catch { /* JWT verification remains on the backend. */ }
    }
    return () => {
      clearTimeout(expiryTimer)
      document.removeEventListener('visibilitychange', stopWhenHidden)
      window.removeEventListener('pagehide', endSession)
      window.removeEventListener(AUTH_INVALIDATED_EVENT, endSession)
      window.removeEventListener(KG_SESSION_END_EVENT, endSession)
    }
  }, [releaseMic, stopRecording, stopMusic, preview])

  const playClip = useCallback(async (id: string) => {
    if (recorderRef.current?.state === 'recording' || micStartingRef.current) throw new Error('Recording must stop before playback')
    const releaseDucking = beginVoice()
    try {
      if (!audioRef.current) audioRef.current = new Audio()
      if (preview) await kgAlphabetService.previewPlay(id, audioRef.current, requestRef.current?.signal)
      else await kgAlphabetService.play(id, audioRef.current, stateRef.current?.audio[id]?.url, requestRef.current?.signal)
    } finally { releaseDucking() }
  }, [preview, beginVoice])

  const returnToMap = async () => {
    if (preview) { generation.current++; window.speechSynthesis?.cancel(); onPreviewBack?.(); return }
    generation.current++
    requestRef.current?.abort()
    requestRef.current = new AbortController()
    stopRecording()
    releaseMic()
    audioRef.current?.pause()
    stopMusic()
    setMapError('')
    // Never block the replay map behind an optional S3 navigation voice clip.
    router.push('/student/kg/map')
  }

  const beginStep = useCallback(async (stepIndex: number) => {
    if (stepIndex >= STEP_COUNT) { setPhase('finished'); return }
    const token = ++generation.current
    requestRef.current?.abort()
    requestRef.current = new AbortController()
    stopRecording(); releaseMic()
    pendingSubmissionRef.current = null; pendingResultRef.current = null
    busy.current = false
    silenceRetriesRef.current = 0
    stepStartedAtRef.current = performance.now()
    cursorRef.current = stepIndex; setIndex(stepIndex)
    setFeedback(''); setMicError(''); setHeardTranscript('')
    const openingAudio = stepIndex === 0 && replayAllRef.current ? ['replay-level'] : []
    setPhase('julie')
    try {
      // One short Azure line per step; don't queue many prerecorded clips.
      if (generation.current !== token) return
      for (const id of [...openingAudio, ...audioForStep(stepIndex)]) {
        await playClip(id)
        if (generation.current !== token) return
      }
      if (stepAt(stepIndex).mode === 'speak') await startListening(stepIndex, token)
      else setPhase('touch')
    } catch {
      if (generation.current !== token) return
      setFeedback('Miss Julie could not play audio. Check Azure Speech credentials on the backend and try again.')
      setPhase('error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playClip, preview])

  const finishIntro = useCallback(async () => {
    if (!introEndedRef.current || introSavingRef.current) return
    introSavingRef.current = true
    setPhase('saving-intro')
    setVideoError('')
    try {
      const existing = stateRef.current
      if (!preview) await kgAlphabetService.introSeen() // every visit completes its own server-side ticket
      const updated = existing ? { ...existing, introSeen: true } : null
      if (updated) { stateRef.current = updated; setData(updated) }
      if (document.fullscreenElement === introFrameRef.current) await document.exitFullscreen?.().catch(() => undefined)
      if (preview) {
        await beginStep(previewStartIndex)
      } else if (introReplayRef.current) {
        router.replace('/student/kg/map')
      } else if ((updated?.currentIndex ?? 0) >= STEP_COUNT) {
        setPhase('finished')
      } else {
        // Start ABCD immediately after the compulsory film; the browser may still
        // ask the child/teacher once for microphone permission.
        await beginStep(updated?.currentIndex ?? 0)
      }
    } catch {
      setVideoError('The story finished, but your progress did not save yet. Tap Continue to try again.')
      setPhase('intro-error')
    } finally {
      introSavingRef.current = false
    }
  }, [beginStep, preview, previewStartIndex, router])

  // Browsers allow Esc and OS/browser controls to exit Fullscreen API mode.
  // We cannot lock F11 from JavaScript. In a managed lab, run a real OS/browser kiosk.
  // In normal browsers, leaving fullscreen pauses playback and blocks advancement.
  useEffect(() => {
    if (!isIntro) return
    const fullscreenChanged = () => {
      const video = videoRef.current
      if (!video || introEndedRef.current) return
      if (document.fullscreenElement !== introFrameRef.current && !video.paused) {
        video.pause()
        setVideoError('Fullscreen was exited. Tap Continue full screen to resume the story.')
        setPhase('intro-paused')
      }
    }
    document.addEventListener('fullscreenchange', fullscreenChanged)
    document.addEventListener('webkitfullscreenchange', fullscreenChanged)
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChanged)
      document.removeEventListener('webkitfullscreenchange', fullscreenChanged)
    }
  }, [isIntro])

  const keepVideoUnskippable = () => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.currentTime)) return
    if (video.currentTime > maxVideoTimeRef.current + 1.25) {
      video.currentTime = lastValidVideoTimeRef.current
    }
  }

  const startVideo = async () => {
    const video = videoRef.current
    const frame = introFrameRef.current
    if (!preview && !kgAlphabetService.hasIntroTicket()) {
      setVideoError('The story is still preparing. Please wait a moment and try again.'); setPhase('intro-error'); return
    }
    if (!video || !frame) { setVideoError('The story is still loading. Please try again.'); setPhase('intro-error'); return }
    if (introEndedRef.current) { await finishIntro(); return }
    setVideoError('')
    try {
      // Both calls start during the same user gesture; browsers may otherwise
      // lose media-autoplay activation while waiting for Fullscreen API.
      if (document.fullscreenElement !== frame && !frame.requestFullscreen)
        throw new Error('Fullscreen is unavailable in this browser')
      video.playbackRate = 1
      const enterFullscreen = document.fullscreenElement === frame
        ? Promise.resolve()
        : frame.requestFullscreen({ navigationUI: 'hide' })
      const startPlayback = video.play()
      await Promise.all([enterFullscreen, startPlayback])
      setPhase('intro-playing')
    } catch {
      video.pause()
      setVideoError('Your browser needs one tap to enable fullscreen sound. Tap the story to begin.')
      setPhase('intro-error')
    }
  }

  // Best-effort direct entry. Browsers may require a real tap for unmuted media
  // and Fullscreen API; in managed labs, configure browser kiosk permissions.
  useEffect(() => {
    if (phase !== 'intro' || autoIntroAttemptRef.current === videoAttempt) return
    if (!preview && !kgAlphabetService.hasIntroTicket()) return
    autoIntroAttemptRef.current = videoAttempt
    void startVideo()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, videoAttempt, preview])

  const retryVideo = async () => {
    if (introEndedRef.current) { await finishIntro(); return }
    setVideoError('')
    maxVideoTimeRef.current = 0
    lastValidVideoTimeRef.current = 0
    setVideoAttempt((attempt) => attempt + 1)
    if (!preview && !kgAlphabetService.hasIntroTicket()) {
      try { await kgAlphabetService.beginIntro() }
      catch {
        setVideoError('Could not prepare your story. Check the connection and try again.')
        setPhase('intro-error')
        return
      }
    }
    setPhase('intro')
  }

  const sendPrepared = async (stepIndex: number, prepared: KGPreparedAttempt, token: number) => {
    if (generation.current !== token) return
    pendingSubmissionRef.current = { prepared, stepIndex }
    setPhase('checking')
    try {
      const response = preview
        ? await kgAlphabetService.previewSubmitPrepared(prepared, requestRef.current?.signal)
        : await kgAlphabetService.submitPrepared(prepared, requestRef.current?.signal)
      if (generation.current !== token) return
      const result: KGAttemptResponse = preview
        ? { ...response, state: stateRef.current || makeKGPreviewState(stepIndex), replay: false }
        : response as KGAttemptResponse
      pendingSubmissionRef.current = null
      pendingResultRef.current = { result, stepIndex }
      stateRef.current = result.state; setData(result.state)
      setHeardTranscript(result.transcript || '')
      await handleOutcome(result.outcome, stepIndex, token, result.feedbackAudioId, result.teachingHint, result.feedbackText, result.feedbackAudioBase64)
    } catch (error) {
      if (generation.current !== token) return
      if (error instanceof ApiError && error.status === 400) pendingSubmissionRef.current = null
      if (error instanceof ApiError && error.status === 409 && !(error.details as { retryable?: boolean } | undefined)?.retryable) {
        pendingSubmissionRef.current = null
        try {
          const saved = await kgAlphabetService.state()
          if (generation.current !== token) return
          stateRef.current = saved; setData(saved); cursorRef.current = saved.currentIndex; setIndex(saved.currentIndex)
          setPhase(saved.completed ? 'finished' : 'ready')
          return
        } catch { /* Keep a recoverable retry if refreshing state is also offline. */ }
      }
      setFeedback(error instanceof ApiError && error.status >= 500
        ? 'Speech recognition could not connect. Check Groq STT in the backend, then tap Try again.'
        : error instanceof ApiError && error.status === 403
          ? 'This microphone test needs a signed-in teacher or student.'
          : 'I couldn’t check that answer. Tap Try again.')
      setPhase('error')
    }
  }

  const submitSpeech = useCallback(async (stepIndex: number, blob: Blob | undefined, durationMs: number, timeSpentMs: number, token: number, noSpeech?: boolean) => {
    try {
      const prepared = await kgAlphabetService.prepare({ activityId: stepAt(stepIndex).id, replay: replayRef.current, audio: blob, durationMs, timeSpentMs, noSpeech })
      await sendPrepared(stepIndex, prepared, token)
    } catch {
      if (generation.current === token) { setFeedback('The recording needs another try.'); setPhase('error') }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playClip])

  const startListening = useCallback(async (stepIndex: number, token: number) => {
    if (generation.current !== token) return
    if (recorderRef.current?.state === 'recording' || micStartingRef.current) return
    silenceForMicrophone()
    if (audioRef.current && !audioRef.current.paused) return
    micStartingRef.current = true
    try {
      const signal = requestRef.current?.signal
      if (!signal) return
      const stream = await requestKGMicrophone(signal)
      if (generation.current !== token) { stream.getTracks().forEach((track) => track.stop()); return }
      streamRef.current = stream
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
      const mimeType = types.find((type) => MediaRecorder.isTypeSupported(type)) || ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      const chunks: Blob[] = []
      const startedAt = performance.now()
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = (event) => { recorder.onstop = null; stopRecording(); releaseMic(); if (generation.current === token) { const message = friendlyMicrophoneError(event); setMicError(message); setFeedback(message); setPhase('error') } }
      recorder.onstop = () => {
        const duration = Math.min(11900, Math.max(250, Math.round(performance.now() - startedAt)))
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
        releaseMic()
        if (generation.current !== token) return
        if (blob.size < 800) {
          void submitSpeech(stepIndex, undefined, duration, currentStepTimeMs(), token, true)
          return
        }
        silenceRetriesRef.current = 0
        void submitSpeech(stepIndex, blob, duration, currentStepTimeMs(), token)
      }
      recorder.start()
      setPhase('listening')
      stopWatcher.current = watchVoiceActivity(stream, () => { if (recorder.state === 'recording') recorder.stop() },
        { silenceMs: 1100, minimumSpeechMs: 350, noSpeechTimeoutMs: 6500, speechThreshold: .017,
          resumeContext: true, sampleIntervalMs: 50, onUnavailable: () => undefined })
      hardStop.current = window.setTimeout(() => { if (recorder.state === 'recording') recorder.stop() }, 9800)
    } catch (error) {
      releaseMic()
      if (generation.current === token) {
        const message = friendlyMicrophoneError(error)
        setMicError(message)
        setFeedback(message)
        setPhase('error')
      }
    } finally { micStartingRef.current = false }
  }, [playClip, releaseMic, submitSpeech, silenceForMicrophone, preview])

  retryListeningRef.current = (stepIndex, token) => { void startListening(stepIndex, token) }

  const speakFeedback = async (audioId: string, audioBase64?: string | null) => {
    if (!audioBase64) return playClip(audioId)
    const releaseDucking = beginVoice()
    try {
      if (!audioRef.current) audioRef.current = new Audio()
      await kgAlphabetService.playFeedback(audioBase64, audioRef.current, requestRef.current?.signal)
    } finally { releaseDucking() }
  }

  const handleOutcome = async (outcome: KGOutcome, stepIndex: number, token: number, serverFeedbackId?: string,
    teachingHint?: string | null, feedbackText?: string, feedbackAudioBase64?: string | null) => {
    if (generation.current !== token) return
    const success = outcome === 'correct'
    const feedbackId = serverFeedbackId || (success ? 'great' : outcome === 'unclear' ? 'repeat' : 'try-again')
    if (feedbackId === 'silence') {
      const retryNumber = silenceRetriesRef.current++
      setFeedback(retryNumber < 2 ? 'Take your time, then say the word!' : 'That was quiet. Tap Try again when you are ready.')
      setPhase(retryNumber < 2 ? 'julie' : 'error')
      if (retryNumber < 2) {
        try {
          await speakFeedback('silence', feedbackAudioBase64)
          if (generation.current !== token) return
          pendingResultRef.current = null
          stepStartedAtRef.current = performance.now()
          retryListeningRef.current(stepIndex, token)
        } catch { if (generation.current === token) { silenceRetriesRef.current = Math.max(0, silenceRetriesRef.current - 1); setFeedback(friendlyAudioError()); setPhase('error') } }
      } else pendingResultRef.current = null
      return
    }
    setFeedback(feedbackText || (success ? 'Wonderful! You found it!' : teachingHint || (outcome === 'unclear' ? 'Let’s try that word together.' : 'Good try! Listen and have another go!')))
    setPhase('feedback')
    try { await speakFeedback(feedbackId, feedbackAudioBase64) }
    catch {
      if (generation.current !== token) return
      setFeedback('Miss Julie could not play audio. Check Azure Speech credentials on the backend and try again.')
      setPhase('error')
      return
    }
    if (generation.current !== token) return
    if (!success) { await beginStep(stepIndex); return }
    const nextIndex = preview || replayRef.current ? stepIndex + 1 : stateRef.current?.currentIndex ?? stepIndex
    if (preview && stateRef.current) { stateRef.current = { ...stateRef.current, currentIndex: nextIndex }; setData(stateRef.current) }
    if (replayRef.current && !replayAllRef.current) { pendingResultRef.current = null; setPhase('finished'); return }
    if (nextIndex >= STEP_COUNT) {
      try { await playClip('level-complete'); await playClip('celebrate') }
      catch {
        if (generation.current !== token) return
        setFeedback(friendlyAudioError())
        setPhase('error')
        return
      }
      // The child has already mastered the activities. A missing homework
      // audio object must not erase progress or trap them in an error state.
      if (generation.current !== token) return
      pendingResultRef.current = null; setPhase('finished')
      try { await playClip('homework-abcd') } catch { /* printed homework remains visible */ }
      return
    }
    await beginStep(nextIndex)
  }

  const startAdventure = async () => {
    if (busy.current || !stateRef.current) return
    if (!preview && !stateRef.current.introSeen) { setPhase('intro'); return }
    unlockMusic() // authorized by the Start/Continue click; never autoplay during the intro
    if (cursorRef.current >= STEP_COUNT) { setPhase('finished'); return }
    busy.current = true
    const requestToken = ++generation.current
    requestRef.current?.abort()
    requestRef.current = new AbortController()
    setMicError('')
    try {
      if (stepAt(cursorRef.current).mode === 'speak') {
        silenceForMicrophone()
        micStartingRef.current = true
        const permission = await requestKGMicrophone(requestRef.current.signal)
        permission.getTracks().forEach((track) => track.stop())
        micStartingRef.current = false
      }
      if (generation.current !== requestToken) return
      await beginStep(cursorRef.current)
    } catch (error) {
      if (generation.current === requestToken) {
        const message = friendlyMicrophoneError(error)
        setMicError(message)
        setFeedback(message)
        setPhase('error')
      }
    } finally { busy.current = false; micStartingRef.current = false }
  }

  const retryLesson = async () => {
    if (busy.current) return
    const pending = pendingSubmissionRef.current
    const result = pendingResultRef.current
    if (!pending && !result) { await startAdventure(); return }
    busy.current = true
    const token = ++generation.current
    requestRef.current?.abort(); requestRef.current = new AbortController()
    try {
      if (pending) await sendPrepared(pending.stepIndex, pending.prepared, token)
      else if (result) await handleOutcome(result.result.outcome, result.stepIndex, token, result.result.feedbackAudioId, result.result.teachingHint, result.result.feedbackText, result.result.feedbackAudioBase64)
    } finally { busy.current = false }
  }

  const choosePicture = async (selected: string) => {
    if (busy.current || phase !== 'touch') return
    busy.current = true
    const stepIndex = cursorRef.current
    const token = generation.current
    setPhase('checking')
    try {
      if (!preview) {
        const prepared = await kgAlphabetService.prepare({ activityId: stepAt(stepIndex).id, replay: replayRef.current, selected, timeSpentMs: currentStepTimeMs() })
        await sendPrepared(stepIndex, prepared, token)
        return
      }
      const prepared = await kgAlphabetService.prepare({ activityId: stepAt(stepIndex).id, replay: false, selected, timeSpentMs: currentStepTimeMs() })
      await sendPrepared(stepIndex, prepared, token)
    } catch {
      if (generation.current === token) { setFeedback('The garden needs a moment. Tap Try again to stay on this puzzle.'); setPhase('error') }
    } finally { busy.current = false }
  }

  const current = index < STEP_COUNT ? stepAt(index) : null
  const isPictureRound = current?.mode === 'touch'

  if (isIntro) return <section className={`kg-intro-cinema ${phase === 'intro-playing' ? 'is-video-playing' : ''}`} ref={introFrameRef} role="dialog" aria-modal="true" aria-label="Miss Julie’s full Level 1 story">
    <Image className="kg-intro-cinema__garden" src="/kg/images/garden-story.webp" alt="" fill priority sizes="100vw" />
    <div className="kg-intro-cinema__shade" aria-hidden="true" />
    <header className="kg-intro-cinema__header">
      <span className="kg-intro-brand"><Sparkles size={18} /> MISS JULIE’S PICTURE GARDEN</span>
      <span className="kg-intro-level">LEVEL 1 · A B C D</span>
    </header>
    <div className="kg-intro-cinema__content">
      <div className="kg-intro-cinema__title">
        <span>YOUR STORY ADVENTURE</span>
        <h1>A little garden magic</h1>
        <p>Meet the letters before your picture adventure begins.</p>
      </div>
      <div className="kg-intro-video-frame">
        <video
          key={videoAttempt}
          ref={videoRef}
          src={INTRO_VIDEO}
          playsInline
          preload="metadata"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={(event) => event.preventDefault()}
          onSeeking={keepVideoUnskippable}
          onRateChange={() => { if (videoRef.current && videoRef.current.playbackRate !== 1) videoRef.current.playbackRate = 1 }}
          onTimeUpdate={() => {
            const video = videoRef.current
            if (!video || video.seeking) return
            if (video.currentTime <= maxVideoTimeRef.current + 1.25) {
              maxVideoTimeRef.current = Math.max(maxVideoTimeRef.current, video.currentTime)
              lastValidVideoTimeRef.current = video.currentTime
            } else keepVideoUnskippable()
          }}
          onPlay={() => setPhase('intro-playing')}
          onPause={() => { if (!introEndedRef.current) setPhase((value) => value === 'intro-playing' ? 'intro-paused' : value) }}
          onEnded={() => {
            const video = videoRef.current
            // A legitimate media-ended event is the sole progression trigger.
            if (!video || !Number.isFinite(video.duration) || video.duration <= 0 ||
                maxVideoTimeRef.current < video.duration - 1.5 ||
                document.fullscreenElement !== introFrameRef.current) {
              setVideoError('The video ended outside fullscreen. Tap Try the story again to watch it completely.')
              setPhase('intro-error')
              return
            }
            introEndedRef.current = true; void finishIntro()
          }}
          onError={() => { setVideoError('The story could not load. Check your connection, then try again.'); setPhase('intro-error') }}
          aria-label="Full-screen Miss Julie Picture Garden introduction"
        />
      </div>
      <div className="kg-intro-cinema__controls">
        {videoError ? <p className="kg-friendly-alert" role="alert">{videoError}</p> : null}
        {phase === 'saving-intro' ? <p className="kg-intro-saving" role="status"><LoaderCircle size={20} /> Saving your story progress…</p> : null}
        {phase === 'intro-paused' ? <button type="button" className="kg-story-play" onClick={() => void startVideo()}><Play size={19} fill="currentColor" /> Continue full screen</button> : null}
        {phase === 'intro' ? <p className="kg-intro-saving" role="status">Opening your fullscreen story…</p> : null}
        {phase === 'intro-error' && !introEndedRef.current ? <button type="button" className="kg-story-play" onClick={() => { if (kgAlphabetService.hasIntroTicket()) void startVideo(); else void retryVideo() }}><Play size={19} /> Tap to allow fullscreen</button> : null}
        {phase === 'intro-error' && introEndedRef.current ? <button type="button" className="kg-story-play" onClick={retryVideo}><Check size={19} /> Save and continue</button> : null}
      </div>
    </div>
    <div className="kg-alpha-rotate-lock" aria-hidden="true"><RotateCw size={38} /><strong>Rotate your phone</strong><span>Turn your screen sideways for Miss Julie’s story.</span></div>
  </section>

  return <main className={`kg-alpha kg-alpha-play ${preview ? 'is-preview' : ''}`} aria-label="ABCD Picture Garden with Miss Julie">
    <Image className="kg-alpha-garden-art" src="/kg/images/garden-story.webp" alt="" fill priority sizes="100vw" />
    <div className="kg-alpha-garden-wash" aria-hidden="true" />
    <header className="kg-alpha-play-top">
      {preview ? <button type="button" className="kg-alpha-map-link" onClick={() => { generation.current++; window.speechSynthesis?.cancel(); onPreviewBack?.() }}><ArrowLeft size={18} /> Preview map</button> : <button type="button" className="kg-alpha-map-link" onClick={() => void returnToMap()}><ArrowLeft size={18} /> My garden</button>}
      <div className="kg-alpha-progress-wrap" aria-label={`${Math.min(index, STEP_COUNT)} of ${STEP_COUNT} garden adventures`}>
        <span>LEVEL 1 · ABCD</span>
        <div className="kg-alpha-step-bar">{Array.from({ length: STEP_COUNT }, (_, i) => <i key={i} className={i < index ? 'done' : i === index ? 'current' : ''} />)}</div>
      </div>
      <div className="kg-alpha-audio-actions">
        <button type="button" className="kg-alpha-music-toggle" onClick={() => setMusicEnabled((enabled) => !enabled)} aria-pressed={musicEnabled} aria-label={musicEnabled ? 'Mute background music' : 'Enable background music'} title="Music only — Miss Julie’s voice stays on">
          {musicEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} <span>Music {musicEnabled ? 'on' : 'off'}</span>
        </button>
        {data?.introSeen && !preview ? <Link className="kg-alpha-replay-intro" href="/student/kg?intro=replay"><RotateCw size={16} /> Replay story</Link> : <span className="kg-alpha-level-pill"><Sparkles size={15} /> LETTER GARDEN</span>}
      </div>
    </header>

    {mapError ? <p className="kg-alpha-recoverable" role="alert">{mapError}</p> : null}
    {preview ? <div className="kg-alpha-preview-tag"><Sparkles size={14} /> SCHOOL PREVIEW · practice only</div> : null}

    {phase === 'loading' ? <div className="kg-alpha-loading"><LoaderCircle className="kg-spin" size={26} /> Opening your garden…</div> : phase === 'finished' ? <motion.section className="kg-alpha-finish" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="kg-alpha-finish__art"><AnimatedMissJulie state="celebrating" reducedMotion={Boolean(reduceMotion)} /></div>
      <div className="kg-alpha-finish__card"><span className="kg-alpha-eyebrow"><Sparkles size={18} /> GARDEN MASTER</span><h1>You did it!</h1><p>You learned A, B, C and D. Miss Julie is so proud of you!</p>
        {preview ? <button type="button" className="kg-story-play" onClick={onPreviewBack}><Check size={20} /> Back to the map</button> : <Link className="kg-story-play" href="/student/kg/map"><Check size={20} /> Back to my garden</Link>}
        <div className="kg-alpha-homework" role="note"><strong>🏡 Your tiny homework</strong><p>Find an apple, a ball, a cat or a dog picture at home. Say its name and its first letter!</p><button type="button" className="kg-alpha-hear-again" onClick={() => void playClip('homework-abcd').catch(() => setFeedback(friendlyAudioError()))}><Volume2 size={16} /> Hear homework again</button>{feedback === friendlyAudioError() ? <p role="alert">{feedback}</p> : null}</div>
      </div>
    </motion.section> : phase === 'error' && !current ? <section className="kg-alpha-error" role="alert"><Image src="/miss-julie-welcome.webp" alt="Miss Julie is here to help" width={170} height={210} /><div><h1>Let’s try that again</h1><p>{feedback}</p><button type="button" className="kg-story-play" onClick={() => window.location.reload()}><RotateCw size={18} /> Try again</button></div></section> : <>
      <div className="kg-alpha-scene">
        <aside className={`kg-alpha-teacher ${phase === 'julie' ? 'is-speaking' : ''}`}>
          <div className="kg-alpha-teacher-glow" aria-hidden="true" />
          <AnimatedMissJulie
            state={phase === 'julie' ? 'speaking' : phase === 'listening' ? 'listening' : phase === 'checking' ? 'thinking' : phase === 'feedback' ? 'encouraging' : phase === 'finished' ? 'celebrating' : isPictureRound ? 'pointing' : 'idle'}
            reducedMotion={Boolean(reduceMotion)}
          />
          <div className="kg-alpha-speech" role="status" aria-live="polite">
            {phase === 'error' ? feedback : phase === 'julie' ? 'Listen close, superstar!' : phase === 'listening' ? 'Your turn! Say the word to Miss Julie.' : phase === 'checking' ? 'Let me hear that…' : phase === 'feedback' ? feedback : phase === 'ready' ? 'Ready for your next garden adventure?' : current ? data?.audio[current.id]?.text || `Let’s learn ${current.letter}!` : 'Welcome to your garden!'}
            {phase === 'listening' ? <span className="kg-alpha-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span> : null}
          </div>
        </aside>

        <section className="kg-alpha-quest kg-alpha-teaching-board" aria-label="Miss Julie’s interactive teaching board">
          <AnimatePresence mode="wait">
            {current && !isPictureRound ? <motion.div key={current.id} className="kg-alpha-learning" initial={reduceMotion ? false : { opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: -10 }} transition={{ duration: .32 }}>
              <span className="kg-alpha-activity-label"><Headphones size={17} /> LISTEN · LEARN · SAY IT</span>
              <div className="kg-alpha-lesson-art kg-board-lesson" style={{ '--letter-color': data?.letters.find((item) => item.letter === current.letter)?.color || '#ef8cad' } as React.CSSProperties}>
                <button type="button" className="kg-alpha-letter-orb kg-board-tappable"
                  aria-label={`Hear the letter ${current.letter} again`} title="Touch the letter to hear it again"
                  disabled={phase === 'listening' || phase === 'julie' || phase === 'checking'}
                  onClick={() => void beginStep(cursorRef.current)}><span>{current.letter}</span><small>{current.letter} is for</small></button>
                <button type="button" className="kg-board-object kg-board-tappable"
                  aria-label={`Hear ${current.word} again`} title={`Touch ${current.word} to hear it again`}
                  disabled={phase === 'listening' || phase === 'julie' || phase === 'checking'}
                  onClick={() => void beginStep(cursorRef.current)}>
                  <Image src={`/kg/pictures/level-1/${current.word}.webp`} alt={`A friendly 3D cartoon ${current.word}`} width={480} height={450} priority sizes="(max-width: 760px) 42vw, 360px" />
                </button>
              </div>
              <h1><span>{current.letter}</span> for <strong>{current.word}!</strong></h1>
              <p>Listen to Miss Julie, then say <b>{current.word}</b>.</p>
              {phase === 'ready' ? <button type="button" className="kg-story-play" onClick={() => void startAdventure()}><Mic size={20} /> Allow microphone &amp; {index ? 'continue' : 'start'}</button> : null}
              {phase === 'error' ? <button type="button" className="kg-story-play" onClick={() => void retryLesson()}><RotateCw size={19} /> Try again</button> : null}
              {phase === 'listening' ? <button type="button" className="kg-mic-pulse" onClick={stopRecording} aria-label="Finish recording my answer"><Mic size={22} /><span>Done speaking</span></button> : null}
              {phase === 'julie' || phase === 'checking' ? <div className="kg-alpha-status"><LoaderCircle className="kg-spin" size={19} /> {phase === 'julie' ? 'Miss Julie is speaking…' : 'Listening to your answer…'}</div> : null}
              {heardTranscript ? <p className="kg-alpha-heard">Miss Julie heard: “{heardTranscript}”</p> : null}
              {phase === 'feedback' ? <div className="kg-alpha-status is-feedback"><Sparkles size={18} /> {feedback}</div> : null}
            </motion.div> : current && isPictureRound ? <motion.div key={current.id} className="kg-alpha-recognition" initial={reduceMotion ? false : { opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: -10 }} transition={{ duration: .32 }}>
              <span className="kg-alpha-activity-label"><Sparkles size={17} /> {current.mastery ? 'FINAL MASTERY PUZZLE' : 'MIXED PICTURE REVIEW'}</span>
              <h1>{current.mastery ? 'One last picture puzzle!' : 'Can you find it?'}</h1>
              <p>Listen to Miss Julie, then touch the picture.</p>
              <div className="kg-alpha-puzzle" aria-label={current.mastery ? 'Final mastery picture puzzle' : 'Mixed picture choices'}>
                {(data?.letters || []).map((item, optionIndex, values) => {
                  const rotate = (index - 4) % values.length
                  const option = values[(optionIndex + rotate) % values.length]
                  return <motion.button key={`${current.id}-${option.letter}`} type="button" whileHover={reduceMotion ? undefined : { y: -4, scale: 1.025 }} whileTap={{ scale: .96 }} disabled={phase !== 'touch'} onClick={() => void choosePicture(option.word)} aria-label={`Touch the ${option.word}`}>
                    <Image src={`/kg/pictures/level-1/${option.word}.webp`} alt={`3D cartoon ${option.word}`} width={480} height={450} sizes="(max-width: 760px) 37vw, 230px" />
                    <span>{option.word}</span>
                  </motion.button>
                })}
              </div>
              {phase === 'touch' ? <div className="kg-alpha-status"><Volume2 size={18} /> Touch one picture</div> : phase === 'julie' || phase === 'checking' ? <div className="kg-alpha-status"><LoaderCircle className="kg-spin" size={19} /> {phase === 'julie' ? 'Miss Julie is speaking…' : 'Checking your picture…'}</div> : null}
              {phase === 'feedback' ? <div className="kg-alpha-status is-feedback"><Sparkles size={18} /> {feedback}</div> : null}
              {phase === 'ready' ? <button type="button" className="kg-story-play" onClick={() => void startAdventure()}><Play size={19} /> Continue picture garden</button> : null}
              {phase === 'error' ? <button type="button" className="kg-story-play" onClick={() => void retryLesson()}><RotateCw size={19} /> Try again</button> : null}
            </motion.div> : <motion.div key="ready" className="kg-alpha-ready" initial={reduceMotion ? false : { opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}>
              <span className="kg-alpha-activity-label"><Sparkles size={17} /> YOUR ADVENTURE IS READY</span>
              <div className="kg-alpha-ready-letters">{LETTERS.map((letter) => <span key={letter}>{letter}</span>)}</div>
              <h1>Let’s play in the garden!</h1><p>Miss Julie is ready to learn with you.</p>
              <button type="button" className="kg-story-play" onClick={() => void startAdventure()}><Play size={20} fill="currentColor" /> {index ? 'Continue my adventure' : 'Start my adventure'}</button>
            </motion.div>}
          </AnimatePresence>
        </section>
      </div>
      {phase === 'error' && current ? <div className="kg-alpha-recoverable" role="alert"><span>{feedback}</span>{isPictureRound ? null : <button type="button" onClick={() => void retryLesson()}>Try again</button>}</div> : null}
      {(phase === 'listening' || phase === 'touch') && <button type="button" className="kg-alpha-hear-again" onClick={() => { generation.current++; audioRef.current?.pause(); stopRecording(); releaseMic(); void beginStep(cursorRef.current) }}><Volume2 size={17} /> Hear Julie again</button>}
    </>}
    <div className="kg-alpha-rotate-lock" aria-hidden="true"><RotateCw size={38} /><strong>Rotate your phone</strong><span>Turn your screen sideways to play in the garden.</span></div>
  </main>
}

export default function KGAlphabetLessonPage() {
  return <Suspense fallback={<main className="kg-alpha kg-alpha-loading"><LoaderCircle className="kg-spin" size={24} /> Opening your garden…</main>}><KGAlphabetLesson /></Suspense>
}

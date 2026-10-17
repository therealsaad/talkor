'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { watchVoiceActivity } from '@/lib/voice-activity'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, BookOpen, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import type { ActivityItem } from '@/services/curriculum-service'
import { voiceService, type VoiceAIResponse, type VoicePriority } from '@/services/voice-service'
import { useMissJulieVoice } from '@/hooks/use-miss-julie-voice'
import { LessonHud } from '@/components/student/lesson/lesson-hud'
import { LessonWorld, TalkoraWorldLoader } from '@/components/student/lesson/lesson-world'
import type { ActivityResponsePhase } from '@/components/student/lesson/activity-response'
import { resolveStageLabel, resolveWorldForLevel } from '@/components/student/worlds/world-config'
import type { JulieVisualState } from '@/components/student/lesson/miss-julie-character'
import { getWarmupPrompts, isWarmupActivity, resolveActivityTeacherLine, warmupQuestion } from '@/services/lesson-presentation'
import { progressService } from '@/services/progress-service'
import { firstUnfinishedActivity, isOpenLessonConversation, personalizeLessonText, shouldUseLessonVoice } from '@/services/lesson-progress'
import { KGLessonIntro } from '@/components/student/lesson/kg-lesson-intro'

/**
 * Local matching for spoken answers to published lesson choices.
 * Only determines which visible option the child *said*; correctness is
 * ALWAYS checked by the existing backend attempt endpoint.
 * No AI call and no answer key is shipped to the browser.
 */
const WORD_NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

function normalizeSpokenWords(value: string): string {
  return String(value || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

/** Returns a choice label only when the transcript identifies exactly one option. */
function matchSpokenChoice(transcript: string, choices: readonly string[]): string | null {
  const spoken = normalizeSpokenWords(transcript)
  if (!spoken || !choices.length) return null
  const cleaned = choices.map(normalizeSpokenWords)
  const hits = new Set<number>()
  // If multiple answer labels occur, do not guess and accidentally score one.
  cleaned.forEach((answer, index) => {
    if (answer && (` ${spoken} `).includes(` ${answer} `)) hits.add(index)
  })
  if (hits.size === 1) return choices[[...hits][0]]
  if (hits.size > 1) return null

  // "number two", "option 2", "second one" work for visual/MCQ choices.
  const ordinal = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']
  const positionHits = new Set<number>()
  for (let index = 0; index < Math.min(choices.length, 6); index++) {
    const number = index + 1
    const word = WORD_NUMBERS[number]
    if (new RegExp(`\\b(?:option|number|choice|picture) (?:${number}|${word})\\b`).test(spoken) ||
        new RegExp(`\\b${ordinal[index]} (?:one|option|picture)?\\b`).test(spoken)) {
      positionHits.add(index)
    }
  }
  if (positionHits.size === 1) return choices[[...positionHits][0]]
  if (positionHits.size > 1) return null
  const bareNumber = WORD_NUMBERS.indexOf(spoken)
  if (bareNumber >= 1 && bareNumber <= choices.length) return choices[bareNumber - 1]
  if (/^[1-6]$/.test(spoken) && Number(spoken) <= choices.length) return choices[Number(spoken) - 1]
  return null
}

function matchSpokenYesNo(transcript: string): boolean | null {
  const spoken = normalizeSpokenWords(transcript)
  if (!spoken) return null
  if (/\b(no|nope|nah|dont|don t|do not|not really|i dislike)\b/.test(spoken)) return false
  if (/\b(yes|yeah|yep|sure|i do|i like|i love)\b/.test(spoken)) return true
  return null
}

function isReplayCommand(text: string): boolean {
  return /^(repeat|repeat please|say again|again please|once more|please repeat|can you repeat)$/.test(normalizeSpokenWords(text))
}

/** Commands are exact phrases so ordinary lesson answers are never intercepted. */
function isExitLessonCommand(text: string): boolean {
  return /^(stop lesson|exit lesson|end lesson|go home|finish lesson)$/.test(normalizeSpokenWords(text))
}

export interface LessonExperienceProps {
  activities: ActivityItem[]
  levelTitle?: string
  syllabusName?: string
  levelNumber?: number
  avatarType?: 'BOY' | 'GIRL'
  studentName?: string
  introVideoKey?: string
  onLessonComplete?: (xpEarned: number) => void
  completedActivityIds?: string[]
}

type ConversationPhase = 'entering' | 'julie_preparing' | 'julie_speaking' | 'waiting_for_student' | 'student_recording' | 'transcribing' | 'student_submitted' | 'julie_thinking' | 'julie_text_ready' | 'julie_audio_pending' | 'retry_required' | 'hinting' | 'transitioning' | 'activity_complete' | 'lesson_complete' | 'recoverable_error'
type ExperienceState = ConversationPhase
type Evidence = { skill: string; utterance: string; support: 'INDEPENDENT' | 'SUPPORTED' }
type TeacherTurn = {
  id: string
  text: string
  emotion?: JulieVisualState
  intent?: 'ask' | 'react' | 'correct' | 'hint' | 'model' | 'answer' | 'celebrate' | 'transition'
  requiresStudentResponse: boolean
  retryRequired?: boolean
  hintLevel?: number
  modelSentence?: string
  sentenceStarter?: string
  activityComplete?: boolean
  conversationComplete?: boolean
  xpAwarded?: number
  evidence?: unknown[]
  memoryUpdates?: unknown[]
  voicePriority?: VoicePriority
}
type StudentTurn = { id: string; text: string; source: 'microphone' | 'typed' | 'choice'; transcriptConfidence?: number; durationMs?: number; status: 'captured' | 'transcribing' | 'evaluating' | 'accepted' | 'retry' }
type HistoryTurn = { id: string; role: 'teacher' | 'student'; text: string }

import { ImmersiveLessonStage } from '@/components/student/lesson/immersive-lesson-stage'

export function LessonExperience({ activities, levelTitle = 'Favourite Fair', syllabusName = 'My Favourite Things', levelNumber = 1, avatarType = 'BOY', studentName = 'Explorer', onLessonComplete, completedActivityIds = [], introVideoKey }: LessonExperienceProps) {
  const router = useRouter()
  const skippedPictureActivityCount = activities.filter((item) => typeof item.content?.pilotUnavailableMessage === 'string').length
  const playableActivities = activities.filter((item) => typeof item.content?.pilotUnavailableMessage !== 'string')
  const [index, setIndex] = useState(() => firstUnfinishedActivity(
    playableActivities.map((item) => item.id),
    new Set(completedActivityIds),
  ))
  const [experience, setExperience] = useState<ExperienceState>('entering')
  const [selected, setSelected] = useState('')
  const [transcript, setTranscript] = useState('')
  const [teacherText, setTeacherText] = useState('')
  const [feedback, setFeedback] = useState('')
  const [modelSentence, setModelSentence] = useState('')
  const [expectedPhrase, setExpectedPhrase] = useState('')
  const [activityComplete, setActivityComplete] = useState(false)
  const [conversationTurn, setConversationTurn] = useState(0)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [xp, setXp] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [pose, setPose] = useState<JulieVisualState>('greeting')
  const [teacherTurn, setTeacherTurn] = useState<TeacherTurn | null>(null)
  const [studentTurn, setStudentTurn] = useState<StudentTurn | null>(null)
  const [history, setHistory] = useState<HistoryTurn[]>([])
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [spokenWarmupAnswer, setSpokenWarmupAnswer] = useState<{ id: number; likesIt: boolean } | null>(null)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [introState, setIntroState] = useState<'checking' | 'playing' | 'done'>(introVideoKey ? 'checking' : 'done')
  const [introAvailable, setIntroAvailable] = useState(false)
  const [introReplayRequest, setIntroReplayRequest] = useState(0)

  const activity = playableActivities[index]
  const julie = useMissJulieVoice()
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const sessionId = useRef<string | null>(null)
  const interval = useRef<number | null>(null)
  const stopVoiceWatcher = useRef<(() => void) | null>(null)
  const startingMic = useRef(false)
  const ignoreRecordingResult = useRef(false)
  const recordingTimeout = useRef<number | null>(null)
  const recordingStartedAt = useRef<number | null>(null)
  const activeRecordingSessionId = useRef<string | null>(null)
  const teacherSequence = useRef(0)
  const spokenTurnIds = useRef(new Set<string>())
  const playbackGeneration = useRef(0)
  const lastSpokenTurnIdRef = useRef<string | null>(null)
  const currentTeacherTurnRef = useRef<TeacherTurn | null>(null)
  const finishIntro = useCallback(() => setIntroState('done'), [])
  const markIntroAvailable = useCallback(() => setIntroAvailable(true), [])

  const world = resolveWorldForLevel(levelNumber, levelTitle)
  const warmupPrompts = useMemo(() => getWarmupPrompts(activity), [activity])
  const isWarmup = isWarmupActivity(activity)
  const firstRepeatLine = activity?.type === 'REPEAT_SENTENCE' && Array.isArray(activity.content?.dialogueTurns)
    ? (activity.content.dialogueTurns[0] as { text?: string } | undefined)?.text
    : undefined
  const initialLine = personalizeLessonText(
    isWarmup && warmupPrompts[0]
      ? warmupQuestion(warmupPrompts[0].label)
      : resolveActivityTeacherLine(activity, studentName),
    studentName,
  )
  const dialogue = personalizeLessonText(teacherText || initialLine, studentName)
  const isQuiz = ['MCQ', 'PICTURE_CHOICE', 'VISUAL_CHOICE', 'WORD_RECOGNITION', 'LISTENING', 'MATCHING', 'SPELLING'].includes(String(activity?.type)) && activity?.stage !== 'REWARD'
  const voiceChoiceMode = isQuiz || isWarmup
  const isSpelling = String(activity?.type).toUpperCase() === 'SPELLING'
  const isModelDialogue = String(activity?.type).toUpperCase() === 'LISTEN_MODEL' ||
    String(activity?.metadata?.digitalType).toUpperCase() === 'MODEL_CONVERSATION'
  const isVoicePractice = [
    'REPEAT_SENTENCE', 'LISTEN_AND_REPEAT', 'SPEAK_PROMPT',
    'SENTENCE_BUILDER', 'SPEAKING', 'OPEN_CONVERSATION',
    'FOLLOW_UP_CONVERSATION', 'FINAL_CONVERSATION', 'CONVERSATION',
  ].includes(String(activity?.type).toUpperCase())
  const hasMic = !voiceChoiceMode && !isModelDialogue && activity?.stage !== 'REWARD' &&
    activity?.metadata?.micDisabled !== true && Boolean(
      isVoicePractice || activity?.voiceEnabled || activity?.allowMic || activity?.metadata?.micMode ||
      ['SPEAK', 'INTERACT', 'FOLLOW_UP', 'REASONS', 'FINAL_TALK', 'FINAL_CHALLENGE', 'PRACTICE_ZONE'].includes(String(activity?.stage)),
    )
  const wantsMic = hasMic || voiceChoiceMode
  const isConversation = Boolean(activity && isOpenLessonConversation(activity))
  // A picture or MCQ prompt must be spoken too: young readers cannot rely on text.
  const audioEnabled = activity?.metadata?.voiceDisabled !== true && (voiceChoiceMode || shouldUseLessonVoice(activity || {}))

  useEffect(() => {
    if (introState !== 'done') return
    const reveal = window.setTimeout(() => setExperience('waiting_for_student'), 300)
    return () => window.clearTimeout(reveal)
  }, [introState])

  useEffect(() => {
    if (introState !== 'done' || !activity || experience === 'entering') return
    playbackGeneration.current += 1
    julie.stop()
    setSelected('')
    setTranscript('')
    setTeacherText('')
    setFeedback('')
    setModelSentence('')
    setExpectedPhrase(personalizeLessonText(firstRepeatLine || activity.target || '', studentName))
    setActivityComplete(false)
    setConversationTurn(0)
    setStudentTurn(null)
    setRetryAttempt(0)
    setSpokenWarmupAnswer(null)
    setAudioBlocked(false)
    spokenTurnIds.current.clear()
    setPose(index === 0 ? 'greeting' : 'teaching')
    setExperience('julie_preparing')
    const timer = window.setTimeout(() => {
      void commitTeacherTurn({
        id: `teacher-${activity?.id || index}-intro`,
        text: initialLine,
        emotion: index === 0 ? 'greeting' : 'teaching',
        intent: 'ask',
        requiresStudentResponse: wantsMic,
        retryRequired: false,
        hintLevel: 0,
        activityComplete: false,
        // Deterministic syllabus copy goes through the lesson/cache path.
        // Dynamic replies use the conversation path; the backend chooses the
        // configured TTS provider (Azure first in the current deployment).
        voicePriority: 'LESSON',
      }, wantsMic ? 'waiting_for_student' : 'transitioning')
    }, 350)
    return () => window.clearTimeout(timer)
    // Activity identity is the reset boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity?.id, index, experience === 'entering', introState])

  const replayIntro = useCallback(async () => {
    if (!introVideoKey) return
    playbackGeneration.current += 1
    julie.stop()
    resetRecorder()
    setExperience('entering')
    setIntroState('playing')
    setIntroReplayRequest((value) => value + 1)
    await cancelActiveVoiceSession()
  // A user initiated replay ends any active audio turn before opening the video.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introVideoKey, julie.stop])

  useEffect(() => () => resetRecorder(), [])

  useEffect(() => {
    if (julie.state === 'speaking') setExperience('julie_speaking')
    if (julie.state === 'loading') setExperience('julie_audio_pending')
  }, [julie.state])

  function normalizeTeacherTurnFromAi(result: VoiceAIResponse | undefined, fallbackText: string, baseTurn?: Partial<TeacherTurn>): TeacherTurn {
    const normalizedText = [result?.message, result?.followUpQuestion].filter(Boolean).join(' ') || fallbackText || 'Thanks for sharing that.'
    const retryRequired = Boolean(result?.shouldRetry || result?.conversation?.retryState?.waiting)
    const activityComplete = Boolean(result?.activityComplete || result?.conversation?.complete)
    const conversationComplete = Boolean(result?.conversation?.complete)
    const hintLevel = Math.max(0, Number(result?.hintLevel ?? result?.conversation?.retryState?.hintLevel ?? 0))

    return {
      id: baseTurn?.id || `teacher-${activity?.id || index}-${++teacherSequence.current}`,
      text: normalizedText,
      emotion: baseTurn?.emotion || (retryRequired ? 'gentle-correction' : activityComplete ? 'celebrating' : result?.emotion === 'thinking' ? 'thinking' : result?.emotion === 'curious' ? 'curious' : 'encouraging'),
      intent: baseTurn?.intent || (retryRequired ? 'correct' : activityComplete ? 'celebrate' : result?.followUpQuestion ? 'ask' : 'react'),
      requiresStudentResponse: !activityComplete && !conversationComplete,
      retryRequired,
      hintLevel,
      modelSentence: result?.modelSentence || result?.correction?.corrected || baseTurn?.modelSentence,
      sentenceStarter: baseTurn?.sentenceStarter,
      activityComplete,
      conversationComplete,
      xpAwarded: result?.conversation?.complete ? 0 : baseTurn?.xpAwarded,
      evidence: result?.conversation?.skillEvidence ?? baseTurn?.evidence,
      memoryUpdates: result?.conversation ? [] : baseTurn?.memoryUpdates,
      voicePriority:
        result && (isConversation || Boolean(result.conversation))
          ? 'CONVERSATION'
          : 'LESSON',
    }
  }

  async function commitTeacherTurn(input: TeacherTurn, afterState?: ExperienceState) {
    const turn = { ...input, text: personalizeLessonText(input.text, studentName), id: input.id || `teacher-${activity?.id || index}-${++teacherSequence.current}` }
    setTeacherTurn(turn)
    setTeacherText(turn.text)
    currentTeacherTurnRef.current = turn
    setHistory((current) => [...current, { id: turn.id, role: 'teacher', text: turn.text } satisfies HistoryTurn].slice(-8))
    await speakTeacherTurn(turn, afterState)
  }

  async function speakTeacherTurn(turn: TeacherTurn, afterState?: ExperienceState) {
    if (!turn.text.trim()) return
    const generation = playbackGeneration.current
    if (spokenTurnIds.current.has(turn.id)) {
      setExperience(afterState || (turn.retryRequired ? 'retry_required' : turn.activityComplete || turn.conversationComplete ? 'activity_complete' : 'waiting_for_student'))
      return
    }
    spokenTurnIds.current.add(turn.id)
    lastSpokenTurnIdRef.current = turn.id
    if (audioEnabled) {
      setExperience('julie_audio_pending')
      const playback = await julie.speak(turn.text, `${turn.id}:${++teacherSequence.current}`, turn.voicePriority || 'LESSON')
      if (generation !== playbackGeneration.current) return
      if (playback === 'autoplay-blocked') {
        // Do not start recording over a prompt the child never heard.
        setAudioBlocked(true)
        setFeedback('Tap Enable sound once so Miss Julie can speak automatically.')
        setExperience('recoverable_error')
        return
      }
    }
    if (generation !== playbackGeneration.current) return
    setExperience(afterState || (turn.retryRequired ? 'retry_required' : turn.activityComplete || turn.conversationComplete ? 'activity_complete' : turn.requiresStudentResponse ? 'waiting_for_student' : 'transitioning'))
  }

  async function replayCurrentTeacherTurn() {
    if (audioEnabled) await julie.replay()
  }

  async function enableAudioAndContinue() {
    // Called by a real tap: browser autoplay policy requires user activation.
    const unlocked = await voiceService.unlockPlayback()
    if (!unlocked) {
      setFeedback('Sound is blocked. Allow sound for this website and tap again.')
      return
    }
    setFeedback('')
    const playback = await julie.replay()
    if (playback === 'autoplay-blocked') {
      setAudioBlocked(true)
      setFeedback('Sound is still blocked. Check your browser sound permissions.')
      return
    }
    setAudioBlocked(false)
    setExperience('waiting_for_student')
  }

  function resetRecorder() {
    stopVoiceWatcher.current?.()
    stopVoiceWatcher.current = null
    startingMic.current = false
    if (interval.current !== null) {
      window.clearInterval(interval.current)
      interval.current = null
    }

    if (recordingTimeout.current !== null) {
      window.clearTimeout(recordingTimeout.current)
      recordingTimeout.current = null
    }

    if (recorder.current?.state === 'recording') {
      ignoreRecordingResult.current = true
      recorder.current.stop()
    }
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    recorder.current = null
    recordingStartedAt.current = null
    setSeconds(0)
  }

  async function cancelActiveVoiceSession() {
    const id = activeRecordingSessionId.current || sessionId.current
    activeRecordingSessionId.current = null
    sessionId.current = null

    if (!id) return

    try {
      await voiceService.cancelSession(id)
    } catch {
      // Best-effort cleanup only. The original microphone/STT error is more useful.
    }
  }

  const stopMic = () => {
    if (recordingTimeout.current !== null) {
      window.clearTimeout(recordingTimeout.current)
      recordingTimeout.current = null
    }

    if (recorder.current?.state === 'recording') {
      recorder.current.stop()
    }
  }

  async function startMic() {
    if (!activity || julie.isSpeaking || julie.state === 'loading') return
    if (startingMic.current || recorder.current?.state === 'recording') return
    startingMic.current = true
    ignoreRecordingResult.current = false

    julie.stop()
    setExperience('student_recording')
    setPose('listening')
    setTranscript('')
    setFeedback('')
    setSeconds(0)

    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error('Voice is not available in this browser.')
      }

      // Request permissions and create the server session in parallel. Whichever
      // finishes first is tracked so failures always release both resources.
      let cancelled = false
      const micPromise = navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      }).then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach(track => track.stop())
          throw new Error('Microphone setup was cancelled')
        }
        stream.current = mediaStream
        return mediaStream
      })
      const sessionPromise = voiceChoiceMode ? Promise.resolve(null) : voiceService.startSession({
        lessonId: activity.lessonId,
        activityId: activity.id,
        expectedPhrase: isConversation ? undefined : (expectedPhrase || activity.target || undefined),
      }).then(session => {
        if (cancelled) {
          void voiceService.cancelSession(session._id).catch(() => undefined)
          throw new Error('Voice setup was cancelled')
        }
        sessionId.current = session._id
        activeRecordingSessionId.current = session._id
        return session
      })
      let mediaStream: MediaStream
      try {
        ;[mediaStream] = await Promise.all([micPromise, sessionPromise])
      } catch (error) {
        cancelled = true
        throw error
      }

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ]

      const mimeType =
        preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || ''

      const chunks: Blob[] = []
      const activeRecorder = new MediaRecorder(
        mediaStream,
        mimeType ? { mimeType } : undefined,
      )

      activeRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      activeRecorder.onerror = () => {
        setFeedback('The microphone recorder stopped unexpectedly. Please try again.')
        setExperience('recoverable_error')
        setPose('encouraging')
        void cancelActiveVoiceSession()
        resetRecorder()
      }

      activeRecorder.onstop = async () => {
        if (ignoreRecordingResult.current) {
          // A touch answer superseded the recording. Cancel only the old
          // session, never a new one that might already be starting.
          const discardedSession = activeRecordingSessionId.current || sessionId.current
          ignoreRecordingResult.current = false
          resetRecorder()
          activeRecordingSessionId.current = null
          sessionId.current = null
          if (discardedSession) void voiceService.cancelSession(discardedSession).catch(() => undefined)
          return
        }
        const startedAt = recordingStartedAt.current
        const stoppedAt = performance.now()
        const measuredDurationMs =
          startedAt === null
            ? undefined
            : Math.round(stoppedAt - startedAt)

        // Capture the session before any cleanup changes refs.
        const currentSessionId =
          activeRecordingSessionId.current || sessionId.current

        resetRecorder()

        if (!currentSessionId && !voiceChoiceMode) {
          setFeedback('The voice session ended unexpectedly. Please try again.')
          setExperience('recoverable_error')
          setPose('encouraging')
          return
        }

        try {
          const blob = new Blob(chunks, {
            type: activeRecorder.mimeType || mimeType || 'audio/webm',
          })

          if (!blob.size) {
            throw new Error('I could not hear enough. Please try again.')
          }

          if (
            measuredDurationMs !== undefined &&
            measuredDurationMs < 250
          ) {
            throw new Error('Please speak for a little longer and try again.')
          }

          // Backend accepts 250..10,000 ms. Clamp timer drift at the upper edge
          // so a nominal 10 s recording never becomes 10,012 ms and gets a 400.
          const durationMs =
            measuredDurationMs === undefined
              ? undefined
              : Math.min(10_000, measuredDurationMs)

          if (process.env.NODE_ENV !== 'production') {
            console.info('[STT CLIENT] upload', {
              bytes: blob.size,
              mimeType: blob.type,
              durationMs,
            })
          }

          setExperience('transcribing')

          const result = await voiceService.transcribeAudio(
            blob,
            durationMs,
            'en-IN',
          )

          const normalizedText = result.trim()

          if (!normalizedText) {
            throw new Error('I could not hear that clearly. Try once more.')
          }

          // Voice navigation works for every grade. End unused STT sessions
          // before returning to listening or leaving this lesson.
          if (isExitLessonCommand(normalizedText)) {
            await cancelActiveVoiceSession()
            router.replace('/student/home')
            return
          }
          if (isReplayCommand(normalizedText)) {
            await cancelActiveVoiceSession()
            setExperience('julie_audio_pending')
            await replayCurrentTeacherTurn()
            setExperience('waiting_for_student')
            return
          }

          setTranscript(normalizedText)

          if (voiceChoiceMode) {
            if (isWarmup) {
              const decision = matchSpokenYesNo(normalizedText)
              if (decision === null) {
                setFeedback('Please say Yes or No, beta. You can also touch a button.')
                setExperience('waiting_for_student')
              } else {
                setSpokenWarmupAnswer({ id: Date.now(), likesIt: decision })
                setExperience('julie_thinking')
              }
              return
            }
            // Spelling is checked as a full word, not against a single letter tile.
            const choice = isSpelling
              ? normalizedText.replace(/[^a-z]/gi, '').toUpperCase()
              : matchSpokenChoice(normalizedText, activity.choices || [])
            if (!choice) {
              setFeedback('Say one answer clearly, or touch its picture.')
              setExperience('waiting_for_student')
              return
            }
            await choose(choice)
            return
          }

          const capturedTurn: StudentTurn = {
            id: `student-${activity.id}-${Date.now()}`,
            text: normalizedText,
            source: 'microphone',
            status: 'captured',
            durationMs,
          }

          setStudentTurn(capturedTurn)
          setHistory((current) => [
            ...current,
            {
              id: capturedTurn.id,
              role: 'student',
              text: normalizedText,
            } satisfies HistoryTurn,
          ].slice(-8))

          setExperience('student_submitted')

          // submitTranscript completes the server-side VoiceSession. Do not clear
          // its id until this call has finished.
          // Choice-mode activities return above. Speaking activities must have
          // an active server session before submitting a transcript.
          if (!currentSessionId) {
            setFeedback('The voice session ended unexpectedly. Please try again.')
            setExperience('recoverable_error')
            setPose('encouraging')
            return
          }
          await submit(normalizedText, currentSessionId, 'MIC')

          activeRecordingSessionId.current = null
          sessionId.current = null
        } catch (error) {
          setFeedback(
            error instanceof Error
              ? error.message
              : 'I could not hear that clearly.',
          )
          setExperience('recoverable_error')
          setPose('encouraging')

          activeRecordingSessionId.current = currentSessionId
          sessionId.current = currentSessionId
          await cancelActiveVoiceSession()
        }
      }

      recorder.current = activeRecorder
      recordingStartedAt.current = performance.now()
      activeRecorder.start()
      startingMic.current = false
      stopVoiceWatcher.current = watchVoiceActivity(mediaStream, () => {
        if (activeRecorder.state === 'recording') activeRecorder.stop()
      }, { silenceMs: 850, minimumSpeechMs: 380, noSpeechTimeoutMs: 5500 })

      interval.current = window.setInterval(() => {
        const startedAt = recordingStartedAt.current
        if (startedAt === null) return
        setSeconds(Math.min(10, Math.floor((performance.now() - startedAt) / 1000)))
      }, 250)

      if (recordingTimeout.current !== null) {
        window.clearTimeout(recordingTimeout.current)
      }

      // Stop a little before the backend's hard 10,000 ms duration ceiling.
      recordingTimeout.current = window.setTimeout(() => {
        if (activeRecorder.state === 'recording') {
          activeRecorder.stop()
        }
      }, 9_800)
    } catch (error) {
      resetRecorder()
      await cancelActiveVoiceSession()

      const message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access and try again.'
          : error instanceof DOMException && error.name === 'NotFoundError'
            ? 'No microphone was found on this device.'
            : error instanceof DOMException && error.name === 'NotReadableError'
              ? 'Your microphone is being used by another app. Close it there and try again.'
              : error instanceof Error
                ? error.message
                : 'Please allow microphone access.'

      setFeedback(message)
      setExperience('recoverable_error')
      setPose('encouraging')
    }
  }

  // Voice-first lab UX: after Julie finishes speaking, the microphone opens
  // automatically. A failed permission request remains manual so we never trap
  // the student in a browser permission loop.
  useEffect(() => {
    if (!wantsMic || activityComplete || julie.isSpeaking || julie.state === 'loading') return
    if (experience !== 'waiting_for_student' && experience !== 'retry_required') return
    const timer = window.setTimeout(() => { void startMic() }, 420)
    return () => window.clearTimeout(timer)
    // startMic closes over the current activity; it is intentionally re-bound.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience, activity?.id, wantsMic, activityComplete, julie.isSpeaking, julie.state])

  // Correct answers progress without requiring another click. We wait until
  // praise audio finishes so speaking and microphones never overlap.
  useEffect(() => {
    if (experience !== 'activity_complete' || !activityComplete || julie.isSpeaking || julie.state === 'loading') return
    const timer = window.setTimeout(() => advance(), 1100)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience, activityComplete, julie.isSpeaking, julie.state, activity?.id])

  // Reward screen lasts briefly, then the server selects the next unlocked
  // lesson; if the grade has no more published activities, it opens home.
  useEffect(() => {
    if (experience !== 'lesson_complete' || julie.isSpeaking || julie.state === 'loading') return
    const timer = window.setTimeout(() => router.replace('/student/continue'), 6500)
    return () => window.clearTimeout(timer)
  }, [experience, julie.isSpeaking, julie.state, router])

  async function submit(text: string, id: string, inputMode: 'MIC' | 'TEXT' | 'OPTION' = 'MIC') {
    setExperience('julie_thinking')
    setPose('thinking')
    try {
      const result = await voiceService.submitTranscript(id, text, inputMode)
      const ai = result.aiResponse
      const fallbackText = result.evaluation?.feedback || 'Thank you for sharing that.'
      const retryRequired = Boolean(ai?.shouldRetry || ai?.conversation?.retryState?.waiting)
      const serverComplete = Boolean(ai?.activityComplete || ai?.conversation?.complete)
      const controlledComplete = !ai && Number(result.evaluation?.score || 0) >= 70
      const complete = serverComplete || controlledComplete
      const normalizedTurn = normalizeTeacherTurnFromAi(ai, fallbackText, {
        id: `teacher-${activity?.id || index}-${ai?.conversation?.id || id}-${ai?.conversation?.turnCount || conversationTurn + 1}`,
        emotion: poseFromAi(ai, retryRequired, complete),
        intent: retryRequired ? 'correct' : complete ? 'celebrate' : 'react',
        requiresStudentResponse: !complete,
        retryRequired,
        hintLevel: ai?.hintLevel || ai?.conversation?.retryState?.hintLevel || 0,
        modelSentence: ai?.modelSentence || ai?.correction?.corrected || undefined,
        activityComplete: complete,
      })

      setTeacherText(normalizedTurn.text)
      setFeedback(ai ? (retryRequired ? ai.correction?.explanation || result.evaluation?.feedback || '' : '') : result.evaluation?.feedback || '')
      setModelSentence(retryRequired ? normalizedTurn.modelSentence || '' : '')
      setXp((value) => value + (result.xpAwarded || 0))
      setConversationTurn((value) => value + 1)
      setActivityComplete(complete)
      setPose(poseFromAi(ai, retryRequired, complete))
      setRetryAttempt(ai?.conversation?.retryState?.attempt || 0)
      setStudentTurn((current) => current ? { ...current, status: retryRequired ? 'retry' : 'accepted' } : current)
      setExperience('julie_text_ready')
      const additions = ai?.conversation?.skillEvidence || []
      if (additions.length) setEvidence((current) => uniqueEvidence([...current, ...additions]))
      await commitTeacherTurn(normalizedTurn, complete ? 'activity_complete' : retryRequired ? 'retry_required' : 'waiting_for_student')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Miss Julie could not check that turn.')
      setExperience('recoverable_error')
      setPose('encouraging')
    }
  }

  async function choose(value: string, source: 'choice' | 'typed' = 'choice') {
    if (!activity || activityComplete || experience === 'julie_thinking' || isWarmupActivity(activity)) return
    if (recorder.current?.state === 'recording') {
      ignoreRecordingResult.current = true
      recorder.current.stop()
    }
    setSelected(value)
    if (isQuiz) {
      // A quiz is NOT a voice session. The correct answer is not sent to the client.
      // Backend /attempts checks the stored activity.answer and awards XP atomically.
      setExperience('julie_thinking')
      try {
        const result = await progressService.submitAttempt(activity.id, {
          answer: value, startedAt: new Date().toISOString(),
          idempotencyKey: `quiz:${activity.id}:${value}:${Date.now()}`,
        })
        const attempt = result.attempt as { correct?: boolean; isCorrect?: boolean; score?: number } | undefined
        const correct = attempt?.correct === true || attempt?.isCorrect === true || Number(attempt?.score ?? 0) >= 70
        const message = correct ? 'Wonderful! You got it! ⭐' : 'Good try! Choose another answer.'
        setFeedback(message)
        setActivityComplete(correct)
        setPose(correct ? 'celebrating' : 'encouraging')
        setXp((current) => current + (result.xpAwarded || 0))
        setExperience(correct ? 'activity_complete' : 'waiting_for_student')
        // Feedback uses fixed, repeatable text and the existing Azure/S3 backend cache.
        if (correct) await commitTeacherTurn({ id: `quiz-${activity.id}-success`, text: message, requiresStudentResponse: false, voicePriority: 'LESSON' }, 'activity_complete')
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Could not check this choice. Try again.')
        setExperience('waiting_for_student')
      }
      return
    }
    const capturedTurn: StudentTurn = {
      id: `student-${activity.id}-${Date.now()}`, text: value, source, status: 'evaluating',
    }
    setStudentTurn(capturedTurn)
    setTranscript(value)
    setHistory((current) => [...current, { id: capturedTurn.id, role: 'student', text: value } satisfies HistoryTurn].slice(-8))
    try {
      const session = await voiceService.startSession({
        lessonId: activity.lessonId, activityId: activity.id,
        expectedPhrase: isConversation ? undefined : (expectedPhrase || activity.target || undefined),
      })
      await submit(value, session._id, source === 'typed' ? 'TEXT' : 'OPTION')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not submit. Please try again.')
      setExperience('recoverable_error')
    }
  }

  function advance() {
    if (experience === 'retry_required' || experience === 'recoverable_error' || (!activityComplete && isConversation)) return
    if (index >= playableActivities.length - 1 || activity.stage === 'REWARD') {
      setExperience('lesson_complete')
      setPose('celebrating')
      onLessonComplete?.(xp)
      void commitTeacherTurn({
        id: `teacher-${activity?.id || index}-complete`,
        text: syllabusName.toLowerCase().includes('favourite')
          ? `You did it, ${studentName}! You shared your favourites, asked questions, gave reasons, and spoke politely.`
          : `You did it, ${studentName}! You finished ${syllabusName} and used clear English in real speaking turns.`,
        emotion: 'celebrating',
        intent: 'celebrate',
        requiresStudentResponse: false,
        retryRequired: false,
        hintLevel: 0,
        activityComplete: true,
        voicePriority: 'LESSON',
      }, 'lesson_complete')
      return
    }
    setExperience('transitioning')
    window.setTimeout(() => setIndex((value) => value + 1), 320)
  }

  const responsePhase: ActivityResponsePhase = experience === 'student_recording' ? 'listening_mic' : ['transcribing', 'student_submitted', 'julie_thinking'].includes(experience) ? 'evaluating' : experience === 'retry_required' || experience === 'recoverable_error' ? 'retry' : experience === 'activity_complete' ? 'correct' : experience === 'lesson_complete' ? 'completed' : isConversation && conversationTurn > 0 ? 'conversation' : 'ready'
  const learnerState = experience === 'student_recording' ? 'speaking' : experience === 'transcribing' || experience === 'student_submitted' || experience === 'julie_thinking' ? 'thinking' : experience === 'activity_complete' ? 'happy' : experience === 'retry_required' || experience === 'recoverable_error' ? 'retry' : julie.isSpeaking ? 'listening' : 'idle'
  const statusText = experience === 'student_recording' ? 'Listening to you…' : experience === 'transcribing' ? 'Turning your voice into words…' : experience === 'julie_thinking' ? 'Miss Julie is thinking…' : julie.state === 'loading' ? 'Julie is getting ready to speak…' : ''
  const stageLabel = resolveStageLabel(activity?.stage, world.stageLabel)
  const reflection = useMemo(() => evidence.slice(-3), [evidence])

  if (!activity) return <main className="lesson-empty-state"><h2>No activities found.</h2><Link href="/student/continue">My next lesson</Link></main>

  return (
    <LessonWorld activity={activity} levelNumber={levelNumber} worldName={levelTitle} syllabusName={syllabusName}>
      <AnimatePresence>{experience === 'entering' ? <TalkoraWorldLoader key="arrival" destination={levelTitle} subtitle={`Opening ${levelTitle}...`} /> : null}</AnimatePresence>
      <div className={`talkora-lesson ${experience === 'lesson_complete' ? 'is-celebrating' : ''}`} data-experience={experience}>
        <LessonHud
          title={syllabusName}
          levelLabel={stageLabel}
          xp={xp}
          index={index}
          total={playableActivities.length}
          mode={wantsMic ? 'speak' : 'listen'}
          onModeChange={() => undefined}
          hideModes
          extraAction={introVideoKey && introAvailable && introState === 'done' ? (
            <button type="button" className="kg-intro-replay" onClick={() => void replayIntro()} aria-label="Replay Miss Julie’s story intro">
              <RotateCcw size={15} aria-hidden="true" /><span>Story</span>
            </button>
          ) : undefined}
        />

        {experience !== 'lesson_complete' ? (
          <main className="talkora-lesson__immersive-stage">
            <ImmersiveLessonStage
              activity={activity}
              canonicalPrompt={initialLine}
              index={index}
              totalActivities={playableActivities.length}
              skippedPictureActivityCount={skippedPictureActivityCount}
              julieMessage={dialogue}
              julieState={julie.isSpeaking ? 'speaking' : pose}
              isJulieSpeaking={julie.isSpeaking}
              audioEnabled={audioEnabled}
              transcript={isQuiz ? "" : transcript}
              studentTurnText={isQuiz ? undefined : studentTurn?.text}
              learnerState={learnerState}
              avatarType={avatarType}
              studentName={studentName}
              statusText={statusText}
              feedback={feedback}
              modelSentence={modelSentence}
              expectedPhrase={expectedPhrase}
              seconds={seconds}
              isRecording={responsePhase === 'listening_mic'}
              isProcessing={responsePhase === 'evaluating'}
              teacherReady={experience === 'transitioning' && !julie.isSpeaking && julie.state !== 'loading' && currentTeacherTurnRef.current?.id === `teacher-${activity.id}-intro`}
              requiresVoiceResponse={hasMic}
              spokenWarmupAnswer={spokenWarmupAnswer}
              onResumeListening={() => setExperience('waiting_for_student')}
              needsAudioGesture={audioBlocked}
              onEnableAudio={() => void enableAudioAndContinue()}
              isCompleted={experience === 'activity_complete'}
              isRetry={experience === 'retry_required' || experience === 'recoverable_error'}
              conversationTurn={conversationTurn}
              xpEarned={xp}
              onReplayFromStart={index > 0 && completedActivityIds.length > 0 ? () => setIndex(0) : undefined}
              onStartMic={() => void startMic()}
              onStopMic={stopMic}
              onReplayJulie={() => void replayCurrentTeacherTurn()}
              onSelectChoice={(val: string) => void choose(val, 'choice')}
              onSubmitText={(text: string) => void choose(text, 'typed')}
              onAdvance={advance}
              onSpeakText={async (text, key) => {
                if (!audioEnabled || !text.trim()) return
                setTeacherText(text)
                await julie.speak(text, `${key || `activity:${activity.id}`}:${++teacherSequence.current}`, 'LESSON')
              }}
              onLocalComplete={(message?: string, answer?: string) => {
                if (!answer) return
                setExperience('julie_thinking')
                void progressService.completeLocalActivity(activity.id, answer).then((result) => {
                  if (message) setFeedback(message)
                  setXp((value) => value + (result.xpAwarded || 0))
                  setActivityComplete(true)
                  setPose('celebrating')
                  setExperience('activity_complete')
                }).catch((error) => {
                  setFeedback(error instanceof Error ? error.message : 'Progress could not be saved. Please try again.')
                  setExperience('recoverable_error')
                })
              }}
            />
          </main>
        ) : (
          <RewardScene studentName={studentName} syllabusName={syllabusName} xp={xp} evidence={reflection} onReplay={() => {
            playbackGeneration.current += 1
            julie.stop()
            setIndex(0)
            setXp(0)
            setEvidence([])
            setHistory([])
            setExperience('waiting_for_student')
          }} />
        )}
      </div>
      {introVideoKey && introState !== 'done' ? (
        <KGLessonIntro
          key={`${introVideoKey}:${introReplayRequest}`}
          lessonKey={introVideoKey}
          replayRequest={introReplayRequest}
          onAvailable={markIntroAvailable}
          onDone={finishIntro}
        />
      ) : null}
    </LessonWorld>
  )
}

function poseFromAi(ai: VoiceAIResponse | undefined, retry: boolean, complete: boolean): JulieVisualState {
  if (retry) return ai?.teachingAction?.includes('MODEL') ? 'modeling' : 'gentle-correction'
  if (complete) return 'celebrating'
  const emotion = ai?.emotion
  if (emotion === 'curious' || emotion === 'thinking' || emotion === 'listening' || emotion === 'surprised' || emotion === 'proud' || emotion === 'modeling') return emotion
  if (emotion === 'delighted' || emotion === 'celebrating') return 'celebrating'
  return 'encouraging'
}

function uniqueEvidence(items: Evidence[]) {
  return items.filter((item, index) => items.findIndex((candidate) => candidate.skill === item.skill) === index)
}


function RewardScene({ studentName, syllabusName, xp, evidence, onReplay }: { studentName: string; syllabusName: string; xp: number; evidence: Evidence[]; onReplay: () => void }) {
  return <main className="talkora-reward">
    <div className="talkora-reward__sky" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <motion.i key={index} animate={{ y: [0, -22, 0], rotate: [0, 35, 0], opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.6 + index * 0.08, repeat: Infinity, delay: index * 0.06 }} />)}</div>
    <motion.div className="talkora-reward__badge" initial={{ scale: 0, rotate: -18 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}><Award /><span>{syllabusName.toLowerCase().includes('favourite') ? 'Favourite Finder' : 'Lesson Star'}</span></motion.div>
    <span className="talkora-reward__eyebrow"><Trophy /> ADVENTURE COMPLETE</span>
    <h1>You found your speaking power, {studentName}!</h1>
    <p>Miss Julie heard what you can really do in English.</p>
    <div className="talkora-reward__evidence">{evidence.length ? evidence.map((item) => <span key={item.skill}><BookOpen /> {friendlySkill(item.skill)}</span>) : <><span><BookOpen /> Lesson practice completed</span><span><BookOpen /> Keep learning with Miss Julie</span></>}</div>
    <motion.div className="talkora-reward__xp" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}><Sparkles /><strong>+{xp} XP</strong></motion.div>
    <p className="talkora-reward__home">Your speaking homework was part of this lesson. Miss Julie has saved your learning progress.</p>
    <div className="talkora-reward__actions">
      <button type="button" className="talkora-reward__continue talkora-reward__continue--secondary" onClick={onReplay}>Replay lesson</button>
      <Link href="/student/practice/talk" className="talkora-reward__continue talkora-reward__continue--secondary">Practice with Miss Julie</Link>
      <Link href="/student/practice/home" className="talkora-reward__continue talkora-reward__continue--secondary">Record home conversation</Link>
      <Link href="/student/continue" className="talkora-reward__continue">Next Lesson</Link>
    </div>
  </main>
}

function friendlySkill(skill: string) {
  return skill.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

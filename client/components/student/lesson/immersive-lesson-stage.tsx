'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Headphones,
  LoaderCircle,
  MessageCircle,
  Mic,
  PencilLine,
  Send,
  Bell,
  School,
  Sparkles,
  Square,
  TreePine,
  Trophy,
  Volume2,
} from 'lucide-react'
import type { ActivityItem } from '@/services/curriculum-service'
import { learnerAvatar, talkoraAssets, type MissJulieState } from '@/config/talkora-assets'
import type { JulieVisualState } from '@/components/student/lesson/miss-julie-character'
import { personalizeLessonText } from '@/services/lesson-progress'
import {
  getWarmupPrompts,
  isWarmupActivity,
  lessonCoachCue,
  warmupAnswer,
  warmupQuestion,
  warmupReaction,
} from '@/services/lesson-presentation'

export interface ImmersiveLessonStageProps {
  activity: ActivityItem
  experienceId?: string
  canonicalPrompt?: string
  index: number
  totalActivities: number
  skippedPictureActivityCount?: number
  julieMessage: string
  julieState: JulieVisualState
  isJulieSpeaking: boolean
  audioEnabled?: boolean
  transcript: string
  studentTurnText?: string
  learnerState: 'idle' | 'listening' | 'speaking' | 'thinking' | 'happy' | 'retry'
  avatarType: 'BOY' | 'GIRL'
  studentName: string
  statusText: string
  feedback: string
  modelSentence?: string
  expectedPhrase?: string
  seconds: number
  isRecording: boolean
  isProcessing: boolean
  /** Parent confirms Miss Julie finished presenting the current activity. */
  teacherReady?: boolean
  requiresVoiceResponse?: boolean
  /** Yes/no answer captured hands-free for authored Class 4 warm-ups. */
  spokenWarmupAnswer?: { id: number; likesIt: boolean } | null
  onResumeListening?: () => void
  needsAudioGesture?: boolean
  onEnableAudio?: () => void
  isCompleted: boolean
  isRetry: boolean
  conversationTurn: number
  xpEarned: number
  onStartMic: () => void
  onStopMic: () => void
  onReplayJulie: () => void
  onSelectChoice: (choice: string) => void
  onSubmitText: (text: string) => void
  onAdvance: () => void
  onReplayFromStart?: () => void
  onSpeakText?: (text: string, key?: string) => Promise<void>
  onLocalComplete?: (message?: string, answer?: string) => void
}

type DialogueTurn = {
  role?: string
  speaker?: string
  text: string
  julieText?: string
  julieAnswer?: string
}

export function ImmersiveLessonStage({
  activity,
  experienceId,
  canonicalPrompt = '',
  index,
  totalActivities,
  skippedPictureActivityCount = 0,
  julieMessage,
  julieState,
  isJulieSpeaking,
  audioEnabled = true,
  transcript,
  studentTurnText,
  avatarType,
  studentName,
  statusText,
  feedback,
  modelSentence,
  expectedPhrase,
  seconds,
  isRecording,
  isProcessing,
  teacherReady = false,
  requiresVoiceResponse = false,
  spokenWarmupAnswer = null,
  onResumeListening = () => undefined,
  needsAudioGesture = false,
  onEnableAudio = () => undefined,
  isCompleted,
  isRetry,
  conversationTurn,
  xpEarned,
  onStartMic,
  onStopMic,
  onReplayJulie,
  onSelectChoice,
  onSubmitText,
  onAdvance,
  onReplayFromStart,
  onSpeakText = async () => undefined,
  onLocalComplete = () => undefined,
}: ImmersiveLessonStageProps) {
  const reduceMotion = useReducedMotion()
  const [typedInput, setTypedInput] = useState('')
  const [spelledWord, setSpelledWord] = useState('')
  const [warmupIndex, setWarmupIndex] = useState(0)
  const [warmupAnswers, setWarmupAnswers] = useState<string[]>([])
  const [warmupLocked, setWarmupLocked] = useState(false)
  const [warmupJulieText, setWarmupJulieText] = useState('')
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [pictureLoadFailed, setPictureLoadFailed] = useState(false)
  const [julieAnimationReady, setJulieAnimationReady] = useState(false)
  const handledVoiceAnswer = useRef<number | null>(null)
  const automaticActivityRef = useRef<string | null>(null)
  const liveActivityRef = useRef(activity.id)
  liveActivityRef.current = activity.id

  const type = String(activity.type || '').toUpperCase()
  const stage = String(activity.stage || '').toUpperCase()
  const digitalType = String(activity.metadata?.digitalType || '').toUpperCase()
  const allowTyped = activity.metadata?.allowTypedAnswer === true
  const pilotUnavailableMessage = typeof activity.content?.pilotUnavailableMessage === 'string'
    ? activity.content.pilotUnavailableMessage
    : ''
  const pictureOptions = Array.isArray(activity.content?.pictureOptions)
    ? activity.content.pictureOptions as Array<{ word?: unknown; assetKey?: unknown; status?: unknown }>
    : []

  useEffect(() => {
    setTypedInput('')
    setSpelledWord('')
    setWarmupIndex(0)
    setWarmupAnswers([])
    setWarmupLocked(false)
    setWarmupJulieText('')
    setDialogueIndex(0)
    setPictureLoadFailed(false)
    handledVoiceAnswer.current = null
    automaticActivityRef.current = null
  }, [activity.id])

  // Keep the opening energetic: three fast choices are enough to activate the skill
  // without turning the warm-up into a six-question drill.
  const warmupItems = useMemo(() => getWarmupPrompts(activity).slice(0, 3), [activity])

  const dialogueTurns = useMemo<DialogueTurn[]>(() => {
    const source = activity.content?.dialogueTurns
    if (!Array.isArray(source)) return []
    return source
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const turn = item as DialogueTurn
        return { ...turn, text: personalizeLessonText(turn.text, studentName) }
      })
      .filter((item) => typeof item.text === 'string' && item.text.trim())
  }, [activity.content, studentName])

  const isWarmup = isWarmupActivity(activity)
  const isQuiz = ['MCQ', 'PICTURE_CHOICE', 'VISUAL_CHOICE', 'WORD_RECOGNITION', 'LISTENING', 'MATCHING', 'SPELLING'].includes(type) && stage !== 'REWARD'
  const isSpelling = type === 'SPELLING'
  const isModelDialogue = type === 'LISTEN_MODEL' || digitalType === 'MODEL_CONVERSATION'
  const isRepeat = type === 'REPEAT_SENTENCE' || digitalType === 'EXACT_LINE_ROLE_SWAP'
  const isPractice = !isQuiz && (stage === 'PRACTICE_ZONE' || digitalType === 'FILL_BLANK_PRACTICE')
  const isPersonalSpeak =
    ['SPEAK_PROMPT', 'SENTENCE_BUILDER', 'SPEAKING'].includes(type) &&
    !isPractice
  const isConversation =
    ['OPEN_CONVERSATION', 'FOLLOW_UP_CONVERSATION', 'FINAL_CONVERSATION', 'CONVERSATION'].includes(type) ||
    ['INTERACT', 'FOLLOW_UP', 'REASONS', 'RESPECT_DIFFERENCES', 'FINAL_TALK'].includes(stage)
  const isClass1AIConversation = experienceId === 'g01-l01' && isConversation && activity.aiEnabled
  const isClass1Classroom = experienceId === 'g01-l01'
  const class1CoachStatus = isRecording ? 'Listening to your answer'
    : isProcessing ? 'Thinking about your answer'
      : isJulieSpeaking ? 'Miss Julie is speaking'
        : isCompleted ? 'Great work!'
          : isRetry ? 'Let us try together'
            : 'Your turn to learn and speak'

  const pose: MissJulieState = isCompleted
    ? 'celebrating'
    : isRetry
      ? 'try_again'
      : isProcessing
        ? 'thinking'
        : isRecording
          ? 'listening'
          : isJulieSpeaking
            ? 'speaking'
            : julieState === 'greeting'
              ? 'welcome'
              : 'teaching'

  const juliePortraitByPose: Partial<Record<MissJulieState, string>> = {
    canonical: '/miss-julie/welcome.webp',
    idle: '/miss-julie/welcome.webp',
    welcome: '/miss-julie/welcome.webp',
    teaching: '/miss-julie/teaching.webp',
    modeling: '/miss-julie/modeling.webp',
    listening: '/miss-julie/listening.webp',
    thinking: '/miss-julie/thinking.webp',
    speaking: '/miss-julie/speaking.webp',
    curious: '/miss-julie/listening.webp',
    encouraging: '/miss-julie/encouraging.webp',
    correct: '/miss-julie/heart.webp',
    try_again: '/miss-julie/try_again.webp',
    retry: '/miss-julie/retry.webp',
    hinting: '/miss-julie/hinting.webp',
    proud: '/miss-julie/proud.webp',
    celebrate: '/miss-julie/celebrating.webp',
    celebrating: '/miss-julie/celebrating.webp',
    pointing: '/miss-julie/pointing.webp',
    reading: '/miss-julie/reading.webp',
    standing: '/miss-julie/welcome.webp',
  }

  const julieImage =
    juliePortraitByPose[pose] ||
    talkoraAssets.julie.welcome

  const julieAnimationName = pose === 'celebrating'
    ? 'celebrating'
    : pose === 'try_again'
      ? 'encouraging'
      : pose === 'listening'
        ? 'listening'
        : pose === 'thinking'
          ? 'thinking'
          : pose === 'speaking'
            ? 'speaking'
            : 'idle'
  const julieAnimation = !reduceMotion
    ? `/miss-julie-animations/transparent/${julieAnimationName}.webm`
    : null

  useEffect(() => {
    setJulieAnimationReady(false)
  }, [julieAnimation])

  const studentImage = learnerAvatar(avatarType)

  function submitTyped(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = typedInput.trim()
    if (!value) return
    onSubmitText(value)
    setTypedInput('')
  }

  async function chooseWarmup(likesIt: boolean, fromVoice = false) {
    if (warmupLocked || isJulieSpeaking || (isProcessing && !fromVoice)) return

    const item = warmupItems[warmupIndex]
    if (!item) return

    setWarmupLocked(true)

    const answer = warmupAnswer(item.label, likesIt)
    setWarmupAnswers((current) => [...current, answer])

    const reaction = warmupReaction(item.label, likesIt)
    const nextIndex = warmupIndex + 1
    const nextItem = warmupItems[nextIndex]

    if (nextItem) {
      const nextLine = `${reaction} ${warmupQuestion(nextItem.label)}`

      // Move the visual and teacher copy together before audio starts.
      // This prevents the old bug where Julie asked about cricket while
      // the card showed chilli (or any other mismatched prompt).
      setWarmupIndex(nextIndex)
      setWarmupJulieText(nextLine)

      await onSpeakText(
        nextLine,
        `warmup:${activity.id}:${nextIndex}:${likesIt ? 'yes' : 'no'}`,
      )

      setWarmupLocked(false)
      if (fromVoice) onResumeListening()
      return
    }

    const finishLine = `${reaction} Nice! Three quick picks done. Now let’s turn your real favourites into a conversation.`
    setWarmupJulieText(finishLine)

    await onSpeakText(
      finishLine,
      `warmup:${activity.id}:complete`,
    )

    onLocalComplete('Quick Picks complete — you shared three real preferences.', [...warmupAnswers, answer].join('\n'))
  }

  const currentDialogue = dialogueTurns[dialogueIndex]
  const currentWarmup = warmupItems[Math.min(warmupIndex, Math.max(0, warmupItems.length - 1))]
  const visibleJulieMessage =
    isWarmup && currentWarmup
      ? warmupJulieText || warmupQuestion(currentWarmup.label)
      : julieMessage

  // The task card and Miss Julie bubble share the same first-turn question.
  // After the learner answers, AI follow-up text becomes the new active prompt.
  const activeTaskPrompt = personalizeLessonText(
    conversationTurn > 0 ? julieMessage : canonicalPrompt || julieMessage || activity.prompt,
    studentName,
  )
  // Spoken Yes/No is transcribed once in the parent. This triggers the exact
  // same authored warm-up path as the existing buttons: no invented questions.
  useEffect(() => {
    if (!isWarmup || !spokenWarmupAnswer ||
        handledVoiceAnswer.current === spokenWarmupAnswer.id) return
    handledVoiceAnswer.current = spokenWarmupAnswer.id
    void chooseWarmup(spokenWarmupAnswer.likesIt, true)
    // The unique transcript id is the event boundary, not every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenWarmupAnswer?.id, activity.id])

  // The authored Class 4 model dialogues used to require one click per line.
  // Read the *existing* turns in order, then save actual listening completion.
  useEffect(() => {
    if (!teacherReady || !audioEnabled || !isModelDialogue || !dialogueTurns.length ||
        automaticActivityRef.current === `model:${activity.id}`) return
    automaticActivityRef.current = `model:${activity.id}`
    const currentId = activity.id
    void (async () => {
      for (const [i, turn] of dialogueTurns.entries()) {
        if (liveActivityRef.current !== currentId) return
        setDialogueIndex(i)
        await onSpeakText(turn.text, `dialogue:${currentId}:auto:${i}`)
      }
      if (liveActivityRef.current !== currentId) return
      onLocalComplete('Miss Julie finished reading the model conversation.', `Listened to all ${dialogueTurns.length} model turns`)
    })()
    // Only start once per activity when the parent says narration is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherReady, activity.id, isModelDialogue])

  // Non-interactive visual/reward steps no longer hide progression behind a
  // tiny Continue button. No fabricated speaking-score or self-rating is saved.
  useEffect(() => {
    const requiresResponse = requiresVoiceResponse || isWarmup || isQuiz || isModelDialogue || isRepeat ||
      isPersonalSpeak || isPractice || isConversation
    if (!teacherReady || requiresResponse || automaticActivityRef.current === `visual:${activity.id}`) return
    automaticActivityRef.current = `visual:${activity.id}`
    onLocalComplete('Ready for the next activity.', stage === 'REWARD' ? 'Viewed lesson reward' : 'Viewed visual lesson step')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherReady, activity.id])

  const coachCue = lessonCoachCue(activity)

  return (
    <div className="tk-scene">
      <div className="tk-focus-vignette" aria-hidden="true" />

      <section className="tk-stage-grid">
        <motion.aside
          className="tk-julie"
          initial={{ opacity: 0, x: -52, y: 18 }}
          animate={{
            opacity: 1,
            x: 0,
            y: reduceMotion ? 0 : isJulieSpeaking ? [0, -4, 0] : 0,
          }}
          transition={{
            opacity: { duration: 0.3 },
            x: { type: 'spring', stiffness: 120, damping: 18 },
            y: { duration: 1.2, repeat: isJulieSpeaking && !reduceMotion ? Infinity : 0, ease: 'easeInOut' },
          }}
          data-julie-state={pose}
        >
          {isJulieSpeaking && !reduceMotion ? (
            <motion.span
              className="tk-julie-aura"
              animate={{ scale: [0.82, 1.18, 0.82], opacity: [0.16, 0.5, 0.16] }}
              transition={{ duration: 1.45, repeat: Infinity }}
            />
          ) : null}
          {/* Keying by pose actually crossfades the different approved teacher assets.
              Motion follows the real lesson state, not an unrelated timer. */}
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={julieImage}
              className={`tk-julie-pose${julieAnimation && julieAnimationReady ? ' has-transparent-animation' : ''}`}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 12, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -9, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }}
            >
              <Image
                src={julieImage}
                alt={`Miss Julie ${pose === 'listening' ? 'listening to you' : pose === 'thinking' ? 'thinking' : pose === 'speaking' ? 'speaking' : pose === 'celebrating' ? 'celebrating' : 'teaching'}`}
                width={330}
                height={520}
                sizes="(max-width: 640px) 120px, (max-width: 1024px) 240px, 330px"
                priority={pose === 'teaching' || pose === 'welcome'}
              />
              {julieAnimation ? <video
                key={julieAnimation}
                className="tk-julie-animation"
                src={julieAnimation}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                onCanPlay={() => setJulieAnimationReady(true)}
                onError={() => setJulieAnimationReady(false)}
              /> : null}
            </motion.div>
          </AnimatePresence>
          <div className="tk-character-name tk-character-name--julie">
            <Sparkles size={13} /> Miss Julie
          </div>
        </motion.aside>

        <div className="tk-learning-stack">
          {isClass1Classroom ? (
            <div className="tk-class1-classroom-banner" aria-label="Miss Julie interactive classroom">
              <div className="tk-class1-school-mark"><School size={23} aria-hidden="true" /></div>
              <div>
                <small>ENGLISH BALBHARATI · CLASS 1</small>
                <strong>Miss Julie&apos;s Learning Studio</strong>
              </div>
              <span className="tk-class1-three-steps"><Headphones size={15} /> Listen <Mic size={15} /> Speak <Sparkles size={15} /> Learn</span>
            </div>
          ) : null}
          <motion.section
            className="tk-julie-bubble"
            key={visibleJulieMessage}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            aria-live="polite"
          >
            <div className="tk-bubble-head">
              <div>
                <span className="tk-speaker-dot" aria-hidden="true" />
                <strong>MISS JULIE</strong>
                <small>{isJulieSpeaking ? 'Speaking now' : 'Your English coach'}</small>
              </div>
              {audioEnabled ? <button
                type="button"
                className="tk-listen-again"
                onClick={() => {
                  if (isWarmup) {
                    void onSpeakText(visibleJulieMessage, `warmup:${activity.id}:listen:${warmupIndex}`)
                    return
                  }
                  onReplayJulie()
                }}
                aria-label="Hear Miss Julie again"
                title="Hear Miss Julie again"
              >
                <Volume2 size={19} />
                <span>Listen</span>
              </button> : null}
            </div>

            {experienceId === 'g01-l01' ? (
              <div className={`tk-class1-teaching-mode${isClass1AIConversation ? ' is-ai' : ''}`} role="status" aria-live="polite">
                <span>{isClass1AIConversation ? '✦ AI-guided conversation' : '✦ Miss Julie’s guided lesson'}</span>
                <span>{class1CoachStatus}</span>
              </div>
            ) : null}

            <p>{visibleJulieMessage}</p>

            {needsAudioGesture && (
              <button type="button" onClick={onEnableAudio} className="tk-enable-sound">
                <Volume2 size={19} aria-hidden="true" /> Enable sound &amp; continue
              </button>
            )}

            {isJulieSpeaking ? (
              <div className="tk-wave" aria-hidden="true">
                <i /><i /><i /><i /><i /><i />
              </div>
            ) : null}
          </motion.section>

          <section className="tk-task-float" aria-label={`${activity.title} activity`}>
            <div className="tk-task-meta">
              <div className="tk-task-step">
                <span>{index + 1}</span>
                <small>of {totalActivities}</small>
              </div>

              <div className="tk-task-heading">
                <span>{stage.replaceAll('_', ' ')}</span>
                <strong>{!audioEnabled && isModelDialogue ? 'Read the Conversation' : !audioEnabled && isRepeat ? 'Read and Say' : activity.title}</strong>
              </div>

              <div className="tk-skill-pill">
                {isWarmup ? '🎯 Likes & dislikes' : hasSkillLabel(type, stage)}
              </div>

              {xpEarned > 0 ? <b className="tk-xp-pill">✦ {xpEarned} XP</b> : null}
              {onReplayFromStart ? <button type="button" className="tk-replay-start" onClick={onReplayFromStart}>Replay from start</button> : null}
            </div>

            <div className="tk-coach-cue" role="note" aria-label={coachCue.label}>
              <span aria-hidden="true">{coachCue.icon}</span>
              <div>
                <strong>{coachCue.label}</strong>
                <small>{coachCue.tip}</small>
              </div>
            </div>

            {isClass1Classroom && !isQuiz ? (
              <div className="tk-class1-board-prompt" aria-label="Live English practice board">
                <span>{isClass1AIConversation ? 'LET’S TALK TOGETHER' : 'TODAY’S ENGLISH PRACTICE'}</span>
                <strong>{activeTaskPrompt}</strong>
                {modelSentence && isRetry ? <em>Try saying: {modelSentence}</em> : null}
              </div>
            ) : null}

            {skippedPictureActivityCount > 0 ? <p className="tk-kg-skipped-note" role="status">{skippedPictureActivityCount} picture {skippedPictureActivityCount === 1 ? 'activity is' : 'activities are'} skipped until the illustrations are ready. They do not count as completed.</p> : null}

            {isWarmup && currentWarmup ? (
              <WarmupScene
                item={currentWarmup}
                current={warmupIndex + 1}
                total={warmupItems.length}
                locked={warmupLocked || isCompleted}
                onLike={() => chooseWarmup(true)}
                onDislike={() => chooseWarmup(false)}
              />
            ) : null}

            {isWarmup && currentWarmup && !isCompleted ? <p className="tk-voice-help">{isRecording ? '🎙️ Listening — say yes or no' : 'Say “Yes” or “No” — or touch an answer.'}</p> : null}

            {pilotUnavailableMessage ? (
              <div className="tk-simple-scene">
                <span>ACTIVITY UNAVAILABLE</span>
                <h2>{activity.title}</h2>
                <p className="tk-picture-hint" role="status">{pilotUnavailableMessage}</p>
                <button type="button" className="tk-voice-retry" onClick={onAdvance}>
                  <ArrowRight size={18} /> Continue lesson
                </button>
              </div>
            ) : null}

            {isQuiz && !pilotUnavailableMessage ? (
              <motion.div className="tk-simple-scene" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 210, damping: 18 }}>
                <span>{experienceId === 'g01-l01'
                  ? activity.content?.pictureMode === true ? 'LOOK AND CHOOSE' : 'LISTEN AND CHOOSE'
                  : isSpelling ? 'SAY OR BUILD THE WORD' : activity.content?.pictureMode === true ? 'SAY IT OR TOUCH' : 'SAY YOUR ANSWER'}</span>
                <h2>{activeTaskPrompt}</h2>
                <p className="tk-voice-help" aria-live="polite">{experienceId === 'g01-l01'
                  ? isRecording ? 'Listening. Say the word, or touch an answer.' : isProcessing ? 'Miss Julie is checking...' : 'Say the word or touch an answer.'
                  : isRecording ? isSpelling ? 'Listening - spell the full word' : 'Listening - say the word or option number' : isProcessing ? 'Checking your answer...' : isSpelling ? 'Say the full word. Or tap letters to build it.' : 'Say your answer aloud. You can also tap a choice.'}</p>
                {activity.content?.pictureMode === true && typeof activity.content?.languageHint === 'string' ? (
                  <p className="tk-picture-hint" lang="hi">{activity.content.languageHint}</p>
                ) : null}
                {pictureLoadFailed ? <p className="tk-picture-hint" role="alert">A lesson picture did not load. This answer is paused so a missing picture cannot count as a successful picture activity.</p> : null}
                <div className={activity.content?.pictureMode === true ? 'tk-picture-grid' : 'tk-choice-grid'}>
                  {(activity.choices || []).map((option) => (
                    <motion.button key={`${activity.id}:${option}`} type="button" whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: .96 }}
                      disabled={isCompleted || isProcessing || isJulieSpeaking || pictureLoadFailed} onClick={() => isSpelling ? setSpelledWord((current) => `${current}${option}`) : onSelectChoice(option)}
                      className={activity.content?.pictureMode === true ? 'tk-picture-tile' : 'tk-choice-tile'}
                      aria-label={isSpelling ? `Add letter ${option}` : `Choose ${option}`}>
                      {activity.content?.pictureMode === true ? (
                        (() => {
                          const pictureOption = pictureOptions.find((item) => item.word === option && item.status === 'READY' && typeof item.assetKey === 'string')
                          return typeof pictureOption?.assetKey === 'string' ? (
                            <span className="tk-picture-image-wrap"><Image className="tk-picture-image" src={`/lessons/kg/pictures/${encodeURIComponent(pictureOption.assetKey)}.webp`} alt={option} width={240} height={160} sizes="(max-width: 700px) 42vw, 220px" onError={() => setPictureLoadFailed(true)} /></span>
                          ) : experienceId === 'g01-l01' ? <Class1ChoicePictogram word={option} /> : <span className="tk-picture-emoji" role="img" aria-label={option}>{pictureEmoji(option)}</span>
                        })()
                      ) : experienceId === 'g01-l01' ? null : <span aria-hidden="true" style={{ marginRight: 9 }}>{pictureEmoji(option)}</span>}
                      <span>{option}</span>
                    </motion.button>
                  ))}
                </div>
                {isSpelling ? (
                  <div className="tk-spelling-check" aria-label="Your spelled word">
                    <strong>{spelledWord || 'Tap letters or say the word'}</strong>
                    <button type="button" disabled={!spelledWord || isProcessing || isCompleted} onClick={() => onSelectChoice(spelledWord)}>Check word</button>
                    <button type="button" disabled={!spelledWord || isProcessing || isCompleted} onClick={() => setSpelledWord('')}>Clear</button>
                  </div>
                ) : null}
                {!(activity.choices || []).length ? <p>Quiz choices are missing from this lesson. Please ask your teacher to update the lesson.</p> : null}
                {!isRecording && !isProcessing && !isCompleted ? <button type="button" className="tk-voice-retry" onClick={onStartMic}><Mic size={18} /> Speak answer</button> : null}
              </motion.div>
            ) : null}

            {isModelDialogue ? (
              <ModelDialogueScene
                audioEnabled={audioEnabled}
                turn={currentDialogue}
                index={dialogueIndex}
                total={dialogueTurns.length}
                onBack={() => {
                  const nextIndex = Math.max(0, dialogueIndex - 1)
                  setDialogueIndex(nextIndex)
                  const turn = dialogueTurns[nextIndex]
                  if (turn?.text) void onSpeakText(turn.text, `dialogue:${activity.id}:${nextIndex}`)
                }}
                onNext={() => {
                  void (async () => {
                    if (dialogueIndex < dialogueTurns.length - 1) {
                      const nextIndex = dialogueIndex + 1
                      setDialogueIndex(nextIndex)
                      const next = dialogueTurns[nextIndex]
                      if (next?.text) await onSpeakText(next.text, `dialogue:${activity.id}:${nextIndex}`)
                      return
                    }

                    await onSpeakText(
                      `Great listening, ${studentName}! Now it is your turn to join the conversation.`,
                      `dialogue:${activity.id}:complete`,
                    )
                    onLocalComplete(audioEnabled ? 'Great listening! Now it is your turn.' : 'Great reading! Now it is your turn.', `${audioEnabled ? 'Listened to' : 'Read'} all ${dialogueTurns.length} turns`)
                  })()
                }}
                onSpeak={() => {
                  if (currentDialogue?.text) {
                    void onSpeakText(currentDialogue.text, `dialogue:${activity.id}:${dialogueIndex}`)
                  }
                }}
              />
            ) : null}

            {isRepeat && !isModelDialogue ? (
              <RepeatScene
                audioEnabled={audioEnabled}
                sentence={personalizeLessonText(expectedPhrase || modelSentence || activity.modelSentence || activity.target || activity.prompt, studentName)}
                showTextFallback={isRetry}
                typedInput={typedInput}
                onChange={setTypedInput}
                onSubmit={submitTyped}
                isRecording={isRecording}
                isProcessing={isProcessing}
                seconds={seconds}
                onReplay={onReplayJulie}
                onStart={onStartMic}
                onStop={onStopMic}
              />
            ) : null}

            {isPersonalSpeak ? (
              <PersonalSpeakScene
                prompt={activeTaskPrompt}
                instruction={activity.instruction}
                modelSentence={isRetry ? modelSentence : conversationTurn === 0 ? activity.modelSentence : undefined}
                choices={conversationTurn === 0 && activity.allowOptions ? activity.choices || [] : []}
                allowTyped={allowTyped}
                typedInput={typedInput}
                isProcessing={isProcessing}
                isRecording={isRecording}
                seconds={seconds}
                onChange={setTypedInput}
                onSubmit={submitTyped}
                onStart={onStartMic}
                onStop={onStopMic}
                onChoice={onSelectChoice}
              />
            ) : null}

            {isPractice ? (
              <PracticeScene
                prompt={activeTaskPrompt}
                starter={activity.modelSentence || activity.target || 'I like ___ the most.'}
                allowTyped={allowTyped}
                typedInput={typedInput}
                isProcessing={isProcessing}
                isRecording={isRecording}
                seconds={seconds}
                onChange={setTypedInput}
                onSubmit={submitTyped}
                onStart={onStartMic}
                onStop={onStopMic}
              />
            ) : null}

            {isConversation && !isPractice ? (
              <ConversationScene
                prompt={julieMessage}
                modelSentence={isRetry ? modelSentence : undefined}
                turn={conversationTurn}
                allowTyped={allowTyped}
                typedInput={typedInput}
                choices={conversationTurn === 0 && activity.allowOptions ? activity.choices || [] : []}
                isProcessing={isProcessing}
                isRecording={isRecording}
                seconds={seconds}
                onChange={setTypedInput}
                onSubmit={submitTyped}
                onStart={onStartMic}
                onStop={onStopMic}
                onChoice={onSelectChoice}
              />
            ) : null}

            {stage === 'REWARD' ? (
              <FavouriteFinderReflection
                badge={typeof activity.content?.badge === 'string' ? activity.content.badge : 'Favourite Finder'}
                skills={Array.isArray(activity.content?.skills) ? activity.content.skills.filter((skill): skill is string => typeof skill === 'string') : []}
                homePractice={typeof activity.content?.homePractice === 'string' ? activity.content.homePractice : undefined}
                completed={isCompleted || isProcessing}
                onComplete={(answer) => onLocalComplete('Your Favourite Finder reflection is saved!', answer)}
              />
            ) : null}

            {stage !== 'REWARD' && !isQuiz && !isWarmup && !isModelDialogue && !isRepeat && !isPersonalSpeak && !isPractice && !isConversation ? (
              <div className="tk-simple-scene">
                <Sparkles size={28} />
                <h2>{activeTaskPrompt}</h2>
                {requiresVoiceResponse ? (
                  <KidMic isRecording={isRecording} isProcessing={isProcessing} seconds={seconds} onStart={onStartMic} onStop={onStopMic} />
                ) : (
                  <button type="button" onClick={() => onLocalComplete('Ready for the next part!', 'Viewed lesson reward')}>
                    Continue <ArrowRight size={18} />
                  </button>
                )}
              </div>
            ) : null}

            {isClass1Classroom ? (
              <div className={`tk-class1-student-voice${isRecording ? ' is-listening' : ''}${isProcessing ? ' is-thinking' : ''}`} role="status" aria-live="polite">
                <span className="tk-class1-voice-icon"><Mic size={21} aria-hidden="true" /></span>
                <div>
                  <small>{isRecording ? 'YOUR MICROPHONE IS LISTENING' : isProcessing ? 'MISS JULIE IS THINKING' : 'YOUR TURN · SPEAK TO MISS JULIE'}</small>
                  <strong>{studentTurnText || transcript || (isRecording ? 'Say your answer in your own words…' : 'You can ask for help in Hindi or Marathi.')}</strong>
                </div>
                <span className="tk-class1-voice-pulse" aria-hidden="true" />
              </div>
            ) : null}

            <AnimatePresence>
              {statusText ? (
                <motion.div className="tk-status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  {isProcessing ? <LoaderCircle size={15} className="tk-spin" /> : <Sparkles size={15} />}
                  {statusText}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {feedback ? (
                <motion.div className={`tk-feedback ${isRetry ? 'is-retry' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <span>{isRetry ? 'TRY AGAIN' : 'MISS JULIE'}</span>
                  <strong>{feedback}</strong>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {isCompleted ? (
              <motion.button
                type="button"
                className="tk-continue"
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ y: 2 }}
                onClick={onAdvance}
              >
                Continue Adventure <ArrowRight size={20} />
              </motion.button>
            ) : null}
          </section>
        </div>

        {!isClass1Classroom ? <motion.aside
          className="tk-student"
          initial={{ opacity: 0, x: 46, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.08 }}
        >
          <div className="tk-student-glow" aria-hidden="true" />
          <Image src={studentImage} alt={studentName} width={220} height={330} />
          <div className="tk-character-name tk-character-name--student">YOU · {studentName}</div>

          <AnimatePresence>
            {!isQuiz && (studentTurnText || transcript) ? (
              <motion.div
                className="tk-student-said"
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <small>You said</small>
                <strong>“{studentTurnText || transcript}”</strong>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.aside> : null}
      </section>

      <Styles />
    </div>
  )
}

function hasSkillLabel(type: string, stage: string) {
  if (type.includes('REPEAT')) return '🎧 Listen & repeat'
  if (stage.includes('PRACTICE')) return '✏️ Build a sentence'
  if (type.includes('CONVERSATION') || stage.includes('TALK')) return '💬 Conversation'
  if (type.includes('SPEAK')) return '🎙️ Speaking'
  if (type.includes('LISTEN')) return '🎧 Listening'
  return '✨ English practice'
}

function FavouriteFinderReflection({ badge, skills, homePractice, completed, onComplete }: { badge: string; skills: string[]; homePractice?: string; completed: boolean; onComplete: (answer: string) => void }) {
  const [ratings, setRatings] = useState<Record<number, string>>({})
  const prompts = skills.length ? skills : ['Ask and answer favourite questions', 'Ask follow-up questions', 'Speak politely about differences', 'Speak clearly in full sentences']
  const choices = [{ value: 'confident', label: '😊 Confident' }, { value: 'practising', label: '🙂 Practising' }, { value: 'need_help', label: '🙁 Need help' }]
  return <div className="tk-reflection" style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', alignItems: 'stretch', width: 'min(100%, 650px)', margin: '0 auto', color: '#18364a' }}>
    <div style={{ textAlign: 'center' }}><Trophy size={44} color="#d99800" aria-hidden="true" /><h2 style={{ margin: '6px 0', color: '#18364a' }}>{badge} badge</h2><p>How do you feel about each speaking skill?</p></div>
    {prompts.map((skill, index) => <div key={skill} style={{ background: '#fff', border: '1px solid #dce9dc', borderRadius: 14, padding: 12 }}>
      <strong style={{ display: 'block', marginBottom: 8 }}>{skill}</strong>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {choices.map((choice) => <button key={choice.value} type="button" aria-pressed={ratings[index] === choice.value} disabled={completed} onClick={() => setRatings((current) => ({ ...current, [index]: choice.value }))} style={{ minHeight: 38, padding: '7px 10px', borderRadius: 9, border: ratings[index] === choice.value ? '2px solid #159975' : '1px solid #bfd3cc', background: ratings[index] === choice.value ? '#e7fff5' : '#fff', color: '#163a34', fontSize: 12 }}>{choice.label}</button>)}
      </div>
    </div>)}
    {homePractice ? <p style={{ background: '#eef8ff', border: '1px solid #c4e7f6', borderRadius: 12, padding: 12, margin: 0, fontSize: 13 }}><strong>Try it at home:</strong> {homePractice}</p> : null}
    <button type="button" disabled={completed || prompts.some((_, index) => !ratings[index])} onClick={() => onComplete(skills.length ? JSON.stringify({ kind: 'Favourite Finder reflection', ratings: prompts.map((skill, index) => ({ skill, rating: ratings[index] })) }) : 'Viewed lesson reward')} style={{ minHeight: 46, border: 0, borderRadius: 12, background: '#ffcc49', color: '#18364a', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: completed || prompts.some((_, index) => !ratings[index]) ? .5 : 1 }}>Save my reflection <ArrowRight size={18} /></button>
  </div>
}


function WarmupScene({
  item,
  current,
  total,
  locked,
  onLike,
  onDislike,
}: {
  item: { label: string; emoji: string }
  current: number
  total: number
  locked: boolean
  onLike: () => void
  onDislike: () => void
}) {
  const yesSentence = warmupAnswer(item.label, true)
  const noSentence = warmupAnswer(item.label, false)

  return (
    <div className="tk-warmup">
      <div className="tk-mini-progress" aria-label={`Warm-up card ${current} of ${total}`}>
        <span>{current}/{total}</span>
        <div>
          {Array.from({ length: total }, (_, i) => (
            <i key={i} className={i < current ? 'done' : ''} />
          ))}
        </div>
      </div>

      <motion.div
        key={item.label}
        className="tk-warmup-object"
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      >
        <div className="tk-object-emoji" aria-hidden="true">{item.emoji}</div>
        <div className="tk-object-copy">
          <small>YOUR QUICK CHOICE</small>
          <strong>{item.label}</strong>
          <p>Answer in a full English sentence.</p>
        </div>
      </motion.div>

      <div className="tk-language-pattern" aria-label="English sentence pattern">
        <span>USE THIS PATTERN</span>
        <strong>“I like …”</strong>
        <i>or</i>
        <strong>“I don’t like …”</strong>
      </div>

      <div className="tk-warmup-actions">
        <motion.button
          type="button"
          className="is-yes"
          disabled={locked}
          whileHover={locked ? undefined : { y: -4, scale: 1.01 }}
          whileTap={locked ? undefined : { y: 2, scale: 0.985 }}
          onClick={onLike}
        >
          <span className="tk-answer-icon">👍</span>
          <span className="tk-answer-copy">
            <small>YES</small>
            <strong>{yesSentence}</strong>
          </span>
        </motion.button>

        <motion.button
          type="button"
          className="is-no"
          disabled={locked}
          whileHover={locked ? undefined : { y: -4, scale: 1.01 }}
          whileTap={locked ? undefined : { y: 2, scale: 0.985 }}
          onClick={onDislike}
        >
          <span className="tk-answer-icon">👎</span>
          <span className="tk-answer-copy">
            <small>NO</small>
            <strong>{noSentence}</strong>
          </span>
        </motion.button>
      </div>
    </div>
  )
}

function ModelDialogueScene({
  audioEnabled,
  turn,
  index,
  total,
  onBack,
  onNext,
  onSpeak,
}: {
  audioEnabled: boolean
  turn?: DialogueTurn
  index: number
  total: number
  onBack: () => void
  onNext: () => void
  onSpeak: () => void
}) {
  if (!turn) return <div className="tk-simple-scene"><h2>Read the conversation.</h2></div>
  const speaker = turn.speaker || turn.role || (index % 2 === 0 ? 'Sunny' : 'Preethi')
  return (
    <div className="tk-dialogue-scene">
      <div className="tk-dialogue-title"><Headphones size={20} /> {audioEnabled ? 'Listen like a story' : 'Read the conversation'}</div>
      <AnimatePresence mode="wait">
        <motion.div key={`${index}-${turn.text}`} className="tk-dialogue-card" initial={{ opacity: 0, x: 24, rotateY: -8 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, x: -24 }}>
          <div className="tk-dialogue-avatar">{speaker.toLowerCase().includes('preethi') ? '👧' : speaker.toLowerCase().includes('miss') ? '👩‍🏫' : '👦'}</div>
          <div><small>{speaker}</small><strong>{turn.text}</strong></div>
          {audioEnabled ? <button type="button" onClick={onSpeak}><Volume2 size={18} /></button> : null}
        </motion.div>
      </AnimatePresence>
      <div className="tk-dialogue-controls">
        <button type="button" disabled={index === 0} onClick={onBack}><ChevronLeft size={17} /> Back</button>
        <span>{index + 1}/{Math.max(1, total)}</span>
        <button type="button" onClick={onNext}>{index >= total - 1 ? audioEnabled ? 'I listened' : 'I read it' : 'Next'} <ChevronRight size={17} /></button>
      </div>
    </div>
  )
}

function RepeatScene({
  audioEnabled,
  sentence,
  showTextFallback,
  typedInput,
  onChange,
  onSubmit,
  isRecording,
  isProcessing,
  seconds,
  onReplay,
  onStart,
  onStop,
}: {
  audioEnabled: boolean
  sentence: string
  showTextFallback: boolean
  typedInput: string
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isRecording: boolean
  isProcessing: boolean
  seconds: number
  onReplay: () => void
  onStart: () => void
  onStop: () => void
}) {
  return (
    <div className="tk-repeat-scene">
      <span className="tk-mode-chip"><Headphones size={16} /> {audioEnabled ? 'LISTEN & REPEAT' : 'READ & SAY'}</span>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>“{sentence}”</motion.h2>
      {audioEnabled ? <button type="button" className="tk-replay" onClick={onReplay}><Volume2 size={18} /> Hear Miss Julie</button> : null}
      <KidMic isRecording={isRecording} isProcessing={isProcessing} seconds={seconds} onStart={onStart} onStop={onStop} />
      {showTextFallback ? <div className="tk-repeat-fallback"><p>Microphone having trouble? Type the words you said.</p><TypedAnswer value={typedInput} disabled={isProcessing || isRecording} onChange={onChange} onSubmit={onSubmit} /></div> : null}
    </div>
  )
}


function PersonalSpeakScene({
  prompt,
  instruction,
  modelSentence,
  choices,
  allowTyped,
  typedInput,
  isProcessing,
  isRecording,
  seconds,
  onChange,
  onSubmit,
  onStart,
  onStop,
  onChoice,
}: {
  prompt: string
  instruction?: string
  modelSentence?: string
  choices: string[]
  allowTyped: boolean
  typedInput: string
  isProcessing: boolean
  isRecording: boolean
  seconds: number
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onStart: () => void
  onStop: () => void
  onChoice: (value: string) => void
}) {
  return (
    <div className="tk-personal-speak">
      <div className="tk-mode-chip"><MessageCircle size={15} /> YOUR TURN</div>
      <h2>{prompt}</h2>
      {instruction ? <p>{instruction}</p> : null}
      {modelSentence ? (
        <div className="tk-sentence-starter">
          <small>TRY A FULL SENTENCE</small>
          <strong>{modelSentence}</strong>
        </div>
      ) : null}

      {choices.length ? (
        <div className="tk-idea-chips">
          {choices.map((choice) => (
            <motion.button
              key={choice}
              type="button"
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChoice(choice)}
            >
              {choice}
            </motion.button>
          ))}
        </div>
      ) : null}

      <KidMic
        isRecording={isRecording}
        isProcessing={isProcessing}
        seconds={seconds}
        onStart={onStart}
        onStop={onStop}
      />

      {allowTyped ? (
        <>
          <div className="tk-or"><span />OR TYPE<span /></div>
          <TypedAnswer
            value={typedInput}
            disabled={isProcessing || isRecording}
            onChange={onChange}
            onSubmit={onSubmit}
          />
        </>
      ) : null}
    </div>
  )
}

function PracticeScene({
  prompt,
  starter,
  allowTyped,
  typedInput,
  isProcessing,
  isRecording,
  seconds,
  onChange,
  onSubmit,
  onStart,
  onStop,
}: {
  prompt: string
  starter: string
  allowTyped: boolean
  typedInput: string
  isProcessing: boolean
  isRecording: boolean
  seconds: number
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onStart: () => void
  onStop: () => void
}) {
  return (
    <div className="tk-practice-scene">
      <span className="tk-mode-chip"><PencilLine size={16} /> PRACTICE ZONE</span>
      <h2>{prompt}</h2>
      <div className="tk-starter">{starter}</div>
      {allowTyped ? <TypedAnswer value={typedInput} disabled={isProcessing || isRecording} onChange={onChange} onSubmit={onSubmit} /> : null}
      <KidMic small isRecording={isRecording} isProcessing={isProcessing} seconds={seconds} onStart={onStart} onStop={onStop} />
    </div>
  )
}

function ConversationScene({
  prompt,
  modelSentence,
  turn,
  allowTyped,
  typedInput,
  choices,
  isProcessing,
  isRecording,
  seconds,
  onChange,
  onSubmit,
  onStart,
  onStop,
  onChoice,
}: {
  prompt: string
  modelSentence?: string
  turn: number
  allowTyped: boolean
  typedInput: string
  choices: string[]
  isProcessing: boolean
  isRecording: boolean
  seconds: number
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onStart: () => void
  onStop: () => void
  onChoice: (value: string) => void
}) {
  return (
    <div className="tk-conversation-scene">
      <span className="tk-mode-chip"><MessageCircle size={16} /> REAL CONVERSATION {turn > 0 ? `• TURN ${turn}` : ''}</span>
      <h2>{prompt}</h2>
      {modelSentence ? <div className="tk-starter">Try: “{modelSentence}”</div> : null}
      <KidMic isRecording={isRecording} isProcessing={isProcessing} seconds={seconds} onStart={onStart} onStop={onStop} />
      {allowTyped ? (
        <>
          <div className="tk-or"><span />OR TYPE<span /></div>
          <TypedAnswer value={typedInput} disabled={isProcessing || isRecording} onChange={onChange} onSubmit={onSubmit} />
        </>
      ) : null}
      {choices.length ? (
        <div className="tk-help-chips">
          <small>Need a little help?</small>
          {choices.map((choice) => <button key={choice} type="button" onClick={() => onChoice(choice)}>{choice}</button>)}
        </div>
      ) : null}
    </div>
  )
}

function TypedAnswer({
  value,
  disabled,
  onChange,
  onSubmit,
}: {
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="tk-type" onSubmit={onSubmit}>
      <input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder="Type your answer…" autoComplete="off" />
      <button type="submit" disabled={disabled || !value.trim()}><Send size={18} /></button>
    </form>
  )
}

function KidMic({
  isRecording,
  isProcessing,
  seconds,
  onStart,
  onStop,
  small = false,
}: {
  isRecording: boolean
  isProcessing: boolean
  seconds: number
  onStart: () => void
  onStop: () => void
  small?: boolean
}) {
  return (
    <div className={`tk-mic ${small ? 'is-small' : ''}`}>
      {isRecording ? (
        <>
          <motion.i animate={{ scale: [0.8, 1.7], opacity: [0.55, 0] }} transition={{ duration: 1.25, repeat: Infinity }} />
          <motion.i animate={{ scale: [0.8, 1.7], opacity: [0.55, 0] }} transition={{ duration: 1.25, delay: 0.62, repeat: Infinity }} />
        </>
      ) : null}
      <motion.button
        type="button"
        disabled={isProcessing}
        className={isRecording ? 'is-recording' : ''}
        whileHover={isProcessing ? undefined : { y: -4, scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={isRecording ? onStop : onStart}
      >
        {isProcessing ? <LoaderCircle size={small ? 24 : 32} className="tk-spin" /> : isRecording ? <Square size={small ? 21 : 28} fill="currentColor" /> : <Mic size={small ? 28 : 37} />}
      </motion.button>
      <strong>{isProcessing ? 'Thinking…' : isRecording ? `Listening ${seconds}/6s` : 'Tap to speak'}</strong>
    </div>
  )
}

function Styles() {
  return (
    <style jsx global>{`
      .tk-coach-cue {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 12px 0 14px;
        padding: 10px 12px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(255, 227, 111, 0.16), rgba(74, 222, 128, 0.10));
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .tk-coach-cue > span { font-size: 24px; }
      .tk-coach-cue div { display: grid; gap: 2px; }
      .tk-coach-cue strong { color: #fde68a; font-size: 11px; letter-spacing: .1em; }
      .tk-coach-cue small { color: rgba(248, 250, 252, .82); font-weight: 700; }
      /* =========================================================
         TALKORA LESSON — IMMERSIVE ENGLISH COACHING STAGE
         The world stays visible. The learning task stays focused.
         ========================================================= */

      .tk-scene {
        --ink: #f7fbff;
        --muted: #bfd2de;
        --navy: rgba(7, 24, 42, 0.9);
        --navy-soft: rgba(12, 39, 60, 0.84);
        --cream: #fff7dc;
        --yellow: #ffd95a;
        --green: #57d39b;
        --pink: #ff7f9f;
        --blue: #78c8ff;
        position: relative;
        width: 100%;
        min-height: calc(100svh - 58px);
        padding: clamp(14px, 2vw, 26px) clamp(18px, 3vw, 48px) clamp(18px, 2.5vw, 34px);
        display: grid;
        align-items: end;
        overflow: hidden;
        isolation: isolate;
      }

      .tk-focus-vignette {
        position: absolute;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        background:
          radial-gradient(ellipse at 50% 47%, rgba(4, 18, 31, 0.03) 0 25%, rgba(4, 18, 31, 0.16) 62%, rgba(4, 18, 31, 0.42) 100%),
          linear-gradient(90deg, rgba(4, 15, 27, 0.34), transparent 19%, transparent 81%, rgba(4, 15, 27, 0.34));
      }

      .tk-stage-grid {
        width: min(1500px, 100%);
        min-height: min(760px, calc(100svh - 96px));
        margin: 0 auto;
        display: grid;
        grid-template-columns: minmax(220px, 0.82fr) minmax(560px, 2.15fr) minmax(220px, 0.82fr);
        align-items: end;
        gap: clamp(16px, 2.25vw, 38px);
      }

      /* ------------------------- CHARACTERS ------------------------- */

      .tk-julie,
      .tk-student {
        position: relative;
        align-self: end;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        overflow: visible;
      }

      .tk-julie {
        width: min(25vw, 360px);
        min-width: 210px;
        height: min(67vh, 610px);
        justify-self: end;
        z-index: 3;
      }

      .tk-julie::after,
      .tk-student::after {
        content: '';
        position: absolute;
        left: 12%;
        right: 12%;
        bottom: 18px;
        height: 34px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.34);
        filter: blur(13px);
        z-index: 0;
      }

      .tk-julie img,
      .tk-student img {
        position: relative;
        z-index: 2;
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center bottom;
        filter: drop-shadow(0 22px 22px rgba(0, 0, 0, 0.28));
      }

      .tk-julie-pose {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: end;
        justify-content: center;
        pointer-events: none;
      }

      .tk-julie-animation {
        position: absolute;
        inset: 0;
        z-index: 3;
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center bottom;
        opacity: 0;
        filter: drop-shadow(0 22px 22px rgba(0, 0, 0, .28));
        transition: opacity .16s ease-out;
      }

      .tk-julie-pose.has-transparent-animation img { opacity: 0; }
      .tk-julie-pose.has-transparent-animation .tk-julie-animation { opacity: 1; }

      .tk-julie-aura,
      .tk-student-glow {
        position: absolute;
        z-index: 1;
        left: 16%;
        bottom: 13%;
        width: 68%;
        aspect-ratio: 1;
        border-radius: 50%;
        pointer-events: none;
        filter: blur(18px);
      }

      .tk-julie-aura {
        background: radial-gradient(circle, rgba(255, 218, 88, 0.46), rgba(255, 218, 88, 0) 68%);
      }

      .tk-student-glow {
        background: radial-gradient(circle, rgba(120, 200, 255, 0.28), rgba(120, 200, 255, 0) 70%);
      }

      .tk-student {
        width: min(28vw, 420px);
        min-width: 250px;
        height: min(65vh, 590px);
        justify-self: start;
        z-index: 3;
      }

      .tk-character-name {
        position: absolute;
        z-index: 5;
        bottom: 8px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 30px;
        padding: 0 12px;
        border: 1px solid rgba(255,255,255,.55);
        border-radius: 999px;
        color: #172c3e;
        font-size: 10px;
        font-weight: 1000;
        letter-spacing: .06em;
        text-transform: uppercase;
        box-shadow: 0 5px 0 rgba(0,0,0,.16), 0 9px 20px rgba(0,0,0,.18);
        backdrop-filter: blur(8px);
      }

      .tk-character-name--julie { background: rgba(255, 227, 111, .94); }
      .tk-character-name--student { background: rgba(212, 243, 255, .94); white-space: nowrap; }

      .tk-student-said {
        position: absolute;
        right: 0;
        bottom: 88%;
        z-index: 8;
        width: min(250px, 20vw);
        padding: 12px 14px;
        border: 1px solid rgba(255,255,255,.7);
        border-radius: 18px 18px 6px 18px;
        background: rgba(247, 253, 255, .94);
        color: #17334b;
        box-shadow: 0 14px 32px rgba(0,0,0,.24);
        backdrop-filter: blur(12px);
      }

      .tk-student-said small {
        display: block;
        margin-bottom: 4px;
        color: #4d8daa;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .tk-student-said strong {
        display: block;
        font-size: 13px;
        line-height: 1.35;
      }

      /* ------------------------- LEARNING STACK ------------------------- */

      .tk-learning-stack {
        position: relative;
        z-index: 6;
        align-self: center;
        width: 100%;
        max-width: 790px;
        margin: 0 auto clamp(18px, 3vh, 38px);
        display: grid;
        gap: 14px;
      }

      .tk-julie-bubble {
        position: relative;
        width: 100%;
        padding: 17px 20px 18px;
        border: 1px solid rgba(255,255,255,.24);
        border-radius: 24px 24px 24px 9px;
        color: var(--ink);
        background:
          linear-gradient(135deg, rgba(8, 27, 45, .95), rgba(13, 43, 61, .9));
        box-shadow:
          0 8px 0 rgba(2, 13, 24, .28),
          0 22px 52px rgba(0,0,0,.29),
          inset 0 1px 0 rgba(255,255,255,.08);
        backdrop-filter: blur(18px) saturate(1.16);
      }

      .tk-julie-bubble::before {
        content: '';
        position: absolute;
        left: -14px;
        bottom: 22px;
        width: 28px;
        height: 28px;
        background: rgba(9, 29, 47, .96);
        clip-path: polygon(100% 0, 100% 100%, 0 100%);
      }

      .tk-bubble-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .tk-bubble-head > div {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tk-speaker-dot {
        width: 9px;
        height: 9px;
        flex: 0 0 9px;
        border-radius: 50%;
        background: var(--pink);
        box-shadow: 0 0 0 5px rgba(255, 127, 159, .14);
      }

      .tk-bubble-head strong {
        color: #ff9bb3;
        font-size: 10px;
        font-weight: 1000;
        letter-spacing: .12em;
      }

      .tk-bubble-head small {
        color: #9fb9ca;
        font-size: 10px;
        font-weight: 750;
      }

      .tk-listen-again {
        min-height: 36px;
        padding: 0 11px;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        background: rgba(255,255,255,.09);
        color: #e9f8ff;
        font-size: 10px;
        font-weight: 900;
        cursor: pointer;
        transition: transform .16s ease, background .16s ease;
      }

      .tk-enable-sound { display:inline-flex; align-items:center; justify-content:center; gap:9px; margin-top:13px; padding:13px 18px; border:2px solid #ffcf5a; border-radius:14px; background:#ffcc40; color:#17264c; font-size:14px; font-weight:900; cursor:pointer; box-shadow:0 5px 14px #0002; }
      .tk-enable-sound:hover { background:#ffe07d; }
      .tk-listen-again:hover { transform: translateY(-2px); background: rgba(255,255,255,.14); }
      .tk-listen-again:active { transform: translateY(1px); }

      .tk-julie-bubble > p {
        margin: 11px 0 0;
        color: #fffdf7;
        font-size: clamp(22px, 2vw, 32px);
        font-weight: 950;
        letter-spacing: -.026em;
        line-height: 1.16;
        text-wrap: balance;
      }

      .tk-wave {
        height: 14px;
        margin-top: 11px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .tk-wave i {
        width: 3px;
        height: 6px;
        border-radius: 99px;
        background: linear-gradient(180deg, #ffd95a, #ff8fac);
        animation: tkWave .62s ease-in-out infinite;
      }

      .tk-wave i:nth-child(2){animation-delay:.07s}.tk-wave i:nth-child(3){animation-delay:.14s}.tk-wave i:nth-child(4){animation-delay:.21s}.tk-wave i:nth-child(5){animation-delay:.28s}.tk-wave i:nth-child(6){animation-delay:.35s}
      @keyframes tkWave { 50% { height: 14px; transform: translateY(-1px); } }

      /* ------------------------- ACTIVITY CARD ------------------------- */

      .tk-task-float {
        position: relative;
        width: 100%;
        padding: 14px 15px 16px;
        border: 1px solid rgba(255,255,255,.23);
        border-radius: 25px;
        color: var(--ink);
        background:
          linear-gradient(150deg, rgba(7, 28, 45, .92), rgba(12, 44, 58, .88));
        box-shadow:
          0 8px 0 rgba(1, 12, 22, .28),
          0 24px 56px rgba(0,0,0,.30),
          inset 0 1px 0 rgba(255,255,255,.08);
        backdrop-filter: blur(20px) saturate(1.18);
      }

      .tk-task-meta {
        min-height: 42px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .tk-task-step {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        border-radius: 14px;
        display: grid;
        place-content: center;
        text-align: center;
        background: linear-gradient(145deg, #ffe470, #ffc33f);
        color: #223546;
        box-shadow: 0 4px 0 #a96c20;
      }

      .tk-task-step span { font-size: 13px; font-weight: 1000; line-height: 1; }
      .tk-task-step small { margin-top: 2px; font-size: 7px; font-weight: 900; text-transform: uppercase; }

      .tk-task-heading {
        min-width: 0;
        flex: 1;
      }

      .tk-task-heading span {
        display: block;
        margin-bottom: 2px;
        color: #79d8bc;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: .13em;
        text-transform: uppercase;
      }

      .tk-task-heading strong {
        display: block;
        overflow: hidden;
        color: #fff;
        font-size: 13px;
        font-weight: 900;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tk-skill-pill,
      .tk-xp-pill {
        min-height: 29px;
        padding: 0 10px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        font-size: 9px;
        font-weight: 900;
      }

      .tk-skill-pill {
        border: 1px solid rgba(120, 200, 255, .25);
        background: rgba(120, 200, 255, .10);
        color: #cdeeff;
      }

      .tk-xp-pill {
        border: 1px solid rgba(255, 217, 90, .28);
        background: rgba(255, 217, 90, .12);
        color: #ffe987;
      }

      /* ------------------------- WARM-UP ------------------------- */

      .tk-warmup {
        width: 100%;
      }

      .tk-mini-progress {
        margin: 0 2px 10px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .tk-mini-progress > span {
        color: #b9cad5;
        font-size: 8px;
        font-weight: 900;
      }

      .tk-mini-progress > div {
        flex: 1;
        display: flex;
        gap: 5px;
      }

      .tk-mini-progress i {
        height: 5px;
        flex: 1;
        max-width: 58px;
        border-radius: 99px;
        background: rgba(255,255,255,.11);
        overflow: hidden;
      }

      .tk-mini-progress i.done {
        background: linear-gradient(90deg, #5ed6a0, #ffe266);
        box-shadow: 0 0 12px rgba(94, 214, 160, .20);
      }

      .tk-warmup-object {
        min-height: 105px;
        padding: 13px 18px;
        border: 1px solid rgba(255,255,255,.86);
        border-radius: 20px;
        display: grid;
        grid-template-columns: 90px 1fr;
        align-items: center;
        gap: 16px;
        background:
          radial-gradient(circle at 15% 20%, rgba(255,255,255,.95), transparent 26%),
          linear-gradient(145deg, #fff7d8, #f8efd1);
        color: #18364c;
        box-shadow: 0 6px 0 #cdb76e, 0 12px 24px rgba(0,0,0,.14);
      }

      .tk-object-emoji {
        width: 78px;
        height: 78px;
        border-radius: 22px;
        display: grid;
        place-items: center;
        background: rgba(255,255,255,.66);
        box-shadow: inset 0 0 0 1px rgba(27, 61, 81, .06), 0 7px 17px rgba(91, 73, 34, .12);
        font-size: 48px;
      }

      .tk-object-copy small {
        display: block;
        color: #3e9a86;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: .12em;
      }

      .tk-object-copy strong {
        display: block;
        margin-top: 3px;
        font-size: clamp(22px, 2vw, 30px);
        font-weight: 1000;
        letter-spacing: -.02em;
      }

      .tk-object-copy p {
        margin: 3px 0 0;
        color: #6d776f;
        font-size: 10px;
        font-weight: 700;
      }

      .tk-language-pattern {
        margin: 10px 1px;
        min-height: 34px;
        padding: 7px 10px;
        border: 1px dashed rgba(120, 200, 255, .32);
        border-radius: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: rgba(120, 200, 255, .07);
        color: #dceefa;
      }

      .tk-language-pattern > span {
        color: #82ccee;
        font-size: 7px;
        font-weight: 1000;
        letter-spacing: .11em;
      }

      .tk-language-pattern strong {
        font-size: 11px;
        font-weight: 900;
      }

      .tk-language-pattern i {
        color: #8199a8;
        font-size: 9px;
        font-style: normal;
      }

      .tk-warmup-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .tk-warmup-actions button {
        min-height: 70px;
        padding: 10px 12px;
        border: 1px solid rgba(255,255,255,.25);
        border-radius: 17px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #173649;
        cursor: pointer;
        text-align: left;
        transition: filter .16s ease, opacity .16s ease;
      }

      .tk-warmup-actions button.is-yes {
        background: linear-gradient(145deg, #e8ffdd, #c9f2c3);
        box-shadow: 0 5px 0 #7eaf79;
      }

      .tk-warmup-actions button.is-no {
        background: linear-gradient(145deg, #ffe6e1, #ffcfc7);
        box-shadow: 0 5px 0 #bd827a;
      }

      .tk-warmup-actions button:disabled {
        opacity: .56;
        cursor: default;
        filter: saturate(.72);
      }

      .tk-answer-icon {
        width: 40px;
        height: 40px;
        flex: 0 0 40px;
        border-radius: 13px;
        display: grid;
        place-items: center;
        background: rgba(255,255,255,.55);
        font-size: 23px;
      }

      .tk-answer-copy { min-width: 0; }
      .tk-answer-copy small { display: block; color: #53806c; font-size: 7px; font-weight: 1000; letter-spacing: .12em; }
      .tk-warmup-actions .is-no .tk-answer-copy small { color: #9b5b55; }
      .tk-answer-copy strong { display: block; margin-top: 2px; font-size: 11px; font-weight: 950; line-height: 1.25; }

      /* ------------------------- OTHER ACTIVITY TYPES ------------------------- */

      .tk-dialogue-scene,
      .tk-repeat-scene,
      .tk-practice-scene,
      .tk-conversation-scene,
      .tk-personal-speak,
      .tk-simple-scene {
        color: #eef8ff;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .tk-dialogue-title,
      .tk-mode-chip {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #7de0c1;
        font-size: 9px;
        font-weight: 1000;
        letter-spacing: .12em;
      }

      .tk-personal-speak h2,
      .tk-repeat-scene h2,
      .tk-conversation-scene h2,
      .tk-practice-scene h2,
      .tk-simple-scene h2 {
        max-width: 680px;
        margin: 8px auto 10px;
        color: #fff;
        font-size: clamp(21px, 2vw, 29px);
        line-height: 1.2;
      }

      .tk-personal-speak > p { max-width: 620px; margin: 2px auto 9px; color: #bdd1dc; font-size: 11px; }

      .tk-sentence-starter,
      .tk-starter {
        margin: 6px auto 10px;
        padding: 9px 13px;
        border: 1px solid rgba(255, 227, 106, .24);
        border-radius: 14px;
        background: rgba(255, 227, 106, .10);
        color: #fff0af;
      }

      .tk-sentence-starter small { display: block; color: #80d7bf; font-size: 7px; font-weight: 1000; letter-spacing: .12em; }
      .tk-sentence-starter strong { display: block; margin-top: 3px; font-size: 16px; }
      .tk-starter { font-size: 12px; font-weight: 800; }

      .tk-idea-chips,
      .tk-help-chips {
        width: min(700px,100%);
        margin: 5px auto 8px;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 7px;
      }

      .tk-idea-chips button,
      .tk-help-chips button {
        padding: 8px 12px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 999px;
        background: rgba(255,255,255,.10);
        color: #effbff;
        font-size: 10px;
        font-weight: 850;
        cursor: pointer;
      }

      .tk-help-chips small { width: 100%; color: #9eb7c6; }

      .tk-dialogue-card {
        width: min(680px, 100%);
        margin: 12px auto;
        padding: 14px;
        display: grid;
        grid-template-columns: 52px 1fr 38px;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(255,255,255,.7);
        border-radius: 19px;
        background: #fff5cf;
        color: #1d3a4c;
        box-shadow: 0 6px 0 #cdbb79;
        text-align: left;
      }

      .tk-dialogue-avatar { width: 48px; height: 48px; border-radius: 15px; display: grid; place-items: center; background: #fff; font-size: 25px; }
      .tk-dialogue-card small { display:block; color:#d25b7a; font-size:8px; font-weight:1000; text-transform:uppercase; }
      .tk-dialogue-card strong { display:block; margin-top:3px; font-size:clamp(16px,1.7vw,22px); }
      .tk-dialogue-card button { width:36px; height:36px; border:0; border-radius:50%; display:grid; place-items:center; background:#d9f3e9; color:#31544d; cursor:pointer; }

      .tk-dialogue-controls { display:flex; align-items:center; justify-content:center; gap:10px; }
      .tk-dialogue-controls button,
      .tk-replay {
        min-height: 39px;
        padding: 0 12px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255,255,255,.10);
        color: #eaf8ff;
        font-weight: 850;
        cursor: pointer;
      }
      .tk-dialogue-controls button:disabled { opacity:.4; }
      .tk-dialogue-controls span { color:#aec0cb; font-size:9px; font-weight:900; }

      .tk-type {
        width: min(540px, 100%);
        display: flex;
        gap: 8px;
      }

      .tk-type input {
        flex: 1;
        min-height: 48px;
        padding: 0 14px;
        border: 1px solid rgba(255,255,255,.20);
        border-radius: 14px;
        outline: none;
        background: rgba(255,255,255,.94);
        color: #1f394b;
        font-size: 13px;
        font-weight: 750;
      }

      .tk-type input:focus { border-color:#70cbb4; box-shadow:0 0 0 4px rgba(112,203,180,.13); }
      .tk-type button { width:48px; border:0; border-radius:14px; background:#e46082; color:#fff; box-shadow:0 5px 0 #9f3c58; cursor:pointer; }
      .tk-type button:disabled { opacity:.45; }

      .tk-or { width:min(430px,100%); margin:9px auto; display:flex; align-items:center; gap:10px; color:#91a9b8; font-size:8px; font-weight:900; }
      .tk-or span { height:1px; flex:1; background:rgba(255,255,255,.14); }

      .tk-mic { position:relative; margin-top:9px; display:flex; flex-direction:column; align-items:center; }
      .tk-mic > i { position:absolute; top:-5px; width:86px; height:86px; border:3px solid rgba(255,118,150,.36); border-radius:50%; pointer-events:none; }
      .tk-mic button {
        position:relative;
        z-index:2;
        width:72px;
        height:72px;
        border:4px solid rgba(255,255,255,.95);
        border-radius:50%;
        display:grid;
        place-items:center;
        background:linear-gradient(145deg,#ffe26a,#ffbb3f);
        color:#243d42;
        box-shadow:0 7px 0 #9f681d,0 14px 26px rgba(0,0,0,.22);
        cursor:pointer;
      }
      .tk-mic button.is-recording { background:linear-gradient(145deg,#ff7896,#d94469); color:white; box-shadow:0 7px 0 #872443,0 0 28px rgba(229,68,105,.32); }
      .tk-mic.is-small button { width:58px; height:58px; }
      .tk-mic strong { margin-top:8px; color:#b7cad5; font-size:9px; }

      .tk-status {
        width: fit-content;
        margin: 10px auto 0;
        padding: 7px 11px;
        display: flex;
        align-items: center;
        gap: 6px;
        border: 1px solid rgba(120, 217, 188, .18);
        border-radius: 999px;
        background: rgba(91, 199, 165, .09);
        color: #a4efd8;
        font-size: 9px;
        font-weight: 850;
      }

      .tk-feedback {
        width: min(650px,100%);
        margin: 10px auto 0;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 9px;
        border: 1px solid rgba(119, 217, 166, .24);
        border-radius: 13px;
        background: rgba(87, 211, 155, .10);
        color: #d8ffec;
        font-size: 10px;
      }
      .tk-feedback > span { color:#83e3b7; font-size:8px; font-weight:1000; letter-spacing:.08em; }
      .tk-feedback.is-retry { border-color:rgba(255,205,101,.26); background:rgba(255,205,101,.10); color:#ffefc4; }
      .tk-feedback.is-retry > span { color:#ffd572; }

      .tk-continue,
      .tk-simple-scene button {
        min-height: 46px;
        margin: 12px auto 0;
        padding: 0 18px;
        border: 0;
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        background: linear-gradient(145deg,#ffe260,#ffb735);
        color:#243629;
        box-shadow:0 6px 0 #96631a,0 12px 22px rgba(0,0,0,.18);
        font-weight:1000;
        cursor:pointer;
      }

      .tk-spin { animation: tkSpin .8s linear infinite; }
      @keyframes tkSpin { to { transform: rotate(360deg); } }

      /* =========================================================
         V4 — OPEN, RESPONSIVE LEARNING CANVAS
         The lesson uses the whole scene instead of squeezing learning into a tiny panel,
         with one clear teacher message and one clear learning action.
         ========================================================= */

      .tk-scene {
        height: 100%;
        min-height: 0;
        padding: clamp(14px, 2.2vw, 34px) clamp(14px, 3vw, 54px) clamp(14px, 2.4vw, 34px);
        align-items: stretch;
        overflow: hidden;
      }

      .tk-focus-vignette {
        background:
          linear-gradient(90deg, rgba(4, 15, 27, .30), transparent 24%, transparent 78%, rgba(4, 15, 27, .22)),
          linear-gradient(180deg, rgba(4, 15, 27, .06), transparent 36%, rgba(4, 15, 27, .20));
      }

      .tk-stage-grid {
        width: min(1640px, 100%);
        min-height: 0;
        height: 100%;
        margin: 0 auto;
        grid-template-columns: clamp(210px, 19vw, 320px) minmax(0, 850px) clamp(220px, 20vw, 330px);
        justify-content: center;
        align-items: end;
        gap: clamp(12px, 1.5vw, 28px);
      }

      .tk-learning-stack {
        align-self: center;
        width: 100%;
        max-width: 860px;
        margin: 0;
        gap: clamp(14px, 2vh, 22px);
      }

      .tk-julie {
        width: 100%;
        min-width: 0;
        height: min(70vh, 660px);
        justify-self: stretch;
      }

      .tk-student {
        width: 100%;
        min-width: 0;
        height: min(61vh, 560px);
        justify-self: stretch;
      }

      .tk-julie-bubble {
        padding: clamp(18px, 2.1vw, 28px) clamp(18px, 2.3vw, 30px);
        border: 2px solid rgba(255,255,255,.88);
        border-radius: 28px 28px 28px 10px;
        color: #19344b;
        background:
          linear-gradient(145deg, rgba(255,253,245,.97), rgba(255,246,226,.94));
        box-shadow:
          0 8px 0 rgba(92, 57, 32, .18),
          0 26px 70px rgba(2, 12, 24, .30),
          inset 0 1px 0 rgba(255,255,255,.9);
        backdrop-filter: blur(18px) saturate(1.1);
      }

      .tk-julie-bubble::before {
        left: -17px;
        bottom: 26px;
        width: 30px;
        height: 30px;
        background: rgba(255,250,236,.97);
      }

      .tk-bubble-head strong { color: #d9587b; }
      .tk-bubble-head small { color: #688296; }
      .tk-speaker-dot { background: #ef6688; box-shadow: 0 0 0 5px rgba(239,102,136,.14); }

      .tk-listen-again {
        min-height: 40px;
        border-color: rgba(32, 71, 96, .14);
        background: rgba(41, 101, 128, .08);
        color: #244c62;
      }

      .tk-listen-again:hover { background: rgba(41, 101, 128, .14); }

      .tk-julie-bubble > p {
        color: #17324a;
        font-size: clamp(24px, 2.25vw, 36px);
        line-height: 1.15;
      }

      .tk-task-float {
        padding: clamp(16px, 1.8vw, 22px);
        border: 2px solid rgba(255,255,255,.82);
        border-radius: 30px;
        color: #18364a;
        background:
          linear-gradient(150deg, rgba(255,253,243,.96), rgba(244,250,239,.94));
        box-shadow:
          0 9px 0 rgba(83, 75, 45, .18),
          0 28px 72px rgba(0,0,0,.28),
          inset 0 1px 0 rgba(255,255,255,.95);
        backdrop-filter: blur(18px) saturate(1.1);
      }

      .tk-task-heading span { color: #33846f; }
      .tk-task-heading strong { color: #17374b; font-size: clamp(14px, 1.15vw, 18px); }
      .tk-skill-pill { color: #2f6d5f; background: #e3f5e9; border-color: #b8dec9; }
      .tk-xp-pill { color: #75540f; background: #fff0a9; border-color: #e8c65f; }
      .tk-replay-start {
        margin-left: auto;
        padding: 7px 11px;
        border: 1px solid #d3e5db;
        border-radius: 999px;
        background: #f4fbf6;
        color: #315b54;
        font-size: 10px;
        font-weight: 800;
        white-space: nowrap;
        cursor: pointer;
      }

      .tk-warmup-object {
        min-height: clamp(100px, 14vh, 132px);
        border: 2px solid rgba(64, 91, 66, .10);
        background: linear-gradient(145deg, #fff8d9, #fff1bd);
        box-shadow: 0 6px 0 rgba(178, 145, 64, .32);
      }

      .tk-object-copy small { color: #348772; }
      .tk-object-copy strong { color: #17364c; font-size: clamp(24px, 2.2vw, 34px); }
      .tk-object-copy p { color: #6b766e; font-size: 11px; }

      .tk-language-pattern {
        border-color: rgba(54, 123, 113, .22);
        background: rgba(67, 161, 139, .08);
        color: #315e58;
      }

      .tk-language-pattern > span { color: #3d907f; }
      .tk-language-pattern strong { color: #244e49; }
      .tk-language-pattern i { color: #78908a; }

      .tk-warmup-actions button {
        min-height: clamp(68px, 9.5vh, 86px);
        border: 2px solid rgba(32, 61, 49, .08);
        border-radius: 20px;
      }

      .tk-warmup-actions button.is-yes {
        background: linear-gradient(145deg, #e7ffd9, #c9f5c2);
        box-shadow: 0 6px 0 #78aa72;
      }

      .tk-warmup-actions button.is-no {
        background: linear-gradient(145deg, #ffe9e4, #ffcfc5);
        box-shadow: 0 6px 0 #be8279;
      }

      .tk-answer-copy strong { font-size: clamp(11px, .95vw, 14px); }

      .tk-dialogue-scene,
      .tk-repeat-scene,
      .tk-practice-scene,
      .tk-conversation-scene,
      .tk-personal-speak,
      .tk-simple-scene { color: #18364a; }

      .tk-personal-speak h2,
      .tk-repeat-scene h2,
      .tk-conversation-scene h2,
      .tk-practice-scene h2,
      .tk-simple-scene h2 { color: #18364a; }

      .tk-personal-speak > p { color: #5f7783; }
      .tk-dialogue-title, .tk-mode-chip { color: #328b73; }
      .tk-sentence-starter, .tk-starter { color: #795c1a; background: rgba(255,210,91,.17); border-color: rgba(181,139,39,.22); }
      .tk-sentence-starter small { color: #3d8a77; }
      .tk-idea-chips button, .tk-help-chips button { background: #eef7f3; border-color: #cfe5dc; color: #315b54; }
      .tk-help-chips small { color: #69817c; }
      .tk-dialogue-controls button, .tk-replay { background: #eef7f3; border-color: #cfe5dc; color: #315b54; }
      .tk-dialogue-controls span { color: #71847f; }
      .tk-or { color: #80918d; }
      .tk-or span { background: rgba(55,87,78,.14); }
      .tk-mic strong { color: #55716c; }

      .tk-status {
        border-color: rgba(55, 151, 119, .20);
        background: rgba(72, 190, 148, .10);
        color: #28715d;
      }

      .tk-feedback {
        border-color: rgba(54, 151, 106, .22);
        background: rgba(86, 196, 139, .12);
        color: #235f4b;
      }
      .tk-feedback > span { color: #2d8965; }
      .tk-feedback.is-retry { border-color: rgba(199, 142, 35, .25); background: rgba(255, 209, 100, .14); color: #6d5018; }
      .tk-feedback.is-retry > span { color: #9a6b12; }

      /* ------------------------- RESPONSIVE WIDTH ------------------------- */

      @media (max-width: 1320px) {
        .tk-scene { padding-left: 18px; padding-right: 18px; }
        .tk-stage-grid {
          grid-template-columns: clamp(140px, 17vw, 230px) minmax(0, 1fr) clamp(120px, 14vw, 180px);
          max-width: 1200px;
          gap: clamp(10px, 1.4vw, 22px);
        }
        .tk-student { height: min(40vh, 340px); }
        .tk-julie { height: min(66vh, 570px); }
      }

      @media (max-width: 980px) {
        .tk-student { display: none; }
        .tk-scene {
          padding: 14px;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
        }

        .tk-stage-grid {
          height: auto;
          min-height: 100%;
          grid-template-columns: clamp(106px, 18vw, 150px) minmax(0, 1fr);
          align-items: start;
          max-width: 900px;
          gap: 12px;
        }

        .tk-julie {
          width: 100%;
          height: clamp(190px, 29vh, 270px);
          align-self: start;
          margin-top: 24px;
        }

        .tk-learning-stack {
          align-self: start;
          gap: 12px;
        }

        .tk-julie-bubble { border-radius: 22px 22px 22px 8px; }
        .tk-julie-bubble > p { font-size: clamp(20px, 3vw, 28px); }
        .tk-task-float { border-radius: 24px; }
        .tk-skill-pill { display: none; }
        .tk-student-said { display: none; }
      }

      @media (max-width: 700px) {
        .tk-scene {
          padding: 10px 10px 26px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tk-stage-grid {
          display: grid;
          grid-template-columns: 72px minmax(0, 1fr);
          gap: 8px;
          width: 100%;
          max-width: none;
        }

        .tk-julie {
          grid-column: 1;
          grid-row: 1;
          width: 72px;
          height: 116px;
          margin-top: 10px;
          position: sticky;
          top: 4px;
          align-self: start;
          z-index: 8;
        }

        .tk-julie::after { bottom: 4px; height: 15px; }
        .tk-character-name { display: none; }

        .tk-learning-stack {
          grid-column: 2;
          grid-row: 1;
          width: 100%;
          min-width: 0;
        }

        .tk-julie-bubble {
          padding: 13px 14px 14px;
          border-width: 1px;
          border-radius: 18px 18px 18px 6px;
          box-shadow: 0 5px 0 rgba(92,57,32,.14), 0 16px 34px rgba(0,0,0,.20);
        }

        .tk-julie-bubble::before { left: -10px; bottom: 18px; width: 18px; height: 18px; }
        .tk-bubble-head small, .tk-listen-again span { display: none; }
        .tk-listen-again { width: 36px; min-height: 36px; padding: 0; justify-content: center; }
        .tk-julie-bubble > p { margin-top: 8px; font-size: clamp(16px, 4.4vw, 21px); line-height: 1.22; }
        .tk-wave { margin-top: 6px; }

        .tk-task-float {
          grid-column: 1 / -1;
          width: calc(100vw - 20px);
          margin-left: calc(-80px);
          padding: 12px;
          border-width: 1px;
          border-radius: 20px;
          box-shadow: 0 5px 0 rgba(83,75,45,.14), 0 18px 42px rgba(0,0,0,.22);
        }

        .tk-task-meta { min-height: 38px; margin-bottom: 10px; gap: 8px; }
        .tk-task-step { width: 38px; height: 38px; flex-basis: 38px; border-radius: 12px; }
        .tk-task-heading strong { font-size: 12px; }
        .tk-task-heading span { font-size: 7px; }
        .tk-xp-pill { display: none; }

        .tk-warmup-object {
          min-height: 86px;
          grid-template-columns: 58px minmax(0,1fr);
          gap: 10px;
          padding: 10px 12px;
          border-radius: 17px;
        }
        .tk-object-emoji { width: 54px; height: 54px; border-radius: 15px; font-size: 32px; }
        .tk-object-copy strong { font-size: clamp(18px, 5.6vw, 23px); }
        .tk-object-copy p { font-size: 9px; }

        .tk-language-pattern {
          min-height: 34px;
          margin: 8px 0;
          padding: 7px 8px;
          flex-wrap: wrap;
          gap: 4px 7px;
        }
        .tk-language-pattern > span { width: 100%; text-align: center; }

        .tk-warmup-actions { grid-template-columns: 1fr; gap: 9px; }
        .tk-warmup-actions button { min-height: 58px; border-radius: 16px; padding: 9px 10px; }
        .tk-answer-icon { width: 36px; height: 36px; flex-basis: 36px; border-radius: 11px; font-size: 20px; }
        .tk-answer-copy strong { font-size: 10.5px; }

        .tk-personal-speak h2,
        .tk-repeat-scene h2,
        .tk-conversation-scene h2,
        .tk-practice-scene h2,
        .tk-simple-scene h2 { font-size: clamp(18px, 5vw, 24px); }

        .tk-mic button { width: 64px; height: 64px; }
        .tk-dialogue-card { grid-template-columns: 44px 1fr 36px; gap: 8px; padding: 10px; }
        .tk-dialogue-avatar { width: 42px; height: 42px; }
        .tk-dialogue-card strong { font-size: 15px; }
      }

      @media (max-width: 430px) {
        .tk-stage-grid { grid-template-columns: 58px minmax(0,1fr); gap: 6px; }
        .tk-julie { width: 58px; height: 96px; }
        .tk-task-float { width: calc(100vw - 16px); margin-left: -64px; }
        .tk-bubble-head strong { font-size: 8px; }
        .tk-julie-bubble > p { font-size: 15px; }
        .tk-task-heading span { display: none; }
        .tk-object-copy p { display: none; }
        .tk-language-pattern strong { font-size: 10px; }
      }

      /* ------------------------- RESPONSIVE HEIGHT ------------------------- */

      @media (max-height: 760px) and (min-width: 981px) {
        .tk-scene { padding-top: 8px; padding-bottom: 8px; overflow-y: auto; }
        .tk-stage-grid { height: auto; min-height: 100%; }
        .tk-julie { height: min(61vh, 455px); }
        .tk-learning-stack { gap: 9px; }
        .tk-julie-bubble { padding: 12px 16px 13px; }
        .tk-julie-bubble > p { margin-top: 7px; font-size: clamp(19px, 1.7vw, 26px); }
        .tk-task-float { padding: 11px 13px 13px; }
        .tk-task-meta { min-height: 36px; margin-bottom: 8px; }
        .tk-warmup-object { min-height: 82px; padding: 8px 12px; }
        .tk-object-emoji { width: 58px; height: 58px; font-size: 36px; }
        .tk-language-pattern { margin: 7px 0; min-height: 30px; padding: 5px 8px; }
        .tk-warmup-actions button { min-height: 56px; }
      }

      /* Phase 2.1: voice-first, touch-accessible compact school/mobile layout. */
      .tk-voice-help {
        margin: 8px 0 12px;
        color: #17567a;
        font-size: clamp(13px, 1.4vw, 17px);
        font-weight: 800;
        line-height: 1.4;
      }
      .tk-voice-retry {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 48px;
        margin-top: 10px;
        border-radius: 14px;
        border: 2px solid #287cc4;
        background: #e8f4ff;
        color: #103b6b;
        padding: 8px 16px;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
      }
      .tk-spelling-check { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:10px; padding:12px; }
      .tk-spelling-check strong { min-width:100%; text-align:center; font-size:clamp(24px,4vw,32px); color:#10436c; letter-spacing:.16em; }
      .tk-spelling-check button { min-height:48px; border-radius:12px; border:1px solid #1b699a; padding:9px 16px; background:#ecf6ff; color:#143c65; font-weight:800; }
      .tk-spelling-check button:disabled { opacity:.5; }
      .tk-picture-grid, .tk-choice-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .tk-picture-tile, .tk-choice-tile { min-height: 74px; touch-action: manipulation; }
      .tk-kg-skipped-note { margin: 5px 0 8px; padding: 7px 10px; border: 1px solid #f1dfb7; border-radius: 10px; color: #755923; background: #fff9e9; font-size: 10px; font-weight: 750; line-height: 1.35; }
      .tk-picture-image-wrap { width: 100%; height: clamp(64px, 10vw, 104px); display: grid; place-items: center; overflow: hidden; }
      .tk-picture-image { width: 100%; height: 100%; max-width: 132px; object-fit: contain; }
      .tk-picture-tile:disabled { opacity: .7; cursor: not-allowed; }
      @media (max-width: 700px) {
        .tk-scene { height: 100%; min-height: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; padding: 10px 10px 30px; }
        .tk-stage-grid { display: grid; grid-template-columns: 64px minmax(0,1fr); gap: 9px; align-items: start; }
        .tk-learning-stack { grid-column: 2; min-width: 0; max-width: 100%; }
        .tk-julie { grid-column: 1; width: 64px; height: 104px; margin-top: 8px; }
        .tk-julie-bubble { max-width: 100%; padding: 12px; }
        .tk-julie-bubble > p { overflow-wrap: anywhere; }
        .tk-task-float { width: calc(100vw - 20px); max-width: none; margin-left: -73px; box-sizing: border-box; }
        .tk-task-float button { touch-action: manipulation; }
        .tk-picture-grid, .tk-choice-grid { grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
        .tk-picture-tile, .tk-choice-tile { min-width: 0; min-height: 84px; padding: 12px 8px; font-size: 15px; }
        .tk-picture-emoji { font-size: clamp(32px, 9vw, 46px); }
        .tk-replay-start { display: none; }
        .tk-continue { min-height: 52px; width: 100%; }
      }
      @media (max-width: 430px) {
        .tk-stage-grid { grid-template-columns: 56px minmax(0,1fr); gap: 7px; }
        .tk-julie { width: 56px; height: 96px; }
        .tk-task-float { margin-left: -63px; }
        .tk-picture-grid, .tk-choice-grid { gap: 8px; }
      }

      /* Class 1 keeps the shared activity and scoring flow, with a softer meadow palette. */
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-focus-vignette {
        background: linear-gradient(90deg, rgba(35, 91, 39, .10), transparent 20%, transparent 80%, rgba(35, 91, 39, .10));
      }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-julie-bubble {
        border-color: rgba(255,255,255,.96);
        background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(237,249,255,.96));
        box-shadow: 0 7px 0 rgba(79, 116, 71, .14), 0 22px 54px rgba(32, 72, 42, .22);
      }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-julie-bubble::before { background: rgba(248,253,255,.98); }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-bubble-head strong { color: #327a58; }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-speaker-dot { background: #54a875; box-shadow: 0 0 0 5px rgba(84,168,117,.14); }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-task-float {
        border-color: rgba(255,255,255,.96);
        background: linear-gradient(150deg, rgba(255,255,248,.98), rgba(240,250,233,.97));
        box-shadow: 0 8px 0 rgba(83, 115, 61, .15), 0 24px 58px rgba(32, 72, 42, .22);
      }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-task-step {
        background: linear-gradient(145deg, #ffe889, #ffd466);
        box-shadow: 0 4px 0 #b78b2e;
      }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-simple-scene h2 { color: #183e30; }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-choice-grid { width: min(620px, 100%); gap: 14px; }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-choice-tile {
        min-height: 82px;
        padding: 14px 18px;
        border: 2px solid #b8d99e;
        border-radius: 20px;
        background: linear-gradient(160deg, #fff, #f1fae9);
        color: #244d36;
        box-shadow: 0 5px 0 #b1cd98, 0 10px 20px rgba(52, 93, 47, .10);
        font-size: clamp(20px, 2vw, 28px);
        font-weight: 900;
        cursor: pointer;
        transition: transform .16s ease, box-shadow .16s ease;
      }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-choice-tile:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 7px 0 #a5c78c, 0 13px 24px rgba(52, 93, 47, .14);
      }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-picture-tile {
        min-height: 132px;
        padding: 12px;
        border: 2px solid #b8d99e;
        border-radius: 20px;
        background: linear-gradient(160deg, #fff, #f1fae9);
        color: #244d36;
        box-shadow: 0 5px 0 #b1cd98, 0 10px 20px rgba(52, 93, 47, .10);
        font-size: 18px;
        font-weight: 900;
        cursor: pointer;
      }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-picture-pictogram {
        width: 76px;
        height: 68px;
        display: grid;
        place-items: center;
        color: #44875d;
        border: 1px solid #cfe5bc;
        border-radius: 17px;
        background: linear-gradient(145deg, #fff, #e9f6df);
      }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-picture-pictogram-label { font-size: 20px; font-weight: 900; }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-choice-tile:focus-visible,
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-voice-retry:focus-visible { outline: 4px solid #f0bd47; outline-offset: 3px; }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-voice-help { color: #385f4a; }
      .tk-lesson-world[data-experience-id="g01-l01"] .tk-voice-retry {
        border-color: #43865d;
        background: linear-gradient(145deg, #e8f8df, #d2efc6);
        color: #234a32;
        box-shadow: 0 4px 0 #8eb67c;
      }
      @media (max-width: 700px) {
        .tk-lesson-world[data-experience-id="g01-l01"] .tk-choice-grid { gap: 10px; }
        .tk-lesson-world[data-experience-id="g01-l01"] .tk-choice-tile { min-height: 72px; padding: 10px 8px; }
        .tk-lesson-world[data-experience-id="g01-l01"] .tk-picture-tile { min-height: 108px; }
        .tk-lesson-world[data-experience-id="g01-l01"] .tk-picture-pictogram { width: 60px; height: 54px; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: .01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: .01ms !important;
        }
      }
    `}</style>
  )
}


function Class1ChoicePictogram({ word }: { word: string }) {
  const normalized = word.trim().toLowerCase()
  const Icon = normalized === 'school' ? School : normalized === 'bell' ? Bell : normalized === 'playground' ? TreePine : null
  return Icon
    ? <span className="tk-picture-pictogram" aria-hidden="true"><Icon size={58} strokeWidth={1.8} /></span>
    : <span className="tk-picture-pictogram-label">{word}</span>
}


/** Local pictograms render instantly; no image network request during KG lessons. */
function pictureEmoji(word: string): string {
  const icons: Record<string, string> = {
    apple: '🍎', banana: '🍌', cat: '🐱', dog: '🐶', ball: '⚽',
    car: '🚗', sun: '☀️', book: '📚', pencil: '✏️', bag: '🎒',
    hello: '👋', friend: '🧑‍🤝‍🧑', school: '🏫', home: '🏠',
    bell: '🔔', playground: '🛝', walk: '🚶', run: '🏃',
    what: '❓', where: '📍', when: '🕒', why: '🤔',
    morning: '🌞', hobby: '🎨', opinion: '💭', reason: '💡',
    choice: '✅', respect: '🤝', first: '1️⃣', then: '➡️',
    after: '⏭️', finally: '🏁', please: '🙏', could: '💬',
    thank: '💚', explain: '📖', evidence: '🔎', example: '📝',
    conclusion: '🎯', strength: '💪', goal: '🏆', experience: '🌟',
    opportunity: '🚀',
  }
  return icons[word.trim().toLowerCase()] || '✨'
}

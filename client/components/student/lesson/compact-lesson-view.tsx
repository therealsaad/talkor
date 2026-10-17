'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react'
import type { ActivityItem } from '@/services/curriculum-service'
import { learnerAvatar, talkoraAssets, type MissJulieState } from '@/config/talkora-assets'
import type { JulieVisualState } from '@/components/student/lesson/miss-julie-character'
import {
  getWarmupPrompts,
  isWarmupActivity,
  warmupAnswer,
  warmupQuestion,
  warmupReaction,
} from '@/services/lesson-presentation'

export interface CompactLessonViewProps {
  activity: ActivityItem
  index: number
  totalActivities: number
  julieMessage: string
  julieState: JulieVisualState
  isJulieSpeaking: boolean
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
  onSpeakText?: (text: string, key?: string) => Promise<void>
  onLocalComplete?: (message?: string) => void
}

type DialogueTurn = {
  role?: string
  speaker?: string
  text: string
  julieText?: string
  julieAnswer?: string
}

export function CompactLessonView({
  activity,
  index,
  totalActivities,
  julieMessage,
  julieState,
  isJulieSpeaking,
  transcript,
  studentTurnText,
  avatarType,
  studentName,
  statusText,
  feedback,
  modelSentence,
  seconds,
  isRecording,
  isProcessing,
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
  onSpeakText = async () => undefined,
  onLocalComplete = () => undefined,
}: CompactLessonViewProps) {
  const [typedInput, setTypedInput] = useState('')
  const [warmupIndex, setWarmupIndex] = useState(0)
  const [warmupAnswers, setWarmupAnswers] = useState<string[]>([])
  const [warmupLocked, setWarmupLocked] = useState(false)
  const [warmupJulieText, setWarmupJulieText] = useState('')
  const [dialogueIndex, setDialogueIndex] = useState(0)

  const type = String(activity.type || '').toUpperCase()
  const stage = String(activity.stage || '').toUpperCase()
  const digitalType = String(activity.metadata?.digitalType || '').toUpperCase()
  const allowTyped = activity.metadata?.allowTypedAnswer === true

  useEffect(() => {
    setTypedInput('')
    setWarmupIndex(0)
    setWarmupAnswers([])
    setWarmupLocked(false)
    setWarmupJulieText('')
    setDialogueIndex(0)
  }, [activity.id])

  const warmupItems = useMemo(() => getWarmupPrompts(activity), [activity])

  const dialogueTurns = useMemo<DialogueTurn[]>(() => {
    const source = activity.content?.dialogueTurns
    if (!Array.isArray(source)) return []
    return source
      .filter((item) => item && typeof item === 'object')
      .map((item) => item as DialogueTurn)
      .filter((item) => typeof item.text === 'string' && item.text.trim())
  }, [activity.content])

  const isWarmup = isWarmupActivity(activity)
  const isQuiz = ['MCQ', 'PICTURE_CHOICE', 'VISUAL_CHOICE', 'WORD_RECOGNITION'].includes(type) && stage !== 'REWARD'
  const isModelDialogue = type === 'LISTEN_MODEL' || digitalType === 'MODEL_CONVERSATION'
  const isRepeat = type === 'REPEAT_SENTENCE' || digitalType === 'EXACT_LINE_ROLE_SWAP'
  const isPractice = stage === 'PRACTICE_ZONE' || digitalType === 'FILL_BLANK_PRACTICE'
  const isPersonalSpeak =
    ['SPEAK_PROMPT', 'SENTENCE_BUILDER', 'SPEAKING'].includes(type) &&
    !isPractice
  const isConversation =
    ['OPEN_CONVERSATION', 'FOLLOW_UP_CONVERSATION', 'FINAL_CONVERSATION', 'CONVERSATION'].includes(type) ||
    ['INTERACT', 'FOLLOW_UP', 'REASONS', 'RESPECT_DIFFERENCES', 'FINAL_TALK'].includes(stage)

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
    canonical: '/miss-julie/welcome.png',
    idle: '/miss-julie/welcome.png',
    welcome: '/miss-julie/welcome.png',
    teaching: '/miss-julie/teaching.png',
    modeling: '/miss-julie/modeling.png',
    listening: '/miss-julie/listening.png',
    thinking: '/miss-julie/thinking.png',
    speaking: '/miss-julie/speaking.png',
    curious: '/miss-julie/listening.png',
    encouraging: '/miss-julie/encouraging.png',
    correct: '/miss-julie/heart.png',
    try_again: '/miss-julie/try_again.png',
    retry: '/miss-julie/retry.png',
    hinting: '/miss-julie/hinting.png',
    proud: '/miss-julie/proud.png',
    celebrate: '/miss-julie/celebrating.png',
    celebrating: '/miss-julie/celebrating.png',
    pointing: '/miss-julie/pointing.png',
    reading: '/miss-julie/reading.png',
    standing: '/miss-julie/welcome.png',
  }

  const julieImage =
    juliePortraitByPose[pose] ||
    talkoraAssets.julie.welcome

  const studentImage = learnerAvatar(avatarType)

  function submitTyped(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = typedInput.trim()
    if (!value) return
    onSubmitText(value)
    setTypedInput('')
  }

  async function chooseWarmup(likesIt: boolean) {
    if (warmupLocked || isJulieSpeaking || isProcessing) return

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
      return
    }

    const finishLine = `${reaction} Brilliant! You used “I like” and “I don't like” to share your own preferences. Let's continue.`
    setWarmupJulieText(finishLine)

    await onSpeakText(
      finishLine,
      `warmup:${activity.id}:complete`,
    )

    onLocalComplete('Warm-up complete — you shared your preferences in full English sentences.')
  }

  const currentDialogue = dialogueTurns[dialogueIndex]
  const currentWarmup = warmupItems[Math.min(warmupIndex, Math.max(0, warmupItems.length - 1))]
  const visibleJulieMessage =
    isWarmup && currentWarmup
      ? warmupJulieText || warmupQuestion(currentWarmup.label)
      : julieMessage

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
            y: isJulieSpeaking ? [0, -5, 0] : [0, -2, 0],
          }}
          transition={{
            opacity: { duration: 0.38 },
            x: { type: 'spring', stiffness: 120, damping: 18 },
            y: { duration: isJulieSpeaking ? 1.25 : 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          {isJulieSpeaking ? (
            <motion.span
              className="tk-julie-aura"
              animate={{ scale: [0.82, 1.18, 0.82], opacity: [0.16, 0.5, 0.16] }}
              transition={{ duration: 1.45, repeat: Infinity }}
            />
          ) : null}
          <Image src={julieImage} alt="Miss Julie" width={330} height={520} priority />
          <div className="tk-character-name tk-character-name--julie">
            <Sparkles size={13} /> Miss Julie
          </div>
        </motion.aside>

        <div className="tk-learning-stack">
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
              <button
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
              </button>
            </div>

            <p>{visibleJulieMessage}</p>

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
                <strong>{activity.title}</strong>
              </div>

              <div className="tk-skill-pill">
                {isWarmup ? '🎯 Likes & dislikes' : hasSkillLabel(type, stage)}
              </div>

              {xpEarned > 0 ? <b className="tk-xp-pill">✦ {xpEarned} XP</b> : null}
            </div>

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

            {isQuiz ? (
              <MCQScene
                prompt={activity.prompt}
                instruction={activity.instruction}
                choices={activity.choices || []}
                isProcessing={isProcessing}
                isCompleted={isCompleted}
                isRetry={isRetry}
                onChoice={onSelectChoice}
              />
            ) : null}

            {isModelDialogue ? (
              <ModelDialogueScene
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
                    onLocalComplete('Great listening! Now it is your turn.')
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
                sentence={modelSentence || activity.modelSentence || activity.target || activity.prompt}
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
                prompt={activity.prompt}
                instruction={activity.instruction}
                modelSentence={modelSentence || activity.modelSentence}
                choices={activity.allowOptions ? activity.choices || [] : []}
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
                prompt={activity.prompt}
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
                prompt={activity.instruction || activity.prompt}
                modelSentence={modelSentence || activity.modelSentence}
                turn={conversationTurn}
                allowTyped={allowTyped}
                typedInput={typedInput}
                choices={activity.allowOptions ? activity.choices || [] : []}
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

            {!isWarmup && !isQuiz && !isModelDialogue && !isRepeat && !isPersonalSpeak && !isPractice && !isConversation ? (
              <div className="tk-simple-scene">
                <Sparkles size={28} />
                <h2>{activity.prompt}</h2>
                <button type="button" onClick={() => onLocalComplete('Ready for the next part!')}>
                  Continue <ArrowRight size={18} />
                </button>
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

        <motion.aside
          className="tk-student"
          initial={{ opacity: 0, x: 46, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.08 }}
        >
          <div className="tk-student-glow" aria-hidden="true" />
          <Image src={studentImage} alt={studentName} width={220} height={330} />
          <div className="tk-character-name tk-character-name--student">YOU · {studentName}</div>

          <AnimatePresence>
            {(studentTurnText || transcript) ? (
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
        </motion.aside>
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

function MCQScene({
  prompt,
  instruction,
  choices,
  isProcessing,
  isCompleted,
  isRetry,
  onChoice,
}: {
  prompt: string
  instruction?: string
  choices: string[]
  isProcessing: boolean
  isCompleted: boolean
  isRetry: boolean
  onChoice: (value: string) => void
}) {
  return (
    <div className="tk-mcq">
      <div className="tk-mode-chip">
        <Sparkles size={16} />
        QUICK QUIZ
      </div>

      <h2>{prompt}</h2>

      {instruction ? <p>{instruction}</p> : null}

      <div className="tk-mcq-options">
        {choices.map((choice, index) => (
          <motion.button
            key={choice}
            type="button"
            disabled={isProcessing || isCompleted}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChoice(choice)}
            style={{
              minHeight: 72,
              padding: '15px 18px',
              borderRadius: 18,
              border: '3px solid #e5c16c',
              boxShadow: '0 5px 0 #b98e38',
              background: isRetry ? '#fff7dc' : '#fff2c8',
              color: '#183b4d',
              fontWeight: 800,
              cursor: isProcessing || isCompleted ? 'not-allowed' : 'pointer',
              opacity: isProcessing || isCompleted ? 0.7 : 1,
            }}
          >
            <span style={{ marginRight: 9 }}>{String.fromCharCode(65 + index)}</span>
            {choice}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function ModelDialogueScene({
  turn,
  index,
  total,
  onBack,
  onNext,
  onSpeak,
}: {
  turn?: DialogueTurn
  index: number
  total: number
  onBack: () => void
  onNext: () => void
  onSpeak: () => void
}) {
  if (!turn) return <div className="tk-simple-scene"><h2>Listen to the conversation.</h2></div>
  const speaker = turn.speaker || turn.role || (index % 2 === 0 ? 'Sunny' : 'Preethi')
  return (
    <div className="tk-dialogue-scene">
      <div className="tk-dialogue-title"><Headphones size={20} /> Listen like a story</div>
      <AnimatePresence mode="wait">
        <motion.div key={`${index}-${turn.text}`} className="tk-dialogue-card" initial={{ opacity: 0, x: 24, rotateY: -8 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, x: -24 }}>
          <div className="tk-dialogue-avatar">{speaker.toLowerCase().includes('preethi') ? '👧' : speaker.toLowerCase().includes('miss') ? '👩‍🏫' : '👦'}</div>
          <div><small>{speaker}</small><strong>{turn.text}</strong></div>
          <button type="button" onClick={onSpeak}><Volume2 size={18} /></button>
        </motion.div>
      </AnimatePresence>
      <div className="tk-dialogue-controls">
        <button type="button" disabled={index === 0} onClick={onBack}><ChevronLeft size={17} /> Back</button>
        <span>{index + 1}/{Math.max(1, total)}</span>
        <button type="button" onClick={onNext}>{index >= total - 1 ? 'I listened' : 'Next'} <ChevronRight size={17} /></button>
      </div>
    </div>
  )
}

function RepeatScene({
  sentence,
  isRecording,
  isProcessing,
  seconds,
  onReplay,
  onStart,
  onStop,
}: {
  sentence: string
  isRecording: boolean
  isProcessing: boolean
  seconds: number
  onReplay: () => void
  onStart: () => void
  onStop: () => void
}) {
  return (
    <div className="tk-repeat-scene">
      <span className="tk-mode-chip"><Headphones size={16} /> LISTEN & REPEAT</span>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>“{sentence}”</motion.h2>
      <button type="button" className="tk-replay" onClick={onReplay}><Volume2 size={18} /> Hear Miss Julie</button>
      <KidMic isRecording={isRecording} isProcessing={isProcessing} seconds={seconds} onStart={onStart} onStop={onStop} />
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
      <KidMic compact isRecording={isRecording} isProcessing={isProcessing} seconds={seconds} onStart={onStart} onStop={onStop} />
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
  compact = false,
}: {
  isRecording: boolean
  isProcessing: boolean
  seconds: number
  onStart: () => void
  onStop: () => void
  compact?: boolean
}) {
  return (
    <div className={`tk-mic ${compact ? 'is-compact' : ''}`}>
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
        {isProcessing ? <LoaderCircle size={compact ? 24 : 32} className="tk-spin" /> : isRecording ? <Square size={compact ? 21 : 28} fill="currentColor" /> : <Mic size={compact ? 28 : 37} />}
      </motion.button>
      <strong>{isProcessing ? 'Thinking…' : isRecording ? `Listening ${seconds}/6s` : 'Tap to speak'}</strong>
    </div>
  )
}

function Styles() {
  return (
    <style jsx global>{`
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
        width: min(22vw, 340px);
        min-width: 220px;
        height: min(55vh, 500px);
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
        right: 78%;
        bottom: 46%;
        z-index: 8;
        width: min(260px, 22vw);
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
      .tk-mic.is-compact button { width:58px; height:58px; }
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

      /* ------------------------- RESPONSIVE ------------------------- */

      @media (min-width: 1600px) {
        .tk-stage-grid { max-width: 1540px; grid-template-columns: minmax(240px,.82fr) minmax(650px,2.2fr) minmax(180px,.65fr); }
        .tk-learning-stack { max-width: 840px; }
        .tk-julie { width:min(23vw,390px); }
      }

      @media (max-width: 1160px) {
        .tk-scene { padding-left: 14px; padding-right: 14px; }
        .tk-stage-grid { grid-template-columns: 180px minmax(0,1fr) 190px; gap: 12px; }
        .tk-julie { width:190px; min-width:180px; height:min(55vh,480px); }
        .tk-student { width:190px; min-width:180px; height:min(46vh,360px); }
        .tk-learning-stack { max-width:700px; margin-bottom:18px; }
        .tk-student-said { display:none; }
        .tk-skill-pill { display:none; }
      }

      @media (max-width: 850px) {
        .tk-scene { min-height:calc(100svh - 56px); padding:10px 10px 82px; overflow-y:auto; overflow-x:hidden; align-items:start; }
        .tk-stage-grid { min-height:auto; display:grid; grid-template-columns:92px minmax(0,1fr) 68px; gap:7px; align-items:start; }
        .tk-julie { width:92px; min-width:92px; height:175px; align-self:start; margin-top:18px; }
        .tk-student { width:68px; min-width:68px; height:130px; align-self:start; margin-top:38px; }
        .tk-character-name { display:none; }
        .tk-learning-stack { grid-column:2; grid-row:1; margin:0; gap:9px; }
        .tk-julie { grid-column:1; grid-row:1; }
        .tk-student { grid-column:3; grid-row:1; }
        .tk-julie-bubble { padding:12px 12px 13px; border-radius:18px 18px 18px 7px; }
        .tk-julie-bubble::before { left:-9px; bottom:18px; width:18px; height:18px; }
        .tk-bubble-head small, .tk-listen-again span { display:none; }
        .tk-listen-again { width:34px; padding:0; justify-content:center; }
        .tk-julie-bubble > p { margin-top:8px; font-size:15px; line-height:1.25; }
        .tk-wave { margin-top:6px; }
        .tk-task-float { padding:10px; border-radius:19px; }
        .tk-task-meta { min-height:36px; margin-bottom:9px; gap:8px; }
        .tk-task-step { width:35px; height:35px; flex-basis:35px; border-radius:11px; }
        .tk-task-heading strong { font-size:11px; }
        .tk-task-heading span { font-size:7px; }
        .tk-xp-pill { display:none; }
        .tk-warmup-object { min-height:84px; grid-template-columns:62px 1fr; padding:10px 11px; gap:10px; border-radius:16px; }
        .tk-object-emoji { width:56px; height:56px; border-radius:16px; font-size:34px; }
        .tk-object-copy strong { font-size:19px; }
        .tk-object-copy p { display:none; }
        .tk-language-pattern { flex-wrap:wrap; gap:5px; }
        .tk-language-pattern > span { width:100%; text-align:center; }
        .tk-warmup-actions { grid-template-columns:1fr; gap:8px; }
        .tk-warmup-actions button { min-height:58px; }
        .tk-answer-icon { width:34px; height:34px; flex-basis:34px; font-size:19px; }
        .tk-answer-copy strong { font-size:10px; }
      }

      @media (max-width: 560px) {
        .tk-stage-grid { grid-template-columns:72px minmax(0,1fr) 48px; gap:4px; }
        .tk-julie { width:72px; min-width:72px; height:145px; }
        .tk-student { width:48px; min-width:48px; height:96px; margin-top:55px; }
        .tk-bubble-head strong { font-size:8px; }
        .tk-julie-bubble > p { font-size:13px; }
        .tk-task-heading span { display:none; }
        .tk-language-pattern { display:none; }
        .tk-warmup-object { grid-template-columns:52px 1fr; }
        .tk-object-emoji { width:48px; height:48px; font-size:30px; }
        .tk-object-copy strong { font-size:16px; }
      }

      @media (max-height: 760px) and (min-width: 851px) {
        .tk-scene { min-height:calc(100svh - 54px); padding-top:8px; padding-bottom:10px; }
        .tk-stage-grid { min-height:calc(100svh - 76px); }
        .tk-julie { height:min(58vh,430px); }
        .tk-student { height:min(36vh,270px); }
        .tk-learning-stack { margin-bottom:8px; gap:9px; }
        .tk-julie-bubble { padding:12px 16px 13px; }
        .tk-julie-bubble > p { font-size:clamp(18px,1.7vw,25px); margin-top:7px; }
        .tk-task-float { padding:10px 12px 12px; }
        .tk-task-meta { min-height:36px; margin-bottom:8px; }
        .tk-warmup-object { min-height:88px; padding:9px 14px; }
        .tk-object-emoji { width:64px; height:64px; font-size:40px; }
        .tk-language-pattern { margin:7px 1px; min-height:30px; padding:5px 9px; }
        .tk-warmup-actions button { min-height:58px; }
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

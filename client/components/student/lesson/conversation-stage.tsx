 'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LearnerCharacter, type LearnerCharacterState } from '@/components/student/learner-character'
import { MissJulieCharacter, type JulieVisualState } from '@/components/student/lesson/miss-julie-character'
import { DialogueBubble } from '@/components/student/lesson/dialogue-bubble'
import { characterEntranceLeft, characterEntranceRight } from '@/motion/presets'

export function ConversationStage({
  julieMessage,
  julieState,
  transcript,
  learnerState,
  avatarType,
  onReplay,
  isJulieSpeaking = false,
  statusText,
}: {
  julieMessage?: string
  julieState: JulieVisualState
  transcript?: string
  learnerState: LearnerCharacterState
  avatarType: 'BOY' | 'GIRL'
  onReplay: () => void
  isJulieSpeaking?: boolean
  statusText?: string
}) {
  return (
    <section className="lesson-scene-stage" aria-label="Conversation with Miss Julie">
      <div className="lesson-scene-stage__ambient" aria-hidden="true">
        <motion.span animate={{ x: [0, 16, 0], y: [0, -8, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.span animate={{ x: [0, -13, 0], y: [0, 10, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <motion.div className="lesson-scene-stage__julie" variants={characterEntranceLeft} initial="hidden" animate="visible">
        <MissJulieCharacter state={julieState} isSpeaking={isJulieSpeaking} />
      </motion.div>

      <div className="lesson-scene-stage__conversation">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={julieMessage ?? 'miss-julie-default'} className="lesson-scene-stage__julie-bubble">
            <DialogueBubble text={julieMessage ?? 'Let’s begin.'} speaker="Miss Julie" onReplay={onReplay} isSpeaking={isJulieSpeaking} />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {transcript ? (
            <motion.div
              key={transcript}
              className="lesson-scene-stage__student-bubble"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <DialogueBubble text={transcript} speaker="You" tone="student" compact />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {statusText ? (
            <motion.div
              key={statusText}
              className="lesson-scene-stage__status"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <span className="lesson-scene-stage__status-dot" aria-hidden="true" />
              {statusText}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <motion.div className="lesson-scene-stage__learner" variants={characterEntranceRight} initial="hidden" animate="visible">
        <LearnerCharacter avatarType={avatarType} state={learnerState} size="large" label="You" />
      </motion.div>
    </section>
  )
}

export function LessonStudentTranscript({ text }: { text?: ReactNode }) {
  if (!text) return null
  return <div className="lesson-student-transcript">{text}</div>
}

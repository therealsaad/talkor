'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Volume2, Waves } from 'lucide-react'
import { bubbleMotion } from '@/motion/presets'

export type DialogueBubbleTone = 'teacher' | 'student' | 'correction' | 'success'

export function DialogueBubble({
  text,
  speaker = 'Miss Julie',
  onReplay,
  tone = 'teacher',
  isSpeaking = false,
  compact = false,
}: {
  text: string
  speaker?: string
  onReplay?: () => void
  tone?: DialogueBubbleTone
  isSpeaking?: boolean
  compact?: boolean
}) {
  if (!text.trim()) return null

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.section
        key={`${speaker}:${text}`}
        className={`lesson-dialogue-bubble lesson-dialogue-bubble--${tone}${compact ? ' is-compact' : ''}`}
        variants={bubbleMotion}
        initial="hidden"
        animate="visible"
        exit="exit"
        aria-live={tone === 'teacher' ? 'polite' : undefined}
      >
        <div className="lesson-dialogue-bubble__meta">
          <span>{speaker}</span>
          {isSpeaking ? (
            <motion.span
              className="lesson-dialogue-bubble__speaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Waves size={14} aria-hidden="true" />
              Speaking
            </motion.span>
          ) : null}
        </div>

        <p>{text}</p>

        {onReplay ? (
          <motion.button
            type="button"
            className="lesson-dialogue-bubble__replay"
            onClick={onReplay}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.94 }}
            aria-label={`Replay ${speaker}'s line`}
          >
            <Volume2 size={16} aria-hidden="true" />
            <span>Replay</span>
          </motion.button>
        ) : null}
      </motion.section>
    </AnimatePresence>
  )
}

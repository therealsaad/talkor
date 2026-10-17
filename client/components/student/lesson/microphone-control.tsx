'use client'

import { motion } from 'framer-motion'
import { LoaderCircle, Mic, Square } from 'lucide-react'
import { micPulse } from '@/motion/presets'

export type MicrophoneState = 'ready' | 'recording' | 'processing'

export function MicrophoneControl({
  state,
  onClick,
  disabled,
  seconds,
}: {
  state: MicrophoneState
  onClick: () => void
  disabled?: boolean
  seconds?: number
}) {
  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'
  const title = isRecording ? 'I’m listening' : isProcessing ? 'Thinking about your answer' : 'Your turn to speak'
  const subtitle = isRecording
    ? `${seconds ?? 0}s · tap to finish`
    : isProcessing
      ? 'Miss Julie is getting your next teaching move ready.'
      : 'Tap the microphone and speak naturally.'

  return (
    <div className={`lesson-mic-dock lesson-mic-dock--${state}`}>
      <div className="lesson-mic-dock__copy">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      <div className="lesson-mic-dock__control">
        {isRecording ? (
          <motion.span
            className="lesson-mic-dock__ring lesson-mic-dock__ring--one"
            animate={{ scale: [1, 1.35], opacity: [0.42, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          />
        ) : null}
        {isRecording ? (
          <motion.span
            className="lesson-mic-dock__ring lesson-mic-dock__ring--two"
            animate={{ scale: [1, 1.55], opacity: [0.3, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.25 }}
          />
        ) : null}

        <motion.button
          type="button"
          className="microphone-control"
          data-state={state}
          onClick={onClick}
          disabled={disabled}
          variants={micPulse}
          animate={isRecording ? 'listening' : isProcessing ? 'processing' : 'idle'}
          whileHover={disabled ? undefined : { scale: 1.045, y: -2 }}
          whileTap={disabled ? undefined : { scale: 0.94 }}
          aria-label={isRecording ? 'Stop recording' : isProcessing ? 'Processing your answer' : 'Start speaking'}
        >
          {isRecording ? <Square size={28} fill="currentColor" aria-hidden="true" /> : isProcessing ? <LoaderCircle size={32} aria-hidden="true" /> : <Mic size={34} aria-hidden="true" />}
        </motion.button>
      </div>
    </div>
  )
}

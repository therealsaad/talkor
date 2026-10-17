'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Volume2, Waves } from 'lucide-react'
import { talkoraAssets, type MissJulieState } from '@/config/talkora-assets'
import { useVoiceSyncedText } from '@/hooks/use-voice-synced-text'

type Props = {
  state?: MissJulieState
  message?: string
  speaking?: boolean
  size?: 'small' | 'medium' | 'large' | 'hero'
  onSpeak?: () => void
  className?: string
}

export function MissJulie({
  state = 'idle',
  message = '',
  speaking = false,
  size = 'medium',
  onSpeak,
  className = '',
}: Props) {
  const reduced = useReducedMotion()
  const resolvedState: MissJulieState = speaking ? 'speaking' : state
  const spokenText = useVoiceSyncedText(message, speaking)

  return (
    <aside className={`student-julie student-julie-${size} ${className}`} aria-live="polite">
      <motion.div
        className="student-julie-avatar"
        animate={
          reduced
            ? undefined
            : speaking
              ? { y: [0, -5, 0], rotate: [0, -0.5, 0.5, 0] }
              : { y: [0, -7, 0] }
        }
        transition={{ duration: speaking ? 1.4 : 4.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Image
          src={talkoraAssets.julie[resolvedState]}
          alt="Miss Julie, your Talkora English teacher"
          fill
          sizes={
            size === 'hero'
              ? '(max-width: 700px) 240px, 390px'
              : size === 'large'
                ? '(max-width: 700px) 210px, 330px'
                : '180px'
          }
          priority={size === 'large' || size === 'hero'}
        />

        {speaking ? (
          <span className="student-julie-wave" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : null}
      </motion.div>

      {message ? (
        <motion.div
          key={message}
          className="student-julie-bubble"
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
        >
          <span>Miss Julie</span>
          <p>
            {speaking ? spokenText : message}
            {speaking ? <b className="talkora-type-caret">|</b> : null}
          </p>

          {onSpeak ? (
            <button type="button" onClick={onSpeak} aria-label="Hear Miss Julie again">
              {speaking ? <Waves size={18} /> : <Volume2 size={18} />}
            </button>
          ) : null}
        </motion.div>
      ) : null}

      <style jsx global>{`
        .talkora-type-caret{display:inline-block;margin-left:2px;color:#db5d7b;font-weight:900;animation:talkoraCaret .65s steps(1,end) infinite}
        @keyframes talkoraCaret{50%{opacity:0}}
      `}</style>
    </aside>
  )
}

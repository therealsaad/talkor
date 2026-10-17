'use client'

import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { talkoraAssets } from '@/config/talkora-assets'

export type JulieVisualState =
  | 'greeting' | 'teaching' | 'curious' | 'listening' | 'thinking'
  | 'speaking' | 'encouraging' | 'gentle-correction' | 'modeling'
  | 'surprised' | 'proud' | 'celebrating'

function poseForState(state: JulieVisualState): keyof typeof talkoraAssets.julie {
  switch (state) {
    case 'greeting': return 'welcome'
    case 'listening':
    case 'curious': return 'listening'
    case 'thinking': return 'thinking'
    case 'speaking': return 'speaking'
    case 'teaching': return 'teaching'
    case 'encouraging':
    case 'gentle-correction': return 'encouraging'
    case 'modeling': return 'reading'
    case 'proud': return 'proud'
    case 'celebrating': return 'celebrate'
    case 'surprised': return 'correct'
    default: return 'standing'
  }
}

/** Asset-based state animation, not live lip-sync or a video avatar. */
export function MissJulieCharacter({
  state = 'teaching',
  isSpeaking = false,
}: {
  state?: JulieVisualState
  isSpeaking?: boolean
}) {
  const reducedMotion = useReducedMotion()
  const poseKey = isSpeaking ? 'speaking' : poseForState(state)
  const pose = talkoraAssets.julie[poseKey] || talkoraAssets.julie.standing
  const chipLabel = isSpeaking ? 'Speaking' : state === 'listening' ? 'Listening to you'
    : state === 'thinking' ? 'Thinking…'
    : state === 'celebrating' || state === 'proud' ? 'Celebrating!'
    : state === 'encouraging' || state === 'gentle-correction' ? 'Encouraging'
    : 'Miss Julie'

  return (
    <div className="lesson-character-figure lesson-character-figure--julie" data-julie-state={isSpeaking ? 'speaking' : state}>
      <div className="lesson-character-aura" aria-hidden="true" />
      <div className="lesson-character-shadow" aria-hidden="true" />
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={pose}
          className="lesson-julie-art"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 10, scale: .98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -8, scale: .99 }}
          transition={{ duration: reducedMotion ? 0 : .25 }}
        >
          <motion.div
            animate={isSpeaking && !reducedMotion ? { y: [0, -3, 0] } : { y: 0 }}
            transition={{ duration: 1.1, repeat: isSpeaking && !reducedMotion ? Infinity : 0, ease: 'easeInOut' }}
          >
            <Image
              src={pose}
              alt={`Miss Julie ${chipLabel.toLowerCase()}`}
              width={440}
              height={580}
              priority={poseKey === 'welcome'}
              sizes="(max-width: 640px) 60vw, (max-width: 1024px) 36vw, 440px"
              className="lesson-julie-img"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div className="lesson-julie-state-chip" aria-live="polite">
        <span className="lesson-julie-state-dot" aria-hidden="true" />
        <span>{chipLabel}</span>
      </div>
    </div>
  )
}

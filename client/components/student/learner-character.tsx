'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { learnerAvatar, type LearnerAvatarType } from '@/config/talkora-assets'

export type LearnerCharacterState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'waiting' | 'happy' | 'encouraged' | 'confused' | 'retry' | 'celebrate' | 'pointing' | 'reading'

export function LearnerCharacter({
  avatarType = 'BOY',
  state = 'idle',
  size = 'large',
  label,
}: {
  avatarType?: LearnerAvatarType
  state?: LearnerCharacterState
  size?: 'small' | 'medium' | 'large'
  label?: string
}) {
  const reduced = useReducedMotion()

  const animate = reduced
    ? undefined
    : state === 'speaking'
      ? { y: [0, -5, 0], rotate: [0, -0.8, 0.8, 0], scale: [1, 1.01, 1] }
      : state === 'celebrate' || state === 'happy'
        ? { y: [0, -14, 0], rotate: [0, -1.2, 1.2, 0], scale: [1, 1.045, 1] }
        : state === 'thinking' || state === 'waiting'
          ? { rotate: [-1.2, 1.2, -1.2], y: [0, -2, 0] }
          : state === 'retry' || state === 'confused'
            ? { x: [0, -2, 2, 0], y: [0, -2, 0] }
            : state === 'listening'
              ? { y: [0, -3, 0], scale: [1, 1.012, 1] }
              : { y: [0, -4, 0] }

  return (
    <motion.figure
      className={`learner-character learner-${size} learner-${state}`}
      animate={animate}
      transition={{ duration: state === 'speaking' ? 1.05 : state === 'celebrate' || state === 'happy' ? 0.9 : 3.5, repeat: Infinity, ease: 'easeInOut' }}
      data-avatar-type={avatarType}
      data-state={state}
    >
      <motion.div
        className="learner-character__aura"
        aria-hidden="true"
        animate={reduced ? undefined : { opacity: state === 'speaking' ? [0.18, 0.42, 0.18] : [0.08, 0.16, 0.08], scale: [0.98, 1.03, 0.98] }}
        transition={{ duration: state === 'speaking' ? 1.05 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <Image
        src={learnerAvatar(avatarType)}
        alt={label || `Talkora ${avatarType === 'GIRL' ? 'Girl' : 'Boy'} learner`}
        fill
        sizes={size === 'large' ? '(max-width: 768px) 42vw, 300px' : size === 'small' ? '72px' : '180px'}
        priority={size === 'large'}
      />
    </motion.figure>
  )
};

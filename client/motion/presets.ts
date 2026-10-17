export const motionDurations = {
  instant: 0.12,
  fast: 0.2,
  normal: 0.34,
  slow: 0.56,
  cinematic: 0.92,
} as const

export const motionEase = [0.22, 1, 0.36, 1] as const
export const springSoft = { type: 'spring', stiffness: 240, damping: 24, mass: 0.85 } as const
export const springSnappy = { type: 'spring', stiffness: 420, damping: 28, mass: 0.72 } as const
export const springBouncy = { type: 'spring', stiffness: 380, damping: 18, mass: 0.9 } as const

export const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: motionEase } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}
export const riseIn = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: motionDurations.normal, ease: motionEase },
  },
}

export const fadeScale = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: springSoft },
  exit: { opacity: 0, scale: 0.96, transition: { duration: motionDurations.fast } },
}

export const bubbleMotion = {
  hidden: { opacity: 0, y: 14, scale: 0.96, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: springSoft,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    filter: 'blur(2px)',
    transition: { duration: motionDurations.fast },
  },
}

export const characterEntranceLeft = {
  hidden: { opacity: 0, x: -58, y: 18, scale: 0.92 },
  visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: { ...springSoft, delay: 0.08 } },
}

export const characterEntranceRight = {
  hidden: { opacity: 0, x: 58, y: 18, scale: 0.92 },
  visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: { ...springSoft, delay: 0.18 } },
}

export const cardMotion = {
  rest: { y: 0, scale: 1 },
  hover: { y: -6, scale: 1.018, transition: { duration: 0.25, ease: 'easeOut' as const } },
  tap: { scale: 0.97 },
}

export const tileMotion = {
  rest: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.04, boxShadow: '0 8px 20px rgba(0,0,0,0.18)' },
  tap: { scale: 0.95 },
}

export const destinationPulse = {
  animate: {
    scale: [1, 1.06, 1],
    boxShadow: [
      '0 0 0 0 rgba(255, 216, 61, 0.5)',
      '0 0 0 16px rgba(255, 216, 61, 0)',
      '0 0 0 0 rgba(255, 216, 61, 0.5)',
    ],
    transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const },
  },
}

export const badgeReveal = {
  hidden: { opacity: 0, scale: 0.4, rotate: -15 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { ...springBouncy, delay: 0.1 },
  },
}

export const micPulse = {
  idle: { scale: 1 },
  listening: {
    scale: [1, 1.045, 1],
    transition: { duration: 1.25, repeat: Infinity, ease: 'easeInOut' as const },
  },
  processing: {
    rotate: [0, 4, -4, 0],
    transition: { duration: 1.15, repeat: Infinity, ease: 'easeInOut' as const },
  },
}

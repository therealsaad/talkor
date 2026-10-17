'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { LESSON_ASSETS, resolveLessonAssetKey, type LessonAssetKey } from '@/services/lesson-asset-registry'

export function LessonAsset({
  assetKey,
  label,
  size = 190,
  priority = false,
}: {
  assetKey?: LessonAssetKey | string
  label?: string
  size?: number
  priority?: boolean
}) {
  const resolved = resolveLessonAssetKey(assetKey) || resolveLessonAssetKey(label) || 'question'

  return (
    <motion.div
      className="tk-lesson-asset"
      initial={{ opacity: 0, y: 10, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      aria-hidden={!label}
    >
      <Image
        src={LESSON_ASSETS[resolved]}
        alt={label || ''}
        width={size}
        height={size}
        priority={priority}
      />
    </motion.div>
  )
}

'use client'

import { motion } from 'framer-motion'
import type { LessonAssetKey } from '@/services/lesson-asset-registry'
import { LessonAsset } from '@/components/student/lesson/lesson-asset'

export function MCQScene({
  prompt,
  instruction,
  choices,
  assetKey,
  assetLabel,
  disabled,
  onChoice,
}: {
  prompt: string
  instruction?: string
  choices: string[]
  assetKey?: LessonAssetKey | string
  assetLabel?: string
  disabled: boolean
  onChoice: (value: string) => void
}) {
  return (
    <div className="tk-mcq-scene">
      <div className="tk-mcq-visual">
        <LessonAsset assetKey={assetKey} label={assetLabel || prompt} size={165} />
      </div>

      <div className="tk-mode-chip">✨ QUICK CHOICE</div>

      <h2>{prompt}</h2>

      {instruction ? <p className="tk-mcq-instruction">{instruction}</p> : null}

      <div className="tk-mcq-options">
        {choices.map((choice, index) => (
          <motion.button
            key={choice}
            type="button"
            disabled={disabled}
            whileHover={disabled ? undefined : { y: -3, scale: 1.012 }}
            whileTap={disabled ? undefined : { scale: 0.975 }}
            onClick={() => onChoice(choice)}
          >
            <span className="tk-mcq-letter">{String.fromCharCode(65 + index)}</span>
            <span>{choice}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

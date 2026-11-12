'use client'

import { AnimatePresence, motion } from 'framer-motion'

export type LetterWordPictureProps = {
  letter: string
  word: string
  pictureSrc: string
  reducedMotion: boolean
  className?: string
}

export function LetterWordPicture({ letter, word, pictureSrc, reducedMotion, className = '' }: LetterWordPictureProps) {
  const titleWord = word.charAt(0).toUpperCase() + word.slice(1)
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${letter}-${word}`}
        className={`kg-letter-word-picture ${className}`}
        initial={reducedMotion ? false : { opacity: 0, y: 16, scale: .97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: .98 }}
        transition={{ duration: .46, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="kg-letter-word-picture__letter" aria-label={`Letter ${letter}`}>
          <strong>{letter}</strong>
        </div>
        <div className="kg-letter-word-picture__copy">
          <strong>{titleWord}</strong>
        </div>
        <motion.figure
          className="kg-letter-word-picture__picture"
          initial={reducedMotion ? false : { opacity: 0, scale: .88, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: .52, delay: reducedMotion ? 0 : .08, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            className="kg-letter-word-picture__image"
            src={pictureSrc}
            alt={`${titleWord} for letter ${letter}`}
          />
        </motion.figure>
      </motion.div>
    </AnimatePresence>
  )
}

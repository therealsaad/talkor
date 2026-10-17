'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface OptionTileProps {
  label: string
  icon?: ReactNode
  selected?: boolean
  disabled?: boolean
  onSelect: () => void
}

/**
 * Visual answer tile used inside Talkora speaking activities.
 *
 * IMPORTANT:
 * - This component does NOT decide correctness.
 * - It does NOT submit answers directly.
 * - It does NOT contain syllabus logic.
 * - ConversationEngine remains responsible for answer handling.
 */
export function OptionTile({
  label,
  icon,
  selected = false,
  disabled = false,
  onSelect,
}: OptionTileProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.button
      type="button"
      className={[
        'talkora-option-tile',
        selected ? 'talkora-option-tile--selected' : '',
        disabled ? 'talkora-option-tile--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0,
              y: 14,
              scale: 0.96,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      whileHover={
        reducedMotion || disabled
          ? undefined
          : {
              y: -5,
              scale: 1.025,
            }
      }
      whileTap={
        reducedMotion || disabled
          ? undefined
          : {
              scale: 0.97,
            }
      }
      transition={{
        duration: 0.22,
        ease: 'easeOut',
      }}
    >
      {/* top shine */}
      <span
        className="talkora-option-tile__shine"
        aria-hidden="true"
      />

      {/* selected check */}
      {selected ? (
        <motion.span
          className="talkora-option-tile__check"
          initial={
            reducedMotion
              ? false
              : {
                  scale: 0,
                  rotate: -20,
                }
          }
          animate={{
            scale: 1,
            rotate: 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 20,
          }}
          aria-hidden="true"
        >
          <CheckIcon />
        </motion.span>
      ) : null}

      {/* visual area */}
      <span className="talkora-option-tile__visual">
        {icon ? (
          <span className="talkora-option-tile__icon">
            {icon}
          </span>
        ) : (
          <span
            className="talkora-option-tile__letter"
            aria-hidden="true"
          >
            {getOptionLetter(label)}
          </span>
        )}
      </span>

      {/* answer */}
      <span className="talkora-option-tile__content">
        <span className="talkora-option-tile__label">
          {label}
        </span>

        <span className="talkora-option-tile__hint">
          {selected ? 'Selected' : 'Choose this'}
        </span>
      </span>

      {/* bottom accent */}
      <span
        className="talkora-option-tile__accent"
        aria-hidden="true"
      />
    </motion.button>
  )
}

/* =========================================================
   OPTIONAL GROUP WRAPPER
   ========================================================= */

/**
 * Use this around OptionTile components when required.
 *
 * Example:
 *
 * <OptionTileGrid>
 *   {choices.map(...)}
 * </OptionTileGrid>
 */
export function OptionTileGrid({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div
      className="talkora-option-grid"
      role="group"
      aria-label="Choose your answer"
    >
      {children}
    </div>
  )
}

/* =========================================================
   HELPERS
   ========================================================= */

function getOptionLetter(label: string) {
  const cleaned = label.trim()

  if (!cleaned) {
    return '?'
  }

  return cleaned.charAt(0).toUpperCase()
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
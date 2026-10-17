'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export type LessonMode = 'listen' | 'repeat' | 'speak'

interface LessonHudProps {
  title: string
  levelLabel: string
  xp: number
  index: number
  total: number
  mode: LessonMode
  onModeChange: (mode: LessonMode) => void
  currentHint?: string
  hideModes?: boolean
  extraAction?: ReactNode
}

const MODES: {
  value: LessonMode
  label: string
  color: string
  icon: React.ReactNode
}[] = [
  {
    value: 'listen',
    label: 'LISTEN',
    color: '#2563eb',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M11 5L6.5 8.5H3.5A1.5 1.5 0 0 0 2 10v4a1.5 1.5 0 0 0 1.5 1.5h3L11 19V5Z" fill="currentColor" />
        <path d="M15 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'repeat',
    label: 'REPEAT',
    color: '#8b5cf6',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M17 2l4 4-4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11V9a3 3 0 0 1 3-3h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="m7 22-4-4 4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 13v2a3 3 0 0 1-3 3H4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'speak',
    label: 'SPEAK',
    color: '#16a34a',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2.2" />
        <path d="M5.5 10.5a6.5 6.5 0 0 0 13 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 17.5V21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M9 21h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function LessonHud({
  title,
  levelLabel,
  xp,
  index,
  total,
  mode,
  onModeChange,
  currentHint = 'Speak in complete sentences. Give reasons using "because" and ask follow-up questions!',
  hideModes = false,
  extraAction,
}: LessonHudProps) {
  const [showHintModal, setShowHintModal] = useState(false)
  const safeTotal = Math.max(total, 1)
  const currentStep = Math.min(index + 1, safeTotal)
  const progressPercent = Math.min(100, Math.max(0, (currentStep / safeTotal) * 100))

  return (
    <>
      <header className="talkora-lesson-header" aria-label="Lesson navigation and status">
        {/* Left: Back button + Unit & Stage info */}
        <div className="talkora-header-left">
          <Link
            href="/student/levels"
            className="talkora-header-back-btn"
            aria-label="Back to Adventure Map"
            title="Back to Adventure Map"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="talkora-header-title-block">
            <h1 className="talkora-header-unit-title">
              {title || 'Unit 1: My Favourite Things'}
            </h1>
            <div className="talkora-header-stage-info">
              <span>{levelLabel || `Stage ${currentStep} of ${safeTotal}`}</span>
            </div>
          </div>
        </div>

        {/* Center: Mode controls (LISTEN / REPEAT / SPEAK) */}
        {!hideModes ? <nav className="talkora-header-mode-bar" aria-label="Lesson mode selection">
          {MODES.map((item) => {
            const isActive = mode === item.value
            return (
              <button
                key={item.value}
                type="button"
                className={`talkora-mode-btn talkora-mode-btn--${item.value} ${isActive ? 'is-active' : ''}`}
                onClick={() => onModeChange(item.value)}
                aria-pressed={isActive}
              >
                <span className="talkora-mode-btn__icon">{item.icon}</span>
                <span className="talkora-mode-btn__label">{item.label}</span>
              </button>
            )
          })}
        </nav> : <LessonStageProgress currentStep={currentStep} total={safeTotal} />}

        {/* Right: Hint button + XP counter & Progress */}
        <div className="talkora-header-right">
          {extraAction}
          <button
            type="button"
            className="talkora-hint-btn"
            onClick={() => setShowHintModal((prev) => !prev)}
            aria-label="Show speaking hint"
          >
            <span className="talkora-hint-btn__bulb">💡</span>
            <span className="talkora-hint-btn__text">Hint</span>
          </button>

          <div className="talkora-header-xp-pill" aria-label={`${xp} XP earned`}>
            <span className="talkora-header-xp__star">⭐</span>
            <span className="talkora-header-xp__amount">{xp}</span>
            <span className="talkora-header-xp__label">XP</span>
          </div>

          <div className="talkora-header-progress-wrap" title={`Lesson progress: ${currentStep} of ${safeTotal}`}>
            <span className="talkora-header-progress__label">{currentStep}/{safeTotal}</span>
            <div className="talkora-header-progress-track">
              <div
                className="talkora-header-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hint Modal Overlay */}
      <AnimatePresence>
        {showHintModal && (
          <motion.div
            className="talkora-hint-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHintModal(false)}
          >
            <motion.div
              className="talkora-hint-card"
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="talkora-hint-card__header">
                <span className="talkora-hint-card__icon">💡</span>
                <h3>Speaking Tip from Miss Julie</h3>
                <button
                  type="button"
                  className="talkora-hint-card__close"
                  onClick={() => setShowHintModal(false)}
                  aria-label="Close hint"
                >
                  ✕
                </button>
              </div>
              <div className="talkora-hint-card__body">
                <p>{currentHint}</p>
                <div className="talkora-hint-card__examples">
                  <strong>Example sentence patterns:</strong>
                  <ul>
                    <li>&ldquo;My favourite sport is <em>cricket</em>.&rdquo;</li>
                    <li>&ldquo;I like English <em>because I love stories</em>.&rdquo;</li>
                    <li>&ldquo;I play cricket with <em>my friends</em>.&rdquo;</li>
                    <li>&ldquo;We both have <em>different favourites</em>.&rdquo;</li>
                  </ul>
                </div>
              </div>
              <button
                type="button"
                className="talkora-hint-card__gotit"
                onClick={() => setShowHintModal(false)}
              >
                Got it, Miss Julie!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function LessonStageProgress({ currentStep, total }: { currentStep: number; total: number }) {
  return (
    <div className="talkora-header-stage-path" aria-label="Lesson stage progress">
      {Array.from({ length: Math.max(1, total) }, (_, index) => {
        const isComplete = index < currentStep - 1
        const isCurrent = index === currentStep - 1

        return (
          <span
            key={index}
            style={{
              width: 9,
              height: 9,
              borderRadius: '999px',
              background: isCurrent ? '#ffd84d' : isComplete ? '#86efac' : 'rgba(255,255,255,0.25)',
              boxShadow: isCurrent ? '0 0 0 4px rgba(255,216,77,0.18)' : 'none',
              display: 'inline-block',
              transition: 'all 0.2s ease',
            }}
            aria-label={isCurrent ? 'Current stage' : isComplete ? 'Completed stage' : 'Upcoming stage'}
          />
        )
      })}
    </div>
  )
}

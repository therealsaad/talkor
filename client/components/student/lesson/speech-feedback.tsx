'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export function SpeechFeedback({
  transcript,
  aiMessage,
  followUpQuestion,
  evaluationFeedback,
}: {
  transcript?: string
  aiMessage?: string
  followUpQuestion?: string
  evaluationFeedback?: string
}) {
  const reducedMotion = useReducedMotion()

  const hasContent = Boolean(
    transcript ||
      aiMessage ||
      followUpQuestion ||
      evaluationFeedback,
  )

  if (!hasContent) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.section
        className="talkora-speech-feedback"
        aria-label="Speaking feedback"
        initial={
          reducedMotion
            ? false
            : {
                opacity: 0,
                y: 18,
                scale: 0.97,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 10,
          scale: 0.98,
        }}
        transition={{
          duration: 0.28,
          ease: 'easeOut',
        }}
      >
        {/* =================================================
            TOP ACCENT
           ================================================= */}

        <div
          className="talkora-speech-feedback__accent"
          aria-hidden="true"
        />

        {/* =================================================
            HEADER
           ================================================= */}

        <div className="talkora-speech-feedback__header">
          <div className="talkora-speech-feedback__header-icon">
            <SparkleIcon />
          </div>

          <div>
            <span className="talkora-speech-feedback__eyebrow">
              YOUR SPEAKING
            </span>

            <h3 className="talkora-speech-feedback__title">
              Nice work!
            </h3>
          </div>
        </div>

        {/* =================================================
            TRANSCRIPT

            Important:
            This is the only section that should be labelled
            "I heard".

            AI response must never be shown as transcript.
           ================================================= */}

        {transcript?.trim() ? (
          <FeedbackBlock
            className="talkora-speech-feedback__heard"
            icon={<EarIcon />}
            label="I heard"
          >
            <blockquote className="talkora-speech-feedback__transcript">
              “{transcript.trim()}”
            </blockquote>
          </FeedbackBlock>
        ) : null}

        {/* =================================================
            SPEECH / EVALUATION FEEDBACK
           ================================================= */}

        {evaluationFeedback?.trim() ? (
          <FeedbackBlock
            className="talkora-speech-feedback__evaluation"
            icon={<SpeechIcon />}
            label="Speaking tip"
          >
            <p className="talkora-speech-feedback__body">
              {evaluationFeedback.trim()}
            </p>
          </FeedbackBlock>
        ) : null}

        {/* =================================================
            MISS JULIE AI RESPONSE
           ================================================= */}

        {aiMessage?.trim() ? (
          <motion.div
            className="talkora-speech-feedback__julie"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    x: -10,
                  }
            }
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.24,
              delay: 0.05,
            }}
          >
            <div className="talkora-speech-feedback__julie-badge">
              <span className="talkora-speech-feedback__julie-dot" />

              <span>MISS JULIE</span>
            </div>

            <p className="talkora-speech-feedback__julie-message">
              {aiMessage.trim()}
            </p>
          </motion.div>
        ) : null}

        {/* =================================================
            FOLLOW-UP QUESTION

            This is separate from aiMessage because your
            backend already returns it separately.
           ================================================= */}

        {followUpQuestion?.trim() ? (
          <motion.div
            className="talkora-speech-feedback__follow-up"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    y: 8,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.24,
              delay: 0.1,
            }}
          >
            <div className="talkora-speech-feedback__follow-up-icon">
              <QuestionIcon />
            </div>

            <div className="talkora-speech-feedback__follow-up-copy">
              <span>LET&apos;S KEEP TALKING</span>

              <strong>
                {followUpQuestion.trim()}
              </strong>
            </div>

            <div
              className="talkora-speech-feedback__follow-up-arrow"
              aria-hidden="true"
            >
              <ArrowIcon />
            </div>
          </motion.div>
        ) : null}
      </motion.section>
    </AnimatePresence>
  )
}

/* =========================================================
   SHARED BLOCK
   ========================================================= */

function FeedbackBlock({
  label,
  icon,
  children,
  className = '',
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        'talkora-feedback-block',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="talkora-feedback-block__icon">
        {icon}
      </div>

      <div className="talkora-feedback-block__content">
        <span className="talkora-feedback-block__label">
          {label}
        </span>

        {children}
      </div>
    </div>
  )
}

/* =========================================================
   ICONS
   ========================================================= */

function SparkleIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2.7c.5 4.5 2.7 6.7 7.3 7.3-4.6.5-6.8 2.7-7.3 7.3-.5-4.6-2.7-6.8-7.3-7.3 4.6-.6 6.8-2.8 7.3-7.3Z"
        fill="currentColor"
      />

      <path
        d="M18.3 15.2c.2 2 1.1 2.9 3.1 3.1-2 .2-2.9 1.1-3.1 3.1-.2-2-1.1-2.9-3.1-3.1 2-.2 2.9-1.1 3.1-3.1Z"
        fill="currentColor"
        opacity=".65"
      />
    </svg>
  )
}

function EarIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 8.5a6 6 0 1 0-12 0v2.2c0 3.8 2.4 4.3 3.2 6.8.4 1.3 1.2 3 3.2 3 2.1 0 3.6-1.4 3.6-3.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M9.5 9a2.7 2.7 0 1 1 4.9 1.6c-.8 1-2.1 1.3-2.4 2.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SpeechIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-4.8 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path
        d="M7.5 9.5h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M7.5 12.5h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function QuestionIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M9.7 9.2a2.5 2.5 0 0 1 4.8.9c0 1.8-2.5 2-2.5 3.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="17"
        r="1"
        fill="currentColor"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />

      <path
        d="m14 7 5 5-5 5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
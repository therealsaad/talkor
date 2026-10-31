'use client'

import { useReducedMotion, motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Volume2 } from 'lucide-react'
import { MissJulieCharacter, type JulieVisualState } from './miss-julie-character'

export interface MissJulieTeachingStageProps {
  state?: JulieVisualState
  isSpeaking?: boolean
  teacherMessage?: string
  speakerTitle?: string
  statusSubtitle?: string
  onReplayTeacher?: () => void
  audioEnabled?: boolean
  className?: string
}

/**
 * Pure presentation component for Miss Julie's teaching stage.
 * Reuses the canonical MissJulieCharacter with state-driven aura,
 * teacher speech card, audio wave activity, and accessible controls.
 * Does NOT initiate or control microphone or lesson state.
 */
export function MissJulieTeachingStage({
  state = 'teaching',
  isSpeaking = false,
  teacherMessage = 'Hello, explorer! Let us learn together today.',
  speakerTitle = 'Miss Julie',
  statusSubtitle,
  onReplayTeacher,
  audioEnabled = true,
  className = '',
}: MissJulieTeachingStageProps) {
  const reduceMotion = useReducedMotion()

  const auraColorClass = isSpeaking
    ? 'bg-amber-400/20'
    : state === 'listening' || state === 'curious'
      ? 'bg-emerald-400/25'
      : state === 'thinking'
        ? 'bg-indigo-500/25'
        : state === 'celebrating' || state === 'proud'
          ? 'bg-yellow-400/30'
          : state === 'encouraging' || state === 'gentle-correction'
            ? 'bg-orange-400/20'
            : 'bg-sky-400/15'

  const effectiveSubtitle = statusSubtitle
    ? statusSubtitle
    : isSpeaking
      ? 'Speaking now'
      : state === 'listening'
        ? 'Listening to you'
        : state === 'thinking'
          ? 'Thinking…'
          : state === 'celebrating'
            ? 'Great job!'
            : state === 'encouraging'
              ? 'Encouraging'
              : 'Your English Teacher'

  return (
    <aside
      className={`relative flex flex-col items-center justify-between p-4 md:p-6 rounded-3xl bg-slate-900/60 border border-slate-700/60 backdrop-blur-md overflow-hidden ${className}`}
      aria-label="Miss Julie Teaching Stage"
      data-teaching-state={state}
      data-is-speaking={isSpeaking}
    >
      {/* Dynamic Pedagogical Glow / Stage Aura */}
      <div
        className={`absolute -top-16 -left-16 w-80 h-80 rounded-full ${auraColorClass} blur-3xl pointer-events-none transition-colors duration-500`}
        aria-hidden="true"
      />

      {/* Header bar */}
      <div className="w-full flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1">
            <Sparkles size={13} className="text-amber-400" />
            {speakerTitle}
          </span>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shadow-sm"
          role="status"
          aria-live="polite"
        >
          {effectiveSubtitle}
        </span>
      </div>

      {/* Character Figure Container */}
      <div className="relative w-full max-w-[320px] aspect-[4/5] flex items-end justify-center z-10">
        <MissJulieCharacter state={state} isSpeaking={isSpeaking} />
      </div>

      {/* Teacher Utterance & Speech Card */}
      <div className="w-full mt-4 bg-slate-900/90 border border-slate-700/90 rounded-2xl p-4 shadow-lg z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
            Teacher Audio
          </span>
          {audioEnabled && onReplayTeacher ? (
            <button
              type="button"
              onClick={onReplayTeacher}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              aria-label="Hear Miss Julie again"
              title="Hear Miss Julie again"
            >
              <Volume2 size={15} />
              <span>Hear again</span>
            </button>
          ) : null}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={teacherMessage}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-sm md:text-base font-medium text-slate-100 leading-snug break-words"
            aria-live="polite"
          >
            {teacherMessage}
          </motion.p>
        </AnimatePresence>

        {isSpeaking ? (
          <div className="flex items-center gap-1.5 h-4 mt-1" aria-hidden="true">
            <span className="w-1 h-3 bg-amber-400 rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
            <span className="w-1 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            <span className="w-1 h-4 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.45s' }} />
            <span className="text-[11px] font-semibold text-amber-300 ml-1">Speaking aloud…</span>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

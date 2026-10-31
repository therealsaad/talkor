'use client'

import { useReducedMotion, motion } from 'framer-motion'
import { AlertCircle, LoaderCircle, Mic, RefreshCw, Square, Volume2 } from 'lucide-react'

export interface VoiceInteractionBeaconProps {
  isTeacherSpeaking?: boolean
  isRecording?: boolean
  isProcessing?: boolean
  isError?: boolean
  errorMessage?: string
  seconds?: number
  onStartMic?: () => void
  onStopMic?: () => void
  onRetry?: () => void
  disabled?: boolean
  className?: string
}

/**
 * High-visibility voice state beacon for young learners in noisy computer labs.
 * Displays actual runtime states: teacher speaking, recording, processing, ready, and error.
 * Does NOT auto-trigger the microphone. Requires deliberate user interaction.
 */
export function VoiceInteractionBeacon({
  isTeacherSpeaking = false,
  isRecording = false,
  isProcessing = false,
  isError = false,
  errorMessage,
  seconds = 0,
  onStartMic,
  onStopMic,
  onRetry,
  disabled = false,
  className = '',
}: VoiceInteractionBeaconProps) {
  const reduceMotion = useReducedMotion()

  // State priority: Error > Processing > Recording > TeacherSpeaking > Ready
  const currentPhase: 'error' | 'processing' | 'recording' | 'teacher_speaking' | 'ready' =
    isError
      ? 'error'
      : isProcessing
        ? 'processing'
        : isRecording
          ? 'recording'
          : isTeacherSpeaking
            ? 'teacher_speaking'
            : 'ready'

  const title =
    currentPhase === 'teacher_speaking'
      ? 'Listen to Miss Julie'
      : currentPhase === 'recording'
        ? 'I am listening!'
        : currentPhase === 'processing'
          ? 'Miss Julie is thinking…'
          : currentPhase === 'error'
            ? 'Let us try again'
            : 'Your turn to speak'

  const subtitle =
    currentPhase === 'teacher_speaking'
      ? 'Microphone opens when Miss Julie finishes speaking'
      : currentPhase === 'recording'
        ? `${seconds}s · Tap button when done speaking`
        : currentPhase === 'processing'
          ? 'Checking your answer'
          : currentPhase === 'error'
            ? errorMessage || 'Tap to try speaking again'
            : 'Tap the microphone and speak aloud'

  function handleClick() {
    if (disabled || isProcessing) return
    if (currentPhase === 'recording') {
      onStopMic?.()
    } else if (currentPhase === 'error' && onRetry) {
      onRetry()
    } else if (currentPhase === 'ready' || currentPhase === 'error') {
      onStartMic?.()
    }
  }

  const isButtonDisabled = disabled || isProcessing || isTeacherSpeaking

  return (
    <div
      className={`relative flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-5 rounded-3xl bg-slate-900/80 border border-slate-700/80 shadow-xl backdrop-blur-md ${className}`}
      data-voice-phase={currentPhase}
      role="region"
      aria-label="Voice interaction control and status"
    >
      <div className="flex items-center gap-4 w-full md:w-auto">
        {/* Pulsing Beacon Ring & Action Button */}
        <div className="relative flex items-center justify-center flex-none">
          {isRecording && !reduceMotion ? (
            <>
              <motion.span
                className="absolute w-16 h-16 rounded-full bg-emerald-500/30"
                animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                aria-hidden="true"
              />
              <motion.span
                className="absolute w-16 h-16 rounded-full bg-emerald-500/20"
                animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                aria-hidden="true"
              />
            </>
          ) : null}

          {isTeacherSpeaking && !reduceMotion ? (
            <motion.span
              className="absolute w-14 h-14 rounded-full bg-amber-400/20"
              animate={{ scale: [0.95, 1.2], opacity: [0.5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
          ) : null}

          <button
            type="button"
            onClick={handleClick}
            disabled={isButtonDisabled}
            aria-label={
              currentPhase === 'recording'
                ? `Stop recording, ${seconds} seconds elapsed`
                : currentPhase === 'teacher_speaking'
                  ? 'Microphone paused while teacher speaks'
                  : currentPhase === 'processing'
                    ? 'Processing your answer'
                    : 'Start speaking to Miss Julie'
            }
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg transition-all z-10 cursor-pointer ${
              currentPhase === 'recording'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white ring-4 ring-emerald-400/40 scale-105'
                : currentPhase === 'teacher_speaking'
                  ? 'bg-amber-500/80 text-slate-950 opacity-80 cursor-not-allowed'
                  : currentPhase === 'processing'
                    ? 'bg-indigo-600 text-white cursor-wait opacity-80'
                    : currentPhase === 'error'
                      ? 'bg-rose-500 hover:bg-rose-400 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95'
            } ${isButtonDisabled ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {currentPhase === 'recording' ? (
              <Square size={24} fill="currentColor" aria-hidden="true" />
            ) : currentPhase === 'processing' ? (
              <LoaderCircle size={28} className="animate-spin" aria-hidden="true" />
            ) : currentPhase === 'teacher_speaking' ? (
              <Volume2 size={24} aria-hidden="true" />
            ) : currentPhase === 'error' ? (
              <AlertCircle size={24} aria-hidden="true" />
            ) : (
              <Mic size={28} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Status Text & Accessible Cues */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                currentPhase === 'recording'
                  ? 'bg-emerald-400 animate-ping'
                  : currentPhase === 'teacher_speaking'
                    ? 'bg-amber-400'
                    : currentPhase === 'processing'
                      ? 'bg-indigo-400 animate-pulse'
                      : currentPhase === 'error'
                        ? 'bg-rose-400'
                        : 'bg-slate-400'
              }`}
              aria-hidden="true"
            />
            <strong className="text-sm md:text-base font-bold text-white tracking-tight">
              {title}
            </strong>
          </div>
          <span className="text-xs text-slate-300 font-medium break-words">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Auxiliary Actions for Retry / Hint */}
      {isError && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Try again</span>
        </button>
      ) : null}
    </div>
  )
}

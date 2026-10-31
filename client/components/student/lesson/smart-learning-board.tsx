'use client'

import { useReducedMotion, motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Sparkles, Trophy } from 'lucide-react'

export type SmartBoardMode = 'phonics' | 'vocabulary' | 'storybook' | 'choices'

export interface PhonicsCardData {
  letter: string
  sound: string
  word: string
  meaning?: string
  emoji?: string
  imageSrc?: string
}

export interface VocabularyCardData {
  word: string
  phoneticSpelling?: string
  meaningMarathi?: string
  meaningHindi?: string
  contextSentence?: string
  actionPrompt?: string
  emoji?: string
  imageSrc?: string
}

export interface StorybookSceneData {
  sceneTitle: string
  actionWord: string
  sentence: string
  keyWords: string[]
  meaningMarathi?: string
  meaningHindi?: string
}

export interface ChoiceOption {
  id: string
  label: string
  icon?: string
  imageSrc?: string
  subtitle?: string
}

export interface SmartLearningBoardProps {
  mode: SmartBoardMode
  title?: string
  subtitle?: string
  phonics?: PhonicsCardData
  vocabulary?: VocabularyCardData
  storybook?: StorybookSceneData
  choices?: ChoiceOption[]
  selectedChoiceId?: string
  onSelectChoice?: (choiceId: string) => void
  disabled?: boolean
  xpReward?: number
  step?: { current: number; total: number }
  className?: string
}

/** Sample datasets for isolated presentation and storybook preview */
export const SAMPLE_KG_PHONICS_A: PhonicsCardData = {
  letter: 'A a',
  sound: '/æ/',
  word: 'Apple',
  meaning: 'सफरचंद (Apple)',
  emoji: '🍎',
}

export const SAMPLE_CLASS1_VOCAB_SKIP: VocabularyCardData = {
  word: 's-k-i-p',
  phoneticSpelling: 'skip',
  meaningMarathi: 'उड्या मारत जाणे',
  meaningHindi: 'उछलकर चलना',
  contextSentence: 'See me skip, see me run!',
  actionPrompt: 'Tip, tap, little hops!',
  emoji: '🐇',
}

export const SAMPLE_CLASS1_STORY_FIRSTDAY: StorybookSceneData = {
  sceneTitle: 'Our First School Day',
  actionWord: 'skip',
  sentence: 'See me skip, see me run! I am going to school like everyone.',
  keyWords: ['see', 'skip', 'run', 'school'],
  meaningMarathi: 'उड्या मारत जाणे (Skip)',
  meaningHindi: 'उछलकर चलना (Skip)',
}

export const SAMPLE_CHOICES_SKIP_RUN: ChoiceOption[] = [
  { id: 'skip', label: 'Skip', icon: '🐇', subtitle: 'Little hopping steps' },
  { id: 'run', label: 'Run', icon: '🏃', subtitle: 'Move fast on feet' },
]

/**
 * Reusable Smart Learning Board presentation component.
 * Displays Balbharati curriculum visuals (Phonics, Vocabulary, Storybook, Choices)
 * without modifying lesson orchestration or auto-activating the mic.
 */
export function SmartLearningBoard({
  mode = 'vocabulary',
  title = 'ENGLISH BALBHARATI · CLASS 1',
  subtitle = 'Lesson 1.1 · My First Day at School',
  phonics = SAMPLE_KG_PHONICS_A,
  vocabulary = SAMPLE_CLASS1_VOCAB_SKIP,
  storybook = SAMPLE_CLASS1_STORY_FIRSTDAY,
  choices = SAMPLE_CHOICES_SKIP_RUN,
  selectedChoiceId,
  onSelectChoice,
  disabled = false,
  xpReward = 15,
  step = { current: 1, total: 6 },
  className = '',
}: SmartLearningBoardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section
      className={`relative flex flex-col justify-between p-5 md:p-6 rounded-3xl bg-slate-900/80 border border-slate-700/80 shadow-2xl backdrop-blur-md overflow-hidden min-h-[420px] ${className}`}
      aria-label="Smart Learning Board"
    >
      {/* Board Header Topline */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 z-10">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
            <BookOpen size={16} />
          </span>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
              {title}
            </h2>
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {xpReward > 0 ? (
            <span className="text-xs font-black text-amber-400 flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              <Trophy size={13} /> +{xpReward} XP
            </span>
          ) : null}
          {step ? (
            <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              Step {step.current} of {step.total}
            </span>
          ) : null}
        </div>
      </div>

      {/* Dynamic Curriculum Content Area */}
      <div className="my-auto py-4 z-10">
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'phonics' && (
            <motion.div
              key="phonics"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              className="flex flex-col md:flex-row items-center justify-around gap-6 text-center"
            >
              <div className="bg-gradient-to-tr from-amber-400/20 to-emerald-500/20 border-2 border-emerald-400/40 rounded-3xl p-6 w-44 h-44 flex flex-col items-center justify-center shadow-lg">
                <span className="text-6xl font-black text-amber-300 tracking-tighter">
                  {phonics.letter}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mt-2">
                  Sound {phonics.sound}
                </span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 w-44 h-44 flex flex-col items-center justify-center shadow-lg">
                <span className="text-6xl mb-1" role="img" aria-label={phonics.word}>
                  {phonics.emoji || '🍎'}
                </span>
                <span className="text-lg font-black text-white">{phonics.word}</span>
                {phonics.meaning ? (
                  <span className="text-xs text-slate-400">{phonics.meaning}</span>
                ) : null}
              </div>
            </motion.div>
          )}

          {mode === 'vocabulary' && (
            <motion.div
              key="vocabulary"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
            >
              <div className="bg-gradient-to-tr from-emerald-950/60 to-slate-800 rounded-2xl p-6 border border-emerald-500/30 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-6xl mb-2" role="img" aria-label={vocabulary.word}>
                  {vocabulary.emoji || '🐇'}
                </span>
                {vocabulary.actionPrompt ? (
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                    {vocabulary.actionPrompt}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-black tracking-widest uppercase text-amber-400">
                  Target Word
                </span>
                <div className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  {vocabulary.word}
                </div>
                {vocabulary.contextSentence ? (
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 block mb-0.5">Rhyme:</span>
                    <p className="text-base font-bold text-emerald-300">
                      "{vocabulary.contextSentence}"
                    </p>
                  </div>
                ) : null}
                {vocabulary.meaningMarathi ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-bold">
                      मराठी
                    </span>
                    <span>{vocabulary.meaningMarathi}</span>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}

          {mode === 'storybook' && (
            <motion.div
              key="storybook"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={14} /> {storybook.sceneTitle}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Action: {storybook.actionWord}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700">
                <p className="text-lg md:text-xl font-bold text-white leading-relaxed">
                  "{storybook.sentence}"
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap" aria-label="Word Bank">
                <span className="text-xs font-bold text-slate-400 mr-1">Words:</span>
                {storybook.keyWords.map((word) => (
                  <span
                    key={word}
                    className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 uppercase"
                  >
                    {word}
                  </span>
                ))}
              </div>

              {storybook.meaningMarathi ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-bold text-slate-300">Meaning:</span>
                  <span>{storybook.meaningMarathi}</span>
                </div>
              ) : null}
            </motion.div>
          )}

          {mode === 'choices' && (
            <motion.div
              key="choices"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              className="flex flex-col gap-4"
            >
              <div className="text-center mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Tap or Speak Your Choice
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {choices.map((choice) => {
                  const isSelected = selectedChoiceId === choice.id
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onSelectChoice?.(choice.id)}
                      className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-400/40'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 hover:border-slate-500'
                      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {choice.icon ? (
                        <span className="text-3xl" role="img" aria-hidden="true">
                          {choice.icon}
                        </span>
                      ) : null}
                      <div className="flex flex-col">
                        <strong className="text-base font-bold text-white">
                          {choice.label}
                        </strong>
                        {choice.subtitle ? (
                          <span className="text-xs text-slate-400">
                            {choice.subtitle}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

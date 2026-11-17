/**
 * Per-turn timing for KG Level 1, so the slow step is visible instead of guessed.
 *
 * One turn is two requests: the attempt (speech-to-text, then picking the feedback sentence, which may involve
 * Qwen) and the feedback audio (voice). Each logs one JSON line with the time of every step and the slowest one.
 *
 * Privacy: only durations, a source label, the outcome and the client's random submission id are recorded.
 * Never pass a transcript, a name, an id of a student or school, or any text a child said.
 *
 * Pure and dependency-free (the logger is passed in) so it is unit tested without a server.
 */

export type TurnStep = 'stt' | 'feedback' | 'save' | 'llm' | 'tts' | 'total'
export type TurnNoteValue = string | number | boolean | undefined
export type TurnTiming = { steps: Partial<Record<TurnStep, number>>; notes: Record<string, TurnNoteValue> }
export type TurnTimer = ReturnType<typeof createTurnTimer>

const STEP_ORDER: TurnStep[] = ['stt', 'feedback', 'save', 'llm', 'tts', 'total']
export const TURN_TIMING_MESSAGE = 'KG turn timing'
export const DEFAULT_SLOW_TURN_MS = 2500

const SAFE_LABEL = /^[a-z0-9][a-z0-9._:-]{0,79}$/i
export function safeTimingLabel(value: unknown, fallback = 'unknown'): string {
  return typeof value === 'string' && SAFE_LABEL.test(value) ? value : fallback
}

/** Provider/model labels are selected from fixed server configuration, never request text. */
export function aiTimingLabels(input: { provider: string; model: string; grade: number; levelId?: string }) {
  const provider = new Set(['qwen', 'python-qwen', 'groq', 'openai', 'mock']).has(input.provider) ? input.provider : 'other'
  const model = safeTimingLabel(input.model, 'default')
  const cohort = input.grade === 0 ? 'kg' : input.grade === 1
    ? input.levelId === 'g01-l01' ? 'class1-l1' : 'class1-unspecified'
    : `class${Math.min(10, Math.max(2, Math.trunc(input.grade)))}`
  return { provider, model, cohort }
}

export function configuredAIModel(provider: string, config: { qwen: string; groq: string; openai: string }): string {
  const candidate = provider === 'qwen' ? config.qwen : provider === 'groq' ? config.groq
    : provider === 'openai' ? config.openai : provider === 'python' ? 'configured-python-service' : 'default'
  return safeTimingLabel(candidate, 'default')
}

export function createTurnTimer(now: () => number = Date.now) {
  const startedAt = now()
  const steps: Partial<Record<TurnStep, number>> = {}
  const notes: Record<string, TurnNoteValue> = {}
  return {
    /** Times `work`, adds to the step if it runs more than once, and always records even when it throws. */
    async time<T>(step: Exclude<TurnStep, 'total'>, work: () => Promise<T>): Promise<T> {
      const begun = now()
      try { return await work() }
      finally { steps[step] = (steps[step] ?? 0) + Math.max(0, now() - begun) }
    },
    set(step: Exclude<TurnStep, 'total'>, ms: number) { steps[step] = Math.max(0, Math.round(ms)) },
    note(key: string, value: TurnNoteValue) { notes[key] = value },
    finish(): TurnTiming {
      steps.total = Math.max(0, now() - startedAt)
      return { steps: { ...steps }, notes: { ...notes } }
    },
  }
}

/** The step that took longest, ignoring the total. Undefined when nothing was timed. */
export function slowestStep(steps: TurnTiming['steps']): TurnStep | undefined {
  let best: TurnStep | undefined
  for (const step of STEP_ORDER) {
    if (step === 'total' || steps[step] === undefined) continue
    if (best === undefined || (steps[step] as number) > (steps[best] as number)) best = step
  }
  return best
}

/** `stt;dur=412, feedback;dur=3, total;dur=455` so the browser network panel shows it directly. */
export function serverTimingHeader(steps: TurnTiming['steps']): string {
  return STEP_ORDER.filter((step) => steps[step] !== undefined).map((step) => `${step};dur=${Math.round(steps[step] as number)}`).join(', ')
}

export function parseSlowTurnMs(raw: string | undefined): number {
  const parsed = Number(raw)
  if (!raw || !Number.isFinite(parsed)) return DEFAULT_SLOW_TURN_MS
  return Math.min(30000, Math.max(500, Math.round(parsed)))
}

type Log = { info: (message: string, meta?: Record<string, unknown>) => void; warn: (message: string, meta?: Record<string, unknown>) => void }

/**
 * Logs one line per request. Set `enabled` false to silence the routine line; a slow turn is always reported as a
 * warning, because that is the line someone needs to find.
 */
export function logTurnTiming(
  log: Log,
  phase: 'attempt' | 'audio',
  timing: TurnTiming,
  meta: { submissionId?: string; outcome?: string; mode?: string },
  options: { enabled?: boolean; slowMs?: number } = {},
): void {
  const total = timing.steps.total ?? 0
  const slow = total >= (options.slowMs ?? DEFAULT_SLOW_TURN_MS)
  const entry = { phase, ...meta, ...timing.steps, slowestStep: slowestStep(timing.steps), slow, ...timing.notes }
  if (slow) log.warn(TURN_TIMING_MESSAGE, entry)
  else if (options.enabled !== false) log.info(TURN_TIMING_MESSAGE, entry)
}

export type StepSummary = { step: TurnStep; count: number; p50: number; p95: number; max: number }
export type TimingReport = { turns: number; slow: number; qwenShare: number; cacheShare: number; steps: StepSummary[];
  aiGroups: Array<{ cohort: string; provider: string; model: string; count: number; p50: number; p95: number }> }

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))]

/** Turns raw log lines (anything else is ignored) into a per-step p50/p95/max table. */
export function summarizeTurnTimings(lines: Iterable<string>): TimingReport {
  const values: Record<TurnStep, number[]> = { stt: [], feedback: [], save: [], llm: [], tts: [], total: [] }
  let turns = 0
  let slow = 0
  let feedbackTurns = 0
  let qwen = 0
  let audioTurns = 0
  let cached = 0
  const aiGroups = new Map<string, number[]>()
  for (const line of lines) {
    const start = line.indexOf('{')
    if (start < 0) continue
    let entry: Record<string, unknown>
    try { entry = JSON.parse(line.slice(start)) } catch { continue }
    if (entry.message !== TURN_TIMING_MESSAGE) continue
    turns += 1
    if (entry.slow === true) slow += 1
    for (const step of STEP_ORDER) if (typeof entry[step] === 'number') values[step].push(entry[step] as number)
    if (entry.phase === 'ai' && typeof entry.llm === 'number') {
      const cohort = safeTimingLabel(entry.cohort, 'unknown')
      const provider = safeTimingLabel(entry.provider, 'other')
      const model = safeTimingLabel(entry.model, 'default')
      const key = JSON.stringify([cohort, provider, model])
      aiGroups.set(key, [...(aiGroups.get(key) || []), entry.llm])
    }
    if (entry.phase === 'attempt' && typeof entry.feedbackSource === 'string') { feedbackTurns += 1; if (entry.feedbackSource === 'qwen-8002') qwen += 1 }
    if (entry.phase === 'audio' && typeof entry.ttsSource === 'string') { audioTurns += 1; if (entry.ttsSource === 'cache') cached += 1 }
  }
  const steps = STEP_ORDER.filter((step) => values[step].length > 0).map((step) => {
    const sorted = [...values[step]].sort((a, b) => a - b)
    return { step, count: sorted.length, p50: percentile(sorted, 0.5), p95: percentile(sorted, 0.95), max: sorted[sorted.length - 1] }
  })
  const groups = [...aiGroups.entries()].map(([key, samples]) => {
    const [cohort, provider, model] = JSON.parse(key) as [string, string, string]
    const sorted = [...samples].sort((a, b) => a - b)
    return { cohort, provider, model, count: sorted.length, p50: percentile(sorted, 0.5), p95: percentile(sorted, 0.95) }
  })
  return { turns, slow, qwenShare: feedbackTurns ? qwen / feedbackTurns : 0, cacheShare: audioTurns ? cached / audioTurns : 0, steps, aiGroups: groups }
}

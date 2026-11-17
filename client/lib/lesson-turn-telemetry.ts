/**
 * Measures how long a child really waits for Miss Julie, in the browser, so the slow step is found with numbers.
 *
 * One turn is a chain of moments on one monotonic clock (performance.now), so browser and server clocks are never
 * subtracted. The turn's random submission id is the only thing shared with the server log, which is how the two
 * sides are joined afterwards.
 *
 * Privacy and safety:
 * - Off unless a supervised test asks for it (see isTelemetryRequested). When off, every call returns at once.
 * - Memory only. Nothing is written to storage or sent anywhere; the supervisor downloads a report by hand.
 * - Records times and a few labels only: never audio, transcripts, PINs, tokens or student identifiers.
 * - A different login (compared through a one-way fingerprint kept in memory) or a closed page clears everything,
 *   so a shared computer never carries one child's measurements into the next child's session.
 * - It observes only. It never changes what the lesson does.
 */

export const STAGES = [
  'speechEnd',        // last moment the child was heard (estimate from the silence watcher)
  'recorderStop',     // the recorder finished
  'requestStart',     // the attempt upload began (Class 1: speech-to-text request)
  'sttDone',          // Class 1 received the recognized speech
  'teachingStart',    // Class 1 submitted its recognized answer for authorized teaching
  'teachingDone',     // Class 1 received the teaching response
  'apiResponse',      // the attempt answer arrived
  'audioRequestStart',// the feedback audio download began
  'audioDownloaded',  // the feedback audio finished downloading
  'audioPlaying',     // the browser reported playback started
  'audioEnded',       // playback finished
  'ackDone',          // progress was acknowledged by the server
] as const
export type Stage = (typeof STAGES)[number]

/** Each metric is "to - from", in milliseconds, and only exists when both moments were recorded. */
export const METRICS = [
  { name: 'silenceWait', from: 'speechEnd', to: 'recorderStop', meaning: 'Speech end to recorder stop: waiting for silence' },
  { name: 'attemptRequest', from: 'requestStart', to: 'apiResponse', meaning: 'Upload, speech-to-text and feedback on the server (Class 1: STT then teaching)' },
  { name: 'speechToText', from: 'requestStart', to: 'sttDone', meaning: 'Class 1 microphone-upload and speech recognition' },
  { name: 'aiTeaching', from: 'teachingStart', to: 'teachingDone', meaning: 'Class 1 authorized answer submission and teacher response' },
  { name: 'audioDownload', from: 'audioRequestStart', to: 'audioDownloaded', meaning: 'Feedback audio download' },
  { name: 'toAudioStart', from: 'apiResponse', to: 'audioPlaying', meaning: 'Answer arrived to sound starting' },
  { name: 'childWait', from: 'speechEnd', to: 'audioPlaying', meaning: 'Child-perceived wait: speech end to Miss Julie speaking' },
  { name: 'recorderToAudio', from: 'recorderStop', to: 'audioPlaying', meaning: 'Recorder stop to sound (when speech end is unknown)' },
  { name: 'ackWait', from: 'audioEnded', to: 'ackDone', meaning: 'Audio end to progress saved' },
] as const
export type MetricName = (typeof METRICS)[number]['name']

export type TurnReportEntry = {
  submissionId: string
  level: string
  network: string
  complete: boolean
  metrics: Partial<Record<MetricName, number>>
}
export type MetricSummary = { metric: MetricName; meaning: string; count: number; p50: number; p95: number; max: number }
export type LatencyReport = { generatedAt: string; turns: TurnReportEntry[]; summary: MetricSummary[] }

type Turn = { id?: string; level: string; network: string; marks: Partial<Record<Stage, number>>; startedAt: number }

const MAX_TURNS = 200
const STALE_PENDING_MS = 15000

/** True only when a supervisor asked for it: `?latency=1` on the page address. Never stored. */
export function isTelemetryRequested(search: string | undefined): boolean {
  if (!search) return false
  try { return new URLSearchParams(search).get('latency') === '1' } catch { return false }
}

/** One-way fingerprint of a login, used only to notice a change of student. Not a security hash, never reported. */
export function fingerprint(value: string | null | undefined): string {
  if (!value) return ''
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 0x01000193) >>> 0 }
  return hash.toString(36)
}

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))]

export function summarize(turns: ReadonlyArray<{ metrics: Partial<Record<MetricName, number>> }>): MetricSummary[] {
  const summary: MetricSummary[] = []
  for (const metric of METRICS) {
    const values = turns.map((turn) => turn.metrics[metric.name]).filter((value): value is number => typeof value === 'number').sort((a, b) => a - b)
    if (values.length) summary.push({ metric: metric.name, meaning: metric.meaning, count: values.length, p50: Math.round(percentile(values, 0.5)), p95: Math.round(percentile(values, 0.95)), max: Math.round(values[values.length - 1]) })
  }
  return summary
}

export function createTurnTelemetry(options: {
  enabled: () => boolean
  now?: () => number
  network?: () => string
  session?: () => string
  date?: () => string
}) {
  const now = options.now ?? (() => performance.now())
  let pending: Turn | null = null
  let owner = ''
  const turns = new Map<string, Turn>()

  const clear = () => { pending = null; turns.clear() }
  // A new login wipes everything recorded for the previous one before anything new is stored.
  const checkOwner = () => {
    const current = options.session?.() ?? ''
    if (current !== owner) { clear(); owner = current }
  }

  return {
    /** Marks a moment on the turn being built (the latest value wins here), starting one if none is open. */
    mark(stage: Stage, level = 'kg', at?: number): void {
      if (!options.enabled()) return
      checkOwner()
      // A turn that never reached the server within 15 s was abandoned; start a fresh one.
      if (!pending || now() - pending.startedAt > STALE_PENDING_MS) pending = { level, network: options.network?.() ?? '', marks: {}, startedAt: now() }
      pending.marks[stage] = at ?? now()
    },
    /** Gives the turn built so far its submission id so later steps can find it. */
    bind(submissionId: string): void {
      if (!options.enabled() || !pending || pending.id) return
      pending.id = submissionId
      turns.set(submissionId, pending)
      pending = null
      while (turns.size > MAX_TURNS) turns.delete(turns.keys().next().value as string)
    },
    /** Marks a moment on an existing turn. The first time a moment is recorded wins, so replays do not skew it. */
    markFor(submissionId: string, stage: Stage, at?: number): void {
      if (!options.enabled()) return
      checkOwner()
      const turn = turns.get(submissionId)
      if (turn && turn.marks[stage] === undefined) turn.marks[stage] = at ?? now()
    },
    clear,
    report(): LatencyReport {
      checkOwner()
      const entries: TurnReportEntry[] = [...turns.values()].map((turn) => {
        const metrics: Partial<Record<MetricName, number>> = {}
        for (const metric of METRICS) {
          const from = turn.marks[metric.from]
          const to = turn.marks[metric.to]
          if (from !== undefined && to !== undefined && to >= from) metrics[metric.name] = Math.round(to - from)
        }
        return { submissionId: turn.id as string, level: turn.level, network: turn.network, complete: turn.marks.ackDone !== undefined, metrics }
      })
      return { generatedAt: (options.date ?? (() => new Date().toISOString()))(), turns: entries, summary: summarize(entries) }
    },
  }
}

type NetworkInformation = { effectiveType?: string; downlink?: number; rtt?: number }

function readNetwork(): string {
  const connection = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { connection?: NetworkInformation }).connection
  if (!connection) return ''
  return [connection.effectiveType, connection.downlink !== undefined ? `${connection.downlink}Mbps` : '', connection.rtt !== undefined ? `rtt${connection.rtt}` : ''].filter(Boolean).join(' ')
}

let sessionReader: () => string = () => ''
/** The app tells telemetry how to read the current login (the service passes its token reader). */
export function setTelemetrySession(reader: () => string | null | undefined): void {
  sessionReader = () => fingerprint(reader())
}

export const lessonTurnTelemetry = createTurnTelemetry({
  enabled: () => typeof window !== 'undefined' && isTelemetryRequested(window.location?.search),
  network: readNetwork,
  session: () => sessionReader(),
})

if (typeof window !== 'undefined') {
  // Closing or leaving the page clears the measurements, so nothing lingers on a shared computer.
  window.addEventListener('pagehide', () => lessonTurnTelemetry.clear())
}

/** Offers the current report as a file the supervisor saves by hand. Returns false when there is nothing to save. */
export function downloadLatencyReport(): boolean {
  const report = lessonTurnTelemetry.report()
  if (!report.turns.length || typeof document === 'undefined') return false
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `talkora-latency-${report.generatedAt.replace(/[:.]/g, '-')}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}

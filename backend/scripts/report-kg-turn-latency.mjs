/**
 * Aggregate ACTUAL backend "KG turn timing" JSON logs into a privacy-safe report.
 * Offline / read-only. Nothing here contacts providers, authenticates students,
 * replays speech, mutates MongoDB, or claims the browser played audio.
 *
 * Usage (from backend/):
 *   node scripts/report-kg-turn-latency.mjs --file=logs/kg-lab.log --min-pairs=4 --budget-p95-ms=3500
 *   node scripts/report-kg-turn-latency.mjs --file=logs/kg-lab.log --report=../private/kg-latency.json
 */
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const STEPS = ['stt', 'feedback', 'save', 'tts', 'total']
const MAX_FILE_BYTES = 25 * 1024 * 1024

const percentile = (ordered, fraction) =>
  ordered[Math.max(0, Math.min(ordered.length - 1, Math.ceil(ordered.length * fraction) - 1))]
function stats(input) {
  if (!input.length) return null
  const ordered = [...input].sort((a, b) => a - b)
  return { count: ordered.length, p50Ms: percentile(ordered, .5),
    p95Ms: percentile(ordered, .95), maxMs: ordered[ordered.length - 1] }
}
function boundedDuration(value) {
  return Number.isFinite(value) && value >= 0 && value <= 120_000 ? Math.round(value) : null
}
function readTiming(line) {
  const pos = line.indexOf('{')
  if (pos < 0) return null
  try {
    const entry = JSON.parse(line.slice(pos))
    if (entry?.message !== 'KG turn timing' ||
        !['attempt', 'audio'].includes(entry.phase) ||
        typeof entry.submissionId !== 'string' ||
        !/^[a-zA-Z0-9_-]{8,100}$/.test(entry.submissionId)) return null
    const duration = boundedDuration(entry.total)
    if (duration === null) return null
    const steps = {}
    for (const step of STEPS) {
      const value = boundedDuration(entry[step])
      if (value !== null) steps[step] = value
    }
    // Only retain whitelisted values. Never echo names, transcripts or IDs.
    return {
      id: entry.submissionId, phase: entry.phase, steps,
      feedbackSource: entry.feedbackSource === 'qwen-8002' ? 'qwen' : 'other',
      ttsSource: entry.ttsSource === 'cache' ? 'cache' : 'other',
    }
  } catch {
    return null
  }
}

/** Summarize one actual backend log; correlation IDs remain in memory only.
 * For duplicate request logs, use the FIRST attempt/audio pair; repeats
 * are counted separately, never misrepresented as new students.
 * The combined duration is a SERVER REQUEST SUM, NOT microphone-to-speaker
 * elapsed time (which additionally includes network and browser playback).
 */
export function analyzeKGLatency(lines, options = {}) {
  const attempts = new Map()
  const audio = new Map()
  let unrelatedLines = 0, duplicates = 0
  for (const line of lines) {
    const value = readTiming(line)
    if (!value) { unrelatedLines++; continue }
    const target = value.phase === 'attempt' ? attempts : audio
    if (target.has(value.id)) { duplicates++; continue }
    target.set(value.id, value)
  }
  const pairs = []
  for (const [id, attempt] of attempts) {
    const voice = audio.get(id)
    if (voice) pairs.push({ attempt, voice })
  }
  const durationSteps = {}
  for (const step of STEPS) {
    const measurements = [...attempts.values(), ...audio.values()].flatMap(
      (entry) => entry.steps[step] === undefined ? [] : [entry.steps[step]])
    durationSteps[step] = stats(measurements)
  }
  const serverTurnMs = pairs.map(({ attempt, voice }) => attempt.steps.total + voice.steps.total)
  const requestP95 = stats(serverTurnMs)
  const minPairs = options.minPairs ?? 4
  const budgetP95Ms = options.budgetP95Ms ?? 3500
  if (!Number.isInteger(minPairs) || minPairs < 1 || minPairs > 5000) throw Error('Invalid minimum sample count')
  if (!Number.isInteger(budgetP95Ms) || budgetP95Ms < 250 || budgetP95Ms > 120000) throw Error('Invalid latency budget')
  const enoughData = pairs.length >= minPairs
  const withinBudget = enoughData && requestP95.p95Ms <= budgetP95Ms
  const qwenCount = [...attempts.values()].filter((entry) => entry.feedbackSource === 'qwen').length
  const cacheCount = [...audio.values()].filter((entry) => entry.ttsSource === 'cache').length
  return {
    kind: 'talkora-kg-latency-report', methodology: 'actual-backend-log-request-sum',
    recordedAt: new Date().toISOString(),
    threshold: { minimumCompletedPairs: minPairs, maximumServerRequestSumP95Ms: budgetP95Ms },
    counts: {
      attemptRequests: attempts.size, audioRequests: audio.size, correlatedTurns: pairs.length,
      unmatchedAttempts: attempts.size - pairs.length, unmatchedAudio: audio.size - pairs.length,
      duplicateLogLines: duplicates, unrelatedOrInvalidLines: unrelatedLines,
    },
    serverRequestSum: requestP95,
    stepMeasurements: durationSteps,
    feedback: { qwenAttempts: qwenCount, totalAttempts: attempts.size },
    voice: { cachedAudioRequests: cacheCount, totalAudioRequests: audio.size },
    gate: !enoughData ? 'INSUFFICIENT_REAL_SAMPLES' : withinBudget ? 'PASS_SERVER_BUDGET' : 'SLOW_SERVER_REQUEST_SUM',
    deviceMicrophone: 'NOT_VERIFIED_BY_SERVER_LOGS',
    audibleSpeaker: 'NOT_VERIFIED_BY_SERVER_LOGS',
    nextDayPinResume: 'NOT_VERIFIED_BY_SERVER_LOGS',
    note: 'This is attempt HTTP + audio HTTP server timing, not real mouth-to-ear latency; verify browser playback and pauses separately.',
  }
}

function parseArgs(argv) {
  const args = {}
  for (const arg of argv) {
    const match = /^--(file|report|min-pairs|budget-p95-ms)=(.+)$/.exec(arg)
    if (!match || args[match[1]] !== undefined) throw Error('Use --file=path [--min-pairs=4] [--budget-p95-ms=3500] [--report=path]')
    args[match[1]] = match[2]
  }
  if (!args.file || (args.report && args.report === args.file)) throw Error('An input log file is required; report must be a separate file')
  for (const option of ['min-pairs', 'budget-p95-ms']) {
    if (args[option] !== undefined && !/^\d+$/.test(args[option])) throw Error('Invalid --' + option)
  }
  return args
}
export async function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv)
  let bytes
  try {
    bytes = await readFile(args.file)
  } catch {
    throw Error('Could not read a local backend log file. Capture logs in a private folder first.')
  }
  if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) throw Error('Log must be nonempty and no larger than 25 MiB')
  const report = analyzeKGLatency(bytes.toString('utf8').split(/\r?\n/), {
    minPairs: args['min-pairs'] === undefined ? 4 : Number(args['min-pairs']),
    budgetP95Ms: args['budget-p95-ms'] === undefined ? 3500 : Number(args['budget-p95-ms']),
  })
  const output = JSON.stringify(report, null, 2) + '\n'
  if (args.report) {
    try { await writeFile(args.report, output, { flag: 'wx', mode: 0o600 }) }
    catch { throw Error('Report path already exists or is not writable; existing reports are never overwritten') }
  }
  console.log(output.trimEnd())
  if (report.gate !== 'PASS_SERVER_BUDGET') process.exitCode = 1
  return report
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error('KG_LATENCY_REPORT_FAILED:', error instanceof Error ? error.message : 'Invalid log')
    process.exitCode = 1
  })
}

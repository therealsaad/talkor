/**
 * Supervised KG school-device acceptance. This checks real backend PIN,
 * Mongo-backed progress, and optionally live Sarvam/Azure gateway responses.
 * It CANNOT prove browser microphone/video/speaker behavior; use the human
 * browser walkthrough in docs/kg-live-school-session-acceptance.md.
 *
 * Never print/store a PIN, bearer token, transcript, recording or student ID.
 * A successful CLI PIN login deliberately invalidates old KG intro tickets:
 * run --phase=before BEFORE opening the classroom, and --phase=after AFTER it.
 *
 * Node 22+: from backend, e.g.
 * TALKORA_E2E_STUDENT_PIN=..... node scripts/accept-kg-live-session.mjs --phase=before
 */
import { readFile, stat, writeFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'

const MIME = {
  '.webm': 'audio/webm', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg', '.mp4': 'audio/mp4', '.m4a': 'audio/mp4',
}

function parseArgs(argv) {
  const options = {}
  for (const arg of argv) {
    if (!arg.startsWith('--') || !arg.includes('=')) {
      if (arg === '--probe-voice') { options.probeVoice = true; continue }
      throw Error('Use --phase=before|after [--expect-level=1..5|map] [--expect-index=N] [--expect-completed=N] [--probe-voice] [--report=path]')
    }
    const [name, ...value] = arg.slice(2).split('=')
    if (!['phase', 'expect-level', 'expect-index', 'expect-completed', 'report'].includes(name)) {
      throw Error('Unknown option: --' + name)
    }
    options[name] = value.join('=')
  }
  if (!['before', 'after'].includes(options.phase)) throw Error('Set --phase=before or --phase=after')
  if (options.phase === 'after' && !options['expect-level']) throw Error('--phase=after requires --expect-level')
  for (const key of ['expect-index', 'expect-completed']) {
    if (options[key] !== undefined && !/^\d+$/.test(options[key])) throw Error('--' + key + ' must be a non-negative integer')
  }
  if (options['expect-level'] !== undefined &&
      !/^(?:[1-5]|map)$/.test(options['expect-level'])) throw Error('Expected level must be 1..5 or map')
  return options
}

/** Pure, deterministic projection matching /student/continue's server-owned choices. */
export function deriveKGResume(level1, level2, overview) {
  if (!level1 || typeof level1.completed !== 'boolean') throw Error('Invalid KG Level 1 response')
  if (!level1.completed) {
    return { nextLevel: 1, currentIndex: level1.currentIndex, route: '/student/kg', completedLevels: [] }
  }
  if (level1.level2Available !== true) throw Error('Level 1 complete, but Level 2 is not unlocked')
  if (!level2 || typeof level2.completed !== 'boolean') throw Error('Missing KG Level 2 state')
  if (!level2.completed) {
    return { nextLevel: 2, currentIndex: level2.currentIndex, route: '/student/kg/level-2', completedLevels: [1] }
  }
  if (!overview || !Array.isArray(overview.levels)) throw Error('Missing KG continuation overview')
  const completedLevels = [1, 2, ...overview.levels
    .filter((entry) => entry.status === 'COMPLETED')
    .map((entry) => entry.level)]
  const next = overview.nextLevel
  if (next === null) {
    if (overview.levels.some((entry) => entry.status === 'CURRENT')) {
      throw Error('Continuation overview contradicts current level')
    }
    return { nextLevel: 'map', currentIndex: null, route: '/student/kg/map', completedLevels }
  }
  if (![3, 4, 5].includes(next)) throw Error('Server returned an unapproved KG level')
  const current = overview.levels.find((entry) => entry.level === next)
  if (!current || current.status !== 'CURRENT' || !Number.isInteger(current.currentIndex)) {
    throw Error('Invalid authoritative KG continuation state')
  }
  return {
    nextLevel: next, currentIndex: current.currentIndex,
    route: '/student/kg/level-' + next, completedLevels,
  }
}

export function verifyExpectation(snapshot, options) {
  if (options['expect-level'] !== undefined &&
      String(snapshot.nextLevel) !== String(options['expect-level'])) {
    throw Error('Next level mismatch: expected ' + options['expect-level'] +
      ', server returned ' + snapshot.nextLevel)
  }
  if (options['expect-index'] !== undefined &&
      snapshot.currentIndex !== Number(options['expect-index'])) {
    throw Error('Activity cursor mismatch: expected ' + options['expect-index'] +
      ', server returned ' + snapshot.currentIndex)
  }
  if (options['expect-completed'] !== undefined &&
      !snapshot.completedLevels.includes(Number(options['expect-completed']))) {
    throw Error('Required completed level is not saved in Mongo progress')
  }
  return true
}

async function json(url, init = {}) {
  let response
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) })
  } catch {
    throw Error('Unable to contact Talkora backend; check the URL, TLS and network')
  }
  // Never expose response bodies, which can contain identifiable student text.
  if (!response.ok) throw Error(new URL(url).pathname + ' returned HTTP ' + response.status)
  let data
  try { data = await response.json() } catch { throw Error('Invalid JSON from backend') }
  return data
}

function expectedAudioHeader(bytes, type) {
  if (bytes.length < 256 || bytes.length > 8 * 1024 * 1024) return false
  const mime = type.split(';')[0].toLowerCase()
  if (mime === 'audio/mpeg' || mime === 'audio/mp3') {
    return bytes.subarray(0, 3).toString('ascii') === 'ID3' ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  }
  if (mime === 'audio/wav' || mime === 'audio/x-wav') {
    return bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WAVE'
  }
  return false
}

async function probeLiveSpeech(base, token) {
  if (process.env.TALKORA_E2E_ALLOW_PAID_SPEECH !== 'YES') {
    throw Error('Live speech requires TALKORA_E2E_ALLOW_PAID_SPEECH=YES (paid provider calls)')
  }
  const file = process.env.TALKORA_E2E_AUDIO_FILE || ''
  const type = MIME[extname(file).toLowerCase()]
  if (!type) throw Error('Use a consented adult voice sample: TALKORA_E2E_AUDIO_FILE=.wav/.webm/.mp3/.ogg/.mp4/.m4a')
  const metadata = await stat(file)
  if (metadata.size < 1024 || metadata.size > 2 * 1024 * 1024) {
    throw Error('Adult speech sample must be 1 KiB to 2 MiB')
  }
  const sample = await readFile(file)
  const form = new FormData()
  form.append('audio', new Blob([sample], { type }), 'adult-voice-check' + extname(file).toLowerCase())
  form.append('mode', 'fast')
  const startSTT = Date.now()
  const heard = await json(base + '/api/voice/transcribe', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form,
  })
  const spoken = heard.data
  if (!heard.success || spoken?.provider !== 'sarvam' || !spoken.transcript?.trim()) {
    throw Error('Real Sarvam response missing or speech not recognized')
  }
  const sttMs = Date.now() - startSTT
  const startAzure = Date.now()
  const audio = await fetch(base + '/api/voice/synthesize', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose: 'CONVERSATION', text: 'Hello, superstar! Welcome to Talkora.' }),
    signal: AbortSignal.timeout(35_000),
  })
  if (!audio.ok || !(audio.headers.get('x-voice-provider') || '').includes('azure')) {
    throw Error('Live Azure voice route failed (HTTP ' + audio.status + ')')
  }
  const audioType = audio.headers.get('content-type') || ''
  const bytes = Buffer.from(await audio.arrayBuffer())
  if (!expectedAudioHeader(bytes, audioType)) throw Error('Azure returned invalid or silent-format audio bytes')
  return { sarvam: 'PASS', azure: 'PASS', sttMs, azureMs: Date.now() - startAzure }
}

async function run() {
  const options = parseArgs(process.argv.slice(2))
  const pin = process.env.TALKORA_E2E_STUDENT_PIN || ''
  if (!/^\d{5}$/.test(pin)) throw Error('Provide a dedicated demo KG PIN using TALKORA_E2E_STUDENT_PIN')
  const base = (process.env.TALKORA_E2E_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '')
  if (!/^https?:\/\/[^/]+$/.test(base)) throw Error('Invalid TALKORA_E2E_API_URL')
  // Never send the demo PIN to an accidentally configured plain HTTP remote.
  if (!/^https:\/\//.test(base) && !/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(base)) {
    throw Error('Refusing PIN over non-local HTTP; use HTTPS')
  }
  const health = await json(base + '/health')
  if (health.status !== 'ok') throw Error('Talkora backend health did not return ok')
  const login = await json(base + '/api/auth/student/pin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  })
  const token = login.data?.token
  if (!login.success || typeof token !== 'string' || login.data.student?.grade !== 0) {
    throw Error('Demo PIN must belong to an authorized KG student')
  }
  const headers = { Authorization: 'Bearer ' + token }
  const get = async (path) => {
    const result = await json(base + '/api/' + path, { headers })
    if (!result.success || !result.data) throw Error('Invalid KG progress envelope')
    return result.data
  }
  const level1 = await get('kg-alphabet/state')
  let level2 = null, overview = null
  if (level1.completed && level1.level2Available) {
    level2 = await get('kg-level2/state')
    if (level2.completed) overview = await get('kg-continuation/overview')
  }
  const snapshot = deriveKGResume(level1, level2, overview)
  verifyExpectation(snapshot, options)
  const voice = options.probeVoice ? await probeLiveSpeech(base, token) : {
    sarvam: 'NOT_RUN', azure: 'NOT_RUN',
  }
  const evidence = {
    kind: 'talkora-kg-live-school-acceptance',
    recordedAt: new Date().toISOString(),
    phase: options.phase,
    deployedCommit: process.env.TALKORA_E2E_COMMIT_SHA || 'unverified',
    backend: 'PASS',
    pinLogin: 'PASS',
    grade: 0,
    ...snapshot,
    voice,
    deviceMicrophone: 'NOT_VERIFIED_BY_CLI',
    videoPlayback: 'NOT_VERIFIED_BY_CLI',
    audibleSpeaker: 'NOT_VERIFIED_BY_CLI',
    qwen: 'NOT_APPLICABLE_TO_KG3_TO_5_FIXED_LETTERS',
  }
  console.log(JSON.stringify(evidence, null, 2))
  if (options.report) {
    await writeFile(options.report, JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
    console.log('Sanitized evidence report saved at operator-specified path')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    // This runner throws sanitized operator-facing messages only and never
    // includes upstream response bodies, credentials or speech transcripts.
    const reason = error instanceof Error ? error.message : 'Unknown acceptance error'
    console.error('KG_LIVE_ACCEPTANCE_FAILED:', reason)
    process.exitCode = 1
  })
}

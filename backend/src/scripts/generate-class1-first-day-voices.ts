/** Local-only, approval-gated First Day audio generation. No secrets printed.
 * From backend: pnpm exec tsx -r dotenv/config src/scripts/generate-class1-first-day-voices.ts --check
 * For 8001: TALKORA_FIRST_DAY_GENERATE=YES ... --generate --language en-IN --sample
 * For bilingual 1-time Azure: requires additional TALKORA_FIRST_DAY_PAID_BATCH=YES.
 * Never uploads files or changes lesson/progress.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'
import manifest from './class1-first-day-voice-v3.json'
import { hasExpectedAudioHeader } from '../services/voice-audio-format'
import { parsePriyaHealth, checkPriyaHealth, formatPriyaHealth } from '../services/priya-tts-health'

type Line = (typeof manifest.lines)[number]
const arg = (name: string, defaultValue: string) => {
  const i = process.argv.indexOf(name)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : defaultValue
}
const lang = arg('--language', 'en-IN')
const dest = path.resolve(arg('--out', path.join('tmp', 'class1-first-day-v3')))
const generate = process.argv.includes('--generate')
const all = process.argv.includes('--all')
const lines = manifest.lines.filter(line => lang === 'all' || line.language === lang)
if (!['en-IN', 'hi-IN', 'mr-IN', 'all'].includes(lang)) throw new Error('Choose --language en-IN, hi-IN, mr-IN or all')

async function pythonVoice(line: Line): Promise<Buffer> {
  const url = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '')
  if (!/^https:\/\//.test(url) && !/^http:\/\/(?:127\.0\.0\.1|localhost):8001$/.test(url))
    throw new Error('8001 narration endpoint must be local or approved HTTPS')
  // Resolve the voice from the process that's actually running on port 8001.
  const probe = await fetch(url + '/health', { signal: AbortSignal.timeout(7000) })
  if (!probe.ok) throw new Error('Python 8001 /health returned HTTP ' + probe.status)
  const health = parsePriyaHealth(await probe.json())
  console.log(formatPriyaHealth(health))
  const blockers = checkPriyaHealth(health)
  if (blockers.length) throw new Error('Python 8001 TTS is not ready: ' + blockers.join('; '))
  const response = await fetch(url + '/v1/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
      ...(process.env.AI_SERVICE_API_KEY ? { 'X-Service-API-Key': process.env.AI_SERVICE_API_KEY } : {}) },
    body: JSON.stringify({ text: line.text,
      voice: health.voiceId, language: 'en-IN' }),
    signal: AbortSignal.timeout(180000),
  })
  if (!response.ok) {
    // Untrusted provider error bodies can include model paths or request text.
    // Only display a bounded machine-readable error code, never raw HTML.
    const responseBody: unknown = await response.json().catch(() => null)
    const error = responseBody && typeof responseBody === 'object' && 'error' in responseBody
      ? (responseBody as { error?: unknown }).error : undefined
    const code = error && typeof error === 'object' && 'code' in error
      ? (error as { code?: unknown }).code : undefined
    const safeCode = typeof code === 'string' && /^[A-Z0-9_]{3,50}$/.test(code) ? ' [' + code + ']' : ''
    const hint = response.status === 500
      ? ' Unhandled Python generation error: inspect the terminal running port 8001 for the traceback.'
      : response.status === 503
        ? ' Priya may be missing model weights, blocked by Windows application policy, or out of GPU memory; inspect 8001 logs.'
        : response.status === 422
          ? ' Invalid request payload or voice ID; inspect /health and the running service version.'
          : ''
    throw new Error('Python 8001 /v1/tts HTTP ' + response.status + safeCode + '.' + hint)
  }
  return Buffer.from(await response.arrayBuffer())
}
async function azureVoice(line: Line): Promise<Buffer> {
  if (process.env.TALKORA_FIRST_DAY_PAID_BATCH !== 'YES')
    throw new Error('Azure charges are disabled. Set TALKORA_FIRST_DAY_PAID_BATCH=YES for a one-time reviewed Hindi/Marathi batch.')
  // Explicit Class 1 voice selection. This makes only one paid TTS request.
  const result = await new AzureVoiceProvider().synthesizeStream(line.text, { class1Lesson: true })
  const chunks: Buffer[] = []
  const reader = result.body.getReader()
  try {
    while (true) {
      const item = await reader.read()
      if (item.done) break
      chunks.push(Buffer.from(item.value))
    }
  } finally { reader.releaseLock() }
  return Buffer.concat(chunks)
}
async function main() {
  if (lines.length === 0) throw new Error('No matching voice lines')
  const selected = all ? lines : lines.slice(0, 1)
  console.log(JSON.stringify({ status: generate ? 'GENERATE_REQUEST' : 'DRY_RUN',
    revision: manifest.revision, count: selected.length,
    languages: [...new Set(selected.map(x => x.language))],
    outputs: selected.map(x => x.id + '.' + x.format),
    voiceEndpoint: 'local 8001 for English; Azure for Hindi/Marathi' }, null, 2))
  if (!generate) return
  if (process.env.NODE_ENV === 'production' || process.env.TALKORA_FIRST_DAY_GENERATE !== 'YES')
    throw new Error('Write blocked: set TALKORA_FIRST_DAY_GENERATE=YES in a non-production developer process')
  await fs.mkdir(dest, { recursive: true })
  for (const line of selected) {
    const file = path.join(dest, line.id + '.' + line.format)
    try { await fs.access(file); console.log('SKIP existing', line.id); continue } catch { /* missing */ }
    const bytes = line.language === 'en-IN' ? await pythonVoice(line) : await azureVoice(line)
    const mime = line.format === 'wav' ? 'audio/wav' : 'audio/mpeg'
    if (!hasExpectedAudioHeader(bytes, mime)) throw new Error('Invalid synthesized audio for ' + line.id)
    // Exclusive create prevents accidentally overwriting an already approved recording.
    await fs.writeFile(file, bytes, { flag: 'wx' })
    console.log('SAVED', line.id, bytes.byteLength, 'bytes; HUMAN VOICE REVIEW REQUIRED')
  }
}
main().catch(e => { console.error(e instanceof Error ? e.message : 'Generation failed'); process.exitCode = 1 })

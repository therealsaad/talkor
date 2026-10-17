import 'dotenv/config'
import { createHash } from 'node:crypto'
import { execFile as execFileCallback } from 'node:child_process'
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { AUDIO_MANIFEST, KG_AUDIO_VERSION } from '../kg/alphabet-content'
import { S3Service } from '../services/S3Service'

const execFile = promisify(execFileCallback)
const SERVICE_DEFAULT = 'http://127.0.0.1:8001'
const VOICE_PRESET = {
  id: 'miss-julie-priya-v6',
  label: 'Priya · Indic Parler-TTS · Talkora kids teacher v6',
  voiceId: 'talkora-priya-v6-indian-kids-teacher',
  version: 'talkora-priya-v6-indian-kids-teacher',
  language: 'en-IN',
} as const
const ROOT = path.resolve(__dirname, '../..')
const DEFAULT_OUTPUT_ROOT = path.join(ROOT, 'tmp', 'kg-level1-audio')
const SAMPLE_ID = 'say-a'
const MAX_AUDIO_BYTES = 12 * 1024 * 1024
const MAX_CLIP_SECONDS = 18

type ManifestLine = (typeof AUDIO_MANIFEST)[number]
type StoredClip = ManifestLine & {
  voicePreset: string
  voiceId: string
  voiceVersion: string
  language: string
  provider: 'talkora-local-ai-service'
  sourceContentType: string
  format: 'mp3'
  mimeType: 'audio/mpeg'
  durationSeconds: number
  bytes: number
  sha256: string
  generatedAt: string
}
type LocalManifest = {
  manifestVersion: string
  voicePreset: string
  voiceId: string
  voiceVersion: string
  language: string
  generatedAt: string
  clips: StoredClip[]
}
type OpenApiSpec = {
  paths?: Record<string, {
    post?: {
      requestBody?: { content?: Record<string, { schema?: { $ref?: string } }> }
      responses?: Record<string, { content?: Record<string, unknown> }>
    }
  }>
  components?: { schemas?: Record<string, { properties?: Record<string, { type?: string; default?: unknown }> }> }
}

class PipelineError extends Error {
  constructor(message: string, readonly retryable = false) {
    super(message)
    this.name = 'PipelineError'
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function parseFlags(argv: string[]) {
  const allowed = new Set(['--sample', '--all', '--resume', '--dry-run', '--upload', '--verify', '--help'])
  const unknown = argv.filter((item) => !allowed.has(item))
  if (unknown.length) throw new Error(`Unknown option(s): ${unknown.join(', ')}`)
  const flags = new Set(argv)
  if (flags.has('--help')) return { help: true, flags }
  const modes = ['--sample', '--all', '--upload', '--verify'].filter((flag) => flags.has(flag))
  if (modes.length !== 1) throw new Error('Choose one mode: --sample, --all, --upload, or --verify.')
  if (flags.has('--resume') && !flags.has('--sample') && !flags.has('--all')) {
    throw new Error('--resume is available with --sample or --all only.')
  }
  if (flags.has('--upload') && (flags.has('--sample') || flags.has('--all'))) {
    throw new Error('Upload separately after voice approval: run --all first, then --upload.')
  }
  return { help: false, flags }
}

function printHelp() {
  console.log([
    'KG Level 1 Miss Julie voice pipeline',
    '',
    '  npm run kg:audio -- --sample              Generate only the A/apple approval sample.',
    '  npm run kg:audio -- --all                 Generate the complete local voice library.',
    '  npm run kg:audio -- --all --resume        Continue; skip clips whose manifest and checksum match.',
    '  npm run kg:audio -- --all --dry-run       List clips without TTS calls or file writes.',
    '  npm run kg:audio -- --upload               Upload the completed library; existing mismatched keys are never overwritten.',
    '  npm run kg:audio -- --upload --dry-run     Validate files and list S3 keys without AWS writes.',
    '  npm run kg:audio -- --verify                Check every versioned S3 clip and its checksum metadata.',
    '',
    'Sample files: tmp/kg-level1-audio/sample/',
    'Full library: tmp/kg-level1-audio/v1/',
    `Pinned voice: ${VOICE_PRESET.voiceId} (${VOICE_PRESET.language})`,
  ].join('\n'))
}

function getServiceBase(): URL {
  const configured = process.env.AI_SERVICE_URL?.trim() || SERVICE_DEFAULT
  const base = new URL(configured)
  if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(base.hostname) || base.pathname !== '/') {
    throw new Error('AI_SERVICE_URL must point to the existing local service at 127.0.0.1 or localhost. No remote TTS provider is used.')
  }
  return new URL(`${base.toString().replace(/\/$/, '')}/`)
}

async function requestJson(url: URL, timeoutMs: number): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' } })
}

async function inspectTTSContract(base: URL): Promise<{ endpoint: URL; responses: string[] }> {
  const response = await requestJson(new URL('openapi.json', base), 12_000)
  if (!response.ok) throw new Error(`Local TTS OpenAPI returned HTTP ${response.status}.`)
  const spec = await response.json() as OpenApiSpec
  const operation = spec.paths?.['/v1/tts']?.post
  const requestContent = operation?.requestBody?.content?.['application/json']
  const ref = requestContent?.schema?.$ref
  const schemaName = ref?.split('/').at(-1)
  const schema = schemaName ? spec.components?.schemas?.[schemaName] : undefined
  const fields = schema?.properties
  if (!fields?.text || !fields.voice || !fields.language) {
    throw new Error('The local /v1/tts OpenAPI request no longer matches the inspected text/voice/language contract. No audio was generated.')
  }
  if (fields.voice.default !== VOICE_PRESET.voiceId || fields.language.default !== VOICE_PRESET.language) {
    throw new Error(`Local service voice preset changed. Expected ${VOICE_PRESET.voiceId} / ${VOICE_PRESET.language}; refusing to use a different voice.`)
  }
  const responses = Object.keys(operation?.responses?.['200']?.content || {})
  return { endpoint: new URL('v1/tts', base), responses }
}

function sniffAudio(bytes: Buffer, contentType: string): string {
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WAVE') return 'wav'
  if (bytes.subarray(0, 4).toString('ascii') === 'fLaC') return 'flac'
  if (bytes.subarray(0, 4).toString('ascii') === 'OggS') return 'ogg'
  if (bytes.subarray(0, 3).toString('ascii') === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return 'mp3'
  if (bytes.length > 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp') return 'm4a'
  if (bytes.length > 4 && bytes.subarray(0, 4).toString('hex') === '1a45dfa3') return 'webm'
  throw new Error(`TTS returned unrecognized audio bytes (${contentType || 'no Content-Type'}). The script will not guess or substitute another provider.`)
}

async function findBinary(name: 'ffmpeg' | 'ffprobe'): Promise<string> {
  const suffix = process.platform === 'win32' ? '.exe' : ''
  const fileName = `${name}${suffix}`
  for (const folder of (process.env.PATH || '').split(path.delimiter)) {
    const candidate = path.join(folder, fileName)
    try { await access(candidate); return candidate } catch { /* Try the next PATH directory. */ }
  }
  throw new Error(`${fileName} is required for audio validation and MP3 conversion. Install FFmpeg and add it to PATH.`)
}

async function probeAudio(ffprobe: string, audioPath: string): Promise<number> {
  const { stdout } = await execFile(ffprobe, [
    '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name', '-of', 'json', audioPath,
  ], { windowsHide: true, timeout: 30_000, maxBuffer: 2 * 1024 * 1024 })
  const result = JSON.parse(stdout) as { format?: { duration?: string }; streams?: Array<{ codec_type?: string; codec_name?: string }> }
  const seconds = Number(result.format?.duration)
  const audioStream = result.streams?.find((stream) => stream.codec_type === 'audio')
  if (!audioStream || !Number.isFinite(seconds) || seconds < 0.35 || seconds > MAX_CLIP_SECONDS) {
    throw new Error(`Audio validation failed: expected one playable ${MAX_CLIP_SECONDS}-second-or-shorter speech clip.`)
  }
  if (audioStream.codec_name !== 'mp3') throw new Error(`MP3 validation failed: ffprobe found ${audioStream.codec_name || 'an unknown codec'}.`)
  return Math.round(seconds * 1000) / 1000
}

async function ttsBytes(base: URL, text: string): Promise<{ bytes: Buffer; contentType: string }> {
  const { endpoint } = await inspectTTSContract(base)
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: '*/*' }
  const apiKey = process.env.AI_SERVICE_API_KEY?.trim()
  if (apiKey) headers['X-Service-API-Key'] = apiKey
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, voice: VOICE_PRESET.voiceId, language: VOICE_PRESET.language }),
      signal: AbortSignal.timeout(10 * 60_000),
    })
  } catch (error) {
    throw new PipelineError(`Local TTS request could not complete: ${error instanceof Error ? error.message : String(error)}`, true)
  }
  const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() || ''
  let bytes: Buffer
  try { bytes = Buffer.from(await response.arrayBuffer()) }
  catch (error) { throw new PipelineError(`Local TTS audio response was interrupted: ${error instanceof Error ? error.message : String(error)}`, true) }
  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    let errorCode = ''
    if (contentType.includes('json')) {
      try {
        const body = JSON.parse(bytes.toString('utf8')) as { error?: { code?: string; message?: string } }
        errorCode = body.error?.code || ''
        detail = [body.error?.code, body.error?.message].filter(Boolean).join(': ') || detail
      } catch { /* Preserve the HTTP status if the error body is not valid JSON. */ }
    }
    const retryable = (response.status === 408 || response.status === 429 || response.status >= 500) && errorCode !== 'TTS_UNAVAILABLE'
    throw new PipelineError(`Local ${VOICE_PRESET.label} TTS failed: ${detail}`, retryable)
  }
  if (contentType.includes('json')) {
    throw new Error('Local TTS returned successful JSON, but its OpenAPI response schema is empty and no successful JSON audio contract is documented. Refusing to guess an audio field.')
  }
  if (contentType !== 'audio/wav') throw new Error(`Local Priya TTS success contract is audio/wav; received ${contentType || '(missing)'}. Refusing to guess another format.`)
  if (bytes.length < 1024 || bytes.length > MAX_AUDIO_BYTES) throw new Error(`Local TTS audio size ${bytes.length} bytes is outside the supported range.`)
  if (sniffAudio(bytes, contentType) !== 'wav') throw new Error('Local Priya TTS declared audio/wav but returned a different audio format.')
  return { bytes, contentType }
}

async function writeManifest(folder: string, clips: StoredClip[]) {
  const manifest: LocalManifest = {
    manifestVersion: `kg-level1-audio-${KG_AUDIO_VERSION}`,
    voicePreset: VOICE_PRESET.id,
    voiceId: VOICE_PRESET.voiceId,
    voiceVersion: VOICE_PRESET.version,
    language: VOICE_PRESET.language,
    generatedAt: new Date().toISOString(),
    clips: clips.sort((a, b) => a.id.localeCompare(b.id)),
  }
  const temp = path.join(folder, `.manifest-${process.pid}.tmp`)
  await writeFile(temp, JSON.stringify(manifest, null, 2), 'utf8')
  await rename(temp, path.join(folder, 'manifest.json'))
}

async function readManifest(folder: string): Promise<LocalManifest> {
  const parsed = JSON.parse(await readFile(path.join(folder, 'manifest.json'), 'utf8')) as LocalManifest
  if (parsed.manifestVersion !== `kg-level1-audio-${KG_AUDIO_VERSION}` || parsed.voicePreset !== VOICE_PRESET.id ||
      parsed.voiceId !== VOICE_PRESET.voiceId || parsed.voiceVersion !== VOICE_PRESET.version || parsed.language !== VOICE_PRESET.language) {
    throw new Error('Local manifest voice/version does not match the pinned Miss Julie v1 preset. Refusing to mix voices or overwrite files.')
  }
  if (!Array.isArray(parsed.clips)) throw new Error('Local manifest has no clips array.')
  return parsed
}

async function generate(mode: 'sample' | 'all', resume: boolean, dryRun: boolean) {
  const lines = mode === 'sample' ? AUDIO_MANIFEST.filter((line) => line.id === SAMPLE_ID) : AUDIO_MANIFEST
  if (!lines.length) throw new Error(`The curriculum voice manifest is missing sample clip ${SAMPLE_ID}.`)
  const folder = path.join(DEFAULT_OUTPUT_ROOT, mode === 'sample' ? 'sample' : KG_AUDIO_VERSION)
  console.log(`${dryRun ? 'DRY RUN · ' : ''}Mode: ${mode}; clips: ${lines.length}; voice: ${VOICE_PRESET.voiceId}`)
  for (const line of lines) console.log(`  ${line.id}.mp3 | activity=${line.activityIds.join(',') || 'level'} | ${line.s3Key} | ${line.text}`)
  if (dryRun) return

  await mkdir(folder, { recursive: true })
  const ffmpeg = await findBinary('ffmpeg')
  const ffprobe = await findBinary('ffprobe')
  const base = getServiceBase()
  const contract = await inspectTTSContract(base)
  console.log(`Verified local API: POST ${contract.endpoint.toString()} · OpenAPI success media: ${contract.responses.join(', ') || 'unspecified'}`)
  const prior = resume ? await readManifest(folder).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }) : null
  const completed = new Map((prior?.clips || []).map((clip) => [clip.id, clip]))

  for (const [index, line] of lines.entries()) {
    const target = path.join(folder, `${line.id}.mp3`)
    const existing = completed.get(line.id)
    if (resume && existing) {
      const bytes = await readFile(target).catch(() => null)
      if (bytes && existing.sha256 === sha256(bytes) && existing.text === line.text && existing.s3Key === line.s3Key &&
          existing.activityIds.join('|') === line.activityIds.join('|') && existing.voiceId === VOICE_PRESET.voiceId &&
          existing.voiceVersion === VOICE_PRESET.version && existing.language === VOICE_PRESET.language) {
        console.log(`[${index + 1}/${lines.length}] SKIP ${line.id}.mp3 · manifest and SHA-256 match`)
        continue
      }
      throw new Error(`${line.id}.mp3 already exists but does not match its manifest/checksum. It was left untouched; use a new voice version/output folder.`)
    }
    try { await access(target); throw new Error(`${target} already exists. Use --resume only for a matching manifest; existing voice files are never overwritten.`) }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }

    console.log(`[${index + 1}/${lines.length}] GENERATE ${line.id}.mp3`)
    let generatedAudio: Awaited<ReturnType<typeof ttsBytes>> | undefined
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        generatedAudio = await ttsBytes(base, line.text)
        break
      } catch (error) {
        const canRetry = error instanceof PipelineError && error.retryable && attempt < 3
        if (!canRetry) throw error
        console.warn(`  Temporary local TTS failure on attempt ${attempt}/3; retrying in ${attempt}s.`)
        await wait(attempt * 1000)
      }
    }
    if (!generatedAudio) throw new Error(`No audio was returned for ${line.id}.`)
    const { bytes, contentType } = generatedAudio
    const extension = sniffAudio(bytes, contentType)
    const scratch = path.join(folder, `.audio-${process.pid}-${Date.now()}`)
    await mkdir(scratch, { recursive: true })
    const sourcePath = path.join(scratch, `source.${extension}`)
    const outputPath = path.join(scratch, 'clip.mp3')
    const stagingPath = path.join(folder, `.${line.id}.${process.pid}.tmp.mp3`)
    try {
      await writeFile(sourcePath, bytes, { flag: 'wx' })
      await execFile(ffmpeg, [
        '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', sourcePath,
        '-map', '0:a:0', '-vn', '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '64k',
        outputPath,
      ], { windowsHide: true, timeout: 120_000, maxBuffer: 2 * 1024 * 1024 })
      const playable = await readFile(outputPath)
      if (playable.length < 512 || playable.length > 2 * 1024 * 1024) throw new Error(`Optimized MP3 size ${playable.length} bytes is outside 512 B–2 MB.`)
      const durationSeconds = await probeAudio(ffprobe, outputPath)
      await execFile(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', outputPath, '-map', '0:a:0', '-f', 'null', '-'], {
        windowsHide: true, timeout: 60_000, maxBuffer: 2 * 1024 * 1024,
      })
      const clip: StoredClip = {
        ...line,
        voicePreset: VOICE_PRESET.id,
        voiceId: VOICE_PRESET.voiceId,
        voiceVersion: VOICE_PRESET.version,
        language: VOICE_PRESET.language,
        provider: 'talkora-local-ai-service',
        sourceContentType: contentType,
        format: 'mp3',
        mimeType: 'audio/mpeg',
        durationSeconds,
        bytes: playable.length,
        sha256: sha256(playable),
        generatedAt: new Date().toISOString(),
      }
      await writeFile(stagingPath, playable, { flag: 'wx' })
      // wx plus rename prevents accidental replacement of an existing clip.
      try { await access(target); throw new Error(`${target} appeared during generation; refusing to overwrite it.`) }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
      await rename(stagingPath, target)
      completed.set(line.id, clip)
      await writeManifest(folder, [...completed.values()])
      console.log(`  OK ${line.id}.mp3 · ${durationSeconds}s · ${playable.length} bytes · SHA-256 ${clip.sha256}`)
    } catch (error) {
      await rm(stagingPath, { force: true })
      throw error
    } finally {
      await rm(scratch, { recursive: true, force: true })
    }
  }

  const finalManifest = await readManifest(folder)
  if (mode === 'all' && finalManifest.clips.length !== AUDIO_MANIFEST.length) {
    throw new Error(`Manifest has ${finalManifest.clips.length}/${AUDIO_MANIFEST.length} clips. Resume the generation to finish missing lines.`)
  }
  console.log(`Saved local manifest: ${path.join(folder, 'manifest.json')}`)
  console.log(`Saved MP3 directory: ${folder}`)
}

async function loadUploadSet(folder: string): Promise<StoredClip[]> {
  const local = await readManifest(folder)
  const byId = new Map(local.clips.map((clip) => [clip.id, clip]))
  if (byId.size !== AUDIO_MANIFEST.length || AUDIO_MANIFEST.some((line) => !byId.has(line.id))) {
    throw new Error(`Upload requires the complete ${AUDIO_MANIFEST.length}-clip v1 manifest. Generate --all after approving the sample.`)
  }
  for (const line of AUDIO_MANIFEST) {
    const clip = byId.get(line.id)!
    if (clip.text !== line.text || clip.s3Key !== line.s3Key || clip.activityIds.join('|') !== line.activityIds.join('|') || clip.voiceVersion !== VOICE_PRESET.version) {
      throw new Error(`Local clip ${line.id} does not match current curriculum/version; refusing upload.`)
    }
    const bytes = await readFile(path.join(folder, `${line.id}.mp3`))
    if (sha256(bytes) !== clip.sha256 || bytes.length !== clip.bytes) throw new Error(`Checksum/size mismatch: ${line.id}.mp3`)
  }
  return AUDIO_MANIFEST.map((line) => byId.get(line.id)!)
}

function assertRemoteMatch(remote: Awaited<ReturnType<typeof S3Service.headAudio>>, clip: StoredClip) {
  if (!remote || remote.contentLength !== clip.bytes || remote.contentType !== 'audio/mpeg' || remote.sha256 !== clip.sha256 || remote.serverSideEncryption !== 'AES256' || !remote.cacheControl?.includes('private')) {
    throw new Error(`S3 verification failed for ${clip.id} (${clip.s3Key}): size/type/checksum/private-cache/encryption metadata mismatch.`)
  }
}

async function uploadAll(dryRun: boolean) {
  const folder = path.join(DEFAULT_OUTPUT_ROOT, KG_AUDIO_VERSION)
  const clips = await loadUploadSet(folder)
  console.log(`${dryRun ? 'DRY RUN · ' : ''}S3 uploads: ${clips.length} audio clips from ${folder}`)
  for (const clip of clips) console.log(`  ${clip.id} · ${clip.bytes} bytes · ${clip.s3Key}`)
  if (dryRun) return

  // Check every destination before the first write. Matching content is safe to skip;
  // any different existing object aborts the batch without overwriting that version.
  const existing = new Map<string, Awaited<ReturnType<typeof S3Service.headAudio>>>()
  for (const clip of clips) {
    const remote = await S3Service.headAudio(clip.s3Key)
    if (remote && remote.sha256 !== clip.sha256) throw new Error(`Refusing to overwrite existing S3 object ${clip.s3Key}. Create a new audio version after approval.`)
    existing.set(clip.id, remote)
  }
  for (const clip of clips) {
    if (existing.get(clip.id)) {
      assertRemoteMatch(existing.get(clip.id)!, clip)
      console.log(`SKIP ${clip.id} · same checksum already exists`)
      continue
    }
    const bytes = await readFile(path.join(folder, `${clip.id}.mp3`))
    try {
      await S3Service.putAudio(clip.s3Key, bytes, 'audio/mpeg', {
        sha256: clip.sha256,
        'audio-id': clip.id,
        'voice-version': clip.voiceVersion,
      }, '*')
    } catch (error) {
      const s3Error = error as { $metadata?: { httpStatusCode?: number }; name?: string }
      if (s3Error.$metadata?.httpStatusCode !== 412 && s3Error.name !== 'PreconditionFailed') throw error
      const appeared = await S3Service.headAudio(clip.s3Key)
      if (!appeared) throw error
      assertRemoteMatch(appeared, clip)
      console.log(`SKIP ${clip.id} · identical S3 object appeared before conditional upload`)
      continue
    }
    const uploaded = await S3Service.headAudio(clip.s3Key)
    assertRemoteMatch(uploaded, clip)
    console.log(`UPLOADED + VERIFIED ${clip.id} · ${clip.s3Key}`)
  }
  console.log(`Verified ${clips.length}/${clips.length} versioned private S3 audio objects.`)
}

async function verifyAll(dryRun: boolean) {
  console.log(`${dryRun ? 'DRY RUN · ' : ''}S3 verification targets: ${AUDIO_MANIFEST.length}`)
  for (const line of AUDIO_MANIFEST) console.log(`  ${line.id} · ${line.s3Key}`)
  if (dryRun) return
  const missing: string[] = []
  const mismatched: string[] = []
  for (const line of AUDIO_MANIFEST) {
    const remote = await S3Service.headAudio(line.s3Key)
    if (!remote) { missing.push(line.id); continue }
    if (remote.contentLength === null || remote.contentLength < 512 || remote.contentType !== 'audio/mpeg' ||
        remote.serverSideEncryption !== 'AES256' || !remote.cacheControl?.includes('private') || !remote.sha256) {
      mismatched.push(line.id)
      continue
    }
    console.log(`OK ${line.id} · ${remote.contentLength} bytes · AES256 · private cache`)
  }
  console.log(JSON.stringify({ checked: AUDIO_MANIFEST.length, verified: AUDIO_MANIFEST.length - missing.length - mismatched.length, missing, mismatched }, null, 2))
  if (missing.length || mismatched.length) throw new Error('S3 audio verification found missing or mismatched clips.')
}

export async function runKGLevel1Audio(argv = process.argv.slice(2)) {
  const { help, flags } = parseFlags(argv)
  if (help) { printHelp(); return }
  const dryRun = flags.has('--dry-run')
  if (flags.has('--sample') || flags.has('--all')) {
    await generate(flags.has('--sample') ? 'sample' : 'all', flags.has('--resume'), dryRun)
    return
  }
  if (flags.has('--upload')) {
    await uploadAll(dryRun)
    return
  }
  await verifyAll(dryRun)
}

if (require.main === module) {
  runKGLevel1Audio().catch((error) => {
    console.error(`KG audio pipeline stopped: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}

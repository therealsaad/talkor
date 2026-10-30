import { createHash } from 'node:crypto'
import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'
import { logger } from '../utils/logger'
import { S3Service } from './S3Service'

type KGAudioSource = 'memory' | 's3' | 'azure'
export type KGAzureNarration = { audio: Buffer; contentType: string; source: KGAudioSource; storedInS3: boolean }
type CachedNarration = Pick<KGAzureNarration, 'audio' | 'contentType' | 'storedInS3'>

const MAX_ENTRIES = 96
const MAX_BYTES = 24 * 1024 * 1024
const MAX_ITEM_BYTES = 2 * 1024 * 1024
const memory = new Map<string, CachedNarration>()
const inFlight = new Map<string, Promise<KGAzureNarration>>()
let bytesInMemory = 0

function store(key: string, value: CachedNarration) {
  if (value.audio.length > MAX_ITEM_BYTES) return
  const previous = memory.get(key)
  if (previous) bytesInMemory -= previous.audio.length
  memory.delete(key)
  memory.set(key, value)
  bytesInMemory += value.audio.length
  while (memory.size > MAX_ENTRIES || bytesInMemory > MAX_BYTES) {
    const oldest = memory.keys().next().value
    if (!oldest) break
    const removed = memory.get(oldest)
    if (removed) bytesInMemory -= removed.audio.length
    memory.delete(oldest)
  }
}

function s3Configured(): boolean {
  // S3Service currently uses explicit credentials, not the default AWS chain.
  return ['AWS_REGION', 'AWS_S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
    .every((name) => Boolean(process.env[name]?.trim()))
}

function cacheIdentity(level: number, id: string, text: string) {
  const format = process.env.AZURE_SPEECH_OUTPUT_FORMAT?.trim() || 'audio-24khz-48kbitrate-mono-mp3'
  const profile = {
    text,
    voice: process.env.AZURE_SPEECH_VOICE?.trim() || 'en-IN-NeerjaNeural',
    rate: process.env.KG_AZURE_SPEECH_RATE?.trim() || '+5%',
    pitch: process.env.KG_AZURE_SPEECH_PITCH?.trim() || '+6%',
    format,
    version: process.env.AZURE_VOICE_PROFILE_VERSION?.trim() || 'v2-mp3',
  }
  const hash = createHash('sha256').update(JSON.stringify(profile)).digest('hex')
  const ext = format.startsWith('audio-') ? 'mp3' : 'wav'
  return {
    key: `kg/azure/level-${String(level).padStart(2, '0')}/v1/${id}/${hash}.${ext}`,
    contentType: ext === 'mp3' ? 'audio/mpeg' : 'audio/wav',
  }
}

/**
 * Only call with server-owned, reviewed KG narration. Never pass student
 * transcripts, AI feedback, student names or request-supplied text here.
 * On an S3 miss or S3 outage, synthesize the approved sentence with Azure.
 * Content-addressed keys prevent stale audio when voice or wording changes.
 */
export async function getKGAzureNarrationAudio(input: {
  level: number
  id: string
  text: string
}): Promise<KGAzureNarration> {
  const { level, id } = input
  const text = input.text.replace(/\s+/g, ' ').trim()
  if (!Number.isInteger(level) || level < 1 || level > 10 ||
      !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(id) ||
      !text || text.length > 320) {
    throw new Error('Invalid server-owned KG narration identity')
  }

  const { key, contentType } = cacheIdentity(level, id, text)
  const cached = memory.get(key)
  if (cached) {
    memory.delete(key)
    memory.set(key, cached)
    return { ...cached, source: 'memory' }
  }

  const running = inFlight.get(key)
  if (running) return running

  const task = (async (): Promise<KGAzureNarration> => {
    if (s3Configured()) {
      try {
        const stored = await S3Service.getAudio(key)
        if (stored && stored.length >= 256 && stored.length <= 8 * 1024 * 1024) {
          const value = { audio: stored, contentType, storedInS3: true }
          store(key, value)
          return { ...value, source: 's3' }
        }
      } catch (error) {
        logger.warn('KG Azure narration S3 read failed; synthesizing live', {
          level, id, reason: error instanceof Error ? error.name : 'UnknownS3Error',
        })
      }
    }

    // The provider's KG preset and audio validation remain authoritative.
    const generated = await new AzureVoiceProvider().synthesizeUncached(text)
    let storedInS3 = false
    if (s3Configured()) {
      try {
        await S3Service.putAudio(key, generated.audio, generated.contentType, {
          source: 'azure',
          profile: 'kg-v1',
        }, '*')
        storedInS3 = true
      } catch (error) {
        // A concurrent worker can win an If-None-Match race (412).
        // Neither S3 upload failures nor a race should mute the lesson.
        const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode
        if (status === 412) storedInS3 = true
        else logger.warn('KG Azure narration S3 write failed; serving live audio', {
          level, id, reason: error instanceof Error ? error.name : 'UnknownS3Error',
        })
      }
    }
    const value = { ...generated, storedInS3 }
    store(key, value)
    return { ...value, source: 'azure' }
  })()
  inFlight.set(key, task)
  try {
    return await task
  } finally {
    if (inFlight.get(key) === task) inFlight.delete(key)
  }
}

/** Tests may clear the bounded in-memory cache without changing S3. */
export function clearKGAzureNarrationCache() {
  memory.clear()
  inFlight.clear()
  bytesInMemory = 0
}

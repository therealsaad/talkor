/** Upload ONLY human-reviewed existing WAV/MP3 from v3 manifest.
 * PREVIEW default. --upload requires approval and explicit write opt-in.
 * S3 keys are private, versioned and never overwritten. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { S3Service } from '../services/S3Service'
import { hasExpectedAudioHeader } from '../services/voice-audio-format'
import manifest from './class1-first-day-voice-v3.json'

async function main() {
  const directory = process.argv[2]
  if (!directory || directory.startsWith('--')) throw new Error('Provide the reviewed voice folder')
  const upload = process.argv.includes('--upload')
  if (upload && (process.env.TALKORA_FIRST_DAY_AUDIO_REVIEWED !== 'YES' ||
    process.env.TALKORA_FIRST_DAY_S3_WRITE !== 'YES' || process.env.NODE_ENV === 'production'))
    throw new Error('Upload denied until educator review and explicit developer S3 write approval')
  for (const line of manifest.lines) {
    const file = path.resolve(directory, line.id + '.' + line.format)
    let bytes: Buffer
    try { bytes = await fs.readFile(file) }
    catch { console.log('MISSING', line.id); continue }
    const type = line.format === 'wav' ? 'audio/wav' : 'audio/mpeg'
    if (!hasExpectedAudioHeader(bytes, type)) throw new Error('Invalid audio file: ' + line.id)
    const digest = createHash('sha256').update(bytes).digest('hex')
    const remote = await S3Service.headAudio(line.s3Key)
    if (remote) {
      if (remote.sha256 !== digest) throw new Error('Existing S3 object checksum differs: ' + line.id)
      console.log('VERIFIED', line.id); continue
    }
    if (!upload) { console.log('DRY RUN', line.id, bytes.length); continue }
    await S3Service.putAudio(line.s3Key, bytes, type,
      { provider: line.source, level: 'g01-l01', revision: 'v3', sha256: digest }, '*')
    console.log('UPLOADED', line.id)
  }
}
main().catch(e => { console.error(e instanceof Error ? e.message : 'Upload failed'); process.exitCode = 1 })

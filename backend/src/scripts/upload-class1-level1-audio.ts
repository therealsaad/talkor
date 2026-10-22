/** Upload pre-generated, reviewed AI4Bharat WAV files through the existing S3Service.
 * Usage (from backend): npx tsx src/scripts/upload-class1-level1-audio.ts <directory> --upload
 * Default is dry-run; never synthesizes speech or publishes lessons. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { S3Service } from '../services/S3Service'
import manifest from './class1-level1-ai4bharat-lines.json'

async function main() {
  const directory = process.argv[2]
  if (!directory) throw new Error('Supply directory containing reviewed AI4Bharat .wav files')
  const upload = process.argv.includes('--upload')
  for (const line of manifest.lines) {
    const file = path.join(directory, `${line.id}.wav`)
    const bytes = await fs.readFile(file)
    if (bytes.length < 44 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`Invalid WAV: ${file}`)
    const existing = await S3Service.headAudio(line.s3Key)
    if (existing) { console.log(`EXISTS ${line.s3Key}`); continue }
    if (!upload) { console.log(`DRY RUN ${line.s3Key} (${bytes.length} bytes)`); continue }
    await S3Service.putAudio(line.s3Key, bytes, 'audio/wav', { provider: 'ai4bharat', level: 'g01-l01', revision: 'v1' }, '*')
    console.log(`UPLOADED ${line.s3Key}`)
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })

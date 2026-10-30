import 'dotenv/config'
import { AUDIO_MANIFEST } from '../kg/alphabet-content'
import { LEVEL2_NARRATION } from '../kg/level2-content'
import { LEVEL3_NARRATION } from '../kg/level3-content'
import { LEVEL4_NARRATION } from '../kg/level4-content'
import { LEVEL5_NARRATION } from '../kg/level5-content'
import { getKGAzureNarrationAudio } from '../services/kg-azure-narration.service'

type FixedLine = { level: number; id: string; text: string }
const rows: FixedLine[] = [
  ...AUDIO_MANIFEST
    .filter((line) => line.kind === 'curriculum_static')
    .map((line) => ({ level: 1, id: line.id, text: line.text })),
  ...Object.entries(LEVEL2_NARRATION).map(([id, text]) => ({ level: 2, id, text })),
  ...Object.entries(LEVEL3_NARRATION).map(([id, text]) => ({ level: 3, id, text })),
  ...Object.entries(LEVEL4_NARRATION).map(([id, text]) => ({ level: 4, id, text })),
  ...Object.entries(LEVEL5_NARRATION).map(([id, text]) => ({ level: 5, id, text })),
]

async function main() {
  const required = ['AZURE_SPEECH_KEY', 'AWS_REGION', 'AWS_S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
  const missing = required.filter((name) => !process.env[name]?.trim())
  if (missing.length) throw new Error(`KG Azure/S3 prewarm requires: ${missing.join(', ')}`)

  let succeeded = 0
  let failed = 0
  console.log(`Prewarming ${rows.length} server-reviewed KG Level 1-5 Azure lines into S3`)
  // Avoid a burst of simultaneous Azure syntheses or S3 operations.
  for (let i = 0; i < rows.length; i += 3) {
    await Promise.all(rows.slice(i, i + 3).map(async (line) => {
      try {
        const result = await getKGAzureNarrationAudio(line)
        console.log(`KG${line.level} ${line.id}: ${result.source} (${result.audio.length} bytes)`)
        succeeded++
      } catch (error) {
        console.error(`KG${line.level} ${line.id}: FAILED`, error instanceof Error ? error.message : 'unknown error')
        failed++
      }
    }))
  }
  console.log(`KG Azure warmup: ${succeeded} successful, ${failed} failed`)
  if (failed) process.exitCode = 1
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'KG warmup failed')
  process.exitCode = 1
})

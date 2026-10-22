/** Read-only check for reviewed Class 1 AI4Bharat objects. */
import 'dotenv/config'
import { S3Service } from '../services/S3Service'
import manifest from './class1-level1-ai4bharat-lines.json'

async function main() {
  const results = []
  for (const line of manifest.lines) {
    const remote = await S3Service.headAudio(line.s3Key)
    results.push({
      id: line.id,
      s3Key: line.s3Key,
      exists: Boolean(remote),
      bytes: remote?.contentLength ?? null,
      contentType: remote?.contentType ?? null,
    })
  }
  const available = results.filter((item) => item.exists).length
  console.log(JSON.stringify({
    levelId: manifest.levelId,
    provider: manifest.ttsProvider,
    reviewedStatus: manifest.status,
    available,
    expected: results.length,
    dynamicFallbackRequired: available !== results.length,
    results,
  }, null, 2))
  if (available !== results.length) process.exitCode = 2
}

main().catch(() => {
  console.error('Class 1 audio audit failed. Check the configured S3 credentials and network access.')
  process.exitCode = 1
})

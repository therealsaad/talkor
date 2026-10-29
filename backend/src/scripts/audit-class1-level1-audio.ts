/** Read-only audit of approved First Day (v3) narration objects in private S3.
 * Default checks the ten required Priya English clips. --all-languages adds
 * the optional Hindi/Marathi recordings; --legacy-v2 inspects older assets.
 * Neither S3 object existence nor this tool means educator sign-off.
 */
import 'dotenv/config'
import { S3Service } from '../services/S3Service'
import firstDay from './class1-first-day-voice-v3.json'
import legacy from './class1-level1-ai4bharat-lines.json'

async function main() {
  const legacyMode = process.argv.includes('--legacy-v2')
  const allLanguages = process.argv.includes('--all-languages')
  const manifest = legacyMode ? legacy : firstDay
  const lines = manifest.lines.filter(line => legacyMode || allLanguages || line.language === 'en-IN')
  const results: Array<{ id: string; s3Key: string; exists: boolean; bytes: number | null; contentType: string | null }> = []
  for (const line of lines) {
    const remote = await S3Service.headAudio(line.s3Key)
    results.push({
      id: line.id,
      s3Key: line.s3Key,
      exists: Boolean(remote && remote.contentLength && remote.contentLength >= 256),
      bytes: remote?.contentLength ?? null,
      contentType: remote?.contentType ?? null,
    })
  }
  const ready = results.filter(item => item.exists).length
  console.log(JSON.stringify({
    levelId: manifest.levelId,
    revision: manifest.revision,
    checkedLanguages: legacyMode || allLanguages ? 'all' : 'en-IN (required)',
    present: ready,
    expected: results.length,
    assetsPresent: ready === results.length,
    educatorReviewVerified: false,
    note: 'Read-only S3 availability check. Teacher approval must be verified separately. No content is published or changed.',
    results,
  }, null, 2))
  if (ready !== results.length) process.exitCode = 2
}

main().catch(() => {
  console.error('Class 1 voice audit failed. Check S3 credentials and private bucket permissions.')
  process.exitCode = 1
})

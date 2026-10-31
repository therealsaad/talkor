import 'dotenv/config'
import { getKGAzureNarrationAudio } from '../services/kg-azure-narration.service'
import { assertKGPrewarmApplyApproval, getKGPrewarmPlan } from './kg-azure-prewarm-plan'

/**
 * Default is a zero-cost planning report. The former command immediately
 * incurred Azure/S3 operations whenever keys were configured, contrary to the
 * mandatory school approval gate. --apply is an explicit reviewed operator step.
 */
async function main() {
  const arguments_ = process.argv.slice(2)
  if (arguments_.some(value => !['--dry-run', '--apply'].includes(value)) ||
      (arguments_.includes('--dry-run') && arguments_.includes('--apply'))) {
    throw new Error('Usage: pnpm run kg:azure:warm [-- --dry-run | -- --apply]')
  }

  const plan = getKGPrewarmPlan()
  const levels = Object.fromEntries(
    [1, 2, 3, 4, 5].map(level => [level, plan.lines.filter(line => line.level === level).length]),
  )
  const apply = arguments_.includes('--apply')
  // Never print secrets or the actual child-facing lines into CI logs.
  console.log(JSON.stringify({
    mode: apply ? 'approved-apply' : 'DRY_RUN_NO_PROVIDER_CALLS',
    contentSha256: plan.manifestSha256,
    fixedLineCount: plan.lines.length,
    levels,
    profile: plan.voiceProfile,
  }))
  if (!apply) {
    console.log('DRY RUN: no Azure synthesis, S3 reads/writes or credential access.')
    console.log('Teacher/rights review and an exact manifest/profile digest are required before --apply.')
    return
  }

  // Failure to satisfy any gate happens BEFORE the first provider operation.
  assertKGPrewarmApplyApproval(plan.manifestSha256)
  let succeeded = 0
  let failed = 0
  for (let i = 0; i < plan.lines.length; i += 3) {
    await Promise.all(plan.lines.slice(i, i + 3).map(async line => {
      try {
        const result = await getKGAzureNarrationAudio(line)
        if (!result.storedInS3) throw new Error('S3 persistence unavailable')
        console.log(`KG${line.level} ${line.id}: ${result.source} (${result.audio.length} bytes)`)
        succeeded++
      } catch (error) {
        console.error(`KG${line.level} ${line.id}: FAILED`,
          error instanceof Error ? error.message : 'unknown error')
        failed++
      }
    }))
  }
  console.log(`KG Azure warmup: ${succeeded} successful, ${failed} failed`)
  if (failed) process.exitCode = 1
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : 'KG warmup failed')
  process.exitCode = 1
})

import { runKGLevel1Audio } from './kg-level1-audio'

/** Compatibility entry point; the shared pipeline owns version safety and verification. */
const passthrough = process.argv.slice(2).filter((arg) => arg === '--dry-run')
runKGLevel1Audio(['--upload', ...passthrough]).catch((error) => {
  console.error(`KG audio upload stopped: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})

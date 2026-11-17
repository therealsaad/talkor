/** Opt-in LOCAL diagnostic only. Never run in CI, school sessions, or startup.
 * Runs exactly two short paid Azure TTS requests with fixed non-student words.
 * Never saves audio or prints keys, SSML, transcript, child data or upstream bodies.
 * From backend/: pnpm exec tsx -r dotenv/config src/scripts/check-azure-tts.ts --probe
 */
import 'dotenv/config'
import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'

const help = 'Run from backend with: pnpm exec tsx -r dotenv/config src/scripts/check-azure-tts.ts --probe (two short billable Azure TTS requests; no audio saved)'

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== '--probe') {
    console.log(help)
    return
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This diagnostic is restricted to nonproduction environments')
  }
  if (!process.env.AZURE_SPEECH_KEY?.trim()) {
    throw new Error('AZURE_SPEECH_KEY is missing in backend/.env')
  }

  const azure = new AzureVoiceProvider()
  const sample = async (label: string, text: string, poemRecitation: boolean) => {
    try {
      const response = await azure.synthesizeStream(text, {
        class1Lesson: true, language: 'en-IN', poemRecitation,
      })
      let bytes = 0
      const reader = response.body.getReader()
      try {
        while (true) {
          const item = await reader.read()
          if (item.done) break
          bytes += item.value.byteLength
          if (bytes > 2 * 1024 * 1024) throw new Error('Unexpectedly large diagnostic audio')
        }
      } finally {
        reader.releaseLock()
      }
      if (bytes < 256) throw new Error('Azure returned insufficient audio')
      console.log(label + ': PASS (Azure returned non-empty audio; not saved)')
      return true
    } catch {
      console.error(label + ': FAIL (see redacted Azure HTTP status in server/provider logs)')
      return false
    }
  }

  // An isolated ordinary line tells us whether basic region/key/voice/format
  // works before we draw conclusions about the multiline poem's SSML.
  if (!await sample('PLAIN_ENGLISH', 'Hello! I am Miss Julie.', false)) {
    console.error('Check the Azure Speech resource region/key, configured neural voice and output format. The other local ports being open does not confirm any of these.')
    process.exitCode = 1
    return
  }
  if (!await sample('FIRST_DAY_POEM', 'See me skip.\nSee me run.', true)) {
    console.error('Basic Azure works but the poem failed. Inspect the deployed SSML revision and voice settings.')
    process.exitCode = 1
    return
  }
  console.log('Azure accepts both fixed samples. Now retry the authenticated Class 1 lesson; this does NOT certify actual browser playback.')
}

main().catch(() => {
  console.error('The local Azure diagnostic could not start; check backend development environment and dependencies.')
  process.exitCode = 1
})

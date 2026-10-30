/** Read-only Class 1 service doctor; no paid speech, Mongo writes or secret logs.
 * pnpm exec tsx -r dotenv/config src/scripts/doctor-class1-first-day.ts
 */
import { parsePriyaHealth, checkPriyaHealth, formatPriyaHealth } from '../services/priya-tts-health'
import { isAllowedClass1IntroSource, chooseClass1IntroSource } from './class1-first-day-intro-url'

const BASE = [
  { name: 'node-5000', url: 'http://127.0.0.1:5000/health' },
  { name: 'python-voice-8001', url: (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '') + '/health' },
  { name: 'python-qwen-8002', url: (process.env.TALKORA_CLASS1_AI_URL || 'http://127.0.0.1:8002').replace(/\/$/, '') + '/health' },
  { name: 'ollama-11434', url: 'http://127.0.0.1:11434/api/tags' },
]
async function main() {
  const chosenIntro = chooseClass1IntroSource(
    process.env.TALKORA_FIRST_DAY_INTRO_URL || process.env.NEXT_PUBLIC_TALKORA_CLASS1_INTRO_URL,
    process.env.TALKORA_FIRST_DAY_USE_BUNDLED_INTRO === 'YES',
  )
  const flags = {
    'Class 1 Qwen override': process.env.TALKORA_CLASS1_QWEN_PILOT === 'true',
    'Class 1 draft access': process.env.TALKORA_CLASS1_STUDENT_DEMO === 'true',
    'Sarvam selected': String(process.env.SPEECH_PROVIDER || '').toLowerCase() === 'sarvam',
    'Azure selected': String(process.env.CONVERSATION_VOICE_PROVIDER || '').toLowerCase() === 'azure',
    'Sarvam bilingual auto detect': ['unknown', 'auto', ''].includes(String(process.env.SARVAM_STT_LANGUAGE || '').toLowerCase()),
    'Azure credential exists': Boolean(process.env.AZURE_SPEECH_KEY),
    'Sarvam credential exists': Boolean(process.env.SARVAM_API_KEY),
    'First Day intro source configured (NOT review)': isAllowedClass1IntroSource(chosenIntro),
    'Developer has reviewed First Day intro': process.env.TALKORA_FIRST_DAY_INTRO_REVIEWED === 'YES',
  }
  for (const [key, value] of Object.entries(flags)) console.log(value ? 'OK  ' + key : 'CHECK ' + key)
  for (const item of BASE) {
    try {
      const response = await fetch(item.url, { signal: AbortSignal.timeout(3000) })
      if (item.name === 'python-voice-8001' && response.ok) {
        const health = parsePriyaHealth(await response.json())
        const blockers = checkPriyaHealth(health)
        console.log((blockers.length ? 'FAIL ' : 'PASS ') + item.name + ' (HTTP ' + response.status + ')')
        console.log(formatPriyaHealth(health))
      } else {
        console.log((response.ok ? 'PASS ' : 'FAIL ') + item.name + ' (HTTP ' + response.status + ')')
      }
    } catch { console.log('OFFLINE ' + item.name) }
  }
  console.log('NOTE: HTTP health does not verify speaker output, account billing, model quality or microphone permission.')
  console.log('NOTE: 8001 is a local narration generator/last fallback, not the primary Azure dynamic TTS path.')
  console.log('NOTE: Python 8002 main must include the separate First Day PR for bilingual school-scene coaching.')
}
main().catch(() => { console.error('Class 1 offline doctor failed'); process.exitCode = 1 })

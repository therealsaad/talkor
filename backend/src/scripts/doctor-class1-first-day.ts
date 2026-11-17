/** Read-only Class 1 service doctor; no paid speech, Mongo writes or secret logs.
 * pnpm exec tsx -r dotenv/config src/scripts/doctor-class1-first-day.ts
 */
import { parsePriyaHealth, checkPriyaHealth, formatPriyaHealth } from '../services/priya-tts-health'
import { isAllowedClass1IntroSource, chooseClass1IntroSource } from './class1-first-day-intro-url'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'
import { CLASS1_DEMO_VERSION, CLASS1_DEMO_LESSON_FILTER,
  CLASS1_FIRST_DAY_POEM_REVISION, CLASS1_FIRST_DAY_PARALLEL_REVISION } from '../services/class1-demo-access'

const BASE = [
  { name: 'node-5000', url: 'http://127.0.0.1:5000/health' },
  { name: 'python-voice-8001', url: (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '') + '/health' },
  { name: 'python-qwen-8002', url: (process.env.TALKORA_CLASS1_AI_URL || 'http://127.0.0.1:8002').replace(/\/$/, '') + '/health' },
  { name: 'ollama-11434', url: 'http://127.0.0.1:11434/api/tags' },
]
/** Read the actual Class 1 Level 1 status. The v4 poem is only a separate
 * rehearsal; its absence must not be reported as a v3 release failure. */
async function inspectClass1ReleaseDatabase() {
  try {
    await mongoose.connect(env.mongodbUri, {
      autoIndex: false, serverSelectionTimeoutMS: 5000,
    })
    const klass = await CurriculumClass.findOne({
      grade: 1, status: { $in: ['draft', 'active'] },
    }).select('_id status').lean()
    const level = klass && await Level.findOne({
      classId: klass._id, number: 1, curriculumVersion: CLASS1_DEMO_VERSION,
    }).select('_id status availability').lean()
    if (!level) {
      console.log('BLOCKED class1-first-day-v3: canonical Level 1 is missing from this MongoDB database')
      console.log('NEXT: run stage-class1-first-day-release.ts --verify-media (read-only)')
      return
    }
    const v3 = await Lesson.find({
      levelId: level._id, 'settings.lessonPlanRevision': CLASS1_FIRST_DAY_PARALLEL_REVISION,
      'settings.experienceId': 'g01-l01',
    }).select('_id status').lean()
    const v3Active = v3.length === 1 ? await Activity.countDocuments({
      lessonId: v3[0]._id, status: 'active', type: 'CONVERSATION',
      activityKey: /^class1-l01-v3-/,
    }) : 0
    const v3Draft = v3.length === 1 ? await Activity.countDocuments({
      lessonId: v3[0]._id, status: 'draft', type: 'CONVERSATION',
      activityKey: /^class1-l01-v3-/,
    }) : 0
    if (klass?.status === 'active' && level.status === 'active' &&
        level.availability === 'PUBLISHED' && v3.length === 1 &&
        v3[0].status === 'active' && v3Active === 10) {
      console.log('PUBLISHED class1-first-day-v3: Class 1 Level 1 and 10 activities active in MongoDB')
      console.log('CHECK: real media and live student tests must pass separately')
    } else if (level.status === 'draft' && level.availability === 'UPCOMING' &&
               v3.length === 1 && v3[0].status === 'draft' && v3Draft === 10) {
      console.log('STAGED class1-first-day-v3: ten draft scenes found, NOT student-published')
      console.log('NEXT: run publish-class1-level1.ts --verify-media and complete school approval')
    } else {
      console.log('BLOCKED class1-first-day-v3: no complete published/staged ten-scene lesson; ' +
        'lessons=' + v3.length + ', active=' + v3Active + ', draft=' + v3Draft)
      console.log('NEXT: inspect stage-class1-first-day-release.ts --verify-media')
    }

    const poem = await Lesson.find({
      levelId: level._id, ...CLASS1_DEMO_LESSON_FILTER,
      'settings.lessonPlanRevision': CLASS1_FIRST_DAY_POEM_REVISION,
    }).select('_id').lean()
    const poemDraftActivities = poem.length === 1 ? await Activity.countDocuments({
      lessonId: poem[0]._id, activityKey: /^class1-l01-v4-poem-/,
      status: 'draft', type: 'CONVERSATION', aiEnabled: true, allowMic: true,
    }) : 0
    console.log('INFO class1-poem-v4: draft lesson candidates=' + poem.length +
      ', draft activities=' + poemDraftActivities + '/6 (NOT the published v3 release)')
  } catch {
    console.log('CHECK class1-first-day-v3: MongoDB could not be inspected; no publication claim')
  } finally {
    await mongoose.disconnect().catch(() => undefined)
  }
}

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
  await inspectClass1ReleaseDatabase()
  console.log('NOTE: HTTP health does not verify speaker output, account billing, model quality or microphone permission.')
  console.log('NOTE: 8001 is a local narration generator/last fallback, not the primary Azure dynamic TTS path.')
  console.log('NOTE: Python 8002 main must include the separate First Day PR for bilingual school-scene coaching.')
}
main().catch(() => { console.error('Class 1 offline doctor failed'); process.exitCode = 1 })

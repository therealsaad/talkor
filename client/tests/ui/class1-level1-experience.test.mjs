import assert from 'node:assert/strict'
import { access, readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'

const read = (file) => readFile(new URL(file, import.meta.url), 'utf8')
const activities = await read('../../features/lessons/grades/class-01/level-01/activities.ts')
const studentRoute = await read('../../app/student/lesson/[id]/page.tsx')
const lessonEngine = await read('../../components/lessons/lesson-experience.tsx')
const lessonWorld = await read('../../components/student/lesson/lesson-world.tsx')
const intro = await read('../../components/student/lesson/class1-lesson-intro.tsx')
const config = await read('../../features/lessons/grades/class-01/level-01/config.ts')
const draftSeed = await read('../../../backend/src/scripts/prepare-class1-l01-draft.ts')
const voice = await read('../../services/voice-service.ts')
const backendFastRoute = await read('../../../backend/src/services/student-lesson-fast.service.ts')
const backendVoice = await read('../../../backend/src/services/voice.service.ts')
const backendDemoAccess = await read('../../../backend/src/services/class1-demo-access.ts')

test('Class 1 Level 1 retains seven tiny-word foundations then adds three Balbharati bridge activities', () => {
  const keys = activities.match(/id: 'class1-l01-[^']+'/g) || []
  assert.equal(keys.length, 10)
  assert.match(activities, /class1-l01-repeat-at/)
  assert.deepEqual(keys.slice(-3), [
    "id: 'class1-l01-say-walk'",
    "id: 'class1-l01-find-school'",
    "id: 'class1-l01-school-talk'",
  ])
  assert.match(config, /2025, reprint 2026/)
  assert.match(config, /"sourcePages": \[1\]/)
  assert.match(draftSeed, /STOP_STUDENT_PROGRESS_EXISTS/)
  assert.match(backendFastRoute, /activityKey: \/\^class1-l01-\//)
  assert.match(backendFastRoute, /experienceId: isClass1Demo/)
})

test('first visit requires the real 90-second story; no fake audio or in-app skip', () => {
  assert.match(studentRoute, /lesson\.completedActivityIds\.length === 0/)
  assert.match(studentRoute, /class1-g01-l01/)
  assert.match(lessonEngine, /<Class1LessonIntro/)
  assert.match(intro, /miss-julie-first-day-intro\.mp4/)
  assert.match(intro, /MIN_DURATION_SECONDS = 87/)
  assert.match(intro, /REQUIRED_WATCH_SECONDS = 85/)
  assert.match(intro, /requestFullscreen/)
  assert.match(intro, /muted = false/)
  assert.doesNotMatch(intro, /SkipForward|onSkip|skipIntro/)
  assert.match(intro, /lesson cannot start without it/)
})

test('the authenticated student route selects the Class 1 meadow without changing KG', async () => {
  const image = new URL('../../public/lessons/class-01/level-01/two-letter-word-meadow.webp', import.meta.url)
  await access(image)
  assert.ok((await stat(image)).size > 100_000)
  assert.match(studentRoute, /lesson\.experienceId === 'g01-l01'/)
  assert.match(studentRoute, /two-letter-word-meadow\.webp/)
  assert.match(studentRoute, /lesson\.grade === 0/)
  assert.match(lessonWorld, /requestedBackground/)
  assert.match(lessonEngine, /backgroundSrc=\{backgroundSrc\}/)
})

test('lesson narration prefers authorized S3 audio and Qwen turns remain dynamic', () => {
  assert.match(lessonEngine, /staticAudioActivityId: activity\.id/)
  assert.match(voice, /activityId \? \{ activityId \} : \{\}/)
  assert.match(backendVoice, /provider: 'ai4bharat-s3'/)
  assert.match(backendVoice, /using dynamic voice fallback/)
  assert.match(backendVoice, /access\.isKGPilot \|\| access\.isClass1Demo/)
})

test('the completion scene exposes replayable spoken homework', () => {
  assert.match(studentRoute, /Homework: say/)
  assert.match(lessonEngine, /Hear homework/)
  assert.match(studentRoute, /Your progress is saved/)
})

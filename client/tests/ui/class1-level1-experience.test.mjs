import assert from 'node:assert/strict'
import { access, readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'

const read = (file) => readFile(new URL(file, import.meta.url), 'utf8')
const activities = await read('../../features/lessons/grades/class-01/level-01/activities.ts')
const studentRoute = await read('../../app/student/lesson/[id]/page.tsx')
const lessonEngine = await read('../../components/lessons/lesson-experience.tsx')
const lessonWorld = await read('../../components/student/lesson/lesson-world.tsx')
const mapPage = await read('../../app/student/levels/page.tsx')
const registry = await read('../../features/lessons/registry.ts')
const immersiveStage = await read('../../components/student/lesson/immersive-lesson-stage.tsx')
const intro = await read('../../features/lessons/grades/class-01/level-01/Class1LessonIntro.tsx')
const homework = await read('../../features/lessons/grades/class-01/level-01/Class1SpokenHomework.tsx')
const config = await read('../../features/lessons/grades/class-01/level-01/config.ts')
const draftSeed = await read('../../../backend/src/scripts/prepare-class1-l01-draft.ts')
const voice = await read('../../services/voice-service.ts')
const backendFastRoute = await read('../../../backend/src/services/student-lesson-fast.service.ts')
const backendVoice = await read('../../../backend/src/services/voice.service.ts')
const backendDemoAccess = await read('../../../backend/src/services/class1-demo-access.ts')

test('Class 1 Level 1 retains seven tiny-word foundations then adds three Balbharati bridge activities', () => {
  const keys = activities.match(/id: 'class1-l01-[^']+'/g) || []
  assert.equal(keys.length, 10)
  assert.match(activities, /class1-l01-review-little-words/)
  for (const word of ['am', 'an', 'at', 'in', 'is', 'it', 'on', 'up']) assert.match(draftSeed, new RegExp(`'${word}'`))
  assert.deepEqual(keys.slice(-3), [
    "id: 'class1-l01-say-walk'",
    "id: 'class1-l01-find-school'",
    "id: 'class1-l01-school-talk'",
  ])
  assert.match(config, /2025, reprint 2026/)
  assert.match(config, /"sourcePages": \[1\]/)
  assert.match(draftSeed, /class1-l01-legacy-/)
  assert.match(draftSeed, /savedAttemptsPreserved: true/)
  assert.match(backendFastRoute, /CLASS1_DEMO_ACTIVITY_FILTER/)
  assert.match(backendDemoAccess, /activityKey: \/\^class1-l01-\//)
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
  assert.match(intro, /Fullscreen is an enhancement/)
  assert.match(intro, /pauseWhenHidden/)
  assert.match(intro, /pauseWhenFullscreenEnds/)
  assert.match(intro, /Try loading again/)
  assert.doesNotMatch(intro, /SkipForward|onSkip|skipIntro/)
  assert.match(intro, /video could not load/)
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
  assert.match(studentRoute, /experienceId=\{lesson\.experienceId\}/)
  assert.match(immersiveStage, /data-experience-id="g01-l01"/)
})

test('the Class 1 map keeps ten overlays and opens the backend lesson id through the existing registry', async () => {
  const class1Worlds = mapPage.match(/const CLASS1_WORLDS: World\[\] = \[([\s\S]*?)\n\]/)?.[1] || ''
  assert.equal([...class1Worlds.matchAll(/number:\s*\d+/g)].length, 10)
  assert.match(mapPage, /CLASS1_MAP_BACKGROUND/)
  assert.match(mapPage, /student\?\.grade !== 1 \? <motion\.div/)
  const class1Map = new URL('../../public/lessons/class-01/level-01/map.png', import.meta.url)
  await access(class1Map)
  assert.ok((await stat(class1Map)).size > 1_000_000)
  assert.match(mapPage, /targetLesson\?\.id/)
  assert.match(mapPage, /`\/student\/lesson\/\$\{targetLesson\.id\}`/)
  assert.match(registry, /'g01-l01': \(\) => import\('\.\/grades\/class-01\/level-01'\)/)
  await access(new URL('../../public/talkora/adventure/talkora-world-map.png', import.meta.url))
  assert.match(immersiveStage, /miss-julie-animations\/transparent\//)
  assert.match(immersiveStage, /'celebrating'/)
  assert.match(immersiveStage, /has-transparent-animation/)
  await assert.rejects(access(new URL('../../components/student/lesson/class1-lesson-intro.tsx', import.meta.url)))
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
  assert.match(homework, /useAudioRecorder\(\{ maxDurationMs: 12000/)
  assert.match(homework, /voiceService\.transcribeAudio/)
  assert.match(homework, /voiceService\.startSession\(\{ lessonId, activityId \}\)/)
  assert.match(homework, /saveHomePractice\([\s\S]*'class1-first-day'/)
  assert.doesNotMatch(homework, /activityComplete|xpAwarded|completeLocalActivity|submitAttempt/)
  assert.match(lessonEngine, /Hear homework/)
  assert.match(lessonEngine, /experienceId === 'g01-l01' && !homeworkSaved/)
  assert.match(lessonEngine, /homeworkMessage\.replace\(\/\^Homework:/)
  assert.match(studentRoute, /Your progress is saved/)
})

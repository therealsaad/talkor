import assert from 'node:assert/strict'
import { access, readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'

const read = (file) => readFile(new URL(file, import.meta.url), 'utf8')
const activities = await read('../../features/lessons/grades/class-01/level-01/activities.ts')
const studentRoute = await read('../../app/student/lesson/[id]/page.tsx')
const lessonEngine = await read('../../components/lessons/lesson-experience.tsx')
const lessonWorld = await read('../../components/student/lesson/lesson-world.tsx')
const voice = await read('../../services/voice-service.ts')
const backendFastRoute = await read('../../../backend/src/services/student-lesson-fast.service.ts')
const backendVoice = await read('../../../backend/src/services/voice.service.ts')

test('Class 1 Level 1 has one authoritative seven-activity experience', () => {
  const keys = activities.match(/id: 'class1-l01-[^']+'/g) || []
  assert.equal(keys.length, 7)
  assert.match(activities, /class1-l01-repeat-at/)
  assert.match(backendFastRoute, /activityKey: \/\^class1-l01-\//)
  assert.match(backendFastRoute, /experienceId: isClass1Demo/)
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

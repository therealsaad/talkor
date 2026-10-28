import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  canCompleteIntroVideo,
  createSubmissionGate,
  LEVEL4_LETTERS,
  microphoneFailureMessage,
  resolveLevel4Attempt,
} from '../features/lessons/grades/kg/level-04/level4-flow.ts'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')
const configSource = await read('features/lessons/grades/kg/level-04/config.ts')
const lesson = await read('features/lessons/grades/kg/level-04/LevelExperience.tsx')
const studentIntro = await read('components/student/lesson/kg-lesson-intro.tsx')
const routes = await read('app/school/kg-preview/level-4/page.tsx')
const gardenMap = await read('features/lessons/grades/kg/level-01/components/LevelMap.tsx')
const catalog = JSON.parse(await readFile(new URL('../../backend/src/curriculum/level-design-manifest.json', import.meta.url), 'utf8'))
const config = JSON.parse(configSource.match(/export const config = (\{[\s\S]*\}) as const satisfies LevelDesignConfig\s*$/)?.[1] || 'null')

test('KG Level 4 remains an unpublished staff preview with a matching catalog entry', async () => {
  const entry = catalog.find((item) => item.id === 'g00-l04')
  assert.ok(entry)
  assert.equal(config.title, entry.title)
  assert.equal(config.experience.themeId, entry.designTheme)
  assert.equal(config.editorialStatus, 'draft')
  assert.equal(config.studentPlayable, false)
  assert.equal(config.staffOnlyPreview, true)
  assert.equal(config.learningPolicy.introRequired, true)
  assert.equal(config.learningPolicy.introMustComplete, true)
  await access(new URL('../public/lessons/kg/level-04/animal-sounds-intro.mp4', import.meta.url))
  assert.match(routes, /<SchoolShell/)
  assert.match(routes, /<Level4Experience key=\{step\} preview/)
  assert.match(gardenMap, /level === \(preview \? previewLevel : 1\)/)
  assert.match(gardenMap, /aria-label=\{`Preview \$\{previewLabel\}`\}/)
})

test('Q–V advances on correct speech only and submits one microphone attempt', () => {
  assert.deepEqual(LEVEL4_LETTERS, ['Q', 'R', 'S', 'T', 'U', 'V'])
  for (let index = 0; index < LEVEL4_LETTERS.length - 1; index++) {
    assert.deepEqual(resolveLevel4Attempt(LEVEL4_LETTERS[index], 'correct'), {
      letter: LEVEL4_LETTERS[index + 1], complete: false, retry: false,
    })
  }
  assert.deepEqual(resolveLevel4Attempt('V', 'correct'), { letter: 'V', complete: true, retry: false })
  for (const outcome of ['incorrect', 'unclear']) {
    assert.deepEqual(resolveLevel4Attempt('S', outcome), { letter: 'S', complete: false, retry: true })
  }
  const claim = createSubmissionGate()
  assert.equal(claim(), true)
  assert.equal(claim(), false)
  assert.match(microphoneFailureMessage({ name: 'NotAllowedError' }), /allow microphone access/i)
  assert.match(lesson, /onUnavailable: \(\) => \{ vadAvailable = false \}/)
  assert.match(lesson, /recorder\.onerror = \(\) => \{/)
})

test('intro cannot be skipped or silently autoplayed, and KG Level 1 video path survives', () => {
  assert.equal(canCompleteIntroVideo({ ended: true, duration: 70, currentTime: 70 }, 70), true)
  assert.equal(canCompleteIntroVideo({ ended: false, duration: 70, currentTime: 70 }, 70), false)
  assert.equal(canCompleteIntroVideo({ ended: true, duration: 70, currentTime: 10 }, 10), false)
  assert.match(lesson, /useState<VideoState>\('ready'\)/)
  assert.match(lesson, /onClick=\{\(\) => void startVideo\(\)\}/)
  assert.doesNotMatch(lesson, /video\.muted = true/)
  assert.match(lesson, /canCompleteIntroVideo\(video, maximumTimeRef\.current\)/)
  assert.match(studentIntro, /const KG_MEDIA_ROOT = '\/lessons\/kg'/)
  assert.match(studentIntro, /const FULL_VIDEO = `\$\{KG_MEDIA_ROOT\}\/videos\/fullkg\.mp4`/)
  assert.doesNotMatch(studentIntro, /LEVEL_4_LESSON_KEY/)
})

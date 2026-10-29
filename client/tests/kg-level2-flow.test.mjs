import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  canCompleteIntroVideo,
  createSubmissionGate,
  LEVEL2_INTRO_COMPLETED_KEY,
  LEVEL2_LETTERS,
  microphoneFailureMessage,
  resolveLevel2Attempt,
} from '../features/lessons/grades/kg/level-02/level2-flow.ts'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')
const intro = await read('features/lessons/grades/kg/level-02/PreviewIntro.tsx')
const activity = await read('features/lessons/grades/kg/level-02/LevelExperience.tsx')
const level2Styles = await read('features/lessons/grades/kg/level-02/level-02.css')
const service = await read('features/lessons/grades/kg/level-02/services/kg-level2-preview-service.ts')
const introRoute = await read('app/school/kg-preview/level-2/page.tsx')
const activityRoute = await read('app/school/kg-preview/level-2/[letter]/page.tsx')
const landing = await read('app/school/kg-preview/page.tsx')
const config = await read('features/lessons/grades/kg/level-02/config.ts')
const assets = JSON.parse(await read('features/lessons/grades/kg/level-02/assets.json'))
const registry = await read('features/lessons/registry.ts')
const studentRoute = await read('app/student/kg/page.tsx')
const level1 = await read('features/lessons/grades/kg/level-01/LevelExperience.tsx')
const level3Route = await read('app/school/kg-preview/level-3/page.tsx')
const level3Flow = await read('features/lessons/grades/kg/level-03/level3-flow.ts')

test('Level 2 uses the verified E–J video and remains a student-locked draft', async () => {
  assert.equal(assets.introVideo, '/lessons/kg/level-02/level-2-e-to-j.mp4')
  await access(new URL('../public/lessons/kg/level-02/level-2-e-to-j.mp4', import.meta.url))
  assert.match(intro, /INTRO_VIDEO = '\/lessons\/kg\/level-02\/level-2-e-to-j\.mp4'/)
  assert.match(config, /"title": "Letters E to J"/)
  assert.match(config, /"studentPlayable": false/)
  assert.match(config, /"staffOnlyPreview": true/)
  assert.match(registry, /'g00-l02': \(\) => import\('\.\/grades\/kg\/level-02'\)/)
  assert.match(studentRoute, /level=\{1\}/)
})

test('intro playback requires a user action, resists seeking, and only completes after genuine viewing', () => {
  assert.match(intro, /onClick=\{\(\) => void startVideo\(\)\}/)
  assert.match(intro, /requestFullscreen/)
  assert.match(intro, /onSeeking=/)
  assert.match(intro, /onRateChange=/)
  assert.match(intro, /onEnded=/)
  assert.match(intro, /Try video again/)
  assert.equal(canCompleteIntroVideo({ ended: true, duration: 60, currentTime: 60 }, 60), true)
  assert.equal(canCompleteIntroVideo({ ended: false, duration: 60, currentTime: 60 }, 60), false)
  assert.equal(canCompleteIntroVideo({ ended: true, duration: 60, currentTime: 10 }, 60), false)
  assert.equal(canCompleteIntroVideo({ ended: true, duration: Number.NaN, currentTime: 60 }, 60), false)
})

test('the Level 2 route uses its one-use marker and starts the lesson at E', () => {
  assert.equal(LEVEL2_INTRO_COMPLETED_KEY, 'talkora:kg-level2-intro-completed')
  assert.match(introRoute, /sessionStorage\.setItem\(LEVEL2_INTRO_COMPLETED_KEY, 'complete'\)/)
  assert.match(introRoute, /router\.push\('\/school\/kg-preview\/level-2\/E'\)/)
  assert.match(activityRoute, /sessionStorage\.getItem\(LEVEL2_INTRO_COMPLETED_KEY\) === 'complete'/)
  assert.match(activityRoute, /sessionStorage\.removeItem\(LEVEL2_INTRO_COMPLETED_KEY\)/)
  assert.match(activityRoute, /letter === 'E'/)
  assert.match(activityRoute, /router\.replace\('\/school\/kg-preview\/level-2'\)/)
  assert.match(activity, /useState<Level2Letter>\('E'\)/)
  assert.match(landing, /level\.level === 2[\s\S]*?\/school\/kg-preview\/level-2/)
  assert.notEqual(LEVEL2_INTRO_COMPLETED_KEY, 'talkora:kg-level3-intro-completed')
  assert.doesNotMatch(activity, /LEVEL3_LETTERS|kg-level3-preview|K–P/)
})

test('Level 2 displays the confirmed letter-word-picture mappings', async () => {
  for (const [letter, word] of Object.entries({ E: 'elephant', F: 'fish', G: 'goat', H: 'hat', I: 'igloo', J: 'jam' })) {
    assert.match(activity, new RegExp(`${letter}: '/kg/pictures/level-2/${word}\\.svg'`))
    await access(new URL(`../public/kg/pictures/level-2/${word}.svg`, import.meta.url))
  }
  assert.match(activity, /<LetterWordPicture/)
  assert.doesNotMatch(activity, /letter\.toLowerCase|is for/)
})

test('Level 2 E–J share bounded layout rules and complete SVG assets', async () => {
  assert.match(level2Styles, /grid-template-columns: minmax\(112px, 0\.48fr\) minmax\(190px, 0\.9fr\) minmax\(240px, 1fr\)/)
  assert.match(level2Styles, /white-space: nowrap/)
  assert.match(level2Styles, /object-fit: contain/)
  assert.match(level2Styles, /\/lessons\/kg\/jungle-background\.png/)
  for (const word of ['elephant', 'fish', 'goat', 'hat', 'igloo', 'jam']) {
    const svg = await read(`public/kg/pictures/level-2/${word}.svg`)
    assert.match(svg, /viewBox="0 0 (240 180|320 240)"/)
    assert.doesNotMatch(svg, /<clipPath|clip-path:/)
  }
})

test('only correct E–J attempts advance; incorrect and unclear responses retry', () => {
  assert.deepEqual(LEVEL2_LETTERS, ['E', 'F', 'G', 'H', 'I', 'J'])
  let current = 'E'
  for (const next of LEVEL2_LETTERS.slice(1)) {
    assert.deepEqual(resolveLevel2Attempt(current, 'correct'), { letter: next, complete: false, retry: false })
    current = next
  }
  assert.deepEqual(resolveLevel2Attempt('J', 'correct'), { letter: 'J', complete: true, retry: false })
  for (const outcome of ['incorrect', 'unclear']) {
    assert.deepEqual(resolveLevel2Attempt('G', outcome), { letter: 'G', complete: false, retry: true })
  }
  assert.match(activity, /const noSpeech = \(!speechDetected && vadAvailable\) \|\| blob\.size < 800/)
  assert.match(activity, /transition\.retry\)[\s\S]*?setAttemptCycle\(\(cycle\) => cycle \+ 1\)/)
  assert.match(activity, /transition\.complete[\s\S]*?setPhase\('finished'\)/)
  assert.match(activity, /The connection was interrupted/)
  assert.match(activity, /Try again/)
  assert.match(activity, /releaseMicrophone/)
  assert.match(activity, /controller\.abort\(\)/)
})

test('microphone recordings are submitted to the Level 2 authenticated service only', () => {
  const gate = createSubmissionGate()
  assert.equal(gate(), true)
  assert.equal(gate(), false)
  assert.match(activity, /requestKGMicrophone/)
  assert.match(activity, /watchVoiceActivity/)
  assert.match(activity, /new MediaRecorder/)
  assert.match(activity, /createSubmissionGate\(\)/)
  assert.match(activity, /service\.submitAttempt/)
  assert.match(service, /\/kg-level2-preview\/attempt/)
  assert.match(service, /\/kg-level2-preview\/narration\/\$\{id\}/)
  assert.doesNotMatch(service, /kg-level3-preview/)
  assert.doesNotMatch(activity, /outcome:\s*'correct'|setPhase\('finished'\).*recording/)
})

test('Level 1 and Level 3 routes, video marker, and student boundary remain separate', () => {
  assert.match(level1, /INTRO_VIDEO = '\/lessons\/kg\/videos\/fullkg\.mp4'/)
  assert.match(level3Route, /LEVEL3_INTRO_COMPLETED_KEY/)
  assert.match(level3Flow, /talkora:kg-level3-intro-completed/)
  assert.match(landing, /\/school\/kg-preview\/level-1/)
  assert.match(landing, /\/school\/kg-preview\/level-3/)
  assert.match(config, /"studentPlayable": false/)
})

test('microphone permission errors are recoverable and specific', () => {
  assert.match(microphoneFailureMessage({ name: 'NotAllowedError' }), /allow microphone access/i)
  assert.match(microphoneFailureMessage({ name: 'NotFoundError' }), /could not find a microphone/i)
})

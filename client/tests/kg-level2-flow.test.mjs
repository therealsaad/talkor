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
const studentExperience = await read('features/lessons/grades/kg/level-02/StudentExperience.tsx')
const completedReview = await read('features/lessons/grades/kg/review/CompletedLevelReview.tsx')
const level2World = await read('features/lessons/grades/kg/level-02/Level2JungleWorld.tsx')
const level2Styles = await read('features/lessons/grades/kg/level-02/level-02.css')
const letterWordPicture = await read('features/lessons/grades/kg/components/LetterWordPicture.tsx')
const sharedWorldStyles = await read('features/lessons/grades/kg/components/kindergarten-world.css')
const service = await read('features/lessons/grades/kg/level-02/services/kg-level2-preview-service.ts')
const introRoute = await read('app/school/kg-preview/level-2/page.tsx')
const activityRoute = await read('app/school/kg-preview/level-2/[letter]/page.tsx')
const landing = await read('app/school/kg-preview/page.tsx')
const dashboardMap = await read('features/lessons/grades/kg/level-01/components/LevelMap.tsx')
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

test('intro attempts immediate playback and keeps browser-blocked recovery inside the video screen', () => {
  assert.match(intro, /useEffect\(\(\) => \{\s*void startVideo\(\)\s*\}, \[startVideo, videoAttempt\]\)/)
  assert.doesNotMatch(intro, /Start Learning/)
  assert.match(intro, /onClick=\{\(\) => void startVideo\(\)\}/)
  assert.match(intro, /Tap to play with sound/)
  assert.match(intro, /video\.muted = false/)
  assert.match(intro, /video\.volume = 1/)
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

test('Level 2 staff routes use read-only rehearsal while the canonical runtime keeps its E–J flow', () => {
  assert.equal(LEVEL2_INTRO_COMPLETED_KEY, 'talkora:kg-level2-intro-completed')
  assert.match(introRoute, /CurriculumExplorerPage/)
  assert.doesNotMatch(introRoute, /requestKGMicrophone|MediaRecorder|<Level\d?Experience/)
  assert.match(introRoute, /initialLevel=\{2\}/)
  assert.match(activityRoute, /CurriculumExplorerPage/)
  assert.doesNotMatch(activityRoute, /requestKGMicrophone|MediaRecorder|<Level\d?Experience/)
  assert.match(activityRoute, /initialLevel=\{2\}/)
  assert.match(activity, /studentStartLetter = 'E'/)
  assert.match(activity, /LEVEL2_LETTERS\.includes\(studentStartLetter as Level2Letter\)/)
  assert.match(dashboardMap, /dashboardHref[\s\S]*?2: '\/school\/kg-preview\/level-2'/)
  assert.notEqual(LEVEL2_INTRO_COMPLETED_KEY, 'talkora:kg-level3-intro-completed')
  assert.doesNotMatch(activity, /LEVEL3_LETTERS|kg-level3-preview|K–P/)
})

test('Level 2 displays the confirmed letter-word-picture mappings', async () => {
  for (const [letter, word, fileName] of [
    ['E', 'Elephant', 'elephant.jpg'], ['F', 'Fish', 'fish.jpg'], ['G', 'Grapes', 'grapes.jpg'],
    ['H', 'House', 'house.jpg'], ['I', 'Ice Cream', 'ice_cream.jpg'], ['J', 'Juice', 'juice.jpg'],
  ]) {
    const path = `/kg/pictures/level-2/${fileName}`
    assert.match(activity, new RegExp(`${letter}: '${word}'`))
    assert.match(studentExperience, new RegExp(`${letter}: '${word}'`))
    assert.match(completedReview, new RegExp(`${letter}: '${word}'`))
    assert.match(activity, new RegExp(`${letter}: '${path.replaceAll('.', '\\.').replaceAll('/', '\\/')}'`))
    assert.match(studentExperience, new RegExp(`${letter}: '${path.replaceAll('.', '\\.').replaceAll('/', '\\/')}'`))
    assert.match(completedReview, new RegExp(`${letter}: '${path.replaceAll('.', '\\.').replaceAll('/', '\\/')}'`))
    const image = await readFile(new URL(`../public/kg/pictures/level-2/${fileName}`, import.meta.url))
    assert.deepEqual(image.subarray(0, 3), Buffer.from([0xff, 0xd8, 0xff]))
    await access(new URL(`../public/kg/pictures/level-2/${fileName}`, import.meta.url))
  }
  assert.match(activity, /<Level2JungleWorld \/>/)
  assert.match(studentExperience, /<Level2JungleWorld \/>/)
  assert.match(completedReview, /level === 2 \? <Level2JungleWorld \/> : <KindergartenWorld \/>/)
  assert.match(activity, /<LetterWordPicture/)
  assert.doesNotMatch(activity, /letter\.toLowerCase|is for/)
})

test('Level 2 E–J retain bounded image layout and full-screen background rules', async () => {
  await access(new URL('../public/lessons/kg/images/jungle-background.png', import.meta.url))
  await access(new URL('../public/lessons/kg/images/jungle-background.png.webp', import.meta.url))
  assert.match(level2Styles, /grid-template-columns: minmax\(112px, 0\.48fr\) minmax\(190px, 0\.9fr\) minmax\(240px, 1fr\)/)
  assert.match(level2Styles, /white-space: nowrap/)
  assert.match(level2Styles, /object-fit: contain/)
  assert.match(level2Styles, /\.kg-level2-play \.kg-level2-letter-word-picture \.kg-letter-word-picture__image \{\s*position: absolute;\s*inset: 0;\s*width: 100%;\s*height: 100%;[\s\S]*?object-fit: cover;/)
  assert.match(level2Styles, /\/lessons\/kg\/images\/jungle-background\.png/)
  assert.match(level2Styles, /background-repeat: no-repeat/)
  assert.match(level2Styles, /background-position: center center/)
  assert.match(level2Styles, /\.kg-level2-play\.kg-level2-visuals \{\s*background-color: #c9e8a9 !important;\s*background-image: url\('\/lessons\/kg\/images\/jungle-background\.png'\) !important;\s*background-image: image-set\(url\('\/lessons\/kg\/images\/jungle-background\.png\.webp'\) type\('image\/webp'\), url\('\/lessons\/kg\/images\/jungle-background\.png'\) type\('image\/png'\)\) !important;\s*background-repeat: no-repeat !important;\s*background-position: center center !important;\s*background-size: cover !important;/)
  assert.equal((level2Styles.match(/background-image: url\('\/lessons\/kg\/images\/jungle-background\.png'\)/g) || []).length, 1)
  assert.match(level2Styles, /url\('\/lessons\/kg\/images\/jungle-background\.png'\)/)
  assert.equal((level2Styles.match(/image-set\(url\('\/lessons\/kg\/images\/jungle-background\.png\.webp'/g) || []).length, 2)
  assert.match(level2Styles, /\.kg-level2-play__speech \{\s*position: relative;\s*z-index: 2;/)
  assert.match(level2Styles, /\.kg-level2-play\.kg-level2-visuals \.kg-level2-play__teacher \.kg-alpha-teacher-image \{\s*position: relative;\s*z-index: 1;/)
  assert.match(level2Styles, /\.kg-level2-play__speech \{[\s\S]*?background: linear-gradient\(145deg, #fff, #fff4e8\);/)
  assert.match(level2Styles, /\.kg-level2-play__speech\[data-microphone-warning='true'\] \{\s*transform: translateY\(-clamp\(34px, 4\.2vh, 48px\)\);/)
  assert.match(level2Styles, /\.kg-level2-play__speech\[data-microphone-warning='true'\] \{ transform: translateY\(-clamp\(22px, 3vh, 30px\)\); \}/)
  assert.match(level2Styles, /@media \(max-width: 900px\) and \(min-width: 761px\) \{[\s\S]*?grid-template-columns: minmax\(88px, \.6fr\) minmax\(128px, \.86fr\) minmax\(150px, 1fr\);[\s\S]*?max-width: 190px;/)
  assert.doesNotMatch(level2Styles, /\/lessons\/kg\/jungle-background\.png/)
  assert.match(letterWordPicture, /<div className="kg-letter-word-picture__letter-box">\s*<div className="kg-letter-word-picture__letter"/)
  assert.match(letterWordPicture, /className=\{`kg-letter-word-picture \$\{className\}`\}/)
  assert.match(level2Styles, /\.kg-level2-play \.kg-level2-letter-word-picture \.kg-letter-word-picture__letter-box \{[\s\S]*?background: linear-gradient\(145deg, #f5efff 0%, #e4d8f8 56%, #ccb7ed 100%\);/)
  assert.doesNotMatch(level2Styles, /letter-background\.png/)
  assert.match(level2Styles, /\.kg-level2-play \.kg-level2-letter-word-picture \.kg-letter-word-picture__letter \{[\s\S]*?background: linear-gradient\(145deg, #f5efff 0%, #e4d8f8 56%, #ccb7ed 100%\);/)
  assert.match(level2Styles, /\.kg-level2-play\.kg-level2-visuals \.kg-level2-play__teacher \.kg-alpha-teacher-image \{[\s\S]*?overflow: visible;/)
  assert.match(level2Styles, /\.kg-julie-animated__pose,[\s\S]*?object-fit: contain;\s*object-position: center bottom;/)
  assert.match(level2Styles, /\.kg-level2-visuals > \.kg-level2-jungle \{\s*display: none;/)
  const sharedBackgroundStart = sharedWorldStyles.indexOf('/* Exact supplied jungle artwork')
  const sharedBackgroundEnd = sharedWorldStyles.indexOf('.kg-level2-play__board,', sharedBackgroundStart)
  const sharedBackgroundRules = sharedWorldStyles.slice(sharedBackgroundStart, sharedBackgroundEnd)
  assert.doesNotMatch(sharedBackgroundRules, /\.kg-level2-play/)
  for (const [, assetPath] of level2Styles.matchAll(/url\('([^']+)'\)/g)) {
    if (assetPath.startsWith('/')) await access(new URL('../public' + assetPath, import.meta.url))
  }
})

test('the Level 2-only backdrop adds gentle decorations and respects reduced motion', () => {
  assert.match(level2World, /kg-level2-jungle__float/)
  assert.match(level2World, /kg-level2-jungle__star/)
  assert.match(level2World, /kg-level2-jungle__sparkle/)
  assert.match(level2Styles, /\.kg-level2-visuals \.kg-level2-jungle__float/)
  assert.match(level2Styles, /\.kg-level2-visuals \.kg-level2-jungle__star/)
  assert.match(level2Styles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(level2Styles, /\.kg-level2-visuals \.kg-level2-jungle \*/)
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
  assert.match(activity, /transition\.complete[\s\S]*?router\.replace\('\/school\/kg-preview'\)/)
  assert.match(activity, /The connection was interrupted/)
  assert.match(activity, /Try again/)
  assert.match(activity, /releaseMicrophone/)
  assert.match(activity, /controller\.abort\(\)/)
})

test('student rewards are limited to confirmed correct answers and respect reduced motion', () => {
  assert.match(studentExperience, /setCelebrating\(outcome === 'correct'\)/)
  assert.match(studentExperience, /result\.feedbackText, result\.outcome/)
  assert.match(studentExperience, /state\.pendingFeedback\.feedbackText, state\.pendingFeedback\.outcome/)
  assert.match(studentExperience, /setTimeout\(\(\) => setCelebrating\(false\), 1400\)/)
  for (const letter of LEVEL2_LETTERS) {
    assert.match(level2Styles, new RegExp(`data-letter='${letter}'`))
  }
  assert.match(level2Styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none/)
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
  assert.match(level3Route, /CurriculumExplorerPage/)
  assert.doesNotMatch(level3Route, /requestKGMicrophone|MediaRecorder|<Level\d?Experience/)
  assert.match(level3Route, /initialLevel=\{3\}/)
  assert.match(level3Flow, /talkora:kg-level3-intro-completed/)
  assert.match(dashboardMap, /1: '\/school\/kg-preview\/level-1'/)
  assert.match(dashboardMap, /3: '\/school\/kg-preview\/level-3'/)
  assert.match(config, /"studentPlayable": false/)
})

test('microphone permission errors are recoverable and specific', () => {
  assert.match(microphoneFailureMessage({ name: 'NotAllowedError' }), /allow microphone access/i)
  assert.match(microphoneFailureMessage({ name: 'NotFoundError' }), /could not find a microphone/i)
})

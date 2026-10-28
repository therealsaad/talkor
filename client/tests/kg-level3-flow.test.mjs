import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { canCompleteIntroVideo, createSubmissionGate, LEVEL3_INTRO_COMPLETED_KEY, LEVEL3_LETTERS, microphoneFailureMessage, resolveLevel3Attempt } from '../features/lessons/grades/kg/level-03/level3-flow.ts'

const lesson = (await readFile(new URL('../features/lessons/grades/kg/level-03/LevelExperience.tsx', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
const previewService = await readFile(new URL('../features/lessons/grades/kg/level-03/services/kg-level3-preview-service.ts', import.meta.url), 'utf8')
const previewIntro = (await readFile(new URL('../features/lessons/grades/kg/level-03/PreviewIntro.tsx', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
const level3Styles = await readFile(new URL('../features/lessons/grades/kg/level-03/level-03.css', import.meta.url), 'utf8')
const route = await readFile(new URL('../app/school/kg-preview/page.tsx', import.meta.url), 'utf8')
const videoRoute = await readFile(new URL('../app/school/kg-preview/level-3/page.tsx', import.meta.url), 'utf8')
const activityRoute = await readFile(new URL('../app/school/kg-preview/level-3/[letter]/page.tsx', import.meta.url), 'utf8')
const level3Config = await readFile(new URL('../features/lessons/grades/kg/level-03/config.ts', import.meta.url), 'utf8')
const level1Route = await readFile(new URL('../app/school/kg-preview/level-1/page.tsx', import.meta.url), 'utf8')
const schoolLayout = await readFile(new URL('../app/school/layout.tsx', import.meta.url), 'utf8')

test('KG Preview opens the garden with distinct routes for the available levels', () => {
  assert.match(route, /src="\/lessons\/kg\/images\/kg-simple-garden\.webp"/)
  assert.match(route, /\/school\/kg-preview\/level-1/)
  assert.match(route, /\/school\/kg-preview\/level-2/)
  assert.match(route, /\/school\/kg-preview\/level-3/)
  assert.match(route, /const levels = \[level01, level02, level03/)
  assert.match(route, /Level \$\{level\.level\}/)
  assert.match(route, /level\.title/)
  assert.match(route, /Not available in this preview/)
  assert.match(level1Route, /KGAlphabetMap preview/)
  assert.match(level1Route, /KGLevel1Experience/)
})

test('Level 3 selection opens a clean video screen and completion routes directly to K', () => {
  assert.match(previewIntro, /<video/)
  assert.match(previewIntro, /controls={false}/)
  assert.match(previewIntro, /preload="metadata"/)
  assert.match(previewIntro, /disablePictureInPicture/)
  assert.match(previewIntro, /disableRemotePlayback/)
  assert.match(previewIntro, /requestFullscreen/)
  assert.match(previewIntro, /onEnded=\{\(\) =>/)
  assert.match(previewIntro, /canCompleteIntroVideo\(video, maximumTimeRef\.current\)/)
  assert.match(previewIntro, /completionHandledRef\.current = true[\s\S]*?onComplete\(\)/)
  assert.doesNotMatch(previewIntro, /STAFF PREVIEW|Preview list|Choose a letter|Skip introduction|Fast forward|<Link|<header/i)
  assert.doesNotMatch(previewIntro, /<Mic|requestKGMicrophone|beginPreview|speech-recognition/i)
  assert.doesNotMatch(previewIntro, /level-01\/styles/)
  assert.match(videoRoute, /<Level3PreviewIntro/)
  assert.match(videoRoute, /sessionStorage\.setItem\(LEVEL3_INTRO_COMPLETED_KEY, 'complete'\)/)
  assert.match(videoRoute, /router\.push\('\/school\/kg-preview\/level-3\/K'\)/)
  assert.match(activityRoute, /workspace\.config\.staffOnlyPreview/)
  assert.match(activityRoute, /previewStartLetter=\{letter\}/)
  assert.match(activityRoute, /entryCheckStarted\.current\) return/)
  assert.match(activityRoute, /entryCheckStarted\.current = true/)
  assert.match(activityRoute, /sessionStorage\.removeItem\(LEVEL3_INTRO_COMPLETED_KEY\)/)
  assert.match(activityRoute, /router\.replace\('\/school\/kg-preview'\)/)
  assert.match(level3Config, /"editorialStatus": "draft"/)
  assert.match(level3Config, /"studentPlayable": false/)
  assert.match(level3Config, /"staffOnlyPreview": true/)
  assert.match(schoolLayout, /role === 'SCHOOL_ADMIN' \|\| role === 'TEACHER'/)
  assert.match(schoolLayout, /role === 'STUDENT'.*\/student\/home/)
  assert.equal(LEVEL3_INTRO_COMPLETED_KEY, 'talkora:kg-level3-intro-completed')
})

test('only a genuine end after the full video duration opens the K lesson', () => {
  assert.equal(canCompleteIntroVideo({ ended: true, duration: 60, currentTime: 60 }, 60), true)
  assert.equal(canCompleteIntroVideo({ ended: false, duration: 60, currentTime: 60 }, 60), false)
  assert.equal(canCompleteIntroVideo({ ended: true, duration: 60, currentTime: 10 }, 60), false)
  assert.equal(canCompleteIntroVideo({ ended: true, duration: 60, currentTime: 60 }, 10), false)
  assert.equal(canCompleteIntroVideo({ ended: true, duration: Number.NaN, currentTime: 60 }, 60), false)
})

test('all six letter buttons are available and correct K–P answers progress automatically', () => {
  assert.deepEqual(LEVEL3_LETTERS, ['K', 'L', 'M', 'N', 'O', 'P'])
  let current = 'K'
  for (const next of LEVEL3_LETTERS.slice(1)) {
    assert.deepEqual(resolveLevel3Attempt(current, 'correct'), { letter: next, complete: false, retry: false })
    current = next
  }
  assert.deepEqual(resolveLevel3Attempt('P', 'correct'), { letter: 'P', complete: true, retry: false })
  assert.match(lesson, /transitionTimer = window\.setTimeout\(\(\) => \{[\s\S]*?setSelected\(transition\.letter\)/)
  assert.doesNotMatch(lesson, /Next letter button|aria-label="Next letter"/i)
})

test('incorrect, unclear, and empty responses keep the current letter available for retry', () => {
  for (const outcome of ['incorrect', 'unclear']) {
    assert.deepEqual(resolveLevel3Attempt('N', outcome), { letter: 'N', complete: false, retry: true })
  }
  assert.match(lesson, /noSpeech:\s*\(!speechDetected && vadAvailable\) \|\| blob\.size < 800/)
  assert.match(lesson, /transition\.retry\)[\s\S]*?setAttemptCycle\(\(cycle\) => cycle \+ 1\)/)
  assert.match(lesson, /result\.outcome === 'correct' \? 'great' : result\.outcome === 'unclear' \? 'repeat' : 'try-again'/)
})

test('a single recording can only submit once', () => {
  const claim = createSubmissionGate()
  assert.equal(claim(), true)
  assert.equal(claim(), false)
  assert.match(lesson, /const claimSubmission = createSubmissionGate\(\)/)
  assert.match(lesson, /if \(!claimSubmission\(\)\) return/)
})

test('permission, microphone, narration, network, and video failures have retryable feedback', () => {
  assert.match(microphoneFailureMessage({ name: 'NotAllowedError' }), /allow microphone access/i)
  assert.match(microphoneFailureMessage({ name: 'NotFoundError' }), /could not find a microphone/i)
  assert.match(lesson, /Try again/)
  assert.match(previewIntro, /Try video again/)
  assert.match(lesson, /The connection was interrupted/)
  assert.match(previewService, /AbortSignal\.timeout\(15_000\)/)
  assert.match(previewService, /Miss Julie narration playback failed/)
  assert.match(previewService, /Miss Julie feedback playback failed/)
})

test('Level 3 reuses Level 1 Miss Julie animation and approved feedback audio', () => {
  assert.match(lesson, /<AnimatedMissJulie state=\{characterState\}/)
  assert.doesNotMatch(lesson, /PreviewMissJulie|kg-level3-character-video|src="\/miss-julie-animations/)
  assert.match(previewService, /playBlob\(introduction, audio, signal\)[\s\S]*?playBlob\(prompt, audio, signal\)/)
  assert.match(previewService, /kgAlphabetService\.previewPlay\(id, audio, requestSignal\(signal\)\)/)
  assert.match(previewService, /narrationBlobs = new Map/)
  assert.match(previewService, /const \[introduction, prompt\] = await Promise\.all/)
  assert.match(lesson, /service\.playFeedback\(/)
  assert.match(lesson, /Audio playback was blocked/)
  assert.match(lesson, /Say the letter \$\{selected\} to Miss Julie/)
})

test('Level 3 uses authenticated recording/STT only after Miss Julie finishes speaking', () => {
  assert.match(lesson, /requestKGMicrophone/)
  assert.match(lesson, /watchVoiceActivity/)
  assert.match(lesson, /const \{ kgLevel3PreviewService \} = await import\('\.\/services\/kg-level3-preview-service'\)/)
  assert.match(lesson, /previewService\.playIntroduction/)
  assert.match(lesson, /await previewService\.playIntroduction\(selected, audioRef\.current, controller\.signal\)[\s\S]*?await beginListening\(\)/)
  assert.match(lesson, /service\.submitAttempt/)
  assert.match(lesson, /resolveLevel3Attempt/)
  assert.match(lesson, /noSpeechTimeoutMs: 6500/)
  assert.match(lesson, /<AnimatedMissJulie state=\{characterState\}/)
  assert.match(lesson, /if \(!preview\) return/)
  assert.doesNotMatch(lesson, /speakKGOnDevice|speechSynthesis/)
})

test('Level 3 coordinates each confirmed word with its picture', () => {
  assert.match(lesson, /<LetterWordPicture/)
  assert.doesNotMatch(lesson, /letter\.toLowerCase|is for/)
  for (const [letter, word] of Object.entries({ K: 'kite', L: 'lion', M: 'monkey', N: 'nest', O: 'orange', P: 'parrot' })) {
    assert.match(lesson, new RegExp(`${letter}: \{ src: '/kg/pictures/level-3/${word}\\.svg', word: '${word}' \}`))
  }
})

test('Level 3 visual polish follows real lesson states and respects reduced motion', () => {
  assert.match(lesson, /data-phase=\{phase\}/)
  assert.match(lesson, /data-outcome=\{feedbackOutcome\}/)
  assert.match(lesson, /phase === 'listening'[\s\S]*?'listening'/)
  assert.match(lesson, /phase === 'checking'[\s\S]*?'thinking'/)
  assert.match(lesson, /feedbackOutcome === 'correct' \? 'celebrating' : 'encouraging'/)
  assert.match(lesson, /<AnimatedMissJulie state=\{characterState\}/)
  assert.match(lesson, /<KindergartenWorld \/>/)
  assert.match(level3Styles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(level3Styles, /kg-level3-mic-breathe/)
  assert.match(level3Styles, /pointer-events: none/)
  assert.match(level3Styles, /\/lessons\/kg\/jungle-background\.png/)
})

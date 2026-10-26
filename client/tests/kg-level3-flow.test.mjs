import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { canCompleteIntroVideo, createSubmissionGate, LEVEL3_INTRO_COMPLETED_KEY, LEVEL3_LETTERS, microphoneFailureMessage, resolveLevel3Attempt } from '../features/lessons/grades/kg/level-03/level3-flow.ts'

const lesson = (await readFile(new URL('../features/lessons/grades/kg/level-03/LevelExperience.tsx', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
const previewService = await readFile(new URL('../features/lessons/grades/kg/level-03/services/kg-level3-preview-service.ts', import.meta.url), 'utf8')
const previewIntro = (await readFile(new URL('../features/lessons/grades/kg/level-03/PreviewIntro.tsx', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
const route = await readFile(new URL('../app/school/kg-preview/page.tsx', import.meta.url), 'utf8')
const activityRoute = await readFile(new URL('../app/school/kg-preview/level-3/[letter]/page.tsx', import.meta.url), 'utf8')

test('the introduction has no microphone controls and opens a separate letter picker', () => {
  const intro = previewIntro.split("if (view === 'story') {")[1].split('  return (\n    <main className="kg-level3-selection"')[0]
  const selection = previewIntro.split('  return (\n    <main className="kg-level3-selection"')[1]
  assert.match(intro, /<video/)
  assert.match(intro, /controls={false}/)
  assert.match(intro, /preload="metadata"/)
  assert.match(intro, /disablePictureInPicture/)
  assert.match(intro, /disableRemotePlayback/)
  assert.match(previewIntro, /requestFullscreen/)
  assert.match(intro, /onEnded=\{\(\) =>/)
  assert.doesNotMatch(intro, /Explore letters K–P|Skip introduction|Fast forward/i)
  assert.doesNotMatch(intro, /<Mic|requestKGMicrophone|beginPreview|speech-recognition/i)
  assert.match(selection, /LEVEL3_LETTERS\.map/)
  assert.match(selection, /onSelectLetter\(letter\)/)
  assert.doesNotMatch(selection, /<Mic|requestKGMicrophone/)
  assert.doesNotMatch(previewIntro, /level-01\/styles/)
  assert.match(route, /sessionStorage\.setItem\(LEVEL3_INTRO_COMPLETED_KEY/)
  assert.match(route, /<Level3PreviewIntro/)
  assert.doesNotMatch(route, /RegisteredLevelExperience|kgLevel3PreviewService|requestKGMicrophone/)
  assert.match(activityRoute, /workspace\.config\.staffOnlyPreview/)
  assert.match(activityRoute, /previewStartLetter=\{letter\}/)
  assert.match(activityRoute, /entryCheckStarted\.current\) return/)
  assert.match(activityRoute, /entryCheckStarted\.current = true/)
  assert.match(activityRoute, /sessionStorage\.removeItem\(LEVEL3_INTRO_COMPLETED_KEY\)/)
  assert.match(activityRoute, /router\.replace\('\/school\/kg-preview'\)/)
  assert.equal(LEVEL3_INTRO_COMPLETED_KEY, 'talkora:kg-level3-intro-completed')
})

test('only a genuine end after the full video duration unlocks the selection', () => {
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
  assert.match(lesson, /<AnimatedMissJulie state=\{julieState\}/)
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
  assert.match(lesson, /<AnimatedMissJulie state=\{julieState\}/)
  assert.match(lesson, /if \(!preview\) return/)
  assert.doesNotMatch(lesson, /speakKGOnDevice|speechSynthesis/)
})

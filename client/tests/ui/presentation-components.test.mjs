import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

const stageCode = await read('../../components/student/lesson/miss-julie-teaching-stage.tsx')
const beaconCode = await read('../../components/student/lesson/voice-interaction-beacon.tsx')
const boardCode = await read('../../components/student/lesson/smart-learning-board.tsx')
const previewCode = await read('../../app/classroom-preview/page.tsx')
const studentNavCode = await read('../../components/student/navigation/student-nav.tsx')
const studentContinueCode = await read('../../app/student/continue/page.tsx')
const studentHomeCode = await read('../../app/student/home/page.tsx')

test('MissJulieTeachingStage reuses MissJulieCharacter without duplicating avatar logic', () => {
  assert.match(stageCode, /import\s*\{\s*MissJulieCharacter/)
  assert.match(stageCode, /<MissJulieCharacter\s*state=\{state\}\s*isSpeaking=\{isSpeaking\}\s*\/>/)
  assert.doesNotMatch(stageCode, /MediaRecorder/)
  assert.doesNotMatch(stageCode, /navigator\.mediaDevices/)
  assert.doesNotMatch(stageCode, /TeachingResponseV1/)
})

test('VoiceInteractionBeacon strictly enforces deliberate click and avoids auto-activating mic', () => {
  assert.doesNotMatch(beaconCode, /useEffect\(.*onStartMic/)
  assert.match(beaconCode, /isTeacherSpeaking\s*\?\s*'teacher_speaking'/)
  assert.match(beaconCode, /Listen to Miss Julie/)
  assert.match(beaconCode, /I am listening!/)
  assert.match(beaconCode, /Miss Julie is thinking/)
  assert.match(beaconCode, /isButtonDisabled\s*=\s*disabled\s*\|\|\s*isProcessing\s*\|\|\s*isTeacherSpeaking/)
})

test('SmartLearningBoard guards XP and only renders +XP when confirmed by backend', () => {
  assert.match(boardCode, /confirmedXp\s*&&\s*confirmedXp\s*>\s*0/)
  assert.match(boardCode, /\+\{confirmedXp\}\s*XP\s*\(Earned\)/)
  // When only potentialXp is passed, it renders as "Goal: X XP", never "+XP"
  assert.match(boardCode, /Goal:\s*\{displayGoalXp\}\s*XP/)
  assert.doesNotMatch(boardCode, /\+\{potentialXp\}/)
  assert.doesNotMatch(boardCode, /\+\{xpReward\}/)
})

test('ClassroomPreviewPage protects student flows and clearly labels simulated actions', () => {
  // Explicit staff sandbox banner
  assert.match(previewCode, /STAFF &(?:amp;)? DEVELOPER SANDBOX/)
  assert.match(previewCode, /NOT AN ACCREDITED LESSON/)
  // Student session warning guard
  assert.match(previewCode, /role === 'STUDENT'/)
  assert.match(previewCode, /Resume My Lesson/)
  // Distinguishes simulated actions
  assert.match(previewCode, /UI Demo Only/)
  assert.match(previewCode, /Simulated Demo \(0 XP Awarded\)/)
  // Real XP explanation
  assert.match(previewCode, /Real XP is (?:recorded|awarded) only after (?:verified backend|backend attempt)/)
})

test('Production student navigation routes NEVER link to classroom-preview', () => {
  assert.doesNotMatch(studentNavCode, /classroom-preview/)
  assert.doesNotMatch(studentContinueCode, /classroom-preview/)
  assert.doesNotMatch(studentHomeCode, /classroom-preview/)
})

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

const stageCode = await read('../../components/student/lesson/miss-julie-teaching-stage.tsx')
const beaconCode = await read('../../components/student/lesson/voice-interaction-beacon.tsx')
const boardCode = await read('../../components/student/lesson/smart-learning-board.tsx')
const previewCode = await read('../../app/classroom-preview/page.tsx')

test('MissJulieTeachingStage reuses MissJulieCharacter without duplicating avatar logic', () => {
  assert.match(stageCode, /import\s*\{\s*MissJulieCharacter/)
  assert.match(stageCode, /<MissJulieCharacter\s*state=\{state\}\s*isSpeaking=\{isSpeaking\}\s*\/>/)
  assert.doesNotMatch(stageCode, /MediaRecorder/)
  assert.doesNotMatch(stageCode, /navigator\.mediaDevices/)
  assert.doesNotMatch(stageCode, /TeachingResponseV1/)
})

test('VoiceInteractionBeacon strictly enforces deliberate click and avoids auto-activating mic', () => {
  // Verifies no useEffect triggers onStartMic automatically
  assert.doesNotMatch(beaconCode, /useEffect\(.*onStartMic/)
  assert.match(beaconCode, /isTeacherSpeaking\s*\?\s*'teacher_speaking'/)
  assert.match(beaconCode, /Listen to Miss Julie/)
  assert.match(beaconCode, /I am listening!/)
  assert.match(beaconCode, /Miss Julie is thinking/)
  // Button must be disabled when teacher is speaking or processing
  assert.match(beaconCode, /isButtonDisabled\s*=\s*disabled\s*\|\|\s*isProcessing\s*\|\|\s*isTeacherSpeaking/)
})

test('SmartLearningBoard provides sample Balbharati and KG datasets without runtime mutations', () => {
  assert.match(boardCode, /SAMPLE_KG_PHONICS_A/)
  assert.match(boardCode, /SAMPLE_CLASS1_VOCAB_SKIP/)
  assert.match(boardCode, /SAMPLE_CLASS1_STORY_FIRSTDAY/)
  assert.match(boardCode, /SAMPLE_CHOICES_SKIP_RUN/)
  assert.match(boardCode, /मराठी/)
  assert.doesNotMatch(boardCode, /progressService\.completeLocalActivity/)
  assert.doesNotMatch(boardCode, /curriculumService\.getNextLesson/)
})

test('ClassroomPreviewPage integrates all three presentation components cleanly', () => {
  assert.match(previewCode, /<MissJulieTeachingStage/)
  assert.match(previewCode, /<SmartLearningBoard/)
  assert.match(previewCode, /<VoiceInteractionBeacon/)
})

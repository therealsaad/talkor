import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const load = file => readFile(new URL(file, import.meta.url), 'utf8')

test('Class 1 First Day uses the illustrated board with live teacher text', async () => {
  const scene = await load('../../features/lessons/grades/class-01/level-01/FirstDayClassroom.tsx')
  const stage = await load('../../components/student/lesson/immersive-lesson-stage.tsx')
  assert.match(scene, /teacherText\s*\|\|/)
  assert.match(scene, /firstday-book__art/)
  assert.match(scene, /firstday-teacher__animation/)
  assert.match(stage, /if \(isClass1Classroom && firstDayV3Id\)/)
  assert.match(stage, /teacherText=\{julieMessage\}/)
})

test('First Day uses motion-first Miss Julie and voice recovery controls, not fake answer buttons', async () => {
  const scene = await load('../../features/lessons/grades/class-01/level-01/FirstDayClassroom.tsx')
  const stage = await load('../../components/student/lesson/immersive-lesson-stage.tsx')
  const css = await load('../../features/lessons/grades/class-01/level-01/first-day-classroom.css')
  assert.match(scene, /firstday-teacher__animation/)
  assert.match(scene, /videoReady/)
  assert.match(scene, /onError=\{\(\) => \{ setVideoFailed\(true\)/)
  assert.match(scene, /onStartMic/)
  assert.match(scene, /onStopMic/)
  assert.match(scene, /onReplayJulie/)
  assert.match(scene, /onEnableAudio/)
  assert.doesNotMatch(scene, /onSelectChoice|onLocalComplete|completeLocalActivity|new MediaRecorder/)
  assert.match(stage, /onStartMic=\{onStartMic\}/)
  assert.match(stage, /onStopMic=\{onStopMic\}/)
  assert.match(css, /overflow:hidden/)
  assert.match(css, /orientation:portrait/)
})

test('the Class 1 mic tolerates quiet voices with no extra STT requests', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /speechThreshold: 0\.012/)
  assert.match(engine, /noSpeechTimeoutMs: 8000/)
})

test('First Day route uses school-action homework and hides v3 fullscreen button', async () => {
  const page = await load('../../app/student/lesson/[id]/page.tsx')
  const wrapper = await load('../../features/lessons/grades/class-01/level-01/Class1Immersion.tsx')
  assert.match(page, /firstDayV3/)
  assert.match(page, /I can walk, I can play/)
  assert.match(page, /voiceOnly=\{firstDayReady\}/)
  assert.match(page, /firstDayPoem/)
  assert.match(wrapper, /!voiceOnly && !isPortrait && !isFullscreen/)
})


test('Class 1 requires end-of-audio before new microphone or next frame', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /speakingTurnIds\.current\.has\(turn\.id\)/)
  assert.match(engine, /if \(playback !== 'spoken'\)/)
  assert.match(engine, /spokenTurnIds\.current\.add\(turn\.id\)/)
  assert.match(engine, /if \(!activity \|\| julie\.isSpeaking \|\| julie\.state === 'loading' \|\| audioBlocked\)/)
  assert.match(engine, /if \(pending\?\.activityComplete \|\| pending\?\.conversationComplete\)/)
})

test('Balbharati First Day cannot falsely complete after four unlearned turns', async () => {
  const svc = await load('../../../backend/src/services/missJulie.service.ts')
  assert.match(svc, /nextTurn >= maxTurns && \(!isFirstDayScene/)
  assert.match(svc, /demonstratedRequiredSkills && turnSkills\.includes\('first_day_english_attempt'\)/)
  assert.match(svc, /firstDaySceneSkills/)
  assert.match(svc, /turnSkills\.includes\('first_day_english_attempt'\)/)
})

test('Marathi/Hindi STT locale reaches Azure voice choice without another STT request', async () => {
  const hook = await load('../../hooks/use-miss-julie-voice.ts')
  const client = await load('../../services/voice-service.ts')
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  const server = await load('../../../backend/src/services/voice.service.ts')
  const azure = await load('../../../backend/src/providers/voice/AzureVoiceProvider.ts')
  assert.match(engine, /voiceLanguage: detectedLanguage/)
  assert.match(engine, /turn\.voiceLanguage/)
  assert.match(hook, /voiceService\.speak\(text, onState, turnId, priority, activityId, language\)/)
  assert.match(client, /language: language \|\| detectVoiceLanguage\(text\)/)
  assert.match(server, /class1Lesson: true, language: options\.language/)
  assert.match(azure, /options\?\.language/)
})

test('replay command never overrides a failed or unacknowledged teacher response', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  const command = engine.split('if (isReplayCommand(normalizedText)) {')[1].split('setTranscript(normalizedText)')[0]
  assert.doesNotMatch(command, /setExperience\('waiting_for_student'\)/)
  assert.match(engine, /await acknowledgeFirstDayTeacherAudio\(\)/)
})

test('Class 1 never mixes old AM activities into the ten new Balbharati scenes', async () => {
  const page = await load('../../app/student/lesson/[id]/page.tsx')
  assert.match(page, /lesson\.activities\.length === 10/)
  assert.match(page, /lesson\.activities\.every\(activity => activity\.activityKey\?\.startsWith\('class1-l01-v3-'\)\)/)
})

test('manual microphone retry works after no-speech errors; replay restores teaching state', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /lastTurn\.activityComplete \|\| lastTurn\.conversationComplete/)
  assert.match(engine, /lastTurn\.retryRequired \? 'retry_required' : 'waiting_for_student'/)
  const mic = engine.split('async function startMic() {')[1].split('if (startingMic.current')[0]
  assert.doesNotMatch(mic, /experience === 'recoverable_error'/)
})

test('First Day Qwen completion requires media-ended server acknowledgment and is resumable after reload', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  const client = await load('../../services/voice-service.ts')
  const backend = await load('../../../backend/src/services/voice.service.ts')
  const pedagogy = await load('../../../backend/src/services/missJulie.service.ts')
  assert.match(engine, /const firstDayV3 = \/\^class1-l01-v\(\?:3\|4\)-\//)
  assert.match(engine, /pendingTeacherAck\.current = id/)
  assert.match(engine, /if \(firstDayV3 && complete && spoken\) await acknowledgeFirstDayTeacherAudio\(\)/)
  assert.match(engine, /await voiceService\.pendingTeacherAudio\(activity\.id\)/)
  assert.match(engine, /await voiceService\.acknowledgeTeacherAudio\(pendingId\)/)
  assert.match(client, /\/teacher-audio-played/)
  assert.match(backend, /'metadata\.teacherAudioAcknowledgedAt'/)
  assert.match(pedagogy, /status: completed && !isFirstDayScene/)
  assert.match(pedagogy, /if \(completed && !isFirstDayScene/)
})

test('Class 1 voice uses Qwen 8002 without fallback to Groq and exact approved S3 narration', async () => {
  const qwen = await load('../../../backend/src/providers/ai/QwenProvider.ts')
  const python = await load('../../../backend/src/providers/ai/PythonAIProvider.ts')
  const backend = await load('../../../backend/src/services/voice.service.ts')
  assert.match(qwen, /return await this\.pythonFallback\.generate\(context\)/)
  assert.match(qwen, /CLASS1_AI_SERVICE_UNAVAILABLE/)
  assert.match(python, /http:\/\/127\.0\.0\.1:8002/)
  assert.match(backend, /CLASS1_FIRST_DAY_APPROVED_AUDIO_MISSING_OR_MISMATCHED/)
})

test('additive first-day v3 redirects old lesson bookmarks to new, reviewed lesson media without a teacher approval gate', async () => {
  const page = await load('../../app/student/lesson/[id]/page.tsx')
  const intro = await load('../../features/lessons/grades/class-01/level-01/Class1LessonIntro.tsx')
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  const fast = await load('../../../backend/src/services/student-lesson-fast.service.ts')
  const staging = await load('../../../backend/src/scripts/stage-class1-first-day-parallel.ts')
  assert.match(page, /class1IntroVideoUrl/)
  assert.match(intro, /approvedVideoUrl/)
  assert.match(engine, /approvedVideoUrl=\{class1IntroVideoUrl\}/)
  assert.match(fast, /preferClass1FirstDayLesson/)
  assert.match(fast, /const lesson = firstDay \|\| requested\.lesson/)
  assert.match(staging, /MISSING_REVIEWED_PRIYA_AUDIO/)
  assert.match(staging, /databaseName !== 'test'/)
  assert.match(staging, /existingStudentRecordsWillBeUpdated: false/)
  assert.doesNotMatch(staging, /Activity\.deleteMany|Progress\.updateMany|ActivityAttempt\.delete/)
})

test('when Class 1 v3 is installed student-facing map labels school adventure, not obsolete AM word meadow', async () => {
  const curriculum = await load('../../../backend/src/services/student-curriculum.service.ts')
  const fast = await load('../../../backend/src/services/student-lesson-fast.service.ts')
  assert.match(curriculum, /hasFirstDay \? 'My First Day — School Adventure'/)
  assert.match(curriculum, /hasFirstDay \? 'School Garden'/)
  assert.match(fast, /title: 'My First Day — School Adventure', place: 'School Garden'/)
  assert.match(fast, /title: 'My First Day — Poem Garden', place: 'Poem Garden'/)
})

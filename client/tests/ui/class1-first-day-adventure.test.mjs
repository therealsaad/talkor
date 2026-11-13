import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
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

test('Class 1 poem offers a supported one-word choice while keeping full-line practice available', async () => {
  const scene = await load('../../features/lessons/grades/class-01/level-01/FirstDayPoemClassroom.tsx')
  const css = await load('../../features/lessons/grades/class-01/level-01/first-day-poem-classroom.css')
  const service = await load('../../../backend/src/services/missJulie.service.ts')
  assert.match(scene, /Say one word you know, like <strong>\{exampleWord\}<\/strong>, or say both lines with Miss Julie\./)
  assert.match(scene, /Five little parts/)
  assert.match(scene, /Your choice · part/)
  assert.match(scene, /<span>Speak<\/span>/)
  assert.match(scene, /aria-label="Start speaking a poem word or the current lines"/)
  assert.match(scene, /lang="hi"/)
  assert.match(scene, /lang="mr"/)
  assert.match(css, /\.poem-gentle-invitation/)
  assert.match(service, /observeGentlePoemFinale/)
  assert.match(service, /gentleSupportComplete/)
  assert.match(service, /turnSkills\.includes\('first_day_english_attempt'\)/)
  assert.doesNotMatch(scene, /onLocalComplete|onSkipPoem|awardXP/)
})

test('the Class 1 mic tolerates quiet voices with no extra STT requests', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /speechThreshold: 0\.012/)
  assert.match(engine, /noSpeechTimeoutMs: 8000/)
})

test('Class 1 gives one automatic no-speech retry, then a safe manual recovery', async () => {
  const source = await load('../../lib/class1-microphone-recovery.ts')
  const module = { exports: {} }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { module, exports: module.exports, Error })
  const { class1SilenceRecovery, isClass1NoSpeechError } = module.exports
  assert.equal(isClass1NoSpeechError(new Error('No speech was detected. Please try again.')), true)
  assert.equal(isClass1NoSpeechError(new Error('I could not hear enough. Please try again.')), true)
  for (const message of ['Azure TTS 502', 'Microphone permission denied',
    'Speech recognition is temporarily unavailable', 'The teacher audio is unavailable']) {
    assert.equal(isClass1NoSpeechError(new Error(message)), false)
  }
  const first = class1SilenceRecovery(0)
  assert.equal(first.misses, 1)
  assert.equal(first.autoListen, true)
  assert.match(first.feedback, /listen once more/)
  const second = class1SilenceRecovery(first.misses)
  assert.equal(second.misses, 2)
  assert.equal(second.autoListen, false)
  assert.match(second.feedback, /Tap the microphone/)
  const repeat = class1SilenceRecovery(second.misses)
  assert.equal(repeat.autoListen, false)
})

test('Class 1 poem records both lines, retries silence without a second STT call or fake completion', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /silenceMs: activity\.activityKey\?\.startsWith\('class1-l01-v4-poem-'\) \? 1900 : 1350/)
  assert.match(engine, /speechThreshold: 0\.012/)
  assert.match(engine, /const recovery = class1SilenceRecovery\(noSpeechMisses\.current\)/)
  assert.match(engine, /'FEEDBACK', activity\.id, 'en-IN'/)
  assert.match(engine, /playback = await julie\.speak\(/)
  assert.match(engine, /if \(generation !== playbackGeneration\.current\) return/)
  assert.match(engine, /if \(playback !== 'spoken'\) \{\s*setAudioBlocked\(true\)/)
  assert.match(engine, /setExperience\('julie_audio_pending'\)/)
  assert.match(engine, /setExperience\(recovery\.autoListen \? 'waiting_for_student' : 'recoverable_error'\)/)
  assert.match(engine, /const delay = experienceId === 'g01-l01' && noSpeechMisses\.current > 0 \? 1400 : 420/)
  assert.match(engine, /if \(normalizedText\) noSpeechMisses\.current = 0/)
  assert.match(engine, /if \(experienceId === 'g01-l01'\) setStudentTurn\(null\)/)
  assert.match(engine, /await cancelActiveVoiceSession\(\)\s+if \(experienceId === 'g01-l01' && isClass1NoSpeechError\(error\)\)/)
  assert.match(engine, /await submit\(normalizedText, currentSessionId, 'MIC', voiceResult\.languageCode, telemetryTurnId\)/)
  assert.match(engine, /if \(playback !== 'spoken'\)/)
  assert.match(engine, /await acknowledgeFirstDayTeacherAudio\(\)/)
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
  // The optional timing observer may wrap onState, but must never drop the language/session arguments.
  assert.match(hook, /voiceService\.speak\(text, \(nextState, message\) => \{/)
  assert.match(hook, /onState\(nextState, message\)/)
  assert.match(hook, /\}, turnId, priority, activityId, language, teacherSessionId\)/)
  assert.match(client, /language: language \|\| detectVoiceLanguage\(text\)/)
  // Azure now also receives the authenticated v4 poem-recitation flag.
  // Keep checking the language handoff without relying on one-line formatting.
  assert.match(server, /class1Lesson: true,\s*language: options\.language,\s*poemRecitation: isFirstDayPoem/)
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
  // Progress ACK remains after successful onended playback; the new telemetry only observes it.
  assert.match(engine, /if \(firstDayV3 && complete && spoken\) \{\s*const acknowledged = await acknowledgeFirstDayTeacherAudio\(\)/)
  assert.match(engine, /if \(acknowledged && telemetryTurnId\) lessonTurnTelemetry\.markFor\(telemetryTurnId, 'ackDone'\)/)
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

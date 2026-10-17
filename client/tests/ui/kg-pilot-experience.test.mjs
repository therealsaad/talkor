import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const login = await read('../../app/login/student/page.tsx')
const layout = await read('../../app/student/layout.tsx')
const levels = await read('../../app/student/levels/page.tsx')
const map = await read('../../components/student/kg/kg-alphabet-map.tsx')
const lesson = await read('../../app/student/kg/page.tsx')
const shell = await read('../../components/student/shell/student-portal-shell.tsx')
const service = await read('../../services/kg-alphabet-service.ts')
const controller = await read('../../../backend/src/controllers/kg-alphabet.controller.ts')

test('five-digit KG login enters the mandatory story and the student map resumes saved progress', () => {
  assert.match(login, /signedIn\.student\?\.grade === 0 \? '\/student\/kg'/)
  assert.match(levels, /KGAlphabetMap/)
  assert.match(map, /state\?\.currentIndex/)
  assert.match(map, /state\?\.completed \? '\/student\/kg\?replay=all' : '\/student\/kg'/)
  assert.match(map, /index > unlockedThrough/)
  assert.match(map, /done \? `\/student\/kg\?replay=/)
  assert.match(shell, /pathname\.startsWith\('\/student\/kg'\)/)
  assert.match(layout, /mustKeepKGStudentInGarden/)
  assert.match(layout, /!isKGLessonRoute/)
})

test('the canonical intro is unskippable and only its ended event persists completion', () => {
  assert.match(lesson, /const INTRO_VIDEO = '\/kg\/videos\/fullkg\.mp4'/)
  assert.match(lesson, /onEnded=\{\(\) => \{/); assert.match(lesson, /introEndedRef\.current = true; void finishIntro\(\)/)
  assert.match(lesson, /if \(!introEndedRef\.current \|\| introSavingRef\.current\) return/)
  assert.match(lesson, /kgAlphabetService\.introSeen\(\)/)
  assert.doesNotMatch(lesson, /Skip introduction|skip-intro|onClick=\{skipIntro\}/i)
  assert.match(lesson, /onError=\{\(\) => \{ setVideoError/)
  assert.match(lesson, /The story finished, but your progress did not save yet/)
  assert.match(controller, /req\.body\?\.videoEnded !== true/)
  assert.match(controller, /if \(!state\.introSeen\) throw ApiError\.conflict/)
})

test('the lesson keeps Task 1 private S3 playback and uses recoverable errors for missing audio', () => {
  assert.match(service, /apiClientBlob\(key, \{ cache: 'force-cache', signal \}\)/)
  assert.match(service, /kgAlphabetService =/)
  assert.match(lesson, /kgAlphabetService\.ensure/)
  assert.match(lesson, /kgAlphabetService\.play/)
  assert.match(lesson, /Miss Julie.s voice is taking a little rest/)
  assert.match(controller, /getKGStaticAudio\(audioKey\(id\)\)/)
  assert.match(controller, /Content-Type', 'audio\/mpeg'/)
  const lessonStart = lesson.indexOf('const beginStep = useCallback')
  const lessonEnd = lesson.indexOf('const finishIntro =', lessonStart)
  const beginStep = lesson.slice(lessonStart, lessonEnd)
  assert.match(beginStep, /setFeedback\(friendlyAudioError\(\)\)\s*setPhase\('error'\)/)
  assert.doesNotMatch(beginStep, /setPhase\('intro-error'\)/)
})

test('speech capture is single-session, retries silence, and stops when the lesson is hidden', () => {
  assert.match(lesson, /recorderRef\.current\?\.state === 'recording' \|\| micStartingRef\.current\) return/)
  assert.match(lesson, /document\.addEventListener\('visibilitychange', stopWhenHidden\)/)
  assert.match(lesson, /retryNumber < 2/)
  assert.match(lesson, /retryListeningRef\.current\(stepIndex, token\)/)
  assert.match(lesson, /onClick=\{stopRecording\}/)
  assert.match(lesson, /Please allow microphone access/)
})

test('KG mandatory story requests real fullscreen and pauses on escape, keeps native video controls unavailable', () => {
  assert.match(lesson, /frame\.requestFullscreen\(\{ navigationUI: 'hide' \}\)/)
  assert.match(lesson, /document\.addEventListener\('fullscreenchange', fullscreenChanged\)/)
  assert.match(lesson, /video\.pause\(\)/)
  assert.match(lesson, /controls=\{false\}/)
  assert.match(lesson, /onSeeking=\{keepVideoUnskippable\}/)
  assert.match(lesson, /maxVideoTimeRef\.current < video\.duration/)
  assert.match(lesson, /setPhase\('intro'\)\n    \}\)/)
  assert.doesNotMatch(lesson, /Pause story<\/button>/)
})

test('each KG entry gets a backend ticket and a completed watch before attempts', () => {
  assert.match(lesson, /kgAlphabetService\.beginIntro\(\)/)
  assert.match(lesson, /kgAlphabetService\.introSeen\(\)/)
  assert.match(service, /X-KG-Intro-Playback/)
  assert.match(controller, /INTRO_MINIMUM_MS = 59_000/)
  assert.match(controller, /assertIntroTicket\(req/)
})

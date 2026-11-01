import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const client = read('../../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts')
const lesson = read('../../features/lessons/grades/kg/level-01/LevelExperience.tsx')
const routes = read('../../../backend/src/routes/kg-alphabet.routes.ts')
const controller = read('../../../backend/src/controllers/kg-alphabet.controller.ts')
const attempt = read('../../../backend/src/models/KGAlphabetAttempt.ts')

test('KG recovery lookup requires the authenticated per-visit intro ticket', () => {
  assert.match(routes, /router\.get\('\/pending-feedback', requireRole\('STUDENT'\), KGAlphabetController\.pendingFeedback\)/)
  assert.match(client, /pendingFeedback: \(\) => apiClient<\{ pending: KGAttemptResponse \| null \}>\('\/kg-alphabet\/pending-feedback'/)
  assert.match(client, /cache: 'no-store', headers: introTicketHeaders\(\)/)
  const handler = controller.split('  pendingFeedback: catchAsync(')[1]?.split('  previewAttempt:')[0]
  assert.ok(handler)
  assert.match(handler, /await assertIntroTicket\(req, student\._id, student\.schoolId\)/)
  assert.match(handler, /await frozenKGFeedback\(recent\)/)
  assert.match(handler, /awaitingFeedbackPlayback !== true/)
  assert.match(handler, /createdAt: \{ \$gte: new Date\(Date\.now\(\) - 30 \* 60_000\) \}/)
  assert.match(attempt, /awaitingFeedbackPlayback: \{ type: Boolean \}/)
})

test('KG intro still finishes before recovery, preserving a full video on every lab entry', () => {
  const intro = lesson.split('  const finishIntro = useCallback(')[1]?.split('  // Browsers allow Esc')[0]
  assert.ok(intro)
  const gateAt = intro.indexOf('await kgAlphabetService.introSeen()')
  const recoveryAt = intro.indexOf('await kgAlphabetService.pendingFeedback()')
  assert.ok(gateAt > -1 && recoveryAt > gateAt)
  assert.match(intro, /pendingResultRef\.current = \{ result: pending, stepIndex \}/)
  assert.match(intro, /setPhase\('error'\)/)
  assert.match(intro, /await beginStep\(updated\?\.currentIndex \?\? 0\)/)
  assert.doesNotMatch(intro, /kgAlphabetService\.submitPrepared\(/)
})

test('normal retry replays saved voice instead of re-sending the childs recording', () => {
  const retry = lesson.split('  const retryLesson = async () => {')[1]?.split('  const choosePicture =')[0]
  assert.ok(retry)
  assert.match(retry, /else if \(result\) await handleOutcome\(result\.result\.outcome/)
  assert.doesNotMatch(retry, /submitPrepared\(/)
})

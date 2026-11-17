import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const component = await readFile(new URL('../../app/school/students/student-management-page.tsx', import.meta.url), 'utf8')
const toggleStart = component.indexOf('  async function toggleKGAlphabetPilot')
const toggleEnd = component.indexOf('\n  async function handleResetCode', toggleStart)
assert.notEqual(toggleStart, -1, 'KG pilot toggle handler exists')
assert.notEqual(toggleEnd, -1, 'KG pilot toggle handler has an end boundary')
const toggleSource = component
  .slice(toggleStart, toggleEnd)
  .replace('student: StudentListItem', 'student')

function createToggleHarness(setKGAlphabetPilot, fetchStudents = async () => {}) {
  const student = { id: 'student-record', grade: 0, kgAlphabetPilotEnabled: false, fullName: 'Test Student' }
  const students = [student]
  const alerts = []
  let fetchCount = 0
  let updatingId = null
  const handler = new Function(
    'schoolService',
    'pilotUpdateInFlight',
    'pilotUpdating',
    'role',
    'window',
    'setPilotUpdating',
    'setStudents',
    'fetchStudents',
    'alert',
    `${toggleSource}; return toggleKGAlphabetPilot`,
  )(
    { setKGAlphabetPilot },
    { current: false },
    null,
    'SCHOOL_ADMIN',
    { confirm: () => true },
    (id) => { updatingId = id },
    (update) => students.splice(0, students.length, ...update(students)),
    async () => {
      fetchCount += 1
      await fetchStudents(students)
    },
    (message) => alerts.push(message),
  )

  return {
    student,
    students,
    alerts,
    handler,
    fetchCount: () => fetchCount,
    updatingId: () => updatingId,
  }
}

test('KG pilot toggle accepts matching saved state and refreshes the roster', async () => {
  const harness = createToggleHarness(async () => ({ studentId: 'student-record', enabled: true }))

  await harness.handler(harness.student)

  assert.equal(harness.students[0].kgAlphabetPilotEnabled, true)
  assert.equal(harness.fetchCount(), 1)
  assert.deepEqual(harness.alerts, [])
  assert.equal(harness.updatingId(), null)
})

test('KG pilot toggle retains the confirmed state and reports backend rejection', async () => {
  const harness = createToggleHarness(async () => { throw new Error('Request rejected') })

  await harness.handler(harness.student)

  assert.equal(harness.students[0].kgAlphabetPilotEnabled, false)
  assert.deepEqual(harness.alerts, ['Request rejected'])
  assert.equal(harness.fetchCount(), 0)
})

test('KG pilot toggle rejects a response for a different student', async () => {
  const harness = createToggleHarness(async () => ({ studentId: 'different-record', enabled: true }))

  await harness.handler(harness.student)

  assert.equal(harness.students[0].kgAlphabetPilotEnabled, false)
  assert.match(harness.alerts[0], /did not confirm/)
  assert.equal(harness.fetchCount(), 0)
})

test('KG pilot toggle rejects a saved enabled value that differs from the request', async () => {
  const harness = createToggleHarness(async () => ({ studentId: 'student-record', enabled: false }))

  await harness.handler(harness.student)

  assert.equal(harness.students[0].kgAlphabetPilotEnabled, false)
  assert.match(harness.alerts[0], /did not confirm/)
  assert.equal(harness.fetchCount(), 0)
})

test('KG pilot toggle ignores rapid repeated clicks while the request is pending', async () => {
  let resolveRequest
  let requestCount = 0
  const request = new Promise((resolve) => { resolveRequest = resolve })
  const harness = createToggleHarness(() => {
    requestCount += 1
    return request
  })

  const firstClick = harness.handler(harness.student)
  const repeatedClick = harness.handler(harness.student)

  assert.equal(requestCount, 1)
  resolveRequest({ studentId: 'student-record', enabled: true })
  await Promise.all([firstClick, repeatedClick])

  assert.equal(harness.students[0].kgAlphabetPilotEnabled, true)
  assert.equal(harness.fetchCount(), 1)
  assert.match(component, /disabled=\{pilotUpdating === student\.id\}/)
})

test('successful toggle roster refresh reconciles the row from fetched data', async () => {
  const harness = createToggleHarness(
    async () => ({ studentId: 'student-record', enabled: true }),
    async (students) => {
      students.splice(0, students.length, { ...students[0], kgAlphabetPilotEnabled: true })
    },
  )

  await harness.handler(harness.student)

  assert.equal(harness.fetchCount(), 1)
  assert.equal(harness.students[0].kgAlphabetPilotEnabled, true)
})

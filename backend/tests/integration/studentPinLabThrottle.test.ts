import request from 'supertest'
import { createApp } from '../../src/app'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { VoiceWarmupService } from '../../src/services/voice-warmup.service'
import { hashPassword } from '../../src/utils/password'
import { pinLookup } from '../../src/utils/student-pin'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

/**
 * Shared-lab PIN throttling test. Makes genuine HTTP requests and bcrypt
 * comparisons against a disposable MongoDB instance; no production students.
 * This suite runs in its own Jest process so in-memory rate-limit buckets
 * cannot leak into other integration fixtures.
 */
const app = createApp()
const VALID_PIN = '64021'

beforeAll(() => connectTestDatabase())
afterAll(() => disconnectTestDatabase())
beforeEach(() => {
  jest.spyOn(VoiceWarmupService, 'schedule').mockImplementation(() => undefined)
})
afterEach(async () => {
  jest.restoreAllMocks()
  await clearTestDatabase()
})

async function seed() {
  const school = await School.create({
    name: 'Shared-NAT KG Demo School', code: 'KG36LAB',
    status: 'active', passwordHash: 'synthetic-school-hash',
  })
  return Student.create({
    schoolId: school._id, fullName: 'Synthetic PIN Login Student',
    rollNumber: 'G0-LIMIT-1', grade: 0, className: 'LAB-0',
    avatarType: 'BOY', status: 'active', kgAlphabetPilotEnabled: true,
    passwordHash: await hashPassword(VALID_PIN), pinLookup: pinLookup(VALID_PIN),
  })
}

const postPin = (pin: unknown) => request(app)
  .post('/api/auth/student/pin-login').send({ pin })

it('accepts repeated valid five-digit PIN sign-ins behind the same lab IP without hitting the old 20/15-minute quota', async () => {
  const student = await seed()
  const attempts = 25
  for (let i = 0; i < attempts; i++) {
    const login = await postPin(VALID_PIN).expect(200)
    expect(login.body.data.student.id).toBe(student._id.toString())
    expect(login.body.data.student).not.toHaveProperty('passwordHash')
    expect(login.body.data.student).not.toHaveProperty('pinLookup')
    expect(login.body.data.token).toEqual(expect.any(String))
  }
  expect((await Student.findById(student._id).lean())?.grade).toBe(0)
})

it('limits brute-force PIN guessing per candidate and across the shared source IP without disclosing raw PINs', async () => {
  await seed()
  // Even after a handful of failed attempts, a different valid student's
  // PIN should still be usable from the same NAT.
  for (let i = 0; i < 5; i++) {
    const bad = await (i === 4
      ? request(app).post('/api/v1/auth/student/pin-login').send({ pin: '11111' })
      : postPin('11111')).expect(401)
    expect(bad.body.error.message).toBe('Invalid PIN')
  }
  const limitedPin = await postPin('11111').expect(429)
  expect(limitedPin.body.error.code).toBe('RATE_LIMITED')
  expect(JSON.stringify(limitedPin.body)).not.toContain('11111')
  await postPin(VALID_PIN).expect(200)

  // Rotate candidate guesses: per-PIN throttling alone would not stop
  // enumeration of a small 100000-PIN space.
  // The source bucket counts the five 401s and the one 429 above.
  for (let i = 0; i < 74; i++) {
    const pin = String(20000 + i).padStart(5, '0')
    // An untrusted X-Forwarded-For header must NOT reset the source limit.
    await postPin(pin).set('X-Forwarded-For', '198.51.100.' + ((i % 250) + 1)).expect(401)
  }
  const blocked = await postPin('99999').set('X-Forwarded-For', '203.0.113.99').expect(429)
  expect(blocked.body.error.code).toBe('RATE_LIMITED')
  expect(JSON.stringify(blocked.body)).not.toContain('99999')
})

import request from 'supertest'
import express, { type Request } from 'express'
import rateLimit from 'express-rate-limit'
import mongoose, { Types } from 'mongoose'
import { MongoRateLimitStore, prepareSharedRateLimitStore } from '../../src/middleware/mongo-rate-limit-store'
import { generalRateLimitKey } from '../../src/middleware/rateLimit'
import { signToken } from '../../src/utils/jwt'
import { connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

/**
 * Real MongoDB, two independent limiter/Express instances with the SAME
 * namespace, synthetic tokens only. No Redis, school data or cloud services.
 *
 * CI must opt into the production-equivalent backend selection with
 * TALKORA_SHARED_RATE_LIMITS=true. This test itself exercises Mongo directly
 * regardless of test NODE_ENV, and never touches an existing database.
 */
beforeAll(async () => {
  await connectTestDatabase()
  await prepareSharedRateLimitStore()
})
afterAll(() => disconnectTestDatabase())
afterEach(async () => {
  await mongoose.connection.db!.collection('talkora_rate_limit_buckets').deleteMany({})
})

const ms = 60_000

it('atomically counts cross-instance concurrent hits, decrements, expires and never persists raw identifiers', async () => {
  const left = new MongoRateLimitStore('atomic-shared-test', ms)
  const right = new MongoRateLimitStore('atomic-shared-test', ms)
  const rawKey = '127.0.0.1:student:03142'
  const values = await Promise.all(Array.from({ length: 40 }, (_, n) =>
    (n % 2 ? left : right).increment(rawKey)))
  const hitCounts = values.map((value) => value.totalHits).sort((a, b) => a - b)
  expect(hitCounts).toEqual(Array.from({ length: 40 }, (_, i) => i + 1))
  expect(new Set(values.map((value) => value.resetTime.getTime())).size).toBe(1)

  const db = mongoose.connection.db!
  const bucket = await db.collection('talkora_rate_limit_buckets').findOne({})
  expect(bucket).toBeTruthy()
  expect(bucket?._id).toMatch(/^[a-f0-9]{64}$/)
  expect(JSON.stringify(bucket)).not.toContain(rawKey)
  expect(JSON.stringify(bucket)).not.toContain('03142')

  await left.decrement(rawKey)
  expect((await right.increment(rawKey)).totalHits).toBe(40)
  await db.collection('talkora_rate_limit_buckets').updateOne(
    { _id: bucket?._id }, { $set: { resetTime: new Date(0), expiresAt: new Date(0) } },
  )
  expect((await left.increment(rawKey)).totalHits).toBe(1)
  await right.resetKey(rawKey)
  expect((await left.increment(rawKey)).totalHits).toBe(1)
  const indexes = await db.collection('talkora_rate_limit_buckets').indexes()
  expect(indexes).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'expiresAt_ttl', expireAfterSeconds: 0 }),
  ]))
})

it('enforces one budget across two separate HTTP application instances under concurrent load', async () => {
  const makeApp = () => {
    const app = express()
    app.get('/check', rateLimit({
      windowMs: ms, limit: 3, standardHeaders: true, legacyHeaders: false,
      store: new MongoRateLimitStore('cross-app-test', ms),
      keyGenerator: (req) => String(req.ip),
    }), (_req, res) => res.status(200).json({ ok: true }))
    return app
  }
  const nodeA = makeApp()
  const nodeB = makeApp()
  const replies = await Promise.all(Array.from({ length: 10 }, (_, i) =>
    request(i % 2 ? nodeA : nodeB).get('/check')))
  expect(replies.filter((response) => response.status === 200)).toHaveLength(3)
  expect(replies.filter((response) => response.status === 429)).toHaveLength(7)
  expect(replies.every((response) => response.headers['ratelimit-limit'] === '3')).toBe(true)
})

it('uses signed student identity, not one school IP, for the general API budget', async () => {
  const schoolId = new Types.ObjectId().toString()
  const studentA = new Types.ObjectId().toString()
  const studentB = new Types.ObjectId().toString()
  const tokenA = signToken({ sub: studentA, schoolId, role: 'STUDENT', sv: 0 })
  const tokenB = signToken({ sub: studentB, schoolId, role: 'STUDENT', sv: 0 })
  const fakeReq = (token: string) => ({
    get: () => token,
    ip: '127.0.0.1',
  } as unknown as Request)
  expect(generalRateLimitKey(fakeReq('Bearer ' + tokenA))).not.toBe(generalRateLimitKey(fakeReq('Bearer ' + tokenB)))
  expect(generalRateLimitKey(fakeReq('Bearer ' + tokenA))).toBe(generalRateLimitKey(fakeReq('Bearer ' + tokenA)))
  expect(generalRateLimitKey(fakeReq('Bearer invalid.jwt.signature'))).toBe('ip:127.0.0.1')
  expect(generalRateLimitKey(fakeReq('no authentication'))).toBe('ip:127.0.0.1')

  const makeApp = () => {
    const app = express()
    app.get('/protected', rateLimit({
      windowMs: ms, limit: 3, standardHeaders: true, legacyHeaders: false,
      store: new MongoRateLimitStore('signed-students-test', ms),
      keyGenerator: generalRateLimitKey,
    }), (_req, res) => res.status(200).json({ ok: true }))
    return app
  }
  const nodeA = makeApp()
  const nodeB = makeApp()
  for (let i = 0; i < 3; i++) {
    await request(i % 2 ? nodeA : nodeB).get('/protected')
      .set('Authorization', 'Bearer ' + tokenA).expect(200)
  }
  // A valid second student behind the same NAT has an independent quota.
  await request(nodeB).get('/protected').set('Authorization', 'Bearer ' + tokenB).expect(200)
  await request(nodeA).get('/protected').set('Authorization', 'Bearer ' + tokenA).expect(429)
  await request(nodeA).get('/protected').set('Authorization', 'Bearer fake.token')
    .set('X-Forwarded-For', '198.51.100.21').expect(200)
})

it('enforces failed PIN attempts across replicas while uncounting successful logins', async () => {
  const makeNode = () => {
    const app = express()
    app.use(express.json())
    app.post('/pin', rateLimit({
      windowMs: ms, limit: 3, skipSuccessfulRequests: true,
      standardHeaders: true, legacyHeaders: false,
      store: new MongoRateLimitStore('failed-pin-shared-test', ms),
      keyGenerator: (req) => 'candidate:' + String(req.body.pin),
    }), (req, res) => {
      res.status(req.body.pin === 'right' ? 200 : 401).json({ ok: req.body.pin === 'right' })
    })
    return app
  }
  const nodeA = makeNode()
  const nodeB = makeNode()
  for (let i = 0; i < 5; i++) {
    await request(i % 2 ? nodeA : nodeB).post('/pin').send({ pin: 'right' }).expect(200)
  }
  for (let i = 0; i < 3; i++) {
    await request(i % 2 ? nodeA : nodeB).post('/pin').send({ pin: 'wrong' }).expect(401)
  }
  await request(nodeB).post('/pin').send({ pin: 'wrong' }).expect(429)
  // Different valid candidate does not consume its neighbor's failed budget.
  await request(nodeA).post('/pin').send({ pin: 'right' }).expect(200)
})

/** Bounded read-only HTTP load against a database/server created by THIS process.
 * NODE_ENV=test TALKORA_SHARED_RATE_LIMITS=true TALKORA_SYNTHETIC_LOAD_ACK=LOCAL
 * pnpm exec tsx src/scripts/profile-synthetic-kg-load.ts
 * Never accepts a target URL, school account, token file or external Mongo URI.
 */
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { randomBytes } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { writeFile } from 'node:fs/promises'
import { createApp } from '../app'
import { Student } from '../models/Student'
import { School } from '../models/School'
import { KGAlphabetProgress } from '../models/KGAlphabetProgress'
import { KGLevel2Progress } from '../models/KGLevel2Progress'
import { KGContinuationProgress } from '../models/KGContinuationProgress'
import { prepareSharedRateLimitStore, sharedRateLimitsEnabled } from '../middleware/mongo-rate-limit-store'
import { signToken } from '../utils/jwt'

async function main() {
  if (process.env.NODE_ENV !== 'test' || process.env.TALKORA_SYNTHETIC_LOAD_ACK !== 'LOCAL' || !sharedRateLimitsEnabled()) {
    throw Error('Use an isolated test process with explicit LOCAL synthetic acknowledgement and shared rate limits')
  }
  const count = Number(process.env.TALKORA_SYNTHETIC_ACCOUNTS || 10_000)
  const requests = Number(process.env.TALKORA_SYNTHETIC_REQUESTS || 600)
  if (!Number.isInteger(count) || count < 100 || count > 10_000 ||
      !Number.isInteger(requests) || requests < 100 || requests > 3000) throw Error('Synthetic bounds exceeded')
  if (mongoose.connection.readyState !== 0) throw Error('Refusing an existing database connection')
  const database = 'talkora_synthetic_load_' + randomBytes(8).toString('hex')
  const mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' },
    instance: { ip: '127.0.0.1', dbName: database, args: ['--nounixsocket'] } })
  let server: ReturnType<ReturnType<typeof createApp>['listen']> | undefined
  try {
    await mongoose.connect(mongo.getUri(), { dbName: database })
    const schools = await School.create([0, 1].map(i => ({ name: 'Synthetic capacity school ' + i,
      code: 'SYNTHETIC' + i, passwordHash: 'not-a-login-credential', status: 'active' })))
    const students = await Student.insertMany(Array.from({ length: count }, (_, i) => ({
      schoolId: schools[i % 2]._id, fullName: 'Synthetic learner ' + i,
      rollNumber: String(i), grade: 0, passwordHash: 'not-a-login-credential',
      status: 'active', avatarType: 'BOY', kgAlphabetPilotEnabled: true,
    })))
    await KGAlphabetProgress.insertMany(students.map(s => ({ studentId: s._id, schoolId: s.schoolId,
      currentIndex: 8, introSeen: false, xp: 0, stars: 0 })))
    await KGLevel2Progress.insertMany(students.map(s => ({ studentId: s._id, schoolId: s.schoolId, currentIndex: 6 })))
    await Promise.all([Student.init(), KGAlphabetProgress.init(), KGLevel2Progress.init(), KGContinuationProgress.init()])
    await prepareSharedRateLimitStore()
    const tokens = students.map(s => signToken({ sub: String(s._id), schoolId: String(s.schoolId), role: 'STUDENT', sv: 0 }))
    server = createApp().listen(0, '127.0.0.1')
    await new Promise<void>((resolve, reject) => { server!.once('listening', resolve); server!.once('error', reject) })
    const address = server.address()
    if (!address || typeof address === 'string' || address.address !== '127.0.0.1') throw Error('Loopback listener required')
    const target = 'http://127.0.0.1:' + address.port + '/api/kg-continuation/overview'
    let cursor = 0
    const stages = []
    for (const concurrency of [1, 10, 30, 60]) {
      const times: number[] = [], statuses: Record<string, number> = {}
      let assigned = 0, failures = 0, nodePeakRss = process.memoryUsage().rss
      const started = performance.now(), cpu = process.cpuUsage()
      const monitor = setInterval(() => { nodePeakRss = Math.max(nodePeakRss, process.memoryUsage().rss) }, 25)
      try {
        await Promise.all(Array.from({ length: concurrency }, async () => {
          while (assigned++ < requests) {
            const token = tokens[cursor++ % tokens.length]
            const began = performance.now()
            try {
              const response = await fetch(target, { headers: { Authorization: 'Bearer ' + token },
                signal: AbortSignal.timeout(5000) })
              statuses[response.status] = (statuses[response.status] || 0) + 1
              const body = await response.json() as { success?: boolean; data?: { nextLevel?: number } }
              if (!response.ok || !body.success || body.data?.nextLevel !== 3) failures++
            } catch { failures++; statuses.network = (statuses.network || 0) + 1 }
            times.push(performance.now() - began)
          }
        }))
      } finally { clearInterval(monitor) }
      const seconds = (performance.now() - started) / 1000
      const cpuUsed = process.cpuUsage(cpu)
      times.sort((a,b) => a-b)
      const p = (quantile: number) => Math.round(times[Math.ceil(times.length * quantile) - 1] * 10) / 10
      const mongoStatus = await mongoose.connection.db!.admin().serverStatus()
      stages.push({ concurrency, requests: times.length, failures, errorRate: failures / times.length,
        requestsPerSecond: Math.round(times.length / seconds * 10) / 10, seconds: Math.round(seconds * 100) / 100,
        p50ms: p(.5), p95ms: p(.95), p99ms: p(.99), statuses,
        nodePeakRssMiB: Math.round(nodePeakRss / 1024 / 1024),
        nodeCpuMs: Math.round((cpuUsed.user + cpuUsed.system) / 1000),
        mongoResidentMiBAfter: mongoStatus.mem?.resident ?? null })
    }
    const result = { scenario: 'Loopback KG overview reads, one Node process including load generator, disposable MongoDB 7.0.14',
      enrolledSyntheticAccounts: count, schools: 2, sharedMongoRateLimits: true,
      paidSpeechCalls: 0, physicalAudioTested: false, productionSystemTested: false,
      stages }
    const output = process.env.TALKORA_SYNTHETIC_REPORT
    if (output) await writeFile(output, JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify(result, null, 2))
    if (stages.some(s => s.failures > 0)) process.exitCode = 1
  } finally {
    if (server) await new Promise<void>(resolve => server!.close(() => resolve()))
    if (mongoose.connection.db?.databaseName === database && mongoose.connection.host === '127.0.0.1') {
      await mongoose.connection.dropDatabase()
    }
    await mongoose.disconnect()
    await mongo.stop()
  }
}
main().catch(() => { console.error('Synthetic profile failed; no external target or credentials are accepted.'); process.exitCode = 1 })

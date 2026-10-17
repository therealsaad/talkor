import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

async function compile(path, modules = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  })
  assert.equal(compiled.diagnostics?.length || 0, 0, `${path} should parse`)
  const exports = {}
  new Function('exports', 'require', compiled.outputText)(exports, key => {
    if (key in modules) return modules[key]
    throw Error(`Unexpected dependency: ${key}`)
  })
  return exports
}

const alphabet = await compile('../../../backend/src/kg/alphabet-content.ts')
const hints = await compile('../../../backend/src/services/kg-teaching-hint.ts')

test('existing alphabet work stays A-D and new homework is included in the authoritative voice manifest', () => {
  assert.equal(alphabet.AUDIO_LINES['homework-abcd'].includes('at home'), true)
  assert.equal(alphabet.AUDIO_MANIFEST.some(line => line.id === 'homework-abcd' && line.scope === 'level'), true)
  assert.match(alphabet.audioKey('homework-abcd'), /^kg\/level-1\/miss-julie\/v1\/homework-abcd\.mp3$/)
  assert.equal(alphabet.ACTIVITY_AUDIO_IDS['say-a'].includes('say-a'), true)
})

test('bilingual child-friendly hint never changes grading of correct answers', () => {
  assert.equal(hints.kgTeachingHint('A', 'speak', 'correct'), null)
  assert.match(hints.kgTeachingHint('B', 'speak', 'incorrect'), /B se ball/)
  assert.match(hints.kgTeachingHint('C', 'touch', 'incorrect'), /cat ki tasveer/i)
  assert.match(hints.kgTeachingHint('D', 'speak', 'unclear'), /Koi baat nahi/)
})

test('report CSV is spreadsheet-safe, keyset-paged, and teacher-restricted', async () => {
  const filters = []
  const students = Array.from({ length: 5 }, (_, i) => ({ _id: {
    toString: () => String(i + 1).padStart(24, '0'),
  } }))
  class ObjectId { constructor(value) { this.value = value } toString() { return this.value }
    static isValid(id) { return /^[a-f0-9]{24}$/i.test(String(id)) } }
  const mocks = {
    mongoose: { Types: { ObjectId } },
    '../models/Student': { Student: { find(filter) {
      filters.push(filter)
      return { select() { return this }, sort() { return this }, limit(limit) { this.limitValue = limit; return this },
        async lean() { return students.filter(s => !filter._id || s._id.toString() > filter._id.$gt.toString()).slice(0, this.limitValue) } }
    } } },
    './student-report.service': { StudentReportService: { generate: async (schoolId, id, role, requesterId, period) => ({
      student: { id, fullName: '=HYPERLINK("x")', rollNumber: '12', grade: 0, className: 'KG' },
      metrics: { activeDays: 1, attemptCount: 2, correctAttempts: 1, accuracyPercent: 50, totalMinutes: 3,
        completedLevels: 0, totalXp: 4, kgLevel1Activities: 2, kgLevel1Complete: false, unclearSpeechAttempts: 1 },
      period, needsPractice: ['A'], homePractice: ['Say apple'], generatedAt: '2026-10-16T00:00:00Z',
    }) } },
    '../utils/ApiError': { ApiError: { badRequest: msg => Error(msg) } },
  }
  const report = await compile('../../../backend/src/services/report-csv.service.ts', mocks)
  const schoolId = 'a'.repeat(24), requesterId = 'b'.repeat(24)
  const first = await report.reportPage({ schoolId, role: 'TEACHER', requesterId, period: 'weekly', limit: 2 })
  assert.equal(first.records, 2)
  assert.equal(first.nextCursor, students[1]._id.toString())
  assert.equal(filters[0].schoolId, schoolId)
  assert.equal(filters[0].teacherId, requesterId)
  assert.match(first.csv, /'\=HYPERLINK/)
  const second = await report.reportPage({ schoolId, role: 'TEACHER', requesterId, period: 'weekly', limit: 2, after: first.nextCursor })
  const third = await report.reportPage({ schoolId, role: 'TEACHER', requesterId, period: 'weekly', limit: 2, after: second.nextCursor })
  assert.equal(second.records, 2); assert.equal(third.records, 1); assert.equal(third.nextCursor, null)
  await assert.rejects(report.reportPage({ schoolId, role: 'TEACHER', requesterId, period: 'weekly', limit: 999 }))
  await assert.rejects(report.reportPage({ schoolId, role: 'TEACHER', requesterId, period: 'weekly', after: 'wrong' }))
  assert.equal(report.csvCell('  =1+1'), "\"'  =1+1\"")
})

test('static KG audio cache deduplicates concurrent S3 reads and retries missing objects', async () => {
  let calls = 0
  const { getKGStaticAudio } = await compile('../../../backend/src/services/kg-static-audio-cache.ts', {
    './S3Service': { S3Service: { async getAudio(key) { calls++; await new Promise(r => setTimeout(r, 1)); return key === 'missing' ? null : Buffer.from('audio') } } },
  })
  const [a, b] = await Promise.all([getKGStaticAudio('lesson-a'), getKGStaticAudio('lesson-a')])
  assert.equal(calls, 1); assert.deepEqual(a, b)
  await getKGStaticAudio('lesson-a'); assert.equal(calls, 1)
  await getKGStaticAudio('missing'); await getKGStaticAudio('missing')
  assert.equal(calls, 3)
})

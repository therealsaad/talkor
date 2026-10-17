/**
 * Cron-compatible report snapshot job; must run in a private worker with Mongo credentials.
 * It never emails or exposes students' information publicly. Example scheduling in docs.
 */
import { createWriteStream, mkdirSync, renameSync, unlinkSync } from 'node:fs'
import { once } from 'node:events'
import path from 'node:path'
import { createHash } from 'node:crypto'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { School } from '../models/School'
import { reportPage } from '../services/report-csv.service'
import type { ReportPeriod } from '../services/student-report.service'

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`)
  return index < 0 ? undefined : process.argv[index + 1]
}
function timestamp() { return new Date().toISOString().replace(/[:.]/g, '-') }

async function main() {
  if (process.env.TALKORA_PRIVATE_REPORT_EXPORT !== 'enabled') {
    throw new Error('Refusing to export children’s records without TALKORA_PRIVATE_REPORT_EXPORT=enabled')
  }
  const period = argument('period')
  if (!['daily', 'weekly', 'monthly'].includes(period || '')) throw new Error('Use --period daily|weekly|monthly')
  const typedPeriod = period as ReportPeriod
  const schoolId = argument('school')
  if (!schoolId || !mongoose.isValidObjectId(schoolId)) throw new Error('Use --school <24-digit school ObjectId>')
  const outDir = process.env.TALKORA_PRIVATE_REPORT_DIR
  if (!outDir || !path.isAbsolute(outDir)) throw new Error('TALKORA_PRIVATE_REPORT_DIR must be an absolute, private directory')
  mkdirSync(outDir, { recursive: true, mode: 0o700 })
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000 })
  const school = await School.findOne({ _id: schoolId, status: 'active' }).select('_id').lean()
  if (!school) throw new Error('School not found or inactive')
  const filename = `talkora-${schoolId}-${typedPeriod}-${timestamp()}.csv`
  const outFile = path.join(outDir, filename)
  const tempFile = `${outFile}.partial`
  const stream = createWriteStream(tempFile, { flags: 'wx', mode: 0o600 })
  const digest = createHash('sha256')
  let cursor: string | undefined
  let count = 0
  try {
    do {
      const result = await reportPage({ schoolId, requesterId: schoolId, role: 'SCHOOL_ADMIN',
        period: typedPeriod, after: cursor, limit: 50 })
      const payload = cursor ? result.csv.replace(/^\uFEFF[^\r]*\r\n/, '') : result.csv
      digest.update(payload)
      if (!stream.write(payload)) await once(stream, 'drain')
      count += result.records
      cursor = result.nextCursor || undefined
    } while (cursor)
    stream.end()
    await once(stream, 'finish')
    renameSync(tempFile, outFile) // Only complete, closed exports become distributable.
    // Only operational metadata is printed: no child names, IDs, scores, or PINs.
    process.stdout.write(JSON.stringify({ status: 'exported', schoolId, period,
      records: count, filename, sha256: digest.digest('hex') }) + '\n')
  } catch (error) {
    stream.destroy()
    try { unlinkSync(tempFile) } catch { /* possible failed opening or already removed */ }
    throw error
  }
}
main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : 'Report export failed'}\n`); process.exitCode = 1 })
  .finally(async () => { if (mongoose.connection.readyState) await mongoose.disconnect() })

import { createHmac } from 'node:crypto'
import mongoose from 'mongoose'
import { env } from '../config/env'

/**
 * Fixed-window, Mongo-backed express-rate-limit v7 store.
 *
 * Uses the backend's EXISTING MongoDB connection and a single atomic
 * findOneAndUpdate aggregation per request. One process cannot reset another
 * process's counters, and TTL is housekeeping only: expiry is enforced in the
 * atomic update even if Mongo's asynchronous TTL monitor has not run.
 *
 * Production ALWAYS uses this store. Local development/test can opt into the
 * same behavior with TALKORA_SHARED_RATE_LIMITS=true; the default local/test
 * behavior remains express-rate-limit's inexpensive in-memory store.
 */
export function sharedRateLimitsEnabled(): boolean {
  return env.isProd || process.env.TALKORA_SHARED_RATE_LIMITS === 'true'
}

interface RateLimitBucket {
  _id: string
  totalHits: number
  resetTime: Date
  expiresAt: Date
}

const COLLECTION_NAME = 'talkora_rate_limit_buckets'
const indexPromises = new WeakMap<object, Promise<string>>()

async function readyCollection() {
  const db = mongoose.connection.db
  if (!db || mongoose.connection.readyState !== 1) {
    // Fail closed: a disconnected distributed limiter must never silently
    // turn into an unbounded per-process bypass.
    throw new Error('Shared rate-limit MongoDB connection unavailable')
  }
  const collection = db.collection<RateLimitBucket>(COLLECTION_NAME)
  let ready = indexPromises.get(db)
  if (!ready) {
    ready = collection.createIndex(
      { expiresAt: 1 },
      { name: 'expiresAt_ttl', expireAfterSeconds: 0 },
    )
    indexPromises.set(db, ready)
    // A failed index build must be retryable on the next request/boot.
    void ready.catch(() => { indexPromises.delete(db) })
  }
  await ready
  return collection
}

/** Ensure the TTL collection/index is writable before accepting prod traffic. */
export async function prepareSharedRateLimitStore(): Promise<void> {
  if (!sharedRateLimitsEnabled()) return
  await readyCollection()
}

export class MongoRateLimitStore {
  readonly prefix: string

  constructor(namespace: string, private readonly windowMs: number) {
    if (!/^[a-z0-9-]{1,40}$/.test(namespace)) throw new Error('Invalid rate-limit namespace')
    if (!Number.isSafeInteger(windowMs) || windowMs <= 0) throw new Error('Invalid rate-limit window')
    this.prefix = 'talkora-rate-limit-v1:' + namespace + ':'
  }

  private bucketId(key: string) {
    // Never persist raw IP addresses, student IDs, or five-digit candidate
    // PINs as MongoDB keys. This secret must match across all replicas.
    return createHmac('sha256', process.env.RATE_LIMIT_KEY_SECRET || env.jwtSecret)
      .update(this.prefix).update('\0').update(key).digest('hex')
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const collection = await readyCollection()
    const active = { $gt: ['$resetTime', '$$NOW'] }
    const result = await collection.findOneAndUpdate(
      { _id: this.bucketId(key) },
      [
        {
          $set: {
            totalHits: {
              $cond: [active, { $add: [{ $ifNull: ['$totalHits', 0] }, 1] }, 1],
            },
            resetTime: {
              $cond: [
                active,
                '$resetTime',
                { $dateAdd: { startDate: '$$NOW', unit: 'millisecond', amount: this.windowMs } },
              ],
            },
          },
        },
        { $set: { expiresAt: '$resetTime' } },
      ],
      { upsert: true, returnDocument: 'after', projection: { totalHits: 1, resetTime: 1 } },
    )
    if (!result || typeof result.totalHits !== 'number' ||
      !Number.isSafeInteger(result.totalHits) || !(result.resetTime instanceof Date)) {
      throw new Error('Shared rate-limit counter did not return an atomic result')
    }
    return { totalHits: result.totalHits, resetTime: result.resetTime }
  }

  async decrement(key: string): Promise<void> {
    const collection = await readyCollection()
    // Needed for skipSuccessfulRequests. Never create a bucket during a
    // decrement; never let a delayed 200 response make hits negative.
    await collection.updateOne(
      { _id: this.bucketId(key), resetTime: { $gt: new Date() }, totalHits: { $gt: 0 } },
      [{ $set: { totalHits: { $max: [0, { $subtract: ['$totalHits', 1] }] } } }],
    )
  }

  async resetKey(key: string): Promise<void> {
    const collection = await readyCollection()
    await collection.deleteOne({ _id: this.bucketId(key) })
  }
}

export function sharedRateLimitStore(namespace: string, windowMs: number) {
  return sharedRateLimitsEnabled() ? new MongoRateLimitStore(namespace, windowMs) : undefined
}

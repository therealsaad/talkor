import rateLimit from 'express-rate-limit'
import { createHash } from 'node:crypto'
import type { Request } from 'express'
import { pinLookup } from '../utils/student-pin'
import { verifyToken } from '../utils/jwt'
import { sharedRateLimitStore } from './mongo-rate-limit-store'

const QUARTER_HOUR_MS = 15 * 60_000
const ONE_MINUTE_MS = 60_000

/**
 * The general limiter runs before per-route authentication. Only a VALID,
 * signed, unexpired STUDENT JWT gets its own per-student quota. Fake/expired
 * bearer headers and unauthenticated requests stay on the source-IP quota.
 */
export function generalRateLimitKey(req: Request): string {
  const authorization = req.get('Authorization')
  if (authorization?.startsWith('Bearer ') && authorization.length < 4096) {
    try {
      const payload = verifyToken(authorization.slice(7))
      if (payload.role === 'STUDENT' &&
        /^[a-f0-9]{24}$/i.test(payload.sub) && /^[a-f0-9]{24}$/i.test(payload.schoolId)) {
        return 'student:' + payload.schoolId + ':' + payload.sub
      }
    } catch {
      // Bad signatures cannot evade the source-IP bucket.
    }
  }
  return 'ip:' + (req.ip || 'unknown')
}

export const generalLimiter = rateLimit({
  windowMs: QUARTER_HOUR_MS,
  limit: 300,
  keyGenerator: generalRateLimitKey,
  store: sharedRateLimitStore('general', QUARTER_HOUR_MS),
  standardHeaders: true,
  legacyHeaders: false,
  // Voice has dedicated burst-aware limits below; applying both would make the
  // stricter general bucket eventually cut off a healthy lesson session.
  skip: (req) => req.path.startsWith('/api/v1/voice') || req.path.startsWith('/api/voice') ||
    req.path.startsWith('/api/v1/kg-alphabet') || req.path.startsWith('/api/kg-alphabet') ||
    // School labs share one NAT/IP. Authentication is separately guarded by
    // BOTH a PIN-guess bucket and a failure-only source-IP bucket below.
    // Leaving the 300/request general IP bucket on PIN login would block
    // hundreds of valid students despite each having an independent PIN.
    /^\/api(?:\/v1)?\/auth\/student\/pin-login\/?$/.test(req.path),
})

/**
 * KG-to-Class-10 shared school labs must not exhaust one IP bucket by signing
 * in successfully. The IP limiter counts only non-2xx replies (including
 * malformed inputs), while the independent PIN bucket slows distributed
 * guesses against a specific 5-digit PIN.
 *
 * Production counters share an atomic MongoDB store across replicas.
 * Local/test defaults to memory unless TALKORA_SHARED_RATE_LIMITS=true.
 * Never use a client-supplied IP header as identity; production ingress
 * must supply an explicitly configured, trusted client address.
 */
export const studentPinIpFailureLimiter = rateLimit({
  windowMs: QUARTER_HOUR_MS,
  limit: 80,
  store: sharedRateLimitStore('student-pin-ip', QUARTER_HOUR_MS),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: {
    code: 'RATE_LIMITED',
    message: 'Too many unsuccessful sign-in attempts from this connection. Try again later.',
  } },
})

// Hash the candidate PIN before it becomes a limiter key; never retain raw
// five-digit PINs in an in-memory metric/key or public rate-limit header.
export const studentPinGuessLimiter = rateLimit({
  windowMs: QUARTER_HOUR_MS,
  limit: 5,
  store: sharedRateLimitStore('student-pin-guess', QUARTER_HOUR_MS),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const pin = req.body?.pin
    if (typeof pin === 'string' && /^\d{5}$/.test(pin)) return 'pin:' + pinLookup(pin)
    // Invalid PIN bodies are still constrained by the source-IP limiter.
    // A keyed SHA is not necessary here since req.ip is not student data.
    return 'invalid:' + createHash('sha256').update(String(req.ip || 'unknown')).digest('hex')
  },
  message: { success: false, error: {
    code: 'RATE_LIMITED',
    message: 'Too many unsuccessful attempts for this PIN. Try again later.',
  } },
})

export const authLimiter = rateLimit({
  windowMs: QUARTER_HOUR_MS,
  limit: 20,
  store: sharedRateLimitStore('auth', QUARTER_HOUR_MS),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' } },
})

export const aiLimiter = rateLimit({
  windowMs: ONE_MINUTE_MS,
  limit: 20,
  store: sharedRateLimitStore('ai', ONE_MINUTE_MS),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many AI requests. Slow down a little.' } },
})

// Voice traffic is bursty: one lesson turn can legitimately create a session,
// upload audio, submit a transcript and synthesize one or more teacher lines.
// Keep abuse protection without rate-limiting a normal child mid-lesson.
export const voiceSessionLimiter = rateLimit({
  windowMs: ONE_MINUTE_MS,
  limit: 60,
  store: sharedRateLimitStore('voice-session', ONE_MINUTE_MS),
  // School computer labs share public IPs: bucket by verified student identity.
  keyGenerator: (req) => `${req.auth?.schoolId || 'unknown'}:${req.auth?.id || 'unknown'}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many voice session requests. Try again in a moment.' } },
})

export const voiceMediaLimiter = rateLimit({
  windowMs: ONE_MINUTE_MS,
  store: sharedRateLimitStore('voice-media', ONE_MINUTE_MS),
  // Azure STT/TTS costs money: cap rapid accidental taps by student, not school IP.
  limit: 18,
  keyGenerator: (req) => `${req.auth?.schoolId || 'unknown'}:${req.auth?.id || 'unknown'}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many voice media requests. Try again in a moment.' } },
})

// Backwards-compatible export for any route outside this module that still imports it.
export const voiceLimiter = voiceSessionLimiter

/** Lab computers often share one external IP: limit KG requests by authenticated user instead. */
export const kgLessonLimiter = rateLimit({
  windowMs: ONE_MINUTE_MS,
  limit: 90,
  store: sharedRateLimitStore('kg-lesson', ONE_MINUTE_MS),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.auth?.schoolId || 'unknown'}:${req.auth?.id || 'unknown'}`,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Miss Julie is busy. Please wait a moment.' } },
})

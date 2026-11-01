import rateLimit from 'express-rate-limit'
import { createHash } from 'node:crypto'
import { pinLookup } from '../utils/student-pin'

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
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
 * IMPORTANT: express-rate-limit's default memory store is process-local.
 * These guards prevent a single-instance school-LAN lockout, but a clustered
 * or replicated production deployment MUST provide a shared rate-limit
 * store and upstream network abuse controls before claiming fleet-scale
 * brute-force protection. Never use a client-supplied IP header as identity.
 */
export const studentPinIpFailureLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 80,
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
  windowMs: 15 * 60_000,
  limit: 5,
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
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' } },
})

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many AI requests. Slow down a little.' } },
})

// Voice traffic is bursty: one lesson turn can legitimately create a session,
// upload audio, submit a transcript and synthesize one or more teacher lines.
// Keep abuse protection without rate-limiting a normal child mid-lesson.
export const voiceSessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  // School computer labs share public IPs: bucket by verified student identity.
  keyGenerator: (req) => `${req.auth?.schoolId || 'unknown'}:${req.auth?.id || 'unknown'}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many voice session requests. Try again in a moment.' } },
})

export const voiceMediaLimiter = rateLimit({
  windowMs: 60 * 1000,
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
  windowMs: 60_000,
  limit: 90,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.auth?.schoolId || 'unknown'}:${req.auth?.id || 'unknown'}`,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Miss Julie is busy. Please wait a moment.' } },
})

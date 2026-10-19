import rateLimit from 'express-rate-limit'

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  // Voice has dedicated burst-aware limits below; applying both would make the
  // stricter general bucket eventually cut off a healthy lesson session.
  skip: (req) => req.path.startsWith('/api/v1/voice') || req.path.startsWith('/api/voice') ||
    req.path.startsWith('/api/v1/kg-alphabet') || req.path.startsWith('/api/kg-alphabet'),
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
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many voice session requests. Try again in a moment.' } },
})

export const voiceMediaLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
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

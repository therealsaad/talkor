import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env'

const RECEIPT_LIFETIME_MS = 15 * 60 * 1000
const MAX_FUTURE_SKEW_MS = 30_000
const RECEIPT_PATTERN = /^v1\.([1-9]\d{9,12})\.([a-f0-9]{32})\.([a-f0-9]{64})$/

/**
 * A KG feedback receipt proves that this server generated a particular
 * student's feedback audio after a valid introduction ticket. The browser
 * sends it only after its audio.onended event.
 *
 * It cannot independently prove a child heard sound (muted devices or
 * malicious clients remain possible). It does prevent accidental early
 * advancement from an unplayed, failed, or unrequested TTS response.
 */
export type KGFeedbackReceiptScope = {
  studentId: string
  schoolId: string
  submissionId: string
  introTicketHash: string
  feedbackText: string
}

function sign(scope: KGFeedbackReceiptScope, issuedAt: number, nonce: string): string {
  const payload = JSON.stringify([
    'talkora-kg-feedback-v1',
    scope.studentId,
    scope.schoolId,
    scope.submissionId,
    scope.introTicketHash,
    scope.feedbackText,
    issuedAt,
    nonce,
  ])
  return createHmac('sha256', env.jwtSecret).update(payload).digest('hex')
}

export function issueKGFeedbackReceipt(scope: KGFeedbackReceiptScope, now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000)
  const nonce = randomBytes(16).toString('hex')
  return 'v1.' + issuedAt + '.' + nonce + '.' + sign(scope, issuedAt, nonce)
}

export function verifyKGFeedbackReceipt(
  receipt: unknown,
  scope: KGFeedbackReceiptScope,
  now = Date.now(),
): boolean {
  if (typeof receipt !== 'string' || receipt.length > 144) return false
  const match = RECEIPT_PATTERN.exec(receipt)
  if (!match) return false
  const issuedAt = Number(match[1])
  const issuedAtMs = issuedAt * 1000
  if (!Number.isSafeInteger(issuedAt) ||
    now - issuedAtMs > RECEIPT_LIFETIME_MS ||
    issuedAtMs - now > MAX_FUTURE_SKEW_MS) return false
  const expected = Buffer.from(sign(scope, issuedAt, match[2]), 'hex')
  const actual = Buffer.from(match[3], 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

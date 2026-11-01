import { issueKGFeedbackReceipt, verifyKGFeedbackReceipt, type KGFeedbackReceiptScope } from '../../src/services/kg-feedback-receipt'

const scope: KGFeedbackReceiptScope = {
  studentId: 'student-alpha',
  schoolId: 'school-one',
  submissionId: 'word-cat-attempt-001',
  introTicketHash: 'f'.repeat(64),
  feedbackText: 'Nice try! Say cat.',
}
const now = Date.UTC(2026, 10, 1, 12, 0, 0)

describe('KG signed feedback-audio receipt', () => {
  it('authenticates a receipt issued after audio generation', () => {
    const receipt = issueKGFeedbackReceipt(scope, now)
    expect(receipt).toMatch(/^v1\.[0-9]+\.[a-f0-9]{32}\.[a-f0-9]{64}$/)
    expect(verifyKGFeedbackReceipt(receipt, scope, now)).toBe(true)
  })

  it('is unique per voice response and can be replayed for an idempotent ACK', () => {
    const a = issueKGFeedbackReceipt(scope, now)
    const b = issueKGFeedbackReceipt(scope, now)
    expect(a).not.toBe(b)
    expect(verifyKGFeedbackReceipt(a, scope, now + 3000)).toBe(true)
    expect(verifyKGFeedbackReceipt(a, scope, now + 3000)).toBe(true)
    expect(verifyKGFeedbackReceipt(b, scope, now + 3000)).toBe(true)
  })

  it.each([
    ['student switch', { studentId: 'student-beta' }],
    ['school switch', { schoolId: 'school-other' }],
    ['another submission', { submissionId: 'word-dog-attempt-001' }],
    ['intro restart', { introTicketHash: 'a'.repeat(64) }],
    ['changed teacher reply', { feedbackText: 'The word is dog.' }],
  ])('rejects %s without guessing the student's progress', (_label, mutation) => {
    const receipt = issueKGFeedbackReceipt(scope, now)
    expect(verifyKGFeedbackReceipt(receipt, { ...scope, ...mutation }, now)).toBe(false)
  })

  it('rejects expired receipts and receipts minted too far into the future', () => {
    const receipt = issueKGFeedbackReceipt(scope, now)
    expect(verifyKGFeedbackReceipt(receipt, scope, now + 15 * 60 * 1000)).toBe(true)
    expect(verifyKGFeedbackReceipt(receipt, scope, now + 16 * 60 * 1000)).toBe(false)
    expect(verifyKGFeedbackReceipt(receipt, scope, now - 40_000)).toBe(false)
  })

  it.each([
    undefined, null, 123, '', 'v1.123.bad.bad', 'malicious', 'v1.' + 'x'.repeat(300),
  ])('rejects malformed or missing acknowledgement %s', (receipt) => {
    expect(verifyKGFeedbackReceipt(receipt, scope, now)).toBe(false)
  })

  it('rejects tampering without throwing or granting progress', () => {
    const original = issueKGFeedbackReceipt(scope, now)
    const altered = original.slice(0, -1) + (original.slice(-1) === 'a' ? 'b' : 'a')
    expect(verifyKGFeedbackReceipt(altered, scope, now)).toBe(false)
  })
})

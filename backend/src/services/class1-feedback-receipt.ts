import { issueKGFeedbackReceipt, verifyKGFeedbackReceipt } from './kg-feedback-receipt'

export type Class1AudioVisit = { schoolId: string; authVisitHash: string }
export type Class1AudioScope = Class1AudioVisit & {
  studentId: string; sessionId: string; activityId: string; text: string
}

// Reuse the established bounded HMAC signer with a disjoint namespace. KG
// submission IDs forbid ':', so a Class 1 receipt cannot acknowledge a KG turn.
const scope = (s: Class1AudioScope) => ({
  studentId: s.studentId, schoolId: s.schoolId,
  submissionId: 'class1-audio:' + s.sessionId,
  introTicketHash: s.authVisitHash,
  feedbackText: JSON.stringify([s.activityId, s.text]),
})
export const issueClass1FeedbackReceipt = (s: Class1AudioScope, now?: number) => issueKGFeedbackReceipt(scope(s), now)
export const verifyClass1FeedbackReceipt = (receipt: unknown, s: Class1AudioScope, now?: number) => verifyKGFeedbackReceipt(receipt, scope(s), now)

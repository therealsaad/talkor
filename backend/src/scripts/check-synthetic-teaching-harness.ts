/**
 * Opt-in local-only synthetic smoke. Does not use a PIN, real child transcript,
 * live port 8002, MongoDB, Azure, Sarvam or S3.
 *
 * Run only against the separately started Python dev_harness server.
 * See docs/sprint2-synthetic-teaching-bridge.md.
 */
import { randomUUID } from 'node:crypto'
import { sendSyntheticTeachingTurn, type SyntheticTeachingInput } from '../services/synthetic-teaching-harness.service'

async function main(): Promise<void> {
  const sessionId = randomUUID()
  let expectedRevision = 0
  const turns: Array<Pick<SyntheticTeachingInput, 'event' | 'transcript' | 'inputStatus' | 'language'>> = [
    { event: 'INTRODUCE', transcript: '', inputStatus: 'TEXT', language: 'en' },
    { event: 'ANSWER', transcript: 'on', inputStatus: 'TEXT', language: 'en' },
    { event: 'ANSWER', transcript: 'on', inputStatus: 'TEXT', language: 'en' },
    { event: 'HINT', transcript: '', inputStatus: 'TEXT', language: 'hi' },
    { event: 'ANSWER', transcript: 'under', inputStatus: 'TEXT', language: 'en' },
    { event: 'RECALL', transcript: '', inputStatus: 'TEXT', language: 'mr' },
    { event: 'ANSWER', transcript: '', inputStatus: 'SILENCE', language: 'en' },
  ]
  for (const turn of turns) {
    const output = await sendSyntheticTeachingTurn({
      ...turn,
      sessionId,
      requestId: randomUUID(),
      expectedRevision,
    })
    if (
      output.activityComplete !== false ||
      output.teaching.validatedLearning !== false ||
      output.teaching.acceptedEvidence.length !== 0 ||
      output.teaching.revision !== expectedRevision + 1
    ) {
      throw new Error('SYNTHETIC_TEACHING_ACCEPTANCE_FAILED')
    }
    expectedRevision = output.teaching.revision
    // Deliberately avoid printing generated teacher wording or any request
    // identifiers; report only bounded, non-identifying synthetic outcomes.
    console.log(JSON.stringify({
      fixture: 'synthetic-only',
      step: expectedRevision,
      event: turn.event,
      language: turn.language,
      strategy: output.teaching.strategyCandidate,
      provider: output.teaching.providerStatus,
      advisoryOnly: true,
      awardedProgress: false,
    }))
  }
  console.log('PASS: 7 synthetic Node -> Python turns, no student routes or progress')
}

main().catch(error => {
  console.error('FAIL: synthetic-only teaching bridge:', error instanceof Error ? error.message : 'unknown')
  process.exitCode = 1
})

/**
 * Talkora Class 1 Level 1: non-persistent local AI-provider smoke test.
 * Usage (from backend/):
 *   pnpm exec tsx src/scripts/check-class1-ai-bridge.ts
 *
 * This test does not authenticate a student, read/write MongoDB, publish
 * a lesson, assess actual speech, or award progress. It deliberately uses a
 * synthetic pupil and the existing provider route only.
 */
import { getAIProvider } from '../providers/ai'
import type { MissJulieContext } from '../providers/ai/AIProvider'
import { env } from '../config/env'

async function main() {
  if (process.env.TALKORA_CLASS1_QWEN_PILOT !== 'true') {
    throw new Error('Enable TALKORA_CLASS1_QWEN_PILOT=true in the backend .env first.')
  }
  const baseUrl = process.env.TALKORA_CLASS1_AI_URL?.trim()
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    throw new Error('Set TALKORA_CLASS1_AI_URL=http://127.0.0.1:8002 in the backend .env.')
  }

  // Disable Groq fallback in this isolated diagnostic process. Otherwise a
  // configured cloud key could disguise a broken local Qwen connection.
  // We do NOT modify the user's .env file or any running server.
  env.groqApiKey = ''

  // The provider owns the endpoint and structured-response schema. We call
  // the same provider selected by the live Node conversation service.
  const context: MissJulieContext = {
    studentName: 'Demo',
    grade: 1,
    levelId: 'g01-l01',
    avatarType: 'GIRL',
    levelTitle: 'First Day Word Meadow',
    lessonTitle: 'Little Words & My First Day',
    activityTitle: 'Guided little-word talk',
    activityTarget: 'Use one of the little words in a short phrase.',
    recentMistakes: [],
    memoryFacts: [],
    learningEvidence: [],
    promptContext: 'speaking',
    studentMessage: 'I am at school.',
    unitNumber: 1,
    stage: 'guided_practice',
    allowedVocabulary: ['am', 'an', 'at', 'in', 'is', 'it', 'on', 'up'],
    learningObjectives: ['Recognize and use am, an, at, in, is, it, on, and up.'],
    conversationHistory: [],
    requiredConcepts: [],
    achievedConcepts: [],
    remainingConcepts: [],
    hintLevel: 0,
    waitingForRetry: false,
  }

  console.log('Testing existing AI provider route for Class 1 / g01-l01...')
  const started = Date.now()
  const response = await getAIProvider(context).generate(context)
  const durationMs = Date.now() - started

  if (!response.message || typeof response.message !== 'string') {
    throw new Error('AI response is missing a spoken message.')
  }
  if (typeof response.emotion !== 'string' || !response.emotion) {
    throw new Error('AI response is missing a Miss Julie emotion.')
  }
  if (response.activityComplete === true) {
    throw new Error('Unsafe: a transcript-only probe must not complete this activity.')
  }
  if (response.shouldRetry === true && response.responseQuality === 'STRONG') {
    throw new Error('Inconsistent response: STRONG quality but retry required.')
  }

  console.log(JSON.stringify({
    bridgeStatus: 'PASS',
    route: 'Node QwenProvider → PythonAIProvider → /v1/brain/respond',
    levelId: context.levelId,
    latencyMs: durationMs,
    message: response.message,
    emotion: response.emotion,
    responseQuality: response.responseQuality,
    teachingAction: response.teachingAction ?? null,
    activityComplete: response.activityComplete ?? false,
    shouldRetry: response.shouldRetry ?? false,
  }, null, 2))
  console.log('NOTE: This tests provider connectivity only; student auth, speech and MongoDB are not tested.')
}

main().catch((error: unknown) => {
  console.error('CLASS1_AI_BRIDGE_FAILED:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

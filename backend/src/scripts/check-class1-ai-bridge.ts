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
    throw new Error('Enable TALKORA_CLASS1_QWEN_PILOT=true on the running Python 8002 service and backend before this check.')
  }
  const baseUrl = process.env.TALKORA_CLASS1_AI_URL?.trim()
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    throw new Error('Set TALKORA_CLASS1_AI_URL=http://127.0.0.1:8002 in the backend .env.')
  }

  // Disable Groq fallback in this isolated diagnostic process. Class 1
  // production also fails closed instead of silently changing AI models.
  // We do NOT modify the user's .env file or any running server.
  env.groqApiKey = ''

  // The provider owns the endpoint and structured-response schema. We call
  // the same provider selected by the live Node conversation service.
  const context: MissJulieContext = {
    studentName: 'Synthetic Learner',
    grade: 1,
    levelId: 'g01-l01',
    avatarType: 'GIRL',
    levelTitle: 'My First Day — School Adventure',
    lessonTitle: 'My First Day',
    activityTitle: 'Skip like a bunny',
    activityTarget: 'Say in English what you can do. I can skip.',
    recentMistakes: [],
    memoryFacts: [],
    learningEvidence: [],
    promptContext: 'speaking',
    studentMessage: 'jump',
    unitNumber: 1,
    stage: 'INTERACT',
    digitalType: 'FIRST_DAY_VOICE_SCENE',
    allowedVocabulary: ['skip', 'bunny', 'school'],
    learningObjectives: ['Understand and say skip and I can skip in English.'],
    conversationHistory: [],
    requiredConcepts: ['first_day_english_attempt'],
    achievedConcepts: [],
    remainingConcepts: ['first_day_english_attempt'],
    hintLevel: 0,
    waitingForRetry: false,
  }

  console.log('Testing the Balbharati 1.1 First Day correction loop through Node → local Qwen 8002...')
  const started = Date.now()
  const response = await getAIProvider(context).generate(context)
  const durationMs = Date.now() - started
  if (!response.message?.trim() || !/\\bskip\\b/i.test(response.message)) {
    throw new Error('Qwen did not teach the current skip word in its reply.')
  }
  if (response.activityComplete === true || response.shouldRetry !== true ||
      response.responseQuality === 'STRONG' || response.responseQuality === 'ADEQUATE') {
    throw new Error('Unsafe lesson assessment: a child saying jump must retry the word skip.')
  }
  if (response.modelSentence !== 'I can skip.') {
    throw new Error('First Day model sentence is not anchored to the approved scene.')
  }
  // A script-only 8002 instance can pass /health. Refuse to call its repeated
  // default line adaptive coaching.
  if (response.message.trim() === 'Let us do a funny school action together: I can skip.') {
    throw new Error('Outdated 8002 scripted First Day response detected. Deploy the companion AI PR before pilot QA.')
  }

  console.log(JSON.stringify({
    bridgeStatus: 'PASS',
    route: 'Node QwenProvider → Python 8002 → local Ollama Qwen',
    levelId: context.levelId,
    scene: 'skip-bunny',
    latencyMs: durationMs,
    responseQuality: response.responseQuality,
    teachingAction: response.teachingAction ?? null,
    activityComplete: response.activityComplete ?? false,
    shouldRetry: response.shouldRetry ?? false,
    // Avoid printing synthetic utterance or AI free text to match the live
    // privacy rule and ensure this script stays log-safe.
  }, null, 2))
  console.log('NOTE: This tests provider connectivity only; student auth, speech and MongoDB are not tested.')
}

main().catch((error: unknown) => {
  console.error('CLASS1_AI_BRIDGE_FAILED:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

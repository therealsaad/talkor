import { env } from '../../config/env'
import { AIProvider, MissJulieContext } from './AIProvider'
import { QwenProvider } from './QwenProvider'
import { GroqProvider } from './GroqProvider'
import { OpenAIProvider } from './OpenAIProvider'
import { MockAIProvider } from './MockAIProvider'
import { PythonAIProvider } from './PythonAIProvider'

export function getAIProvider(context?: Pick<MissJulieContext, 'grade' | 'levelId' | 'digitalType'>): AIProvider {
  // Only the authenticated curriculum supplies digitalType. Never fall back
  // to Groq/Mock/cloud on a First Day scene: school answers belong to Qwen
  // running on the real Class 1 service at 8002.
  if (context?.grade === 1 && context.levelId === 'g01-l01' &&
      context.digitalType === 'FIRST_DAY_VOICE_SCENE') {
    return new PythonAIProvider()
  }
  // Pilot override is based only on the authorized student/lesson context assembled by
  // StudentContextService. Never trust a grade or levelId supplied by the browser.
  if (process.env.TALKORA_CLASS1_QWEN_PILOT === 'true' && context?.grade === 1 && context.levelId === 'g01-l01') {
    return new QwenProvider()
  }
  switch (env.aiProvider) {
    case 'qwen':
      return new QwenProvider()
    case 'python':
      return new PythonAIProvider()
    case 'groq':
      return new GroqProvider()
    case 'openai':
      return new OpenAIProvider()
    case 'mock':
      return new MockAIProvider()
    default:
      throw new Error(`Unsupported AI_PROVIDER: ${String(env.aiProvider)}`)
  }
}

export type { AIProvider, MissJulieContext } from './AIProvider'

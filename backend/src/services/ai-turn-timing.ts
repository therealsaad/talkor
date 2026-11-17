/**
 * Timing for the AI provider call of a Miss Julie turn. Measurement only: it never changes what is asked,
 * what is answered, or what happens when the provider fails.
 *
 * Exactly one record is written per REAL provider call, on success and on failure. A turn answered without
 * a provider call (a guided reply, an authored finale prompt) writes nothing, so a record always means
 * "a model was asked, and this is how long Node waited".
 *
 * What a record can and cannot say:
 * - `provider` and `model` name the route that was requested, taken from server code and server config.
 *   The generic `qwen` route can fall back inside the provider (direct Qwen, then Python, then Groq) and this
 *   record does not know which one answered. Class 1 Level 1 never falls back, so its label is exact.
 * - `llm` is the Node-side wait for the provider. For Class 1 Level 1 that includes the Python brain and
 *   Ollama. It excludes speech-to-text, voice, the network to the browser and playback.
 * - Records are not joined to a browser turn: the browser's telemetry turn id is not sent to the server.
 *
 * Privacy: a record is built from the fixed key list below. Never add a name, an id, a transcript, a prompt,
 * a model answer or an error message. The cohort comes only from the authorized, server-assembled student
 * context, never from anything the browser sent.
 */
import { createTurnTimer } from './kg-turn-timing'
import { getAIProvider } from '../providers/ai'
import { env } from '../config/env'
import { logger } from '../utils/logger'
import type { MissJulieContext } from '../providers/ai/AIProvider'
import type { AIStructuredResponse } from '../types'

export const AI_TIMING_MESSAGE = 'AI turn timing'
export const AI_TIMING_KEYS = ['phase', 'outcome', 'cohort', 'provider', 'model', 'llm'] as const

const KNOWN_PROVIDERS = new Set(['qwen', 'python-qwen', 'groq', 'openai', 'gemini-conversation', 'mock'])
// Letters, digits and . _ : / - only: real model ids such as openai/gpt-oss-20b and qwen3:4b-instruct pass.
const SAFE_LABEL = /^[a-z0-9][a-z0-9._:/-]{0,79}$/i
const safeLabel = (value: unknown, fallback: string) =>
  typeof value === 'string' && SAFE_LABEL.test(value) ? value : fallback

/** Which group a turn belongs to. Only numbers and ids from the authorized context are believed. */
export function aiCohort(context: { grade?: unknown; levelId?: unknown }): string {
  const { grade } = context
  if (grade === 0) return 'kg'
  if (grade === 1) return context.levelId === 'g01-l01' ? 'class1-l1' : 'class1-other'
  if (typeof grade === 'number' && Number.isInteger(grade) && grade >= 2 && grade <= 10) return `class${grade}`
  return 'other'
}

export type AIRoute = { provider: string; model: string; cohort: string }

export function aiRoute(input: {
  providerName: unknown
  grade?: unknown
  levelId?: unknown
  models: { qwen: string; groq: string }
}): AIRoute {
  const cohort = aiCohort(input)
  const name = typeof input.providerName === 'string' && KNOWN_PROVIDERS.has(input.providerName)
    ? input.providerName : 'other'
  // QwenProvider sends Class 1 Level 1 only to the Python brain, never to a cloud model.
  if (name === 'qwen' && cohort === 'class1-l1') return { provider: 'python-qwen', model: 'class1-python-brain', cohort }
  if (name === 'python-qwen') return { provider: name, model: 'python-service', cohort }
  if (name === 'qwen') return { provider: name, model: safeLabel(input.models.qwen, 'unset'), cohort }
  if (name === 'groq') return { provider: name, model: safeLabel(input.models.groq, 'unset'), cohort }
  if (name === 'other') return { provider: 'other', model: 'unknown', cohort }
  return { provider: name, model: 'default', cohort }
}

type Log = {
  info: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
}

/** Runs `generate` once, writes one record, and returns or rethrows exactly what `generate` did. */
export async function timeAIGeneration<T>(
  route: AIRoute,
  generate: () => Promise<T>,
  log: Log,
  now?: () => number,
): Promise<T> {
  const timer = createTurnTimer(now)
  let outcome: 'success' | 'failure' = 'success'
  try {
    return await timer.time('llm', generate)
  } catch (error) {
    outcome = 'failure'
    throw error
  } finally {
    try {
      const entry = {
        phase: 'ai', outcome, cohort: route.cohort, provider: route.provider, model: route.model,
        llm: timer.finish().steps.llm,
      }
      if (outcome === 'failure') log.warn(AI_TIMING_MESSAGE, entry)
      else log.info(AI_TIMING_MESSAGE, entry)
    } catch {
      // Measuring must never break a lesson turn.
    }
  }
}

/** Drop-in for `getAIProvider(context).generate(context)`: same provider, same call, plus one timing record. */
export async function generateWithTiming(context: MissJulieContext): Promise<AIStructuredResponse> {
  const provider = getAIProvider(context)
  const route = aiRoute({
    providerName: provider.name, grade: context.grade, levelId: context.levelId,
    models: { qwen: env.qwenModel, groq: env.conversationGroqModel },
  })
  return timeAIGeneration(route, () => provider.generate(context), logger)
}

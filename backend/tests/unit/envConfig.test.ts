import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const names = ['NODE_ENV', 'GEMINI_API_KEY', 'GEMINI_MODEL', 'GEMINI_FALLBACK_MODEL'] as const
const previous = new Map(names.map((name) => [name, process.env[name]]))

afterEach(() => {
  for (const name of names) {
    const value = previous.get(name)
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
  jest.resetModules()
})

describe('environment provider configuration', () => {
  it('maps the configured Gemini key and model names for Gemini-backed tools', async () => {
    process.env.NODE_ENV = 'test'
    process.env.GEMINI_API_KEY = 'test-only-gemini-key'
    process.env.GEMINI_MODEL = 'test-only-gemini-model'
    process.env.GEMINI_FALLBACK_MODEL = 'test-only-fallback-model'
    jest.resetModules()

    const { env } = await import('../../src/config/env')
    const values = env as unknown as Record<string, string>

    expect(values.geminiApiKey).toBe('test-only-gemini-key')
    expect(values.geminiModel).toBe('test-only-gemini-model')
    expect(values.geminiFallbackModel).toBe('test-only-fallback-model')
  })

  it('documents Atlas instead of a local MongoDB and uses the correct voice variable name', () => {
    const example = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8')

    expect(example).toMatch(/^MONGODB_URI=mongodb\+srv:\/\//m)
    expect(example).not.toMatch(/^MONGODB_URI=.*localhost/m)
    expect(example).not.toMatch(/^I_PROVIDER=/m)
  })
})

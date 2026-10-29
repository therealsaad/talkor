import { expect, test } from '@jest/globals'
import { parsePriyaHealth, checkPriyaHealth, formatPriyaHealth } from '../src/services/priya-tts-health'
const healthy = { status: 'degraded', ttsVoiceId: 'talkora-priya-v7-female-teacher',
  parlerImport: true, ttsModelAvailable: true, ttsModelLoaded: false,
  ttsDevice: 'not-loaded', cuda: true, ttsStatus: 'not-loaded' }
test('cold/lazy TTS model is not automatically broken', () => {
  expect(checkPriyaHealth(parsePriyaHealth(healthy))).toEqual([])
})
test('model snapshots and imports are independent readiness blockers', () => {
  const status = parsePriyaHealth({ ...healthy, parlerImport: false, ttsModelAvailable: false })
  expect(checkPriyaHealth(status)).toHaveLength(2)
  expect(formatPriyaHealth(status)).toContain('BLOCKER:')
})
test('GPU policy failure is diagnosable before and after model loading', () => {
  const status = parsePriyaHealth({ ...healthy, ttsDevice: 'cuda:0', cuda: false })
  expect(checkPriyaHealth(status).some(x => x.includes('CUDA'))).toBe(true)
  const cold = parsePriyaHealth({ ...healthy, ttsConfiguredDevice: 'cuda', cuda: false })
  expect(checkPriyaHealth(cold).some(x => x.includes('CUDA'))).toBe(true)
})
test('wrong service on 8001 cannot impersonate Priya', () => {
  expect(() => parsePriyaHealth({ status: 'ok' })).toThrow('ttsVoiceId')
  expect(() => parsePriyaHealth('<html>')).toThrow('JSON object')
})

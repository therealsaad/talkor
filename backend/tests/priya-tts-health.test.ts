import { expect, test } from '@jest/globals'
import { parsePriyaHealth, checkPriyaHealth, formatPriyaHealth } from '../src/services/priya-tts-health'

const healthy = {
  status: 'degraded', ttsVoiceId: 'talkora-priya-v7-female-teacher',
  parlerImport: true, ttsModelAvailable: true, ttsModelLoaded: false,
  ttsDevice: 'not-loaded', cuda: true, ttsStatus: 'not-loaded',
}
test('a cold/lazy TTS model is not misreported as broken', () => {
  const parsed = parsePriyaHealth(healthy)
  expect(parsed.voiceId).toBe('talkora-priya-v7-female-teacher')
  expect(checkPriyaHealth(parsed)).toEqual([])
})
test('missing model snapshots and package imports are actionable blockers', () => {
  const status = parsePriyaHealth({ ...healthy, parlerImport: false, ttsModelAvailable: false })
  expect(checkPriyaHealth(status)).toHaveLength(2)
  expect(formatPriyaHealth(status)).toContain('BLOCKER:')
})
test('cuda policy failure appears without exposing secrets', () => {
  const status = parsePriyaHealth({ ...healthy, ttsDevice: 'cuda:0', cuda: false })
  expect(checkPriyaHealth(status)).toContain(expect.stringContaining('CUDA'))
})
test('port mismatch cannot masquerade as a healthy Priya provider', () => {
  expect(() => parsePriyaHealth({ status: 'ok' })).toThrow('ttsVoiceId')
  expect(() => parsePriyaHealth('<html>')).toThrow('JSON object')
})

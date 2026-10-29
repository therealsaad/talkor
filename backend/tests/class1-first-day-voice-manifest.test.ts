import { expect, test } from '@jest/globals'
import manifest from '../src/scripts/class1-first-day-voice-v3.json'

test('one original First Day scene has three approved-language candidate lines', () => {
  const seen = new Set(manifest.lines.map(line => line.scene))
  expect(seen.size).toBe(10)
  for (const scene of seen) {
    const lines = manifest.lines.filter(line => line.scene === scene)
    expect(lines.map(line => line.language).sort()).toEqual(['en-IN','hi-IN','mr-IN'])
    expect(lines.every(line => line.text.length >= 18 && line.text.length <= 270)).toBe(true)
    expect(lines.every(line => line.approval === 'teacher-review-required')).toBe(true)
  }
})
test('no previous tiny-word narration or reused v2 S3 object paths are published by v3', () => {
  expect(manifest.status).toBe('UNREVIEWED_NOT_PUBLISHED')
  expect(manifest.lines.every(line => line.s3Key.startsWith('class-01/level-01/v3/'))).toBe(true)
  expect(manifest.lines.every(line => !/^(?:listen-am|build-an|listen-at|listen-in)$/.test(line.id))).toBe(true)
  expect(new Set(manifest.lines.map(line => line.s3Key)).size).toBe(manifest.lines.length)
})

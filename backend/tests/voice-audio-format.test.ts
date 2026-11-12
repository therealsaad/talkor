import { expect, test } from '@jest/globals'
import { hasExpectedAudioHeader } from '../src/services/voice-audio-format'

test('rejects HTML or an empty body disguised as successful audio', () => {
  expect(hasExpectedAudioHeader(Buffer.from('<html>' + 'x'.repeat(500)), 'audio/mpeg')).toBe(false)
  expect(hasExpectedAudioHeader(Buffer.alloc(0), 'audio/mpeg')).toBe(false)
})

test('accepts valid MP3 and RIFF/WAVE headers with enough bytes', () => {
  const mp3 = Buffer.alloc(512)
  mp3.write('ID3')
  expect(hasExpectedAudioHeader(mp3, 'audio/mpeg')).toBe(true)
  const wav = Buffer.alloc(512)
  wav.write('RIFF', 0)
  wav.write('WAVE', 8)
  expect(hasExpectedAudioHeader(wav, 'audio/wav')).toBe(true)
})

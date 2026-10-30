import { AUDIO_MANIFEST, CURRICULUM_STATIC_AUDIO_MANIFEST } from '../../src/kg/alphabet-content'
import { readFileSync } from 'node:fs'
import path from 'node:path'

it('first teaching prompts A-D use Priya dynamically; remaining fixed narration stays versioned in S3', () => {
  for (const id of ['say-a','say-b','say-c','say-d']) {
    expect(AUDIO_MANIFEST.find(x => x.id === id)?.kind).toBe('dynamic_tts')
    expect(CURRICULUM_STATIC_AUDIO_MANIFEST.some(x => x.id === id)).toBe(false)
  }
  expect(AUDIO_MANIFEST.find(x => x.id === 'word-apple')?.kind).toBe('curriculum_static')
})

it('KG audio generator does not sample or upload the dynamic Priya opening as S3', () => {
  const script = readFileSync(path.resolve(__dirname, '../../src/scripts/kg-level1-audio.ts'),'utf8')
  expect(script).toContain("const SAMPLE_ID = 'word-apple'")
  expect(script).not.toContain("const SAMPLE_ID = 'say-a'")
  expect(script).toContain('CURRICULUM_STATIC_AUDIO_MANIFEST')
  expect(script).toContain('IfNoneMatch')
})

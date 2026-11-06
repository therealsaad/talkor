import { readFileSync } from 'node:fs'
import path from 'node:path'
import { chooseTalkoraBilingualVoice } from '../../src/providers/voice/class1-voice-language'
import manifest from '../../src/scripts/class1-first-day-voice-v3.json'

describe('One-time Class 1 First Day Azure prompts', () => {
  const lines = manifest.lines.filter(x => x.language !== 'en-IN')

  it('ships exactly ten Hindi and ten Marathi S3-ready MP3 cues', () => {
    expect(lines.filter(x => x.language === 'hi-IN')).toHaveLength(10)
    expect(lines.filter(x => x.language === 'mr-IN')).toHaveLength(10)
    for (const line of lines) {
      expect(line.source).toBe('azure-one-time')
      expect(line.format).toBe('mp3')
      expect(line.s3Key).toBe(`class-01/level-01/v3/${line.id}.mp3`)
      expect(line.text.length).toBeGreaterThan(15)
    }
  })

  it('chooses explicit Hindi female Azure voice for every Hindi scene', () => {
    for (const line of lines.filter(x => x.language === 'hi-IN')) {
      expect(chooseTalkoraBilingualVoice(line.text, 'en-IN-NeerjaNeural', true, line.language))
        .toEqual({ voice: 'hi-IN-SwaraNeural', locale: 'hi-IN' })
    }
  })

  it('chooses explicit Marathi female Azure voice for every Marathi scene', () => {
    for (const line of lines.filter(x => x.language === 'mr-IN')) {
      expect(chooseTalkoraBilingualVoice(line.text, 'en-IN-NeerjaNeural', true, line.language))
        .toEqual({ voice: 'mr-IN-AarohiNeural', locale: 'mr-IN' })
    }
  })

  it('routes romanized Hindi and Marathi to the requested Azure voice in live Class 1 turns', () => {
    expect(chooseTalkoraBilingualVoice('Billi means cat. Can you say cat?', 'en-IN-NeerjaNeural', true, 'hi-IN'))
      .toEqual({ voice: 'hi-IN-SwaraNeural', locale: 'hi-IN' })
    expect(chooseTalkoraBilingualVoice('Mala chhan vatla! Say these two lines.', 'en-IN-NeerjaNeural', true, 'mr-IN'))
      .toEqual({ voice: 'mr-IN-AarohiNeural', locale: 'mr-IN' })
  })

  it('does not route ordinary English or other classes to Hindi/Marathi without authorization', () => {
    expect(chooseTalkoraBilingualVoice('See me skip, see me run', 'en-IN-NeerjaNeural', true, 'en-IN'))
      .toEqual({ voice: 'en-IN-NeerjaNeural', locale: 'en-IN' })
    expect(chooseTalkoraBilingualVoice('Billi means cat', 'en-IN-NeerjaNeural', false, 'hi-IN'))
      .toEqual({ voice: 'en-IN-NeerjaNeural', locale: 'en-IN' })
  })

  it('passes manifest language to Azure, rather than guessing from script text', () => {
    const generator = readFileSync(
      path.resolve(__dirname, '../../src/scripts/generate-class1-first-day-voices.ts'),
      'utf8',
    )
    expect(generator).toMatch(/class1Lesson:\s*true,\s*language:\s*line\.language/)
    expect(generator).toContain("TALKORA_FIRST_DAY_PAID_BATCH")
    expect(generator).toContain("TALKORA_FIRST_DAY_GENERATE")
  })
})

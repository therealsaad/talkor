import { guardFirstDayPoemTurn, isFirstDayPoemScene } from '../../src/services/class1-poem-teacher-guard'
import type { AIStructuredResponse } from '../../src/types'

function legacy(message = 'Let us try a short English word together. Can you say at?'): AIStructuredResponse {
  return {
    message, emotion: 'encouraging', responseQuality: 'UNCLEAR',
    corrections: [], followUpQuestion: 'Can you say at?',
    memoryUpdates: [], xpAwarded: 0,
    modelSentence: 'at', activityComplete: true, shouldRetry: false,
  }
}

describe('Class 1 first-day poem lesson boundaries (recorded student regression)', () => {
  it('will NEVER ask at on the grin + school-bell pair even if Python returns the exact old words', () => {
    const result = guardFirstDayPoemTurn('poem-pair-3', 'At at.', 'English', legacy())
    expect(result.message).toContain('See me grin')
    expect(result.message).toContain('When the bell rings, I go in.')
    expect((result.message + ' ' + result.followUpQuestion).toLowerCase()).not.toContain('can you say at')
    expect(result.modelSentence).toBe('See me grin\nWhen the bell rings, I go in.')
    expect(result.responseQuality).toBe('PARTIAL')
    expect(result.activityComplete).toBe(false)
    expect(result.shouldRetry).toBe(true)
    expect(result.xpAwarded).toBe(0)
    expect(result.memoryUpdates).toEqual([])
    expect(result.detectedSkills).toEqual([])
    const wordsOnly = guardFirstDayPoemTurn('poem-pair-3', 'grin bell', 'English')
    expect(wordsOnly.responseQuality).toBe('PARTIAL')
    expect(wordsOnly.shouldRetry).toBe(true)
  })

  it('in Hindi and Marathi, explains the currently highlighted two lines and keeps the English poem', () => {
    const hi = guardFirstDayPoemTurn('poem-pair-3', 'नहीं बताना', 'Hindi', legacy())
    expect(hi.message).toContain('मुस्कान')
    expect(hi.message).toContain('See me grin')
    expect(hi.message).toContain('bell')
    const mr = guardFirstDayPoemTurn('poem-pair-3', 'मला समजत नाही', 'Marathi')
    expect(mr.message).toContain('हसू')
    expect(mr.message).toContain('See me grin')
    expect(mr.message).toContain('bell')
    expect(hi.activityComplete).toBe(false)
    expect(mr.activityComplete).toBe(false)
  })

  it('only accepts AI wording when anchored to both the authoritative poem model and actual pair', () => {
    const model = 'See me grin\nWhen the bell rings, I go in.'
    const aligned = guardFirstDayPoemTurn('poem-pair-3', 'grin', 'English', {
      ...legacy('I heard your effort! The bell rings and we grin at school.'),
      followUpQuestion: 'Listen once more to both lines.',
      modelSentence: model,
    })
    expect(aligned.message).toContain('The bell rings')
    const misleading = guardFirstDayPoemTurn('poem-pair-3', 'grin', 'English', {
      ...legacy('I heard you say at. Now we learn at.'),
      followUpQuestion: 'Say at.',
      modelSentence: model,
    })
    expect(misleading.message).not.toContain('Now we learn at.')
    expect(misleading.modelSentence).toBe(model)
  })

  it('a valid complete pair may progress only through existing Node evidence and audio acknowledgement', () => {
    const result = guardFirstDayPoemTurn(
      'poem-pair-3', 'See me grin. When the bell rings, I go in.', 'English', legacy(),
    )
    expect(result.responseQuality).toBe('ADEQUATE')
    expect(result.shouldRetry).toBe(false)
    expect(result.activityComplete).toBe(false)
    expect(result.xpAwarded).toBe(0)
    expect(result.message).toContain('both poem lines')
  })

  it('offers short supported word practice in English, Hindi and Marathi instead of insisting on perfect recitation', () => {
    const pairEn = guardFirstDayPoemTurn('poem-pair-1', 'At at.', 'English', legacy())
    expect(pairEn.message).toContain('one word')
    expect(pairEn.followUpQuestion).toContain('one word')
    expect(pairEn.message).toContain('See me skip')
    expect(pairEn.message).toContain('See me run')
    expect(pairEn.activityComplete).toBe(false)
    expect(pairEn.xpAwarded).toBe(0)
    const finalEn = guardFirstDayPoemTurn('poem-full', 'At at.', 'English', legacy())
    expect(finalEn.message).toContain('five little parts')
    expect(finalEn.followUpQuestion).toContain('one word from each')
    expect(finalEn.modelSentence).toContain('See me skip')
    expect(finalEn.activityComplete).toBe(false)
    for (const lang of ['Hindi', 'Marathi'] as const) {
      const pair = guardFirstDayPoemTurn('poem-pair-1', 'At at.', lang, legacy())
      const full = guardFirstDayPoemTurn('poem-full', 'At at.', lang, legacy())
      expect(pair.message).toContain(lang === 'Hindi' ? 'एक शब्द' : 'एक शब्द')
      expect(full.message).toContain('एक शब्द')
      expect(full.activityComplete).toBe(false)
      expect(full.xpAwarded).toBe(0)
    }
  })

  it('a struggling finale learner hears only the first two authorized lines rather than all ten', () => {
    const model = 'See me skip\nSee me run'
    for (const language of ['English', 'Hindi', 'Marathi'] as const) {
      const answer = guardFirstDayPoemTurn('poem-full', 'At at.', language, legacy())
      expect(answer.message).toContain('See me skip')
      expect(answer.message).toContain('See me run')
      expect(answer.message).not.toContain('Hip hip hurray!')
      expect(answer.modelSentence).toBe(model)
      expect(answer.followUpQuestion).toContain('first part')
      expect(answer.activityComplete).toBe(false)
      expect(answer.shouldRetry).toBe(true)
      expect(answer.xpAwarded).toBe(0)
      expect(answer.memoryUpdates).toEqual([])
    }
  })

  it('answers a six-year-old meaning question in English, Hindi or Marathi without scoring it', () => {
    const english = guardFirstDayPoemTurn('poem-full', 'What does skip mean?', 'English', legacy())
    expect(english.message).toContain('little hops')
    expect(english.message).toContain('move quickly')
    expect(english.activityComplete).toBe(false)
    const hindi = guardFirstDayPoemTurn('poem-full', 'मदद, skip मतलब?', 'Hindi', legacy())
    expect(hindi.message).toContain('उछलकर')
    const marathi = guardFirstDayPoemTurn('poem-full', 'मला समजत नाही', 'Marathi', legacy())
    expect(marathi.message).toContain('उड्या')
    for (const reply of [english, hindi, marathi]) {
      expect(reply.modelSentence).toBe(['See me skip', 'See me run'].join('\n'))
      expect(reply.message).not.toContain('Hip hip hurray!')
      expect(reply.activityComplete).toBe(false)
      expect(reply.xpAwarded).toBe(0)
      expect(reply.shouldRetry).toBe(true)
    }
  })

  it('the full recital and all poem keys stay authored; unknown keys fail closed', () => {
    for (const key of ['poem-pair-1','poem-pair-2','poem-pair-3','poem-pair-4','poem-pair-5','poem-full']) {
      expect(isFirstDayPoemScene(key)).toBe(true)
      const reply = guardFirstDayPoemTurn(key, 'at at', 'English')
      expect(reply.modelSentence).toBeTruthy()
      expect(reply.message).not.toContain('Can you say at?')
      expect(reply.activityComplete).toBe(false)
    }
    expect(isFirstDayPoemScene('poem-pair-99')).toBe(false)
    expect(() => guardFirstDayPoemTurn('poem-pair-99', 'at at', 'English')).toThrow('FIRST_DAY_POEM_SCENE_NOT_AUTHORED')
  })
})

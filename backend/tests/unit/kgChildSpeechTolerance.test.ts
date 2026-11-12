import { evaluateKGSpeech } from '../../src/kg/alphabet-content'
import { gradeKGTranscription } from '../../src/kg/kg-child-grading'

describe('KG child-friendly word recognition', () => {
  it.each([
    ['aaaaaaappleee', 'A'], ['aaaapple', 'A'], ['appppple', 'A'], ['aaapppple', 'A'], ['aaple', 'A'],
    ['aple', 'A'], ['epple', 'A'], ['appul', 'A'], ['एप्पल', 'A'],
    ['appal', 'A'], ['aapal', 'A'], ['apul', 'A'],
    ['bol', 'B'], ['bawl', 'B'], ['boll', 'B'], ['kat', 'C'], ['kaat', 'C'],
    ['dhog', 'D'], ['dawg', 'D'], ['dogg', 'D'], ['doggy', 'D'], ['dug', 'D'],
    ['baall', 'B'], ['baaall', 'B'], ['baal', 'B'],
    ['caatt', 'C'], ['caaatt', 'C'], ['katt', 'C'],
    ['doog', 'D'], ['doooog', 'D'], ['dawgg', 'D'], ['dhoog', 'D'],
    ['I said dhog!', 'D'], ['I said aaaapple!', 'A'], ['I said baall!', 'B'], ['I said doog!', 'D'],
  ] as const)('accepts child pronunciation %s for %s', (transcript, letter) => {
    expect(evaluateKGSpeech(transcript, letter, 'word')).toBe('correct')
  })

  it.each(['fall', 'bell', 'fog', 'dig', 'dot', 'hat', 'cap', 'cut', 'kit', 'apply', 'bowl', 'belly', 'bola'])(
    'does not blindly pass a different English word %s', (word) => {
      expect(evaluateKGSpeech(word, 'A', 'word')).not.toBe('correct')
      expect(evaluateKGSpeech(word, 'B', 'word')).not.toBe('correct')
      expect(evaluateKGSpeech(word, 'C', 'word')).not.toBe('correct')
      expect(evaluateKGSpeech(word, 'D', 'word')).not.toBe('correct')
    },
  )

  it.each(['saib', 'sayb', 'seb', 'सेब'])(
    'accepts %s as supported understanding, not English-pronunciation mastery', (word) => {
      expect(evaluateKGSpeech(word, 'A', 'word')).toBe('unclear')
      expect(gradeKGTranscription({ transcript: word, letter: 'A' })).toBe('supported')
    },
  )
  it('does not mistake a bilingual answer for confident pronunciation when STT is uncertain', () => {
    expect(gradeKGTranscription({ transcript: 'saib', letter: 'A', uncertain: true })).toBe('unclear')
    expect(gradeKGTranscription({ transcript: 'saib', letter: 'A', confidence: 0.2 })).toBe('unclear')
    expect(gradeKGTranscription({ transcript: 'saib ball', letter: 'A' })).not.toBe('supported')
  })

  it.each([
    ['dog', 'C', 'incorrect'], ['cat', 'D', 'incorrect'],
    ['sun', 'D', 'incorrect'], ['fish', 'C', 'incorrect'],
    ['apple ball', 'A', 'unclear'], ['not dog', 'D', 'unclear'],
    ['', 'D', 'unclear'], ['um', 'A', 'unclear'],
  ] as const)('grades %s for %s as %s', (transcript, letter, expected) => {
    expect(evaluateKGSpeech(transcript, letter, 'word')).toBe(expected)
  })

  it('accepts a close spoken attempt but still rejects unrelated or taught wrong answers', () => {
    expect(evaluateKGSpeech('dug', 'D', 'word')).toBe('correct')
    expect(evaluateKGSpeech('I said dug', 'D', 'word')).toBe('correct')
    expect(evaluateKGSpeech('I said appl', 'A', 'word')).toBe('correct')
    expect(evaluateKGSpeech('D', 'D', 'word')).toBe('correct')
    expect(evaluateKGSpeech('ball', 'D', 'word')).toBe('incorrect')
    expect(evaluateKGSpeech('I sat down', 'C', 'word')).toBe('incorrect')
    expect(evaluateKGSpeech('sun', 'D', 'word')).toBe('incorrect')
    expect(evaluateKGSpeech('yellow bus', 'D', 'word')).toBe('incorrect')
  })

  it('does not let uncalibrated Whisper quality flags veto a clear answer', () => {
    expect(gradeKGTranscription({ transcript: 'dog', letter: 'D', uncertain: true })).toBe('correct')
    expect(gradeKGTranscription({ transcript: 'dhog', letter: 'D', uncertain: true })).toBe('correct')
    expect(gradeKGTranscription({ transcript: 'cat', letter: 'D', uncertain: true })).toBe('unclear')
    expect(gradeKGTranscription({ transcript: '', letter: 'D', uncertain: true })).toBe('unclear')
    expect(gradeKGTranscription({ transcript: 'ball', letter: 'B', confidence: 0.3 })).toBe('correct')
    expect(gradeKGTranscription({ transcript: 'ball', letter: 'C', confidence: 0.3 })).toBe('unclear')
  })
})

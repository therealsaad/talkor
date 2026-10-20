import { evaluateKGSpeech } from '../../src/kg/alphabet-content'
import { gradeKGTranscription } from '../../src/kg/kg-child-grading'

describe('KG child-friendly word recognition', () => {
  it.each([
    ['dhog', 'D'], ['dawg', 'D'], ['dogg', 'D'], ['doggy', 'D'],
    ['kat', 'C'], ['catt', 'C'], ['bawl', 'B'], ['boll', 'B'],
    ['aaple', 'A'], ['appul', 'A'], ['एप्पल', 'A'], ['डॉग', 'D'],
    ['I said dhog!', 'D'],
  ] as const)('accepts child pronunciation %s for %s', (transcript, letter) => {
    expect(evaluateKGSpeech(transcript, letter, 'word')).toBe('correct')
  })

  it.each([
    ['dog', 'C', 'incorrect'], ['cat', 'D', 'incorrect'],
    ['fog', 'D', 'unclear'], ['dig', 'D', 'unclear'],
    ['bell', 'B', 'unclear'], ['appl', 'A', 'unclear'],
    ['apple ball', 'A', 'unclear'], ['not dog', 'D', 'unclear'],
    ['', 'D', 'unclear'], ['um', 'A', 'unclear'],
  ] as const)('does not pass %s for %s', (transcript, letter, expected) => {
    expect(evaluateKGSpeech(transcript, letter, 'word')).toBe(expected)
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

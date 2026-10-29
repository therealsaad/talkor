import { gradeKGVowelTranscript, kgVowelSpeechScript, KGVowelPreviewController, KG_VOWEL_TARGETS } from '../../src/controllers/kg-vowel-preview.controller'
import { PythonVoiceProvider } from '../../src/providers/voice/PythonVoiceProvider'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'

describe('KG Level 6 vowel preview grading', () => {
  it('uses the approved target order and words', () => {
    expect(KG_VOWEL_TARGETS.map(({ letter, word }) => `${letter}-${word}`)).toEqual([
      'A-apple', 'E-elephant', 'I-igloo', 'O-orange', 'U-umbrella',
    ])
  })

  it('requires the learner to say the complete letter-for-word phrase', () => {
    expect(gradeKGVowelTranscript(' A for Apple! ', 'apple')).toBe('correct')
    expect(gradeKGVowelTranscript('E for elephant', 'elephant')).toBe('correct')
    expect(gradeKGVowelTranscript('I for igloo', 'igloo')).toBe('correct')
    expect(gradeKGVowelTranscript('O for orange', 'orange')).toBe('correct')
    expect(gradeKGVowelTranscript('U for umbrella', 'umbrella')).toBe('correct')
    expect(gradeKGVowelTranscript('apple', 'apple')).toBe('incorrect')
    expect(gradeKGVowelTranscript('E for elephant', 'apple')).toBe('incorrect')
    expect(gradeKGVowelTranscript('A for apple please', 'apple')).toBe('incorrect')
  })

  it('treats blank or uncertain speech as unclear', () => {
    expect(gradeKGVowelTranscript('', 'apple')).toBe('unclear')
    expect(gradeKGVowelTranscript('A for apple', 'apple', true)).toBe('unclear')
    expect(gradeKGVowelTranscript('A for apple', 'apple', false, 0.2)).toBe('unclear')
  })

  it('returns a distinct silence result when the learner does not speak', async () => {
    await expect(KGVowelPreviewController.attempt({ activityId: 'say-a-apple', durationMs: 1000, noSpeech: true }))
      .resolves.toEqual({ outcome: 'silence' })
  })
})

describe('KG Level 6 Miss Julie scripts', () => {
  it('uses the supplied fixed scripts and substitutes only approved target words', () => {
    expect(kgVowelSpeechScript('intro', 'introduction')).toBe('Hello, friend! Welcome to Vowel Garden in Rainbow Valley. Listen to Miss Julie, look at each picture, and say the letter and word with me. Ready? Let’s begin!')
    expect(kgVowelSpeechScript('prompt', 'say-e-elephant')).toBe('Look at the picture. E for elephant. Now you say: E for elephant.')
    expect(kgVowelSpeechScript('replay', 'say-u-umbrella')).toBe('Let’s listen once more. U for umbrella. Now you try: U for umbrella.')
    expect(kgVowelSpeechScript('correct', 'say-u-umbrella')).toBe('You said U for umbrella! Wonderful speaking!')
    expect(kgVowelSpeechScript('incorrect', 'say-a-apple')).toBe('Nice try! The phrase is A for apple. Listen: A for apple. You can try again when you’re ready.')
    expect(kgVowelSpeechScript('unclear', 'say-a-apple')).toBe('I didn’t hear the whole phrase clearly. Listen once more, then try saying A for apple.')
    expect(kgVowelSpeechScript('silence', 'say-a-apple')).toBe('Take your time. When you’re ready, say A for apple after me.')
    expect(kgVowelSpeechScript('microphone-error', 'say-a-apple')).toBe('I can’t hear you yet. Please ask your teacher or grown-up to turn on the microphone, then try again.')
    expect(kgVowelSpeechScript('provider-error', 'say-a-apple')).toBe('I couldn’t check your answer just now. That’s not your fault. Let’s try again in a little while, or ask your teacher for help.')
    expect(kgVowelSpeechScript('complete', 'completion')).toBe('You did it! You learned A for apple, E for elephant, I for igloo, O for orange, and U for umbrella. Wonderful work, friend! See you next time in Rainbow Valley!')
    expect(() => kgVowelSpeechScript('prompt', 'free-text')).toThrow()
  })

  it('keeps Miss Julie audible through the standard voice when the Level 1 voice service is offline', async () => {
    const priya = jest.spyOn(PythonVoiceProvider.prototype, 'synthesizeWithVoice').mockRejectedValue(new Error('voice service offline'))
    const azure = jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached').mockResolvedValue({
      audio: Buffer.from([1, 2, 3]), contentType: 'audio/mpeg',
    })
    try {
      await expect(KGVowelPreviewController.speech('prompt', 'say-a-apple')).resolves.toEqual({
        audio: Buffer.from([1, 2, 3]), contentType: 'audio/mpeg',
      })
      expect(azure).toHaveBeenCalledWith('Look at the picture. A for apple. Now you say: A for apple.')
    } finally {
      priya.mockRestore()
      azure.mockRestore()
    }
  })
})

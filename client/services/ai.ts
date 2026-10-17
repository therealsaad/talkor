import type { AIProvider, AIResponse, PronunciationProvider, SpeechProvider, TranscriptionProvider } from './types'

export const mockAIProvider: AIProvider = { async respond({ message }) { return { message: message.toLowerCase().includes('mistake') ? 'That was a brave try. Let us slow it down and try together.' : 'You are doing wonderfully. Keep going!', emotion: 'encouraging', xpAwarded: 5 } } }
export const mockSpeechProvider: SpeechProvider = { async speak(_text) { return Promise.resolve() }, stop() {} }
export const mockTranscriptionProvider: TranscriptionProvider = { async transcribe(_audio) { return 'I see a cat.' } }
export const mockPronunciationProvider: PronunciationProvider = { async evaluate({ expected, transcript }) { const score = transcript.trim().toLowerCase() === expected.trim().toLowerCase() ? 100 : 78; return { score, feedback: score === 100 ? 'Clear and confident!' : 'Nice try. Listen once more and repeat slowly.' } } }

export function normalizeAIResponse(response: AIResponse): AIResponse { return { message: response.message, emotion: response.emotion, score: response.score, corrections: response.corrections ?? [], xpAwarded: response.xpAwarded ?? 0 } }

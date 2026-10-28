/**
 * Original Talkora teaching cues for English Balbharati Grade One (2025),
 * Unit One 1.1 "My First Day", printed page 1.
 * These are on-screen scaffolds, NOT the copyrighted rhyme or an answer key.
 * Actual teacher prompts, grading and progress remain server-owned.
 */
export type Class1TeachingCue = {
  phase: 'FOUNDATION' | 'BALBHARATI'
  badge: string
  headline: string
  spokenGoal: string
  words: readonly string[]
  scene: 'letters' | 'school' | 'movement' | 'conversation'
}

const foundation = (headline: string, words: string[]): Class1TeachingCue => ({
  phase: 'FOUNDATION', badge: 'First, learn the little words',
  headline, spokenGoal: 'Listen to Miss Julie. Then say the answer aloud.',
  words, scene: 'letters',
})

const cues: Record<string, Class1TeachingCue> = {
  'listen-am': foundation('Listen and find AM', ['a', 'm', 'am']),
  'build-an': foundation('Join the sounds: AN', ['a', 'n', 'an']),
  'listen-at': foundation('Listen and find AT', ['a', 't', 'at']),
  'listen-in': foundation('Listen and find IN', ['i', 'n', 'in']),
  'use-on': foundation('Use ON in a sentence', ['on', 'in', 'at']),
  'it-is-up': foundation('Little words in a sentence', ['it', 'is', 'up']),
  'review-little-words': {
    phase: 'FOUNDATION', badge: 'Now speak with Miss Julie',
    headline: 'You can use little English words!',
    spokenGoal: 'Say one small word or sentence. Miss Julie will help you.',
    words: ['am', 'an', 'at', 'in', 'is', 'it', 'on', 'up'], scene: 'conversation',
  },
  'say-walk': {
    phase: 'BALBHARATI', badge: 'Balbharati 1.1 · My First Day',
    headline: 'Let us go to school!',
    spokenGoal: 'Watch Miss Julie move. Listen, then say WALK.',
    words: ['walk', 'run', 'skip'], scene: 'movement',
  },
  'find-school': {
    phase: 'BALBHARATI', badge: 'Balbharati 1.1 · My First Day',
    headline: 'Look! It is our school.',
    spokenGoal: 'Listen to the word. Say SCHOOL to choose it.',
    words: ['school', 'bell', 'play'], scene: 'school',
  },
  'school-talk': {
    phase: 'BALBHARATI', badge: 'Balbharati 1.1 · My First Day',
    headline: 'Tell Miss Julie about school',
    spokenGoal: 'Start with one word. Miss Julie will help you make a sentence.',
    words: ['walk', 'jump', 'play', 'school'], scene: 'conversation',
  },
}

export function class1TeachingCue(activityKey?: string): Class1TeachingCue | null {
  const match = /^class1-l01-(?:v2-)?([a-z-]+)$/.exec(activityKey || '')
  return match ? cues[match[1]] ?? null : null
}

/** A Class 1 child may spell "a and n" aloud instead of typing AN.
 * Return the target only for an exact, unambiguous letter sequence. */
export function class1SpokenSpelling(transcript: string, target?: string): string | null {
  const expected = (target || '').trim().toLowerCase()
  if (!/^[a-z]{2,4}$/.test(expected)) return null
  const words = transcript.toLowerCase().replace(/[^a-z\s]/g, ' ').trim()
  const stripped = words.replace(/\b(?:the|word|letters?|and|then|plus)\b/g, ' ').replace(/\s+/g, '')
  return stripped === expected ? expected : null
}

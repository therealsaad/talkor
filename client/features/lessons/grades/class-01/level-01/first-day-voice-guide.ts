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
  /** Original visual teaching scaffold; never substitutes the authenticated activity prompt. */
  storybook: {
    focus: string
    tiles: readonly string[]
    example: string
    illustration: 'spark' | 'ball-on-box' | 'up-arrow' | 'school' | 'walk' | 'talk'
  }
}

const foundation = (
  headline: string, words: string[], focus: string, tiles: string[], example: string,
  illustration: Class1TeachingCue['storybook']['illustration'] = 'spark',
): Class1TeachingCue => ({
  phase: 'FOUNDATION', badge: 'First, learn the little words',
  headline, spokenGoal: 'Listen to Miss Julie. Then say the answer aloud.',
  words, scene: 'letters',
  storybook: { focus, tiles, example, illustration },
})

const cues: Record<string, Class1TeachingCue> = {
  'listen-am': foundation('Listen and find AM', ['a', 'm', 'am'], 'AM', ['A', 'M'], 'I am here!'),
  'build-an': foundation('Join the sounds: AN', ['a', 'n', 'an'], 'AN', ['A', 'N'], 'Say A, say N, then say AN!'),
  'listen-at': foundation('Listen and find AT', ['a', 't', 'at'], 'AT', ['A', 'T'], 'I am at school.'),
  'listen-in': foundation('Listen and find IN', ['i', 'n', 'in'], 'IN', ['I', 'N'], 'Say I, say N, then say IN!'),
  'use-on': foundation('Use ON in a sentence', ['on', 'in', 'at'], 'ON', ['ON'], 'The ball is ON the box.', 'ball-on-box'),
  'it-is-up': foundation('Little words in a sentence', ['it', 'is', 'up'], 'UP', ['IT', 'IS', 'UP'], 'It is UP!', 'up-arrow'),
  'review-little-words': {
    phase: 'FOUNDATION', badge: 'Now speak with Miss Julie',
    headline: 'You can use little English words!',
    spokenGoal: 'Say one small word or sentence. Miss Julie will help you.',
    words: ['am', 'an', 'at', 'in', 'is', 'it', 'on', 'up'], scene: 'conversation',
    storybook: { focus: 'I CAN SPEAK!', tiles: ['AM', 'IN', 'ON', 'UP'], example: 'You and Miss Julie make a great team.', illustration: 'talk' },
  },
  'say-walk': {
    phase: 'BALBHARATI', badge: 'Balbharati 1.1 · My First Day',
    headline: 'Let us go to school!',
    spokenGoal: 'Watch the footsteps. Listen to Miss Julie, then say WALK.',
    words: ['walk', 'run', 'skip'], scene: 'movement',
    storybook: { focus: 'WALK', tiles: ['WALK', 'RUN', 'SKIP'], example: 'I walk to school.', illustration: 'walk' },
  },
  'find-school': {
    phase: 'BALBHARATI', badge: 'Balbharati 1.1 · My First Day',
    headline: 'Look! It is our school.',
    spokenGoal: 'Listen to the word. Say SCHOOL to choose it.',
    words: ['school', 'bell', 'play'], scene: 'school',
    storybook: { focus: 'SCHOOL', tiles: ['SCHOOL', 'BELL'], example: 'I am at school.', illustration: 'school' },
  },
  'school-talk': {
    phase: 'BALBHARATI', badge: 'Balbharati 1.1 · My First Day',
    headline: 'Tell Miss Julie about school',
    spokenGoal: 'Start with one word. Miss Julie will help you make a sentence.',
    words: ['walk', 'jump', 'play', 'school'], scene: 'conversation',
    storybook: { focus: 'MY FIRST DAY', tiles: ['WALK', 'PLAY', 'SCHOOL'], example: 'I walk to school.', illustration: 'talk' },
  },
  // Full Balbharati 1.1 replaces the foundational word drill in the reviewed
  // v3 pilot. These are original short sentences and playful teaching cues.
  'hello-school': { phase: 'BALBHARATI', badge: 'My First Day', headline: 'Hello, Grade One!',
    spokenGoal: 'Tell Miss Julie how you feel about school.', words: ['school', 'hello', 'happy'], scene: 'school',
    storybook: { focus: 'SCHOOL', tiles: ['HELLO', 'SCHOOL'], example: 'I am happy at school.', illustration: 'school' } },
  'skip-bunny': { phase: 'BALBHARATI', badge: 'My First Day', headline: 'Hop, little bunny!',
    spokenGoal: 'Pretend to skip and say I can skip.', words: ['skip'], scene: 'movement',
    storybook: { focus: 'SKIP', tiles: ['SKIP'], example: 'I can skip.', illustration: 'walk' } },
  'run-race': { phase: 'BALBHARATI', badge: 'My First Day', headline: 'Faster than a turtle?',
    spokenGoal: 'Make your fingers run and say I can run.', words: ['run'], scene: 'movement',
    storybook: { focus: 'RUN', tiles: ['RUN'], example: 'I can run.', illustration: 'walk' } },
  'walk-school': { phase: 'BALBHARATI', badge: 'My First Day', headline: 'Walk to our school!',
    spokenGoal: 'Use your fingers to walk and say a little sentence.', words: ['walk', 'school'], scene: 'movement',
    storybook: { focus: 'WALK', tiles: ['WALK', 'SCHOOL'], example: 'I walk to school.', illustration: 'walk' } },
  'big-grin': { phase: 'BALBHARATI', badge: 'My First Day', headline: 'Show Miss Julie a giant grin!',
    spokenGoal: 'Smile and say I can smile.', words: ['grin', 'smile'], scene: 'conversation',
    storybook: { focus: 'SMILE', tiles: ['GRIN', 'SMILE'], example: 'I can smile.', illustration: 'talk' } },
  'school-bell': { phase: 'BALBHARATI', badge: 'My First Day', headline: 'Ding dong! Hear that?',
    spokenGoal: 'Tell me what rings at school.', words: ['bell', 'school'], scene: 'school',
    storybook: { focus: 'BELL', tiles: ['BELL'], example: 'I hear a bell.', illustration: 'school' } },
  'jump-frog': { phase: 'BALBHARATI', badge: 'My First Day', headline: 'Jump like a frog!',
    spokenGoal: 'Show jumping fingers and say I can jump.', words: ['jump'], scene: 'movement',
    storybook: { focus: 'JUMP', tiles: ['JUMP'], example: 'I can jump.', illustration: 'walk' } },
  'play-friends': { phase: 'BALBHARATI', badge: 'My First Day', headline: 'What do we play?',
    spokenGoal: 'Tell me your favourite school game.', words: ['play', 'ball', 'school'], scene: 'school',
    storybook: { focus: 'PLAY', tiles: ['PLAY'], example: 'I can play.', illustration: 'school' } },
  'enter-class': { phase: 'BALBHARATI', badge: 'My First Day', headline: 'The bell rang — go in!',
    spokenGoal: 'Say where we go when the bell rings.', words: ['bell', 'classroom'], scene: 'school',
    storybook: { focus: 'GO IN', tiles: ['GO', 'IN'], example: 'I go into my classroom.', illustration: 'school' } },
  'grade-one': { phase: 'BALBHARATI', badge: 'My First Day', headline: 'You are a Grade One superstar!',
    spokenGoal: 'Tell Miss Julie one fun thing you do at school.', words: ['grade', 'one', 'school'], scene: 'conversation',
    storybook: { focus: 'GRADE ONE', tiles: ['GRADE', 'ONE'], example: 'I am in Grade One!', illustration: 'talk' } },
}

export function class1TeachingCue(activityKey?: string): Class1TeachingCue | null {
  const match = /^class1-l01-(?:v2-|v3-)?([a-z-]+)$/.exec(activityKey || '')
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

import type { KGAlphabetState } from './kg-alphabet-service'

/** Static staff preview state; audio, speech recognition and evaluation now run through authenticated backend APIs. */
export const KG_PREVIEW_AUDIO: Record<string, string> = {
  welcome: 'Hello, superstar! Welcome to our ABCD adventure!',
  'how-to-play': 'Listen to me, then say the word. I am listening!',
  'letter-a': 'This is the letter A. Say A with me!',
  'letter-b': 'This is the letter B. Say B with me!',
  'letter-c': 'This is the letter C. Say C with me!',
  'letter-d': 'This is the letter D. Say D with me!',
  'word-apple': 'Apple. Apple begins with A. Say apple with me!',
  'word-ball': 'Ball. Ball begins with B. Say ball with me!',
  'word-cat': 'Cat. Cat begins with C. Say cat with me!',
  'word-dog': 'Dog. Dog begins with D. Say dog with me!',
  'say-a': 'A! A for apple! Can you say apple?',
  'say-b': 'B! B for ball! Can you say ball?',
  'say-c': 'C! C for cat! Can you say cat?',
  'say-d': 'D! D for dog! Can you say dog?',
  'puzzle-intro': 'Amazing! Now touch the picture I say!',
  'recognize-intro': 'Look at each picture. Listen, then touch the one I say!',
  'find-a': 'Can you find the apple? Touch the apple!',
  'find-b': 'Can you find the ball? Touch the ball!',
  'find-c': 'Can you find the cat? Touch the cat!',
  'find-d': 'Can you find the dog? Touch the dog!',
  great: 'Yay! You got it! Well done!',
  'try-again': 'Nice try! Listen once more and try again!',
  repeat: 'I did not hear clearly. Can you say it again?',
  silence: 'I am still listening. Take your time, then say it for me!',
  'level-complete': 'You finished Level 1! You learned A, B, C, and D. Hooray!',
  'homework-abcd': 'Your tiny homework: at home, point to an apple, a ball, a cat or a dog picture. Say its English name and tell someone its first letter. Do your best! See you soon!',
  'navigation-map': 'Let us go back to your letter garden!',
  'replay-intro': 'Would you like to watch Miss Julie’s story again? Let’s play!',
  'replay-level': 'Welcome back, superstar! Let’s play the ABCD adventure again!',
  celebrate: 'Hooray! You know A, B, C, and D! You are a superstar!',
}
export function makeKGPreviewState(currentIndex = 0): KGAlphabetState {
  return {
    version: 'kg-alphabet-v1-preview', level: 1, title: 'ABCD Picture Garden', audioVersion: 'v1',
    currentIndex, totalActivities: 8, introSeen: false, completed: currentIndex === 8,
    completedAt: null, level2Unlocked: currentIndex === 8, level2Available: false,
    letters: [
      { letter: 'A', word: 'apple', emoji: '🍎', color: '#ff6f82' },
      { letter: 'B', word: 'ball', emoji: '⚽', color: '#ffbc56' },
      { letter: 'C', word: 'cat', emoji: '🐱', color: '#aa8afa' },
      { letter: 'D', word: 'dog', emoji: '🐶', color: '#67cbb5' },
    ],
    activity: null,
    audio: Object.fromEntries(Object.entries(KG_PREVIEW_AUDIO).map(([id, text]) => [id, { text, url: '' }])),
  }
}


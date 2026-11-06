/** Read-only exercise audit of printed pp. 1–17, 2025 edition / 2026 reprint.
 *  Paraphrased from the supplied textbook; this never replaces existing level assignments. */
export interface CoverageTask {
  number: number
  title: string
  detail: string
  delivery: string
}
export const UNIT_ONE_COVERAGE: Readonly<
  Record<
    string,
    { title: string; pages: number[]; tasks: CoverageTask[]; teacher: string }
  >
> = {
  '1.1': {
    title: 'My First Day',
    pages: [1, 1],
    tasks: [
      {
        number: 1,
        title: 'Listen and sing',
        detail:
          'Explore the school rhyme with rhythm and actions: skipping, running, walking, smiling, jumping, and playing.',
        delivery: 'Voice + movement',
      },
      {
        number: 2,
        title: 'Look and say',
        detail:
          'Practise the complete textbook word set: see, skip, school, everyone, walk, grin, bell, rings, jump, play, Grade, hurray.',
        delivery: 'Screen + voice',
      },
    ],
    teacher:
      'Observe actions and participation; use the textbook rhyme in class. The suggested 90-second Miss Julie welcome belongs before the warm-up, not in place of the lesson.',
  },
  '1.2': {
    title: 'Clap your hands.',
    pages: [2, 2],
    tasks: [
      {
        number: 1,
        title: 'Listen and sing',
        detail:
          'Work through the full five-count action rhyme, including paired actions for each count.',
        delivery: 'Voice + movement',
      },
      {
        number: 2,
        title: 'Change the actions',
        detail:
          'Sing again with all suggested substitutions: singing, waving, tapping the head, touching the nose, and blinking.',
        delivery: 'Voice + movement',
      },
      {
        number: 3,
        title: 'Look and say',
        detail:
          'Practise the action and body vocabulary, including buckle, stamp, knee, bend, floor, turn, around, and dive.',
        delivery: 'Screen + voice',
      },
    ],
    teacher:
      'Use the textbook colour scheme for action substitutions. Provide safe, accessible movement alternatives and observe the child; voice recognition alone cannot assess an action.',
  },
  '1.3': {
    title: 'I know my alphabet.',
    pages: [3, 4],
    tasks: [
      {
        number: 1,
        title: 'Look, say and trace',
        detail:
          'Practise the complete capital-and-small alphabet and retain the tracing work.',
        delivery: 'Teacher-led writing',
      },
      {
        number: 2,
        title: 'Look, listen and follow',
        detail:
          'Play the capital/small letter-card matching game, saying the sounds while finding partners.',
        delivery: 'Teacher-led group',
      },
      {
        number: 3,
        title: 'Find the /e/ path',
        detail:
          'Name each picture and follow words with the middle /e/ sound to guide Bela home.',
        delivery: 'Screen + voice',
      },
    ],
    teacher:
      'Keep physical tracing and letter-card partner matching. Stress the middle sound of the pictured words during the maze.',
  },
  '1.4': {
    title: 'Let us read.',
    pages: [5, 6],
    tasks: [
      {
        number: 1,
        title: 'Listen, read and write',
        detail:
          'Cover every two-letter group: am/an/as/at, be/he/me/we, if/in/is/it, of/on/or, go/no/so, by/my, up/us.',
        delivery: 'Voice + notebook',
      },
      {
        number: 2,
        title: 'Make words',
        detail:
          'Build and write the -an, -en, -in, -op, and -un word families from the supplied letters.',
        delivery: 'Voice + notebook',
      },
      {
        number: 3,
        title: 'Choose the letters',
        detail:
          'Use picture clues to circle the correct letters, then write the completed word in its box.',
        delivery: 'Teacher-led writing',
      },
      {
        number: 4,
        title: 'Break down words',
        detail:
          'Complete the textbook pairs: man/mango, pen/pencil, win/window, pop/popcorn, and sun/Sunday.',
        delivery: 'Screen + voice',
      },
    ],
    teacher:
      'Stress individual sounds during word building. Preserve notebook work and all picture-letter choices.',
  },
  '1.5': {
    title: 'Fun with Special Letters',
    pages: [7, 7],
    tasks: [
      {
        number: 1,
        title: 'Look, listen and repeat',
        detail:
          'Explore the alphabet’s vowel/consonant distinction and say a, e, i, o, u.',
        delivery: 'Screen + voice',
      },
      {
        number: 2,
        title: 'Find the special letters',
        detail:
          'Identify the vowels in ball, dog, cup, ice, tree, onion, zebra, and umbrella.',
        delivery: 'Screen + voice',
      },
      {
        number: 3,
        title: 'Write the missing vowels',
        detail:
          'Complete all five picture words: sun, cat, fish, egg, and owl.',
        delivery: 'Teacher-led writing',
      },
    ],
    teacher:
      'Keep the colour distinction for vowels and consonants, and check the written missing letters.',
  },
  '1.6': {
    title: 'The Rainbow',
    pages: [8, 9],
    tasks: [
      {
        number: 1,
        title: 'Listen, sing and discuss',
        detail:
          'Discuss favourite colours and rainbow experiences, sing the poem, and invite the child’s questions.',
        delivery: 'Voice + discussion',
      },
      {
        number: 2,
        title: 'Look and read',
        detail: 'Read all seven rainbow colours, including indigo and violet.',
        delivery: 'Screen + voice',
      },
      {
        number: 3,
        title: 'Listen and write',
        detail:
          'Keep dictation for rainbow, sky, peeping, clouds, orange, and indigo.',
        delivery: 'Teacher-led writing',
      },
      {
        number: 4,
        title: 'Fill the phrases',
        detail:
          'Use the picture clues to complete the two phrases about peeping out and being in the sky.',
        delivery: 'Voice + notebook',
      },
      {
        number: 5,
        title: 'Explore a / an / the',
        detail:
          'Work through the textbook’s picture/word groups and article examples, including unique things.',
        delivery: 'Screen + voice',
      },
      {
        number: 6,
        title: 'Write the articles',
        detail:
          'Complete all twelve article blanks on printed page 9, keeping the written practice.',
        delivery: 'Teacher-led writing',
      },
    ],
    teacher:
      'Teach the full second page, not just colours. Review the article examples against the textbook; explain sound-based use simply rather than treating spelling as a universal rule.',
  },
  '1.7': {
    title: 'Meet my family.',
    pages: [10, 10],
    tasks: [
      {
        number: 1,
        title: 'Listen and enact',
        detail:
          'Role-play Harsh’s visit to Priya’s home, including parents, Aaji/Ajoba, welcomes, and greetings.',
        delivery: 'Voice + role-play',
      },
      {
        number: 2,
        title: 'Choose a polite reply',
        detail:
          'Discuss and tick appropriate responses when a friend or an elder says thank you.',
        delivery: 'Voice + notebook',
      },
    ],
    teacher:
      'Retain the enacted dialogue and discuss polite choices in context. Let the child use their own family structure without assuming everyone lives with the same relatives.',
  },
  '1.8': {
    title: 'Let us know each other.',
    pages: [11, 13],
    tasks: [
      {
        number: 1,
        title: 'Listen and speak: animals',
        detail:
          'Explore all six named animals and their actions or descriptions.',
        delivery: 'Screen + voice',
      },
      {
        number: 2,
        title: 'Match the names',
        detail:
          'Match each animal to its special name and discuss why those names start with capitals.',
        delivery: 'Voice + notebook',
      },
      {
        number: 3,
        title: 'Read and write',
        detail:
          'Practise the full word set: hop, eat, guard, houses, swing, fast, national, animal.',
        delivery: 'Teacher-led writing',
      },
      {
        number: 4,
        title: 'Listen and speak: children',
        detail:
          'Explore the five introductions with names, towns/cities, and grades.',
        delivery: 'Voice + role-play',
      },
      {
        number: 5,
        title: 'Play the introduction game',
        detail:
          'Use name, home place, and favourite-game questions in the teacher-led onion-ring partner activity.',
        delivery: 'Teacher-led group',
      },
    ],
    teacher:
      'Keep the capital-letter discussion and real peer conversation. For previews use invented names and towns; ask for no real personal data.',
  },
  '1.9': {
    title: 'Everybody has a name.',
    pages: [14, 15],
    tasks: [
      {
        number: 1,
        title: 'Read the names',
        detail: 'Explore the printed names and notice how each name begins.',
        delivery: 'Screen + voice',
      },
      {
        number: 2,
        title: 'Listen and sing',
        detail: 'Enjoy the name poem and discuss why every name is special.',
        delivery: 'Voice + discussion',
      },
      {
        number: 3,
        title: 'Complete the name sentences',
        detail:
          'Write names for self, mother, father, and friend; retain personal-belonging labels from the teacher note.',
        delivery: 'Teacher-led writing',
      },
      {
        number: 4,
        title: 'Listen and make a cap',
        detail:
          'Follow the full illustrated newspaper folding and gluing sequence on page 15.',
        delivery: 'Teacher-led craft',
      },
      {
        number: 5,
        title: 'Guide a friend',
        detail: 'Use the same sequence to help a partner make a cap.',
        delivery: 'Teacher-led group',
      },
    ],
    teacher:
      'Keep the labeling task and hands-on cap activity. Support different families and let teachers adapt name prompts sensitively. The preview uses invented names.',
  },
  '1.10': {
    title: 'My Daily Routine',
    pages: [16, 17],
    tasks: [
      {
        number: 1,
        title: 'Picture talk',
        detail:
          'Discuss every routine picture on page 16, connecting the pictured actions to the child’s day.',
        delivery: 'Screen + voice',
      },
      {
        number: 2,
        title: 'Listen, choose and complete',
        detail:
          'Use all twelve help-box items in the routine passage: bath, get up, teeth, hair, school, breakfast, study, uniform, play, park, bed, family.',
        delivery: 'Voice + notebook',
      },
    ],
    teacher:
      'Retain the full picture discussion and written passage. Daily schedules vary; distinguish the textbook example from each child’s own routine.',
  },
}

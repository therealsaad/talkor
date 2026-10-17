import type { LessonActivity, TalkoraClass, TalkoraLesson, TalkoraLevel } from './types'

export const mockClasses: TalkoraClass[] = [{ id: 'class-4', grade: 4, name: 'Class 4', levelIds: Array.from({ length: 10 }, (_, i) => `level-${i + 1}`) }]

const levelNames = [['Word Explorer', 'School Courtyard', 'Move from everyday words to your first confident sentences.'], ['Sentence Builder', 'School Garden', 'Join words into clear sentences.'], ['Speaking Starter', 'Playground', 'Practice saying what you mean.'], ['Story World', 'Library', 'Read tiny stories with confidence.'], ['Conversation Corner', 'Ice Cream Shop', 'Take turns in friendly conversations.'], ['Grammar Garden', 'Classroom', 'Notice useful English patterns.'], ['Reading Adventure', 'City Library', 'Find meaning in every paragraph.'], ['Listening Lab', 'School Bus', 'Train your ears for English.'], ['Speaking Quest', 'Stage', 'Speak with confidence and clarity.'], ['Talkora Festival', 'Festival Hall', 'Bring all your skills together.']] as const
export const mockLevels: TalkoraLevel[] = levelNames.map(([title, place, description], index) => ({ id: `level-${index + 1}`, classId: 'class-4', number: index + 1, title, place, description, status: index === 0 ? 'in-progress' : index < 3 ? 'available' : 'locked', lessonIds: Array.from({ length: 10 }, (_, lessonIndex) => `lesson-${index + 1}-${lessonIndex + 1}`) }))

const schoolWords = ['school', 'teacher', 'student', 'class', 'book', 'pen', 'pencil', 'bag', 'desk', 'chair']
const familyWords = ['family', 'home', 'mother', 'father', 'brother', 'sister']
const worldWords = ['tree', 'flower', 'sun', 'moon', 'water', 'bird']
const feelingWords = ['happy', 'sad', 'good', 'tired', 'excited', 'big', 'small']
const actionWords = ['run', 'walk', 'eat', 'drink', 'read', 'write', 'play', 'go', 'come', 'like']

const lessonSections = [
  { id: 1, title: 'Meet the Words', subtitle: 'See and say the first words of your adventure.', skill: 'vocabulary', words: feelingWords.slice(0, 6) },
  { id: 2, title: 'School Words', subtitle: 'Explore the objects and people in your classroom.', skill: 'vocabulary', words: schoolWords },
  { id: 3, title: 'Family Words', subtitle: 'Talk about the people and places close to you.', skill: 'vocabulary', words: familyWords },
  { id: 4, title: 'Feelings', subtitle: 'Tell Miss Julie how you feel.', skill: 'conversation', words: feelingWords },
  { id: 5, title: 'Action Words', subtitle: 'Use action words to tell what you do.', skill: 'grammar', words: actionWords },
  { id: 6, title: 'Listen and Choose', subtitle: 'Train your ears to recognize familiar English.', skill: 'listening', words: worldWords },
  { id: 7, title: 'Speak With Julie', subtitle: 'Listen, repeat, and practice your clear voice.', skill: 'speaking', words: ['hello', 'happy', 'book', 'school', 'friend'] },
  { id: 8, title: 'Build Sentences', subtitle: 'Grow from a word to a real sentence.', skill: 'sentence building', words: ['book', 'school', 'friend', 'water', 'happy'] },
  { id: 9, title: 'Read and Understand', subtitle: 'Read a tiny story and find its meaning.', skill: 'reading', words: ['book', 'friend', 'home', 'school'] },
  { id: 10, title: 'Mastery Challenge', subtitle: 'Bring your new words, listening, speaking, and reading together.', skill: 'mastery', words: [...schoolWords.slice(0, 3), ...familyWords.slice(0, 2), ...feelingWords.slice(0, 2)] },
] as const

const activityFor = (lessonId: number, item: number, section: typeof lessonSections[number]): LessonActivity => {
  const word = section.words[item % section.words.length].toUpperCase()
  const nextWord = section.words[(item + 1) % section.words.length].toUpperCase()
  const types = ['pictureChoice', 'listenAndChoose', 'matching', 'spelling', 'sentenceBuilder', 'reading', 'listenAndRepeat', 'conversation', 'fillBlank', 'assessment'] as const
  const type = types[item]
  const common = { id: `level-1-${lessonId}-${item + 1}`, lessonId: `lesson-1-${lessonId}`, target: word, xp: type === 'assessment' ? 30 : type === 'listenAndRepeat' || type === 'conversation' ? 20 : 10 }
  if (type === 'pictureChoice') return { ...common, type, title: `Meet ${word}`, prompt: `Look at the scene. Tap ${word}.`, choices: [word, nextWord, 'SUN'], answer: word, hint: `Look for the ${word.toLowerCase()} in the picture.` }
  if (type === 'listenAndChoose') return { ...common, type, title: `Hear ${word}`, prompt: 'Press the speaker, then choose the word you heard.', choices: [word, nextWord, 'BOOK'], answer: word, hint: `Miss Julie said ${word.toLowerCase()}.` }
  if (type === 'matching') return { ...common, type, title: `Match ${word}`, prompt: `Match ${word} with its meaning.`, choices: [word, nextWord, 'A place to sleep'], answer: word, hint: `Say the word slowly.` }
  if (type === 'spelling') return { ...common, type, title: `Build ${word}`, prompt: `Tap the letters to build ${word}.`, choices: word.split(''), answer: word, hint: `The first letter is ${word[0]}.` }
  if (type === 'sentenceBuilder') return { ...common, type, title: 'Build a sentence', prompt: `Choose the sentence that uses ${word.toLowerCase()}.`, choices: [`I see a ${word.toLowerCase()}.`, `See I ${word.toLowerCase()}.`, `${word} a I see.`], answer: `I see a ${word.toLowerCase()}.`, hint: 'Start with I.' }
  if (type === 'reading') return { ...common, type, title: 'Reading adventure', prompt: `Mia sees a ${word.toLowerCase()} at school. What does Mia see?`, choices: [word, nextWord, 'MOON'], answer: word, hint: `The answer is in the story.` }
  if (type === 'listenAndRepeat') return { ...common, type, title: 'Speak with Miss Julie', prompt: `Listen, then repeat: I see a ${word.toLowerCase()}.`, hint: `Say slowly: I · see · a · ${word.toLowerCase()}.` }
  if (type === 'conversation') return { ...common, type, title: 'Conversation corner', prompt: `Miss Julie asks: What do you like? Say: I like ${word.toLowerCase()}.`, hint: `Try the whole sentence: I like ${word.toLowerCase()}.` }
  if (type === 'fillBlank') return { ...common, type, title: 'Fill the blank', prompt: `I have a ___.`, choices: [word, nextWord, 'RUN'], answer: word, hint: `Choose the thing you can have.` }
  return { ...common, type, title: 'Mastery checkpoint', prompt: `Which word means ${word.toLowerCase()}?`, choices: [word, nextWord, 'BLUE'], answer: word, hint: 'Listen to Miss Julie and think about the word.' }
}

export const mockLessons: TalkoraLesson[] = mockLevels.flatMap((level) => lessonSections.map((section) => ({ id: `lesson-${level.number}-${section.id}`, levelId: level.id, title: section.title, subtitle: section.subtitle, activityIds: Array.from({ length: 10 }, (_, index) => `level-${level.number}-${section.id}-${index + 1}`), estimatedMinutes: 12 })))
export const mockActivities: LessonActivity[] = mockLevels.flatMap((level) => lessonSections.flatMap((section) => Array.from({ length: 10 }, (_, index) => activityFor(section.id, index, section)).map((activity) => ({ ...activity, id: `${level.id}-${activity.id}`, lessonId: `lesson-${level.number}-${section.id}` }))))
export async function getLevel(id: string) { return mockLevels.find((level) => level.id === id || String(level.number) === id) ?? null }
export async function getLesson(id: string) { return mockLessons.find((lesson) => lesson.id === id) ?? null }
export async function getActivities(lessonId: string) { return mockActivities.filter((activity) => activity.lessonId === lessonId) }
export { lessonSections }

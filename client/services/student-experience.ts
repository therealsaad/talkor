import type { Achievement, LessonActivity } from '@/services/types'

export const dailyAdventure = {
  title: 'The Lost Word Parade',
  subtitle: 'Help Miss Julie find three missing words before the parade starts.',
  progress: 2,
  total: 5,
  reward: '+45 XP',
  minutes: '8 min',
  mood: 'You are on a roll!'
}

export const reviewQueue = [
  { word: 'cat', meaning: 'a small animal', sound: 'meow', color: 'coral' },
  { word: 'happy', meaning: 'feeling good', sound: 'smile', color: 'yellow' },
  { word: 'school', meaning: 'a place to learn', sound: 'learn', color: 'blue' }
]

export const studentAchievements: Achievement[] = [
  { id: 'first-words', title: 'First Words', description: 'Learned your first 10 words', category: 'learning', unlocked: true, progress: 100 },
  { id: 'voice-star', title: 'Brave Voice', description: 'Practiced speaking with Miss Julie', category: 'speaking', unlocked: true, progress: 100 },
  { id: 'streak-five', title: 'Five-Day Spark', description: 'Learned five days in a row', category: 'streak', unlocked: true, progress: 100 },
  { id: 'story-maker', title: 'Story Maker', description: 'Finish a Talkora story', category: 'completion', unlocked: false, progress: 40 },
]

export const extraBeginnerActivities: LessonActivity[] = [
  { id: 'activity-6', lessonId: 'lesson-1', type: 'sentenceBuilder', title: 'Make a sentence', prompt: 'Put the words in order.', target: 'I SEE A CAT.', choices: ['I', 'SEE', 'A', 'CAT'], answer: 'I SEE A CAT.', hint: 'Start with I. Then say what you see.', xp: 15 },
  { id: 'activity-7', lessonId: 'lesson-1', type: 'reading', title: 'Tiny story', prompt: 'Choose what happens next.', target: 'CAT', choices: ['The cat runs.', 'The cat is blue.', 'The cat sleeps in school.'], answer: 'The cat runs.', hint: 'A cat can run and play.', xp: 15 },
  { id: 'activity-8', lessonId: 'lesson-1', type: 'assessment', title: 'Golden word checkpoint', prompt: 'Show Miss Julie what you know.', target: 'CAT', choices: ['CAT', 'DOG', 'SUN'], answer: 'CAT', hint: 'You met this word at the start of the adventure.', xp: 25 },
]

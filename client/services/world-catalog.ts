import type { LevelItem } from '@/services/curriculum-service'

export type WorldTheme = { icon: string; color: string; illustration: string; lessons: string[] }

export const classFourWorlds: Record<number, WorldTheme> = {
  1: { icon: '🌱', color: '#9bdc52', illustration: 'Word Garden', lessons: ['Meet New Words', 'Listen Carefully', 'Match the Pictures', 'Spell It', 'Build Sentences', 'Speak With Miss Julie', 'Reading Time', 'Writing Time', 'Review Challenge', 'Mastery Test'] },
  2: { icon: '🏫', color: '#58c9f5', illustration: 'School Street', lessons: ['Meet the Place', 'Classroom Words', 'Listen for Clues', 'Build a Sentence', 'Talk to a Friend'] },
  3: { icon: '🍎', color: '#ffab64', illustration: 'Food Market', lessons: ['Food Words', 'What Do You Like?', 'Market Match', 'Speak Your Choice'] },
  4: { icon: '🎧', color: '#b891f2', illustration: 'Listening Lake', lessons: ['Sound Hunt', 'Listen Carefully', 'Follow the Story', 'Listening Challenge'] },
  5: { icon: '🗣️', color: '#ff89b5', illustration: 'Speaking Studio', lessons: ['Warm Up', 'Say It Clearly', 'Role Play', 'Voice Challenge'] },
  6: { icon: '📖', color: '#70cf93', illustration: 'Story Forest', lessons: ['Open the Story', 'Find the Clues', 'Read Aloud', 'Tell It Back'] },
  7: { icon: '✏️', color: '#ffd35c', illustration: 'Writing Workshop', lessons: ['Plan It', 'Write Words', 'Make Sentences', 'Share Your Work'] },
  8: { icon: '🏰', color: '#6c9ef8', illustration: 'Grammar Castle', lessons: ['Grammar Gate', 'Word Order', 'Sentence Builder', 'Castle Quiz'] },
  9: { icon: '⭐', color: '#f5a252', illustration: 'Confidence Cove', lessons: ['Brave Voice', 'Talk Together', 'Story Stage', 'Practice Quest'] },
  10: { icon: '🏆', color: '#f6cc4a', illustration: 'Final Quest', lessons: ['Word Review', 'Listening Test', 'Speak Strongly', 'Final Celebration'] },
}

export function worldFor(level: Pick<LevelItem, 'number' | 'title'>): WorldTheme {
  return classFourWorlds[level.number] || { icon: '✨', color: '#9bdc52', illustration: level.title, lessons: ['Explore', 'Listen', 'Practise', 'Celebrate'] }
}

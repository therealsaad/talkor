export type LessonAssetKey =
  | 'pizza'
  | 'cricket'
  | 'singing'
  | 'cake'
  | 'food'
  | 'football'
  | 'book'
  | 'art'
  | 'friends'
  | 'cats'
  | 'mango'
  | 'question'

export const LESSON_ASSETS: Record<LessonAssetKey, string> = {
  pizza: '/lesson-assets/pizza.svg',
  cricket: '/lesson-assets/cricket.svg',
  singing: '/lesson-assets/singing.svg',
  cake: '/lesson-assets/cake.svg',
  food: '/lesson-assets/food.svg',
  football: '/lesson-assets/football.svg',
  book: '/lesson-assets/book.svg',
  art: '/lesson-assets/art.svg',
  friends: '/lesson-assets/friends.svg',
  cats: '/lesson-assets/cats.svg',
  mango: '/lesson-assets/mango.svg',
  question: '/lesson-assets/question.svg',
}

export function resolveLessonAssetKey(value?: unknown): LessonAssetKey | undefined {
  const key = String(value || '').trim().toLowerCase()
  if (!key) return undefined

  if (key.includes('pizza')) return 'pizza'
  if (key.includes('cricket')) return 'cricket'
  if (key.includes('sing')) return 'singing'
  if (key.includes('cake')) return 'cake'
  if (key.includes('football')) return 'football'
  if (key.includes('book') || key.includes('story')) return 'book'
  if (key.includes('draw') || key.includes('art')) return 'art'
  if (key.includes('friend')) return 'friends'
  if (key.includes('cat')) return 'cats'
  if (key.includes('mango')) return 'mango'
  if (key.includes('food') || key.includes('noodle') || key.includes('idli')) return 'food'
  if (key.includes('question')) return 'question'

  return undefined
}

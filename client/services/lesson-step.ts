import type { ActivityItem } from '@/services/curriculum-service'
import { personalizeLessonText } from '@/services/lesson-progress'

export type LessonStepVisual = {
  label: string
  emoji: string
}

const FALLBACK_STEPS: LessonStepVisual[] = [
  { label: 'Listen & Repeat', emoji: '👂' },
  { label: 'Word Meaning', emoji: '💡' },
  { label: 'Choose Favourite', emoji: '❤️' },
  { label: 'Speak Full Sentence', emoji: '🗣️' },
  { label: 'Ask a Follow-up', emoji: '❓' },
  { label: 'Listen and Respond', emoji: '🎧' },
  { label: 'Respect Different Choices', emoji: '🤝' },
  { label: 'Mini Conversation', emoji: '💬' },
  { label: 'Revision Challenge', emoji: '⭐' },
  { label: 'Final Speaking Challenge', emoji: '🏆' },
]

/**
 * One source of truth for the line a child sees and the deterministic line
 * Miss Julie speaks. Never prefer metadata.ttsText or a stale target over the
 * visible prompt. This also keeps Azure/S3 cache keys stable.
 */
export function lessonVisibleSpokenText(activity: ActivityItem | undefined, studentName: string) {
  if (!activity) return ''

  const text =
    activity.prompt ||
    activity.teacherPrompt ||
    activity.instruction ||
    activity.modelSentence ||
    activity.target ||
    ''

  return personalizeLessonText(text, studentName)
}

export function lessonStepVisual(activity: ActivityItem, index: number): LessonStepVisual {
  const metadataLabel = typeof activity.metadata?.experienceLabel === 'string'
    ? activity.metadata.experienceLabel.replace(/^\s*\d+\.\s*/, '').trim()
    : ''
  const metadataEmoji = typeof activity.metadata?.lessonEmoji === 'string'
    ? activity.metadata.lessonEmoji.trim()
    : ''

  const fallback = FALLBACK_STEPS[index] || { label: activity.title, emoji: '✨' }

  return {
    label: metadataLabel || fallback.label,
    emoji: metadataEmoji || fallback.emoji,
  }
}

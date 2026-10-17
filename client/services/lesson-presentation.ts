import type { ActivityItem } from '@/services/curriculum-service'

export type WarmupPrompt = {
  label: string
  emoji: string
  assetKey: string
}

const WARMUP_FALLBACK: WarmupPrompt[] = [
  { label: 'Playing cricket', emoji: '🏏', assetKey: 'cricket' },
  { label: 'Singing', emoji: '🎤', assetKey: 'singing' },
  { label: 'Eating cake', emoji: '🎂', assetKey: 'cake' },
]

const ASSET_BY_KEYWORD: Array<[string, string]> = [
  ['cricket', 'cricket'],
  ['sing', 'singing'],
  ['music', 'singing'],
  ['cake', 'cake'],
  ['football', 'football'],
  ['draw', 'art'],
  ['art', 'art'],
  ['book', 'book'],
  ['read', 'book'],
  ['story', 'book'],
  ['friend', 'friends'],
  ['pizza', 'pizza'],
  ['food', 'food'],
  ['noodle', 'food'],
  ['idli', 'food'],
  ['cat', 'cats'],
  ['mango', 'mango'],
]

const EMOJI_BY_KEYWORD: Array<[string, string]> = [
  ['cricket', '🏏'],
  ['sing', '🎤'],
  ['music', '🎵'],
  ['read', '📚'],
  ['book', '📚'],
  ['homework', '✏️'],
  ['cake', '🎂'],
  ['football', '⚽'],
  ['draw', '🎨'],
  ['dance', '💃'],
  ['friend', '🧑‍🤝‍🧑'],
]

function cleanLabel(value: string) {
  return value.trim().replace(/[?.!]+$/, '')
}

function assetFor(label: string) {
  const normalized = label.toLowerCase()
  return ASSET_BY_KEYWORD.find(([keyword]) => normalized.includes(keyword))?.[1] || 'question'
}

function emojiFor(label: string, index: number) {
  const normalized = label.toLowerCase()
  return (
    EMOJI_BY_KEYWORD.find(([keyword]) => normalized.includes(keyword))?.[1] ||
    WARMUP_FALLBACK[index % WARMUP_FALLBACK.length].emoji
  )
}

export function getWarmupPrompts(
  activity?: ActivityItem,
  allowUnitOneFallback = false,
): WarmupPrompt[] {
  const source = activity?.content?.visualPrompts

  if (!Array.isArray(source) || source.length === 0) {
    return allowUnitOneFallback
      ? WARMUP_FALLBACK
      : []
  }

  return source
    .map((item, index): WarmupPrompt | null => {
      if (typeof item === 'string') {
        const label = cleanLabel(item)
        if (!label) return null
        return {
          label,
          emoji: emojiFor(label, index),
          assetKey: assetFor(label),
        }
      }

      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const label = cleanLabel(String(record.label || record.text || '').trim())
        if (!label) return null

        return {
          label,
          emoji: String(record.emoji || emojiFor(label, index)),
          assetKey: String(record.assetKey || assetFor(label)),
        }
      }

      return null
    })
    .filter((item): item is WarmupPrompt => Boolean(item))
}

export function warmupQuestion(label: string) {
  const cleaned = cleanLabel(label)
  return `Do you like ${cleaned.toLowerCase()}?`
}

export function warmupAnswer(label: string, likesIt: boolean) {
  const cleaned = cleanLabel(label).toLowerCase()
  return likesIt
    ? `Yes, I do. I like ${cleaned}.`
    : `No, I don't. I don't like ${cleaned}.`
}

export function warmupReaction(label: string, likesIt: boolean) {
  const key = label.toLowerCase()

  if (key.includes('cricket')) {
    return likesIt
      ? 'Nice! Cricket is fun and full of teamwork.'
      : 'That is okay. Everyone enjoys different games.'
  }

  if (key.includes('sing')) {
    return likesIt
      ? 'Lovely! Singing is a fun way to use your voice confidently.'
      : 'That is okay. We all enjoy different activities.'
  }

  if (key.includes('cake')) {
    return likesIt
      ? 'Yum! Cake can be a lovely treat.'
      : 'That is completely okay. Everyone has different tastes.'
  }

  return likesIt
    ? 'Nice! Thanks for telling me what you like.'
    : 'That is okay. Different people can have different favourites.'
}

export function resolveActivityTeacherLine(
  activity: ActivityItem | undefined,
  studentName = 'Explorer',
) {
  if (!activity) return ''

  const candidates = [
    activity.teacherPrompt,
    activity.prompt,
    activity.instruction,
    activity.modelSentence,
    activity.target,
  ]

  const line =
    candidates.find(
      (value) => typeof value === 'string' && value.trim(),
    ) || ''

  return line.replace(/\bAarav\b/gi, studentName).trim()
}

export function lessonCoachCue(
  activity?: ActivityItem,
  allowUnitOneFallback = false,
) {
  const stage = String(activity?.stage || '').toUpperCase()

  if (stage === 'WARM_UP') {
    if (!isWarmupActivity(activity, allowUnitOneFallback)) {
      return {
        icon: '💬',
        label: 'TURN AND TALK',
        tip: 'Take turns asking and answering. Listen carefully to your partner.',
      }
    }

    return {
      icon: '⚡',
      label: 'QUICK PICK',
      tip: 'Choose what is true for you. There is no wrong favourite.',
    }
  }

  if (stage === 'LISTEN_REPEAT') {
    return {
      icon: '🎧',
      label: 'LISTEN → LEARN → SAY',
      tip: 'Listen to a useful sentence, then try it yourself.',
    }
  }

  if (stage === 'SPEAK') {
    return {
      icon: '🎙️',
      label: 'THINK → SPEAK',
      tip: 'Say your own answer in a clear full sentence.',
    }
  }

  if (stage === 'INTERACT') {
    return {
      icon: '💬',
      label: 'TALK WITH JULIE',
      tip: 'Answer, listen, and keep the conversation going.',
    }
  }

  if (stage === 'FOLLOW_UP' || stage === 'REASONS') {
    return {
      icon: '🔎',
      label: 'GO DEEPER',
      tip: 'Tell one more thing: who, why, what, or how.',
    }
  }

  if (stage === 'RESPECT_DIFFERENCES') {
    return {
      icon: '🤝',
      label: 'SPEAK POLITELY',
      tip: 'It is okay to like different things.',
    }
  }

  if (stage === 'PRACTICE_ZONE') {
    return {
      icon: '✏️',
      label: 'PRACTICE ZONE',
      tip: 'Build a sentence, then say it aloud.',
    }
  }

  if (stage === 'FINAL_CHALLENGE' || stage === 'FINAL_TALK') {
    return {
      icon: '🏆',
      label: 'FINAL TALK',
      tip: 'Use everything you learned in a real conversation.',
    }
  }

  return {
    icon: '✨',
    label: 'ENGLISH MISSION',
    tip: 'Listen, think, and answer with confidence.',
  }
}

export function isWarmupActivity(
  activity?: ActivityItem,
  allowUnitOneFallback = false,
) {
  const stage = String(activity?.stage || '').toUpperCase()
  const digitalType = String(activity?.metadata?.digitalType || '').toUpperCase()
  const hasVisualPrompts =
    Array.isArray(activity?.content?.visualPrompts) &&
    activity.content.visualPrompts.length > 0

  return (
    digitalType === 'VISUAL_WARM_UP' ||
    (
      stage === 'WARM_UP' &&
      (hasVisualPrompts || allowUnitOneFallback)
    )
  )
}

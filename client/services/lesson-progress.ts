export function firstUnfinishedActivity(
  ids: string[],
  completed: ReadonlySet<string>,
  unavailable: ReadonlySet<string> = new Set(),
): number {
  const next = ids.findIndex((id) => !completed.has(id) && !unavailable.has(id))
  return next < 0 ? 0 : next
}

export function personalizeLessonText(text: string, studentName: string): string {
  return text.replace(/\bAarav\b/gi, studentName)
}

export function isOpenLessonConversation(activity: {
  type?: string
  stage?: string
  metadata?: Record<string, unknown>
  aiEnabled?: boolean
}): boolean {
  const type = String(activity.type || '').toUpperCase()
  const stage = String(activity.stage || '').toUpperCase()
  const digitalType = String(activity.metadata?.digitalType || '').toUpperCase()

  if (type === 'PICTURE_CHOICE' || type === 'MCQ') return false
  if (activity.metadata?.conversationMode === 'OPEN') return true

  if (
    ['OPEN_CONVERSATION', 'FOLLOW_UP_CONVERSATION', 'FINAL_CONVERSATION', 'CONVERSATION'].includes(type) ||
    ['INTERACT', 'FOLLOW_UP', 'REASONS', 'RESPECT_DIFFERENCES', 'FINAL_TALK', 'SPEAK'].includes(stage)
  ) {
    return true
  }

  // Warm-up and other controlled steps can still use live AI turns.
  if (activity.aiEnabled && digitalType === 'VISUAL_WARM_UP') return true

  return false
}

export function shouldUseLessonVoice(activity: { type?: string; stage?: string; voiceEnabled?: boolean; metadata?: Record<string, unknown> }): boolean {
  // Curriculum explicitly controls whether Miss Julie speaks. This keeps every
  // visible teacher prompt aligned with TTS instead of silently disabling voice
  // for SPEAK/PRACTICE activities.
  if (activity.metadata?.voiceDisabled === true) return false
  if (activity.voiceEnabled === true) return true

  const type = String(activity.type || '').toUpperCase()
  const stage = String(activity.stage || '').toUpperCase()
  const digitalType = String(activity.metadata?.digitalType || '').toUpperCase()

  if (stage === 'REWARD') return false

  return ['LIKE_DISLIKE', 'LISTEN_MODEL', 'LISTEN_AND_REPEAT', 'REPEAT_SENTENCE', 'SPEAK_PROMPT', 'SENTENCE_BUILDER', 'SPEAKING', 'CONVERSATION', 'OPEN_CONVERSATION', 'FOLLOW_UP_CONVERSATION', 'FINAL_CONVERSATION'].includes(type)
    || ['VISUAL_WARM_UP', 'MODEL_CONVERSATION', 'READ_REPEAT', 'EXACT_LINE_ROLE_SWAP', 'FILL_BLANK_PRACTICE'].includes(digitalType)
    || activity.metadata?.conversationMode === 'OPEN'
}

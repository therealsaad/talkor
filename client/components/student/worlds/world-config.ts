export type TalkoraWorldId =
  | 'wonder-fair'
  | 'buddy-boulevard'
  | 'tasty-town'
  | 'time-trek'
  | 'helping-hands-harbor'
  | 'storywood'
  | 'memory-meadows'
  | 'voice-valley'

export type TalkoraStageKey =
  | 'WARM_UP'
  | 'LISTEN_REPEAT'
  | 'SPEAK'
  | 'INTERACT'
  | 'FOLLOW_UP'
  | 'REASONS'
  | 'RESPECT_DIFFERENCES'
  | 'PRACTICE_ZONE'
  | 'PRESENT'
  | 'ROLEPLAY'
  | 'FINAL_CHALLENGE'
  | 'FINAL_TALK'
  | 'BONUS'
  | 'HOME_PRACTICE'

export interface TalkoraWorldConfig {
  id: TalkoraWorldId

  /**
   * Child-facing Talkora world name.
   */
  worldName: string

  /**
   * Real syllabus/unit title.
   */
  syllabusName: string

  /**
   * Default stage label only.
   * Actual activity.stage should override this.
   */
  stageLabel: string

  /**
   * Root environment class used by LessonWorld.
   */
  shellClass: string

  /**
   * Main accent used by HUD / selected controls.
   */
  accent: string

  /**
   * Soft environment overlay colour.
   */
  overlay: string

  /**
   * Small map icon / UI fallback.
   * This is not the main 3D landmark artwork.
   */
  icon: string

  /**
   * Short description for map/detail UI.
   */
  description: string

  /**
   * Whether this world currently has published
   * student curriculum content.
   *
   * Units 5–8 can stay visible on the map while
   * remaining locked/upcoming until curriculum
   * is actually published.
   */
  published: boolean
}

/* =========================================================
   TALKORA 8-WORLD CONFIGURATION
   ========================================================= */

export const TALKORA_WORLDS = {
  1: {
    id: 'wonder-fair',
    worldName: 'Favourite Fair',
    syllabusName: 'My Favourite Things',
    stageLabel: 'Warm-Up',
    shellClass: 'wonder-fair-scene',
    accent: '#FFD84D',
    overlay: '#8DDFF5',
    icon: '★',
    description:
      'Explore the things you like, love and enjoy talking about.',
    published: true,
  },

  2: {
    id: 'buddy-boulevard',
    worldName: 'Friendship Garden',
    syllabusName: 'All About My Partner',
    stageLabel: 'Partner Talk',
    shellClass: 'buddy-boulevard-scene',
    accent: '#71B8FF',
    overlay: '#D9EDFF',
    icon: '♥',
    description:
      'Ask questions, learn about a partner and present what you discover.',
    published: true,
  },

  3: {
    id: 'tasty-town',
    worldName: 'Talkora Café',
    syllabusName: "Let's Order",
    stageLabel: 'Food Time',
    shellClass: 'tasty-town-scene',
    accent: '#FF8E66',
    overlay: '#FFD8A8',
    icon: '☕',
    description:
      'Practise polite restaurant conversations and talk about food.',
    published: true,
  },

  4: {
    id: 'time-trek',
    worldName: 'Calendar Town',
    syllabusName: 'On My Calendar',
    stageLabel: 'Time Talk',
    shellClass: 'time-trek-scene',
    accent: '#8F7DFF',
    overlay: '#DBC7FF',
    icon: '◷',
    description:
      'Talk about yesterday, your daily routine and future plans.',
    published: true,
  },

  5: {
    id: 'helping-hands-harbor',
    worldName: 'Helping Hands Harbor',
    syllabusName: 'Let Me Help You',
    stageLabel: 'Helping Talk',
    shellClass: 'helping-hands-harbor-scene',
    accent: '#55CF91',
    overlay: '#D8F6E5',
    icon: '✦',
    description:
      'Use helpful, polite English while supporting people around you.',
    published: false,
  },

  6: {
    id: 'storywood',
    worldName: 'Storywood',
    syllabusName: 'Familiar Folk Tales',
    stageLabel: 'Story Talk',
    shellClass: 'storywood-scene',
    accent: '#A876E8',
    overlay: '#EADCF8',
    icon: '✧',
    description:
      'Step into familiar stories and practise speaking through characters.',
    published: false,
  },

  7: {
    id: 'memory-meadows',
    worldName: 'Memory Meadows',
    syllabusName: 'My Special Moment',
    stageLabel: 'My Story',
    shellClass: 'memory-meadows-scene',
    accent: '#F2B94B',
    overlay: '#FFF0C7',
    icon: '◆',
    description:
      'Share special memories and learn to tell personal stories clearly.',
    published: false,
  },

  8: {
    id: 'voice-valley',
    worldName: 'Voice Valley',
    syllabusName: 'Using Our Voices for Good',
    stageLabel: 'Voice Mission',
    shellClass: 'voice-valley-scene',
    accent: '#F06F9D',
    overlay: '#F9D9E7',
    icon: '✹',
    description:
      'Use confident English to share ideas that can help other people.',
    published: false,
  },
} as const satisfies Record<number, TalkoraWorldConfig>

export type TalkoraWorldNumber =
  keyof typeof TALKORA_WORLDS

/* =========================================================
   WORLD RESOLUTION
   ========================================================= */

/**
 * Resolves a Talkora world from the real level/unit number.
 *
 * IMPORTANT:
 * We no longer send Unit 5–8 back to Wonder Fair.
 */
export function resolveWorldForLevel(
  levelNumber?: number,
  fallbackTitle?: string,
): TalkoraWorldConfig {
  const numericLevel = Number(levelNumber)

  if (
    Number.isFinite(numericLevel) &&
    numericLevel >= 1 &&
    numericLevel <= 8
  ) {
    return TALKORA_WORLDS[
      numericLevel as TalkoraWorldNumber
    ]
  }

  /**
   * Compatibility fallback:
   * Sometimes older routes only provide the world/title.
   */
  if (fallbackTitle?.trim()) {
    const normalized = normalizeText(fallbackTitle)

    const matchedWorld = Object.values(
      TALKORA_WORLDS,
    ).find((world) => {
      return (
        normalizeText(world.worldName) === normalized ||
        normalizeText(world.syllabusName) === normalized
      )
    })

    if (matchedWorld) {
      return matchedWorld
    }
  }

  return TALKORA_WORLDS[1]
}

/**
 * Resolve world directly from a child-facing world name
 * or official syllabus name.
 */
export function resolveWorldByName(
  value?: string,
): TalkoraWorldConfig {
  if (!value?.trim()) {
    return TALKORA_WORLDS[1]
  }

  const normalized = normalizeText(value)

  return (
    Object.values(TALKORA_WORLDS).find(
      (world) =>
        normalizeText(world.worldName) === normalized ||
        normalizeText(world.syllabusName) === normalized,
    ) || TALKORA_WORLDS[1]
  )
}

/**
 * Get ordered world list for the Adventure map.
 */
export function getTalkoraWorlds() {
  return Object.entries(TALKORA_WORLDS).map(
    ([number, world]) => ({
      number: Number(number),
      ...world,
    }),
  )
}

/* =========================================================
   STAGE LABELS
   ========================================================= */

const TALKORA_STAGE_LABELS: Record<string, string> = {
  WARM_UP: 'Warm-Up',

  LISTEN_REPEAT: 'Listen & Repeat',

  SPEAK: 'Speak',

  INTERACT: 'Conversation',

  FOLLOW_UP: 'Ask One More',

  REASONS: 'Tell Me Why',

  RESPECT_DIFFERENCES: 'Different Is Great',

  PRACTICE_ZONE: 'Practice Zone',

  PRESENT: 'Present',

  ROLEPLAY: 'Roleplay',

  FINAL_CHALLENGE: 'Final Challenge',

  FINAL_TALK: 'Final Talk',

  BONUS: 'Bonus Adventure',

  HOME_PRACTICE: 'Practice at Home',
}

/**
 * Converts backend stage values into child-friendly labels.
 *
 * Existing call remains valid:
 *
 * resolveStageLabel(activity.stage, world.stageLabel)
 */
export function resolveStageLabel(
  activityStage?: string,
  fallback = 'Warm-Up',
) {
  if (!activityStage?.trim()) {
    return fallback
  }

  const normalizedStage = normalizeStage(
    activityStage,
  )

  return (
    TALKORA_STAGE_LABELS[normalizedStage] ||
    humanizeStage(activityStage) ||
    fallback
  )
}

/* =========================================================
   STAGE HELPERS
   ========================================================= */

export function isConversationStage(
  activityStage?: string,
) {
  const stage = normalizeStage(activityStage)

  return [
    'INTERACT',
    'FOLLOW_UP',
    'REASONS',
    'RESPECT_DIFFERENCES',
    'ROLEPLAY',
    'FINAL_TALK',
  ].includes(stage)
}

export function isSpeakingStage(
  activityStage?: string,
) {
  const stage = normalizeStage(activityStage)

  return [
    'SPEAK',
    'INTERACT',
    'FOLLOW_UP',
    'REASONS',
    'RESPECT_DIFFERENCES',
    'PRESENT',
    'ROLEPLAY',
    'FINAL_CHALLENGE',
    'FINAL_TALK',
  ].includes(stage)
}

export function isPresentationStage(
  activityStage?: string,
) {
  const stage = normalizeStage(activityStage)

  return [
    'PRESENT',
  ].includes(stage)
}

export function isFinalStage(
  activityStage?: string,
) {
  const stage = normalizeStage(activityStage)

  return [
    'FINAL_CHALLENGE',
    'FINAL_TALK',
  ].includes(stage)
}

/* =========================================================
   DEFAULT WORLD MODE
   ========================================================= */

export function resolveDefaultLessonMode(
  activityStage?: string,
): 'listen' | 'repeat' | 'speak' {
  const stage = normalizeStage(activityStage)

  if (
    isSpeakingStage(stage)
  ) {
    return 'speak'
  }

  if (
    stage === 'LISTEN_REPEAT'
  ) {
    return 'listen'
  }

  return 'listen'
}

/* =========================================================
   WORLD AVAILABILITY
   ========================================================= */

export function isWorldPublished(
  levelNumber?: number,
) {
  return resolveWorldForLevel(
    levelNumber,
  ).published
}

/* =========================================================
   INTERNAL HELPERS
   ========================================================= */

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeStage(
  value?: string,
) {
  if (!value) {
    return ''
  }

  return value
    .trim()
    .toUpperCase()
    .replace(/&/g, 'AND')
    .replace(/[\s-]+/g, '_')
}

function humanizeStage(
  value?: string,
) {
  if (!value?.trim()) {
    return ''
  }

  return value
    .trim()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
}
// ============================================================
// FILE: client/config/talkora-assets.ts
//
// FULL FILE.
//
// This preserves your existing Talkora contracts,
// but adds the approved background + together hero asset.
// ============================================================

export const talkoraAssets = {
  environments: {
    landing:
      '/assets/talkora-world-approved.webp',

    school:
      '/classroom-scenes/classroom-board.webp',

    classroom:
      '/classroom-scenes/classroom-circle.webp',

    lesson:
      '/classroom-scenes/classroom-lesson.webp',
  },

  hero: {
    trio:
      '/assets/talkora-hero-trio.png',
  },

  julie: {
    canonical:
      '/miss-julie/standing.webp',

    idle:
      '/miss-julie/welcome.webp',

    welcome:
      '/miss-julie/welcome.webp',

    listening:
      '/miss-julie/listening.webp',

    thinking:
      '/miss-julie/thinking.webp',

    speaking:
      '/miss-julie/speaking.webp',

    curious:
      '/miss-julie/listening.webp',

    encouraging:
      '/miss-julie/encouraging.webp',

    correct:
      '/miss-julie/heart.webp',

    try_again:
      '/miss-julie/try_again.webp',

    retry:
      '/miss-julie/retry.webp',

    modeling:
      '/miss-julie/teaching.webp',

    hinting:
      '/miss-julie/teaching.webp',

    proud:
      '/miss-julie/proud.webp',

    celebrate:
      '/miss-julie/celebrating.webp',

    celebrating:
      '/miss-julie/celebrating.webp',

    pointing:
      '/miss-julie/pointing.webp',

    reading:
      '/miss-julie/reading.webp',

    teaching:
      '/miss-julie/teaching.webp',

    standing:
      '/miss-julie/standing.webp',
  },

  students: {
    BOY:
      '/talkora/characters/students/boy/canonical.png',

    GIRL:
      '/talkora/characters/students/girl/canonical.png',
  },

  avatars: {
    aarav:
      '/avatars/aarav.png',

    ananya:
      '/avatars/ananya.png',

    kabir:
      '/avatars/kabir.png',

    meera:
      '/avatars/meera.png',

    rahul:
      '/avatars/rahul.png',

    sara:
      '/avatars/sara.png',

    rehan:
      '/avatars/aarav.png',

    vihaan:
      '/avatars/kabir.png',

    arjun:
      '/avatars/rahul.png',

    ibrahim:
      '/avatars/aarav.png',

    zara:
      '/avatars/ananya.png',

    myra:
      '/avatars/sara.png',

    aisha:
      '/avatars/ananya.png',

    diya:
      '/avatars/meera.png',

    pari:
      '/avatars/sara.png',
  },

  avatarFallbacks: [
    '/avatars/aarav.png',
    '/avatars/ananya.png',
    '/avatars/kabir.png',
    '/avatars/meera.png',
    '/avatars/rahul.png',
    '/avatars/sara.png',
  ],
} as const

export type MissJulieState =
  keyof typeof talkoraAssets.julie

export type LearnerAvatarType =
  keyof typeof talkoraAssets.students

export function learnerAvatar(
  avatarType?: LearnerAvatarType,
) {
  return talkoraAssets.students[
    avatarType || 'BOY'
  ]
}

export function accountAvatar(
  avatar:
    string | undefined,

  stableIndex = 0,
) {
  if (
    avatar &&
    avatar in
      talkoraAssets.avatars
  ) {
    return talkoraAssets.avatars[
      avatar as keyof typeof talkoraAssets.avatars
    ]
  }

  return (
    avatar ||
    talkoraAssets.avatarFallbacks[
      Math.abs(
        stableIndex,
      ) %
        talkoraAssets
          .avatarFallbacks
          .length
    ]
  )
}
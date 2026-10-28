
import type { LevelActivity, SuggestedActivity } from '../../../types'

/**
 * Level 4 video-aligned draft.
 *
 * The video visuals appear to introduce Q–V vocabulary:
 * Queen, Rabbit, Sun, Tiger, Umbrella and Van.
 *
 * These are editorial suggestions only. Do not publish them
 * until the spoken content, answer keys and backend activities
 * have been verified.
 */
export const activities: LevelActivity[] = []

export const suggestedActivities: SuggestedActivity[] = [
  {
    label: 'Meet the Pictures: Q–V',
    mode: 'tap-picture',
    educatorNote:
      'Use the six pictures visible in the lesson video: Queen or Princess, Rabbit, Sun, Tiger, Umbrella and Van. Miss Julie introduces each picture and its word. Confirm the exact spoken words and letter-sound examples against the video before approving this activity.',
  },
  {
    label: 'Say the Words with Miss Julie',
    mode: 'repeat-after-julie',
    educatorNote:
      'Invite the child to repeat the vocabulary words shown in the video. Use the existing Talkora voice service for microphone capture and feedback. Do not create scores or claim speech evaluation until the approved backend activity and rubric are connected.',
  },
  {
    label: 'Listen and Find the Picture',
    mode: 'listen-and-find',
    educatorNote:
      'Miss Julie says a word and the child identifies its matching picture from the six video-aligned choices. Configure the correct answer and scoring in the existing backend activity record before enabling this activity for students.',
  },
]

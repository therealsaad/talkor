import type { LevelActivity, SuggestedActivity } from '../../../types'
import { class1DraftActivities, class1DraftSuggestions } from '../balbharati-curriculum'
import { CLASS1_LEVEL2_REVIEW_ACTIVITIES } from './teaching-plan'
import { CLASS1_L2_NUMBERED_EXERCISE_ACTIVITIES } from './exercise-checkpoints'

/** Original lesson drafts and all 19 numbered teacher-review checkpoints anchored to Balbharati chapters.
 *  Deliberately not published: a qualified educator must sign off every prompt,
 *  bilingual scaffold, asset and evidence rubric before student deployment. */
export const activities: LevelActivity[] = [
  ...class1DraftActivities(2),
  ...CLASS1_LEVEL2_REVIEW_ACTIVITIES,
  ...CLASS1_L2_NUMBERED_EXERCISE_ACTIVITIES,
]

export const suggestedActivities: SuggestedActivity[] = [
  ...class1DraftSuggestions(2),
  { label: 'Class 1 L2 original storyboard and safeguarding review', mode: 'guided-dialogue',
    educatorNote: 'Teacher approval required for narrated 1.2–1.6 storyboard, stable student progress, Hindi/Marathi scaffolds, safe picture prompts, approved media and real microphone/Azure playback.' },
]

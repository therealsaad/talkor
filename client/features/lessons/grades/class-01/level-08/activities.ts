import type { LevelActivity, SuggestedActivity } from '../../../types'
import { class1DraftActivities, class1DraftSuggestions } from '../balbharati-curriculum'

/** Original lesson drafts anchored to individual English Balbharati chapters.
 *  Deliberately not published: a qualified educator must sign off every prompt,
 *  bilingual scaffold, asset and evidence rubric before student deployment. */
export const activities: LevelActivity[] = class1DraftActivities(8)

export const suggestedActivities: SuggestedActivity[] = class1DraftSuggestions(8)

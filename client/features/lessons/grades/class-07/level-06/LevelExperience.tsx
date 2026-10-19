'use client'
import { LevelDraftPreview } from '../../../LevelDraftPreview'
import { config } from './config'
import { activities, suggestedActivities } from './activities'
import { interactions } from './interactions'
/** Staff-only design preview; do not route students to unfinished lessons. */
export default function LevelExperience() {
  return <LevelDraftPreview config={config} activities={activities} suggestedActivities={suggestedActivities} interactions={interactions} />
}

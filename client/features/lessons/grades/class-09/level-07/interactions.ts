import type { LevelInteractionConfig } from '../../../types'

export const interactions: LevelInteractionConfig = {
  "allowedModes": [
    "conversation",
    "scenario-decision",
    "speaking-reflection"
  ],
  "requireMicrophone": true,
  "disableMusicDuringSpeech": true,
  "allowReplayCompletedLevels": true,
  "teacherStates": [
    "idle",
    "speaking",
    "listening",
    "thinking",
    "pointing",
    "encouraging",
    "celebrating"
  ]
}

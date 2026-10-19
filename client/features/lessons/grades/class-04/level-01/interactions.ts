import type { LevelInteractionConfig } from '../../../types'

export const interactions: LevelInteractionConfig = {
  "allowedModes": [
    "role-play",
    "sentence-builder",
    "listen-and-answer"
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

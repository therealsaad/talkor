import type { LevelInteractionConfig } from '../../../types'

export const interactions: LevelInteractionConfig = {
  "allowedModes": [
    "picture-choice",
    "guided-dialogue",
    "word-builder"
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

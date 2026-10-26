import type { LevelInteractionConfig } from '../../../types'

export const interactions: LevelInteractionConfig = {
  "allowedModes": [
    "tap-picture",
    "repeat-after-julie",
    "listen-and-find"
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

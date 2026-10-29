import type { LevelInteractionConfig } from '../../../types'

export const interactions: LevelInteractionConfig = {
  allowedModes: ['repeat-after-julie'],
  requireMicrophone: true,
  disableMusicDuringSpeech: true,
  allowReplayCompletedLevels: true,
  teacherStates: ['idle', 'speaking', 'listening', 'thinking', 'pointing', 'encouraging', 'celebrating'],
}

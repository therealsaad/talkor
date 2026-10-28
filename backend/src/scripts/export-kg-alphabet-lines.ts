/** Export the authoritative static curriculum TTS manifest. */
import { CURRICULUM_STATIC_AUDIO_MANIFEST, KG_AUDIO_VERSION } from '../kg/alphabet-content'

console.log(JSON.stringify({
  manifestVersion: KG_AUDIO_VERSION,
  voicePreset: 'miss-julie-priya-v6',
  clips: CURRICULUM_STATIC_AUDIO_MANIFEST,
}, null, 2))

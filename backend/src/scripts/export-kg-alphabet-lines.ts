/** Export the authoritative curriculum-linked offline TTS manifest. */
import { AUDIO_MANIFEST, KG_AUDIO_VERSION } from '../kg/alphabet-content'

console.log(JSON.stringify({
  manifestVersion: KG_AUDIO_VERSION,
  voicePreset: 'miss-julie-priya-v6',
  clips: AUDIO_MANIFEST,
}, null, 2))

/**
 * Deterministic, zero-cloud-cost manifest for the KG Azure/S3 operator.
 * This module only imports checked-in fixed narration text.
 * It cannot publish a lesson or prove teacher/rights approval.
 */
import { createHash } from 'node:crypto'
import { AUDIO_MANIFEST } from '../kg/alphabet-content'
import { LEVEL2_NARRATION } from '../kg/level2-content'
import { LEVEL3_NARRATION } from '../kg/level3-content'
import { LEVEL4_NARRATION } from '../kg/level4-content'
import { LEVEL5_NARRATION } from '../kg/level5-content'

export type FixedKGLine = Readonly<{ level: number; id: string; text: string }>

export function fixedKGPrewarmLines(): FixedKGLine[] {
  return [
    ...AUDIO_MANIFEST.filter(line => line.kind === 'curriculum_static')
      .map(line => ({ level: 1, id: line.id, text: line.text })),
    ...Object.entries(LEVEL2_NARRATION).map(([id, text]) => ({ level: 2, id, text })),
    ...Object.entries(LEVEL3_NARRATION).map(([id, text]) => ({ level: 3, id, text })),
    ...Object.entries(LEVEL4_NARRATION).map(([id, text]) => ({ level: 4, id, text })),
    ...Object.entries(LEVEL5_NARRATION).map(([id, text]) => ({ level: 5, id, text })),
  ]
}

export function getKGPrewarmPlan(config: NodeJS.ProcessEnv = process.env) {
  const lines = fixedKGPrewarmLines()
  const keys = new Set<string>()
  for (const line of lines) {
    const key = line.level + '/' + line.id
    if (!Number.isInteger(line.level) || line.level < 1 || line.level > 5 ||
        !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(line.id) ||
        !line.text.trim() || line.text.length > 320 ||
        keys.has(key)) throw new Error('Invalid or duplicate fixed KG narration source')
    keys.add(key)
  }

  // Voice-profile input parameters must be part of the signed manifest digest.
  // A mismatch with the reviewed voice settings blocks --apply, never
  // silently warms a new voice/format that a teacher has not heard.
  const voiceProfile = {
    voice: config.AZURE_SPEECH_VOICE?.trim() || 'en-IN-NeerjaNeural',
    profileVersion: config.AZURE_VOICE_PROFILE_VERSION?.trim() || 'v2-mp3',
    outputFormat: config.AZURE_SPEECH_OUTPUT_FORMAT?.trim() || 'audio-24khz-48kbitrate-mono-mp3',
    rate: config.KG_AZURE_SPEECH_RATE?.trim() || '+5%',
    pitch: config.KG_AZURE_SPEECH_PITCH?.trim() || '+6%',
    bilingualRouting: config.TALKORA_CLASS1_BILINGUAL_TTS === 'true',
  }
  const manifestSha256 = createHash('sha256')
    .update(JSON.stringify({ lines, voiceProfile }))
    .digest('hex')
  return { lines, voiceProfile, manifestSha256 }
}

export function assertKGPrewarmApplyApproval(
  manifestSha256: string,
  config: NodeJS.ProcessEnv = process.env,
): void {
  if (config.TALKORA_KG_PREWARM_APPROVED !== 'YES') {
    throw new Error('KG prewarm requires explicit TALKORA_KG_PREWARM_APPROVED=YES')
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]{7,127}$/.test(config.TALKORA_KG_NARRATION_REVIEW_REF || '')) {
    throw new Error('KG prewarm requires a documented qualified-teacher/rights review reference')
  }
  if (config.TALKORA_KG_PREWARM_MANIFEST_SHA256 !== manifestSha256) {
    throw new Error('KG prewarm manifest/voice profile differs from the recorded review')
  }
  const required = ['AZURE_SPEECH_KEY', 'AWS_REGION', 'AWS_S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
  const missing = required.filter(key => !config[key]?.trim())
  if (missing.length) throw new Error('KG Azure/S3 prewarm requires: ' + missing.join(', '))
}

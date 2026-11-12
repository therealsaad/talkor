import { assertKGPrewarmApplyApproval, getKGPrewarmPlan } from '../../src/scripts/kg-azure-prewarm-plan'

const base = {
  AZURE_SPEECH_VOICE: 'en-IN-NeerjaNeural',
  AZURE_VOICE_PROFILE_VERSION: 'kg-test-v1',
  AZURE_SPEECH_OUTPUT_FORMAT: 'audio-24khz-48kbitrate-mono-mp3',
  KG_AZURE_SPEECH_RATE: '+5%',
  KG_AZURE_SPEECH_PITCH: '+6%',
  TALKORA_CLASS1_BILINGUAL_TTS: 'true',
}

describe('KG teacher-reviewed fixed narration operator release gate', () => {
  it('produces a deterministic preview for every server-owned KG1-5 fixed line without requiring credentials', () => {
    const a = getKGPrewarmPlan({ ...base })
    const b = getKGPrewarmPlan({ ...base })
    expect(a.manifestSha256).toBe(b.manifestSha256)
    expect(a.manifestSha256).toMatch(/^[0-9a-f]{64}$/)
    expect(a.lines.length).toBeGreaterThan(40)
    expect(a.lines.some(line => line.level === 1)).toBe(true)
    for (const level of [2, 3, 4, 5]) {
      expect(a.lines.some(line => line.level === level)).toBe(true)
    }
    expect(new Set(a.lines.map(line => line.level + '/' + line.id)).size).toBe(a.lines.length)
  })

  it.each([
    ['AZURE_SPEECH_VOICE', 'hi-IN-SwaraNeural'],
    ['AZURE_VOICE_PROFILE_VERSION', 'kg-test-v2'],
    ['AZURE_SPEECH_OUTPUT_FORMAT', 'riff-16khz-16bit-mono-pcm'],
    ['KG_AZURE_SPEECH_RATE', '-2%'],
    ['KG_AZURE_SPEECH_PITCH', '+0%'],
    ['TALKORA_CLASS1_BILINGUAL_TTS', 'false'],
  ])('changes manifest digest when %s changes', (key, value) => {
    const a = getKGPrewarmPlan({ ...base })
    const b = getKGPrewarmPlan({ ...base, [key]: value })
    expect(a.manifestSha256).not.toBe(b.manifestSha256)
  })

  it('refuses apply with missing operator intent or teacher review', () => {
    const sha = getKGPrewarmPlan(base).manifestSha256
    expect(() => assertKGPrewarmApplyApproval(sha, {})).toThrow('TALKORA_KG_PREWARM_APPROVED')
    expect(() => assertKGPrewarmApplyApproval(sha, {
      TALKORA_KG_PREWARM_APPROVED: 'YES',
      TALKORA_KG_PREWARM_MANIFEST_SHA256: sha,
    })).toThrow('review reference')
  })

  it('refuses an unreviewed voice/content version before any cloud provider request', () => {
    const sha = getKGPrewarmPlan(base).manifestSha256
    expect(() => assertKGPrewarmApplyApproval(sha, {
      TALKORA_KG_PREWARM_APPROVED: 'YES',
      TALKORA_KG_NARRATION_REVIEW_REF: 'school-review-2026-approved',
      TALKORA_KG_PREWARM_MANIFEST_SHA256: '0'.repeat(64),
    })).toThrow('differs from the recorded review')
  })

  it('refuses apply without credentials even with the expected review digest', () => {
    const sha = getKGPrewarmPlan(base).manifestSha256
    expect(() => assertKGPrewarmApplyApproval(sha, {
      TALKORA_KG_PREWARM_APPROVED: 'YES',
      TALKORA_KG_NARRATION_REVIEW_REF: 'school-review-2026-approved',
      TALKORA_KG_PREWARM_MANIFEST_SHA256: sha,
    })).toThrow('AZURE_SPEECH_KEY')
  })

  it('permits only a fully acknowledged and exact reviewed version to reach the paid command', () => {
    const sha = getKGPrewarmPlan(base).manifestSha256
    const fakeCredentials = {
      TALKORA_KG_PREWARM_APPROVED: 'YES',
      TALKORA_KG_NARRATION_REVIEW_REF: 'school-review-2026-approved',
      TALKORA_KG_PREWARM_MANIFEST_SHA256: sha,
      AZURE_SPEECH_KEY: 'unit-test-only',
      AWS_REGION: 'unit-test',
      AWS_S3_BUCKET: 'unit-test',
      AWS_ACCESS_KEY_ID: 'unit-test-only',
      AWS_SECRET_ACCESS_KEY: 'unit-test-only',
    }
    expect(() => assertKGPrewarmApplyApproval(sha, fakeCredentials)).not.toThrow()
  })
})

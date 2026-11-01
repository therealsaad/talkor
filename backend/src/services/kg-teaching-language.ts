/** Stable, per-introduction KG coaching language. This is explanation/voice
 * routing metadata only; it must never influence grading or English mastery.
 * History is supplied newest-first from the current authorised intro session.
 */
export const KG_TEACHING_LANGUAGES = ['en-IN', 'hi-IN', 'mr-IN'] as const
export type KGTeachingLanguage = typeof KG_TEACHING_LANGUAGES[number]

export function isKGTeachingLanguage(value: unknown): value is KGTeachingLanguage {
  return value === 'en-IN' || value === 'hi-IN' || value === 'mr-IN'
}

/** Two of the last three recognised utterances must agree before a stable
 * language changes. One lone detection never flips an established session.
 * An unknown result reuses the last known language, otherwise English.
 */
export function stableKGTeachingLanguage(
  detected: KGTeachingLanguage | undefined,
  recent: readonly (KGTeachingLanguage | undefined)[],
): KGTeachingLanguage {
  const prior = recent.filter(isKGTeachingLanguage).slice(0, 2)
  if (!detected) return prior[0] || 'en-IN'
  if (prior.length === 0) return detected
  const samples = [detected, ...prior]
  for (const language of KG_TEACHING_LANGUAGES) {
    if (samples.filter((item) => item === language).length >= 2) return language
  }
  return prior[0]
}

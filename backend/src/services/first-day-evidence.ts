import { FIRST_DAY_POEM_STEPS } from '../curriculum/class1-first-day-poem'

/** Small, auditable evidence gate for active Balbharati 1.1 scenes.
 * A word detected in Sarvam text is NOT a pronunciation assessment. The
 * student can learn/continue with one appropriate English attempt, including
 * a lone word, but questions, negation and support-language-only attempts
 * must not auto-advance. This gate cannot choose a different scene.
 */
export function firstDaySceneSkills(sceneKey: string, message: string): string[] {
  const text = message.toLowerCase().trim().normalize('NFC')
  if (!text) return []
  if (sceneKey.startsWith('poem-')) return poemEvidence(sceneKey, text)
  // The child may say 'skip?' to ask what to say; that is NOT evidence of
  // independent use. Nor is the target word inside "what does skip mean".
  if (/\?|\b(?:what|why|how|meaning|mean|explain|help|repeat|again|don['’]?t\s+know|do\s+not\s+know|can['’]?t|cannot|no\s+idea)\b|क्या|काय|समजत|म्हणजे|नहीं|नाही|मदद|मतलब|समझा|पुन्हा/.test(text)) return []
  const evidence: Record<string, RegExp> = {
    'hello-school': /\b(school|happy|hello)\b/,
    'skip-bunny': /\b(skip|skipping)\b/,
    'run-race': /\b(run|running)\b/,
    'walk-school': /\b(walk|walking)\b/,
    'big-grin': /\b(smile|grin|smiling)\b/,
    'school-bell': /\b(bell|rings|ringing)\b/,
    'jump-frog': /\b(jump|jumping)\b/,
    'play-friends': /\b(play|playing)\b/,
    'enter-class': /\b(classroom|go in|go into)\b/,
    'grade-one': /\b(grade one|grade 1|school|play|skip|run|walk|jump)\b/,
  }
  return evidence[sceneKey]?.test(text) ? ['first_day_english_attempt'] : []
}

/** A bounded recognition alias for a common child's spoken "See me".
 * Saaras can render the connected English sounds as "semi". This is NOT a
 * general-purpose correction and never supplies an absent action/second line.
 * Do not change the stored raw transcript or use this for pronunciation grades.
 */
export function normalizeFirstDayPoemRecognition(text: string): string {
  return text.normalize('NFKC').toLowerCase()
    .replace(/\bsemi\s+(?=(?:skip|run|walk|grin|jump|play)(?:ping|ning|ing)?\b)/g, 'see me ')
}

/** Only transcript evidence of both taught lines is enough to progress.
 * No acoustic pronunciation or comprehension scores are inferred from STT.
 */
export function poemEvidence(sceneKey: string, text: string): string[] {
  // Direct callers (including the final teacher-voice guard) can pass raw
  // Sarvam casing. Normalize here, not only in firstDaySceneSkills.
  const said = normalizeFirstDayPoemRecognition(text).trim()
  if (!said || /[?]|\b(?:what|why|how|help|repeat|again|meaning|i don['’]?t know|no idea)\b|क्या|मदद|मतलब|काय|म्हणजे|नाही|समजत/.test(said)) return []
  // A bare word bank response ("grin bell", "skip run", or "at at")
  // is NOT reciting both lines. Look for both authored phrase patterns with
  // modest speech-recognition tolerance for punctuation and inflections.
  // This is textual evidence, never an accent/pitch pronunciation score.
  const step = FIRST_DAY_POEM_STEPS.find(candidate => candidate.key === sceneKey)
  if (!step) return []
  if ('recital' in step) {
    const { minWords, minThemes, themes } = step.recital
    return said.split(/\s+/).length >= minWords &&
      themes.filter(re => re.test(said)).length >= minThemes
      ? ['first_day_english_attempt'] : []
  }
  return step.expectedLinePatterns.every(re => re.test(said))
    ? ['first_day_english_attempt'] : []
}

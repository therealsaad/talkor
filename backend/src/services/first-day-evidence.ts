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

/** Only transcript evidence of both taught lines is enough to progress.
 * No acoustic pronunciation or comprehension scores are inferred from STT.
 */
export function poemEvidence(sceneKey: string, text: string): string[] {
  // Direct callers (including the final teacher-voice guard) can pass raw
  // Sarvam casing. Normalize here, not only in firstDaySceneSkills.
  const said = text.toLowerCase().trim().normalize('NFC')
  if (!said || /[?]|\b(?:what|why|how|help|repeat|again|meaning|i don['’]?t know|no idea)\b|क्या|मदद|मतलब|काय|म्हणजे|नाही|समजत/.test(said)) return []
  // A bare word bank response ("grin bell", "skip run", or "at at")
  // is NOT reciting both lines. Look for both authored phrase patterns with
  // modest speech-recognition tolerance for punctuation and inflections.
  // This is textual evidence, never an accent/pitch pronunciation score.
  const checks: Record<string, RegExp[]> = {
    'poem-pair-1': [/\bsee\s+me\s+skip(?:ping)?\b/, /\bsee\s+me\s+run(?:ning)?\b/],
    'poem-pair-2': [/\bgoing\s+to\s+school\b/, /\bsee\s+me\s+walk(?:ing)?\b/],
    'poem-pair-3': [
      /\bsee\s+me\s+(?:grin|smile|smiling)\b/,
      /\bbell\s+(?:rings?|ringing)\b[\s\S]*\b(?:go\s+in|go\s+inside)\b/,
    ],
    'poem-pair-4': [/\bsee\s+me\s+jump(?:ing)?\b/, /\bsee\s+me\s+play(?:ing)?\b/],
    'poem-pair-5': [/\b(?:i['’]?m|i\s+am)\s+in\s+grade\s+(?:one|1)\b/, /\b(?:hurray|hooray)\b/],
  }
  if (sceneKey === 'poem-full') {
    const themes = [/\bskip\b.*\brun\b/s,/\bwalk\b.*\bgrin\b/s,
      /\bbell\b.*\bin\b/s,/\bjump\b.*\bplay\b/s,
      /\bgrade\s+(?:one|1)\b.*\b(?:hurray|hooray)\b/s]
    return said.split(/\s+/).length >= 20 && themes.filter(re => re.test(said)).length >= 4
      ? ['first_day_english_attempt'] : []
  }
  const pair = checks[sceneKey]
  return pair && pair.every(re => re.test(said)) ? ['first_day_english_attempt'] : []
}

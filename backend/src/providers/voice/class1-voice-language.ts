/** Optional Hindi/Marathi Azure routing for short Class 1 coaching lines.
 * Off by default; the existing English Miss Julie voice is unchanged until
 * school staff listen to and approve the two localized female voices.
 * Selection changes a SINGLE TTS request, never generates an extra request.
 */
export function chooseTalkoraBilingualVoice(text: string, defaultVoice: string, class1Lesson = false, preferredLanguage?: string): { voice: string; locale: string } {
  // Sarvam's authenticated language hint is stronger than the script
  // heuristic: children may speak Romanized Hindi/Marathi ("billi", "mala"),
  // and Qwen may answer in mixed Latin/Devanagari. Don't silently switch to
  // the English voice just because the teacher's sentence uses Latin text.
  if (class1Lesson && preferredLanguage === 'mr-IN') return { voice: 'mr-IN-AarohiNeural', locale: 'mr-IN' }
  if (class1Lesson && preferredLanguage === 'hi-IN') return { voice: 'hi-IN-SwaraNeural', locale: 'hi-IN' }

  if ((!class1Lesson && process.env.TALKORA_CLASS1_BILINGUAL_TTS !== 'true') || !/[\u0900-\u097f]/.test(text)) {
    return { voice: defaultVoice, locale: 'en-IN' }
  }

  // Both languages use Devanagari. Only distinctive vocabulary selects
  // Marathi; ambiguous text should be checked in supervised audio testing.
  if (/मला|छान|पुन्हा|एकत्र|ऐक|म्हण|शाळे|तयार\s+झाल्या|हरकत\s+नाही/.test(text)) {
    return { voice: 'mr-IN-AarohiNeural', locale: 'mr-IN' }
  }
  return { voice: 'hi-IN-SwaraNeural', locale: 'hi-IN' }
}

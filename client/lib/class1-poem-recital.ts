/** The browser has already recorded five separate, ordered Sarvam clips.
 * Preserve one line per section for Node's lesson-authorized assisted evaluator.
 * No grading or progress is performed here.
 */
export const CLASS1_FINALE_SECTION_COUNT = 5

export function joinClass1PoemRecitalParts(parts: readonly string[]): string {
  if (parts.length !== CLASS1_FINALE_SECTION_COUNT) {
    throw new Error('Five poem parts are required before the last answer.')
  }
  const normalized = parts.map(part => part.replace(/\s+/g, ' ').trim())
  if (normalized.some(part => !part || part.length > 240)) {
    throw new Error('One poem part was unclear. Try recording that part again.')
  }
  return normalized.join('\n')
}

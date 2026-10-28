/** Language is a *coaching preference*, not a child's identity or an
 * assessment score. Only canonical Class 1 Level 1 uses Sarvam metadata.
 * Unrecognized codes must defer to explicit speech and session history.
 */
export function class1SupportFromSarvam(
  activityKey: string | undefined,
  detectedCode: string | undefined,
): 'English' | 'Hindi' | 'Marathi' | undefined {
  if (!activityKey?.startsWith('class1-l01-')) return undefined
  if (detectedCode === 'hi-IN') return 'Hindi'
  if (detectedCode === 'mr-IN') return 'Marathi'
  if (detectedCode === 'en-IN') return 'English'
  return undefined
}

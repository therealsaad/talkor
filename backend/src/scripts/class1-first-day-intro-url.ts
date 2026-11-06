/** Input shape validation only, NOT video-content approval or hosting verification.
 * Reject common example domains and copy-pasted placeholder URLs; the staging
 * script separately requires explicit media review and approved S3 narration.
 */
export function isRealFirstDayIntroUrl(raw: string): boolean {
  try {
    if (!raw || raw !== raw.trim()) return false
    const url = new URL(raw)
    if (url.protocol !== 'https:' || url.username || url.password) return false
    const host = url.hostname.toLowerCase().replace(/\.$/, '')
    if (!host.includes('.') || /^(localhost|127\.0\.0\.1)$/.test(host)) return false
    if (/(^|\.)(example\.(com|org|net)|invalid|test|localhost)$/.test(host)) return false
    if (/(^|[-.])(your|placeholder|dummy|sample)([-.]|$)/i.test(host)) return false
    if (/(^|[\/_.-])(your[-_]reviewed|placeholder|dummy)([\/_.-]|$)/i.test(url.pathname)) return false
    return true
  } catch {
    return false
  }
}

/** Only this exact same-origin shipped asset is eligible for a local-lab
 * First Day intro. Other relative paths are forbidden. This is source
 * selection, NOT verification of the video's educational content.
 */
export const CLASS1_BUNDLED_FIRST_DAY_INTRO =
  '/lessons/class-01/level-01/miss-julie-first-day-intro.mp4'

export function isAllowedClass1IntroSource(raw: string): boolean {
  return raw === CLASS1_BUNDLED_FIRST_DAY_INTRO || isRealFirstDayIntroUrl(raw)
}

/** Deliberately opt in to a locally reviewed bundled intro: never guess
 * teacher approval or silently reuse a video for a different chapter.
 */
export function chooseClass1IntroSource(
  inputUrl: string | undefined,
  allowBundled: boolean,
): string {
  const url = inputUrl?.trim() || ''
  return url || (allowBundled ? CLASS1_BUNDLED_FIRST_DAY_INTRO : '')
}

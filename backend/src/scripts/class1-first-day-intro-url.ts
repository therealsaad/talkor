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

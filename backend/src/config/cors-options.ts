/**
 * CORS settings for the browser app. The app and the API live on different origins and every lesson request
 * carries an Authorization header, so the browser first sends a permission check (an OPTIONS "preflight").
 * Without Access-Control-Max-Age a browser remembers that answer for only a few seconds, so nearly every
 * request paid an extra network round trip, which is what hurts most on a slow connection. Letting the browser
 * remember it for a day (browsers cap this at their own limit) removes that trip from repeat requests.
 */
export const PREFLIGHT_MAX_AGE_SECONDS = 86400

export function buildCorsOptions(input: { clientUrl: string; extraClientUrls?: string; isProd: boolean }) {
  const extra = (input.extraClientUrls || '').split(',').map((url) => url.trim()).filter(Boolean)
  return {
    origin: Array.from(new Set([input.clientUrl, ...extra, ...(input.isProd ? [] : ['http://localhost:3000'])])),
    credentials: true,
    exposedHeaders: ['X-KG-Feedback-Receipt', 'X-Class1-Feedback-Receipt'],
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
  }
}

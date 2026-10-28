/**
 * A lesson can enter browser fullscreen only after a user gesture. Mobile
 * orientation locking is optional and browser-controlled; never claim the
 * physical screen has rotated when the API refuses the request.
 */
export async function requestClass1Fullscreen(target: HTMLElement): Promise<boolean> {
  if (document.fullscreenElement !== target) {
    if (typeof target.requestFullscreen !== 'function') return false
    try {
      await target.requestFullscreen({ navigationUI: 'hide' })
    } catch {
      return false
    }
  }

  const orientation = window.screen?.orientation as (ScreenOrientation & {
    lock?: (value: string) => Promise<void>
  }) | undefined
  try {
    await orientation?.lock?.('landscape')
  } catch {
    // iOS and some managed-school browsers disallow orientation locking.
    // The landscape guidance overlay remains available in that case.
  }
  return document.fullscreenElement === target
}

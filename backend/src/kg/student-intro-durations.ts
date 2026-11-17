/** Minimum elapsed watch-ticket time for the complete packaged student films.
 * Verified with ffprobe: KG2/3/4 = 90s, KG5 = 60s. The browser still requires
 * the actual ended event, prevents seeking and pauses when hidden. Elapsed
 * time alone cannot prove attention, sound output, or honest browser events.
 * Change this policy only alongside a reviewed replacement film and tests.
 */
export const KG_STUDENT_INTRO_MINIMUM_MS = {
  2: 90_000,
  3: 90_000,
  4: 90_000,
  5: 60_000,
} as const

import { isRealFirstDayIntroUrl, isAllowedClass1IntroSource, chooseClass1IntroSource, CLASS1_BUNDLED_FIRST_DAY_INTRO } from '../../src/scripts/class1-first-day-intro-url'

describe('First Day intro URL: reject fake demo media links', () => {
  it.each([
    '', 'https://YOUR-REVIEWED-FIRST-DAY-VIDEO.mp4',
    'https://example.org/first-day.mp4',
    'https://cdn.example.com/lesson.mp4',
    'https://demo.invalid/video.mp4',
    'http://cdn.school.edu/first-day.mp4',
    'https://localhost/first-day.mp4',
    'https://user:pass@cdn.school.edu/first-day.mp4',
    'https://cdn.school.edu/placeholder-first-day.mp4',
  ])('refuses unapproved URL shape %s', url => {
    expect(isRealFirstDayIntroUrl(url)).toBe(false)
  })
  it.each([
    'https://media.talkora.school/first-day.mp4',
    'https://d123abcdef.cloudfront.net/talkora/first-day.mp4?signature=abc123',
  ])('accepts plausible HTTPS video URL shape without claiming content approval', url => {
    expect(isRealFirstDayIntroUrl(url)).toBe(true)
  })
})

describe('developer-approved bundled Class 1 intro avoids a fake external HTTPS prerequisite', () => {
  it('accepts ONLY the exact known local First Day MP4 URL', () => {
    expect(isAllowedClass1IntroSource(CLASS1_BUNDLED_FIRST_DAY_INTRO)).toBe(true)
    expect(isRealFirstDayIntroUrl(CLASS1_BUNDLED_FIRST_DAY_INTRO)).toBe(false)
    for (const path of [
      '/lessons/kg/level-01/intro.mp4', '/random-file.mp4',
      '/lessons/class-01/level-01/../level-02/intro.mp4', 
      '//evil.example.org/lesson.mp4',
      'http://localhost:3000/lessons/class-01/level-01/miss-julie-first-day-intro.mp4',
    ]) expect(isAllowedClass1IntroSource(path)).toBe(false)
  })

  it('requires an explicit developer selection; external HTTPS remains supported', () => {
    expect(chooseClass1IntroSource('', false)).toBe('')
    expect(chooseClass1IntroSource(undefined, true)).toBe(CLASS1_BUNDLED_FIRST_DAY_INTRO)
    expect(chooseClass1IntroSource('https://cdn.talkora.edu/intro.mp4', true))
      .toBe('https://cdn.talkora.edu/intro.mp4')
    expect(isAllowedClass1IntroSource('https://YOUR-REVIEWED-FIRST-DAY-VIDEO.mp4'))
      .toBe(false)
  })
})

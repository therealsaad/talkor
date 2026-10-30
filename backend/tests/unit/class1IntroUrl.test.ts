import { isRealFirstDayIntroUrl } from '../../src/scripts/class1-first-day-intro-url'

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

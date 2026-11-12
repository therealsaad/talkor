import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE_URL = process.env.TALKORA_TEST_URL || 'http://localhost:3000'
const ARTIFACT_DIR = 'C:\\Users\\devsa\\.gemini\\antigravity\\brain\\a99f7301-1b79-4389-96e2-f45110af1921'
const SCREENSHOT_DIR = path.resolve(import.meta.dirname, '../../public/lessons/class-01/level-01/screenshots')

let browser

before(async () => {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
  })
})

after(async () => {
  if (browser) await browser.close()
})

function buildMockPackage(version = 'v4', activeIndex = 0) {
  if (version === 'v4') {
    const poemKeys = [
      'class1-l01-v4-poem-pair-1',
      'class1-l01-v4-poem-pair-2',
      'class1-l01-v4-poem-pair-3',
      'class1-l01-v4-poem-pair-4',
      'class1-l01-v4-poem-pair-5',
      'class1-l01-v4-poem-full',
    ]
    return {
      experienceId: 'g01-l01',
      grade: 1,
      level: { id: 'lvl-class1-1', title: 'English Balbharati', unitNumber: 1, number: 1, place: 'My First Day' },
      lesson: {
        id: 'lsn-class1-1',
        settings: {
          introVideoUrl: '/lessons/class-01/level-01/miss-julie-first-day-intro.mp4',
          lessonPlanRevision: 'class1-first-day-poem-2026-v4'
        }
      },
      completedActivityIds: ['act-intro-done', ...poemKeys.slice(0, activeIndex).map((k, i) => `act-${i}`)],
      activities: poemKeys.map((key, i) => ({
        id: `act-${i}`,
        activityKey: key,
        title: `Poem activity ${i + 1}`,
        prompt: 'Listen to Miss Julie and recite your lines.',
        teacherPrompt: 'Recite lines with Miss Julie',
        type: 'CONVERSATION',
        aiEnabled: true,
        allowMic: true,
        order: i + 1,
      }))
    }
  }

  // v3 mock package
  const v3Keys = [
    'class1-l01-v3-hello-school',
    'class1-l01-v3-skip-bunny',
    'class1-l01-v3-run-race',
    'class1-l01-v3-walk-school',
    'class1-l01-v3-big-grin',
    'class1-l01-v3-school-bell',
    'class1-l01-v3-jump-frog',
    'class1-l01-v3-play-friends',
    'class1-l01-v3-enter-class',
    'class1-l01-v3-grade-one',
  ]
  return {
    experienceId: 'g01-l01',
    grade: 1,
    level: { id: 'lvl-class1-1', title: 'English Balbharati', unitNumber: 1, number: 1, place: 'My First Day' },
    lesson: {
      id: 'lsn-class1-1',
      settings: {
        introVideoUrl: '/lessons/class-01/level-01/miss-julie-first-day-intro.mp4',
        lessonPlanRevision: 'class1-first-day-v3'
      }
    },
    completedActivityIds: ['act-intro-done'],
    activities: v3Keys.map((key, i) => ({
      id: `act-v3-${i}`,
      activityKey: key,
      title: `Adventure step ${i + 1}`,
      prompt: 'Listen to Miss Julie and speak.',
      teacherPrompt: 'Say word with Miss Julie',
      type: 'CONVERSATION',
      aiEnabled: true,
      allowMic: true,
      order: i + 1,
    }))
  }
}

async function setupPage(context, { version = 'v4', activeIndex = 0, width = 1366, height = 768 } = {}) {
  const page = await context.newPage()
  await page.setViewport({ width, height })

  const pageErrors = []
  page.on('pageerror', err => pageErrors.push(err.message))

  const mockPkg = buildMockPackage(version, activeIndex)

  await page.evaluateOnNewDocument((pkg) => {
    const exp = Math.floor(Date.now() / 1000) + 7200
    const token = 'header.' + btoa(JSON.stringify({ exp, role: 'STUDENT', sub: 'std-1' })) + '.sig'
    const session = {
      token,
      role: 'STUDENT',
      user: { id: 'usr-student-1', role: 'STUDENT', name: 'Aarav' },
      student: { id: 'std-1', fullName: 'Aarav Sharma', avatarType: 'BOY', grade: 1 },
      school: { id: 'sch-1', name: 'Demo School' }
    }
    sessionStorage.setItem('talkora_token', token)
    sessionStorage.setItem('talkora_user', JSON.stringify(session))

    const origFetch = window.fetch
    window.fetch = async function(resource, init) {
      const url = typeof resource === 'string' ? resource : resource?.url || ''
      if (url.includes('/auth/me')) {
        return new Response(JSON.stringify({
          success: true,
          data: {
            role: 'STUDENT',
            student: session.student,
            school: session.school
          }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      if (url.includes('/students/me/progress')) {
        return new Response(JSON.stringify({
          success: true,
          data: { completedLessonIds: [], completedActivityIds: ['act-intro-done'] }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      if (url.includes('/pending-teacher-audio')) {
        return new Response(JSON.stringify({
          success: true,
          data: null
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      if (url.includes('/lessons/g01-l01')) {
        return new Response(JSON.stringify({
          success: true,
          data: pkg
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      if (url.includes('localhost:5000/api')) {
        return new Response(JSON.stringify({ success: true, data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return origFetch.apply(this, arguments)
    }
  }, mockPkg)

  return { page, pageErrors }
}

test('Scene 1 — Skipping and Running: mounts at 1366x768 with skip-run.webp and highlighted words', async () => {
  const context = await browser.createBrowserContext()
  try {
    const { page, pageErrors } = await setupPage(context, { version: 'v4', activeIndex: 0, width: 1366, height: 768 })
    await page.goto(`${BASE_URL}/student/lesson/g01-l01`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('[data-testid="class1-firstday-poem"]', { timeout: 10000 })

    const imagesStatus = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      return imgs.map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
      }))
    })

    assert.ok(imagesStatus.length >= 2, 'Should load teacher and scene artwork')
    for (const img of imagesStatus) {
      assert.ok(img.complete && img.naturalWidth > 0, `Image should load without broken path: ${img.src}`)
    }

    const hasSkipRun = imagesStatus.some(img => img.src.includes('skip-run.webp'))
    assert.ok(hasSkipRun, 'Scene 1 must load skip-run.webp illustration')

    const layout = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="class1-firstday-poem"]')
      return {
        viewportHeight: window.innerHeight,
        scrollHeight: el ? el.scrollHeight : 0,
      }
    })
    assert.ok(
      layout.scrollHeight <= layout.viewportHeight + 5,
      `Classroom layout should fit in 768px height without scrollbar (scroll: ${layout.scrollHeight}, vp: ${layout.viewportHeight})`
    )

    const highlightedWords = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.poem-word-highlight')).map(e => e.textContent.trim().toLowerCase())
    })
    assert.ok(highlightedWords.includes('skip'), 'Word "skip" must be highlighted')
    assert.ok(highlightedWords.includes('run'), 'Word "run" must be highlighted')

    const shot1 = path.join(SCREENSHOT_DIR, 'class1-scene1-skip-run-1366x768.png')
    await page.screenshot({ path: shot1 })
    await copyFile(shot1, path.join(ARTIFACT_DIR, 'class1-scene1-skip-run-1366x768.png')).catch(() => {})

    assert.equal(pageErrors.length, 0)
  } finally {
    await context.close()
  }
})

test('Scene 2 — Walking to School: mounts with walk-school.webp at 1366x768', async () => {
  const context = await browser.createBrowserContext()
  try {
    const { page, pageErrors } = await setupPage(context, { version: 'v4', activeIndex: 1, width: 1366, height: 768 })
    await page.goto(`${BASE_URL}/student/lesson/g01-l01`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('[data-testid="class1-firstday-poem"]', { timeout: 10000 })

    const hasWalkSchool = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).some(i => i.src.includes('walk-school.webp') && i.complete && i.naturalWidth > 0)
    })
    assert.ok(hasWalkSchool, 'Scene 2 must load walk-school.webp illustration')

    const shot2 = path.join(SCREENSHOT_DIR, 'class1-scene2-walk-school-1366x768.png')
    await page.screenshot({ path: shot2 })
    await copyFile(shot2, path.join(ARTIFACT_DIR, 'class1-scene2-walk-school-1366x768.png')).catch(() => {})

    assert.equal(pageErrors.length, 0)
  } finally {
    await context.close()
  }
})

test('Scene 3 — Smiling and School Bell: responsive layout at 1280x720 with smile-bell.webp', async () => {
  const context = await browser.createBrowserContext()
  try {
    const { page, pageErrors } = await setupPage(context, { version: 'v4', activeIndex: 2, width: 1280, height: 720 })
    await page.goto(`${BASE_URL}/student/lesson/g01-l01`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('[data-testid="class1-firstday-poem"]', { timeout: 10000 })

    const hasSmileBell = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).some(i => i.src.includes('smile-bell.webp') && i.complete && i.naturalWidth > 0)
    })
    assert.ok(hasSmileBell, 'Scene 3 must load smile-bell.webp illustration')

    const layout = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="class1-firstday-poem"]')
      return {
        viewportHeight: window.innerHeight,
        scrollHeight: el ? el.scrollHeight : 0,
      }
    })
    assert.ok(
      layout.scrollHeight <= layout.viewportHeight + 5,
      `Classroom layout should fit in 720px height without scrollbar (scroll: ${layout.scrollHeight}, vp: ${layout.viewportHeight})`
    )

    const shot3 = path.join(SCREENSHOT_DIR, 'class1-scene3-smile-bell-1280x720.png')
    await page.screenshot({ path: shot3 })
    await copyFile(shot3, path.join(ARTIFACT_DIR, 'class1-scene3-smile-bell-1280x720.png')).catch(() => {})

    assert.equal(pageErrors.length, 0)
  } finally {
    await context.close()
  }
})

test('Scene 4 — Jumping and Playing: mounts with jump-play.webp at 1366x768', async () => {
  const context = await browser.createBrowserContext()
  try {
    const { page, pageErrors } = await setupPage(context, { version: 'v4', activeIndex: 3, width: 1366, height: 768 })
    await page.goto(`${BASE_URL}/student/lesson/g01-l01`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('[data-testid="class1-firstday-poem"]', { timeout: 10000 })

    const hasJumpPlay = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).some(i => i.src.includes('jump-play.webp') && i.complete && i.naturalWidth > 0)
    })
    assert.ok(hasJumpPlay, 'Scene 4 must load jump-play.webp illustration')

    const shot4 = path.join(SCREENSHOT_DIR, 'class1-scene4-jump-play-1366x768.png')
    await page.screenshot({ path: shot4 })
    await copyFile(shot4, path.join(ARTIFACT_DIR, 'class1-scene4-jump-play-1366x768.png')).catch(() => {})

    assert.equal(pageErrors.length, 0)
  } finally {
    await context.close()
  }
})

test('Scene 5 — Grade One Celebration: mounts with grade-one-celebration.webp at 1366x768', async () => {
  const context = await browser.createBrowserContext()
  try {
    const { page, pageErrors } = await setupPage(context, { version: 'v4', activeIndex: 4, width: 1366, height: 768 })
    await page.goto(`${BASE_URL}/student/lesson/g01-l01`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('[data-testid="class1-firstday-poem"]', { timeout: 10000 })

    const hasCelebration = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).some(i => i.src.includes('grade-one-celebration.webp') && i.complete && i.naturalWidth > 0)
    })
    assert.ok(hasCelebration, 'Scene 5 must load grade-one-celebration.webp illustration')

    const shot5 = path.join(SCREENSHOT_DIR, 'class1-scene5-celebration-1366x768.png')
    await page.screenshot({ path: shot5 })
    await copyFile(shot5, path.join(ARTIFACT_DIR, 'class1-scene5-celebration-1366x768.png')).catch(() => {})

    assert.equal(pageErrors.length, 0)
  } finally {
    await context.close()
  }
})

test('Final Activity — Full Poem Recitation: displays 10 lines and 2-line active chunk', async () => {
  const context = await browser.createBrowserContext()
  try {
    const { page, pageErrors } = await setupPage(context, { version: 'v4', activeIndex: 5, width: 1366, height: 768 })
    await page.goto(`${BASE_URL}/student/lesson/g01-l01`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('[data-testid="class1-firstday-poem"]', { timeout: 10000 })

    const details = await page.evaluate(() => {
      const lines = Array.from(document.querySelectorAll('.poem-line'))
      const activeLines = Array.from(document.querySelectorAll('.poem-line.is-active'))
      const focusText = document.querySelector('.poem-focus__text')?.textContent?.trim() || ''
      return { totalLines: lines.length, activeCount: activeLines.length, focusText }
    })

    assert.equal(details.totalLines, 10, 'All 10 Balbharati lines must be displayed in the full recitation storybook')
    assert.equal(details.activeCount, 2, 'Only 2 lines at a time should be active in recital chunk')
    assert.ok(details.focusText.length > 0, 'Active lines must be present in focus bar')

    const shot6 = path.join(SCREENSHOT_DIR, 'class1-scene6-full-recitation-1366x768.png')
    await page.screenshot({ path: shot6 })
    await copyFile(shot6, path.join(ARTIFACT_DIR, 'class1-scene6-full-recitation-1366x768.png')).catch(() => {})

    assert.equal(pageErrors.length, 0)
  } finally {
    await context.close()
  }
})

test('v3 School Adventure Classroom: mounts with first-day-school.webp illustration', async () => {
  const context = await browser.createBrowserContext()
  try {
    const { page, pageErrors } = await setupPage(context, { version: 'v3', activeIndex: 0, width: 1366, height: 768 })
    await page.goto(`${BASE_URL}/student/lesson/g01-l01`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('[data-testid="class1-firstday-adventure"]', { timeout: 10000 })

    const imgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(i => ({
        src: i.src,
        complete: i.complete,
        naturalWidth: i.naturalWidth,
      }))
    })
    console.log('v3 images:', imgs)

    const hasSchoolImg = imgs.some(i => i.src.includes('first-day-school.webp'))
    assert.ok(hasSchoolImg, 'v3 Adventure must load first-day-school.webp illustration')

    const shotV3 = path.join(SCREENSHOT_DIR, 'class1-v3-adventure-1366x768.png')
    await page.screenshot({ path: shotV3 })
    await copyFile(shotV3, path.join(ARTIFACT_DIR, 'class1-v3-adventure-1366x768.png')).catch(() => {})

    assert.equal(pageErrors.length, 0)
  } finally {
    await context.close()
  }
})

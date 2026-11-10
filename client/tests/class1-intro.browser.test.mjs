/** Real production Next + Chromium and packaged film; synthetic HTTP/accounts.
 * Never finishes/skips the intro or contacts providers/a school database.
 */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { spawn } from 'node:child_process'
import { readFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import puppeteer from 'puppeteer-core'

const require = createRequire(import.meta.url)
const base = 'http://127.0.0.1:3121'
const sceneModule = { exports: {} }
vm.runInNewContext(ts.transpileModule(await readFile(new URL('../../backend/src/scripts/class1-first-day-scenes.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: sceneModule.exports, module: sceneModule })
const scenes = sceneModule.exports.FIRST_DAY_SCENES
const lessonId = '444444444444444444444444'
const activities = scenes.map((scene, i) => ({ id: String(i + 10).repeat(12), lessonId, order: i + 1,
  activityKey: 'class1-l01-v3-' + scene.key, title: scene.title, prompt: scene.prompt,
  teacherPrompt: scene.prompt, target: scene.focus, type: 'CONVERSATION', stage: 'INTERACT',
  voiceEnabled: true, aiEnabled: true, allowMic: true, allowOptions: false, difficulty: 'easy',
  xp: 10, estimatedSeconds: 30, metadata: { conversationMode: 'OPEN', sceneKey: scene.key },
}))
let browser, server
before(async () => {
  server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '-p', '3121'], { stdio: 'pipe' })
  let log = ''
  server.stdout.on('data', c => { log += c })
  server.stderr.on('data', c => { log += c })
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw Error('Next exited: ' + log)
    if (await fetch(base).then(r => r.ok).catch(() => false)) break
    if (i === 99) throw Error('Next did not start: ' + log)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
})
after(async () => { await browser?.close(); server?.kill('SIGTERM') })

async function fixture({ resumed = false, failStart = false } = {}) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setViewport({ width: 1366, height: 768 })
  const student = { id: '333333333333333333333333', fullName: 'Synthetic Learner', grade: 1, avatarType: 'GIRL' }
  const school = { id: '111111111111111111111111', name: 'Synthetic school', code: 'INTROQA' }
  const token = `fixture.${Buffer.from(JSON.stringify({ role: 'STUDENT', exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.fixture`
  let signedIn = false, starts = 0
  const calls = [], errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.evaluateOnNewDocument(() => {
    window.__introMicCalls = 0
    navigator.mediaDevices.getUserMedia = async () => { window.__introMicCalls++; throw Error('No physical microphone in this test') }
  })
  await page.setRequestInterception(true)
  page.on('request', async request => {
    try {
      const u = new URL(request.url())
      if (!u.pathname.startsWith('/api/')) {
        if (u.origin === base || ['data:', 'blob:'].includes(u.protocol)) return await request.continue()
        return await request.abort()
      }
      const p = u.pathname.slice(4)
      const headers = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
      if (request.method() === 'OPTIONS') return await request.respond({ status: 204, headers })
      calls.push(p)
      const json = (data, status = 200) => request.respond({ status, headers, contentType: 'application/json',
        body: JSON.stringify(status < 400 ? { success: true, data } : { success: false, error: { code: 'INTRO_FIXTURE_FAILURE', message: data } }) })
      if (p === '/auth/student/pin-login') { signedIn = true; return await json({ token, student, school }) }
      if (p === '/auth/me') return await json(signedIn ? { role: 'STUDENT', student, school } : 'Sign in required', signedIn ? 200 : 401)
      if (p === '/students/me/progress') return await json({ xp: 0, stars: 0, streak: 0 })
      if (p === '/students/me/next-lesson') return await json({ grade: 1, lessonId, activityId: activities[resumed ? 2 : 0].id, complete: false })
      if (p === '/students/me/lessons/' + lessonId) return await json({ grade: 1, experienceId: 'g01-l01',
        curriculumClass: { id: '222222222222222222222222', grade: 1, name: 'Class 1', order: 1 },
        level: { id: '555555555555555555555555', title: 'My First Day', place: 'First Day Meadow', number: 1, unitNumber: 1 },
        lesson: { id: lessonId, title: 'My First Day', settings: { introVideoUrl: '/lessons/class-01/level-01/miss-julie-first-day-intro.mp4' } },
        activities, completedActivityIds: resumed ? activities.slice(0, 2).map(a => a.id) : [],
      })
      if (p === '/voice/first-day/intro/start') {
        assert.equal(JSON.parse(request.postData()).lessonId, lessonId)
        starts++
        return await json(failStart && starts === 1 ? 'Synthetic introduction unavailable' : { playbackId: 'a'.repeat(64), minimumSeconds: 90 }, failStart && starts === 1 ? 503 : 200)
      }
      throw Error('Unexpected request before full introduction: ' + p)
    } catch (error) {
      errors.push(error.message)
      if (!request.isInterceptResolutionHandled()) await request.abort().catch(() => {})
    }
  })
  return { page, context, calls, errors, starts: () => starts }
}

for (const resumed of [false, true]) {
  test(`${resumed ? 'saved-progress resume' : 'fresh PIN visit'} waits for the complete Class 1 story without starting speech`, { timeout: 60000 }, async () => {
    const f = await fixture({ resumed })
    try {
      await f.page.goto(base + '/login/student', { waitUntil: 'domcontentloaded' })
      await f.page.waitForSelector('input[inputmode="numeric"]')
      await f.page.type('input[inputmode="numeric"]', '00000')
      await f.page.click('form button[type="submit"]')
      await f.page.waitForSelector('.class1-intro-play-prompt button', { visible: true })
      await f.page.waitForFunction(() => document.querySelector('.class1-intro-video')?.readyState >= 1)
      assert.match(f.page.url(), new RegExp('/student/lesson/' + lessonId))
      assert.equal(f.starts(), 1)
      assert.equal(await f.page.$eval('.class1-intro-video', v => v.paused), true)
      assert.equal(await f.page.evaluate(() => window.__introMicCalls), 0)
      assert.deepEqual(f.calls.filter(p => /^\/(voice|ai|progress)\//.test(p)), ['/voice/first-day/intro/start'])
      assert.deepEqual(f.errors, [])
      if (process.env.BROWSER_EVIDENCE_DIR && resumed) {
        await mkdir(process.env.BROWSER_EVIDENCE_DIR, { recursive: true })
        await f.page.screenshot({ path: path.join(process.env.BROWSER_EVIDENCE_DIR, 'class1-resume-mandatory-intro.png') })
      }
      // Exercise the real user gesture and actual packaged media, without
      // accelerating the movie or fabricating a completion event.
      await f.page.click('.class1-intro-play-prompt button')
      await f.page.waitForFunction(() => document.querySelector('.class1-intro-video')?.currentTime > 0.3)
      assert.equal(await f.page.$eval('.class1-intro-video', v => v.muted), false)
      assert.equal(await f.page.evaluate(() => window.__introMicCalls), 0)
      assert.deepEqual(f.errors, [])
    } finally { await f.context.close() }
  })
}

test('a failed intro start offers visible retry and does not enter practice', { timeout: 60000 }, async () => {
  const f = await fixture({ resumed: true, failStart: true })
  try {
    await f.page.goto(base + '/login/student', { waitUntil: 'domcontentloaded' })
    await f.page.waitForSelector('input[inputmode="numeric"]')
    await f.page.type('input[inputmode="numeric"]', '00000')
    await f.page.click('form button[type="submit"]')
    await f.page.waitForSelector('.class1-intro-error button', { visible: true })
    assert.match(await f.page.$eval('.class1-intro-error', el => el.innerText), /could not open/)
    assert.equal(await f.page.$('.class1-intro-play-prompt'), null)
    await f.page.click('.class1-intro-error button')
    await f.page.waitForSelector('.class1-intro-play-prompt button', { visible: true })
    assert.equal(f.starts(), 2)
    assert.equal(await f.page.evaluate(() => window.__introMicCalls), 0)
    assert.deepEqual(f.errors, [])
  } finally { await f.context.close() }
})

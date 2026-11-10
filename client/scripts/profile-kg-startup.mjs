/** Production-build browser profile with synthetic HTTP only. Never contacts
 * a school DB, speech provider or external website. Does not complete an intro.
 * Build first; then CHROME_PATH=... node scripts/profile-kg-startup.mjs.
 * PROFILE_CLIENT_ROOT can select a separately built baseline checkout.
 */
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.env.PROFILE_CLIENT_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'package.json'))
const { default: puppeteer } = await import(require.resolve('puppeteer-core'))
const out = path.resolve(process.env.PROFILE_OUT_DIR || 'startup-profile')
const runs = Number(process.env.PROFILE_RUNS || 10)
const apiDelayMs = Number(process.env.PROFILE_API_DELAY_MS || 200)
if (!Number.isInteger(runs) || runs < 1 || runs > 30 || !Number.isInteger(apiDelayMs) || apiDelayMs < 0 || apiDelayMs > 2000) throw Error('Invalid bounded profile options')
const base = 'http://127.0.0.1:3127'
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const token = `fixture.${Buffer.from(JSON.stringify({ role: 'STUDENT', exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.fixture`
const student = { id: '333333333333333333333333', fullName: 'Synthetic learner', grade: 0, avatarType: 'GIRL' }
const school = { id: '111111111111111111111111', name: 'Synthetic profile school', code: 'FIXTURE' }
const overview = { nextLevel: 4, nextStudentRoute: '/student/kg/level-4', levels: [], unavailableLevels: [6,7,8,9,10] }
const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '-p', '3127'], { cwd: root, stdio: 'pipe' })
let log = '', browser
server.stdout.on('data', c => { log = (log + c).slice(-4000) })
server.stderr.on('data', c => { log = (log + c).slice(-4000) })
await mkdir(out, { recursive: true })
try {
  let ready = false
  for (let i=0; i<100; i++) {
    if (server.exitCode !== null) throw Error('Next exited: ' + log)
    if (await fetch(base).then(r => r.ok).catch(() => false)) { ready = true; break }
    await new Promise(r => setTimeout(r, 100))
  }
  assert(ready, 'Production Next became available')
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
  const samples = []
  for (let i=0; i<runs; i++) {
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({ width: 1366, height: 768 })
    const apiRequests = [], mediaRequests = [], failures = [], errors = []
    let signedIn = false
    await page.evaluateOnNewDocument(() => {
      window.__startup = { longTasks: [], cls: 0, microphoneRequests: 0 }
      new PerformanceObserver(list => { for (const e of list.getEntries()) window.__startup.longTasks.push(e.duration) }).observe({ type: 'longtask', buffered: true })
      new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__startup.cls += e.value }).observe({ type: 'layout-shift', buffered: true })
      if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => { window.__startup.microphoneRequests++; throw Error('No physical microphone in a synthetic startup profile') }
    })
    page.on('pageerror', e => errors.push(e.message))
    page.on('requestfailed', r => { if (!r.failure()?.errorText.includes('ERR_ABORTED')) failures.push(new URL(r.url()).pathname) })
    await page.setRequestInterception(true)
    page.on('request', async request => {
      try {
        const u = new URL(request.url())
        if (u.pathname.startsWith('/api/')) {
          const p = u.pathname.slice(4)
          if (request.method() === 'OPTIONS') return await request.respond({ status: 204,
            headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-KG-Continuation-Intro',
              'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Max-Age': '86400' } })
          apiRequests.push(p)
          await new Promise(r => setTimeout(r, apiDelayMs))
          let data
          if (p === '/auth/student/pin-login') { signedIn = true; data = { token, student, school } }
          else if (p === '/auth/me') data = signedIn ? { role: 'STUDENT', student, school } : null
          else if (p === '/kg-alphabet/state') data = { completed: true, level2Available: true, currentIndex: 8, audio: {}, audioVersion: 'fixture' }
          else if (p === '/kg-level2/state') data = { completed: true, currentIndex: 6 }
          else if (p === '/kg-continuation/overview') data = overview
          else if (p === '/kg-continuation/4/state') data = { level: 4, title: 'Letters Q to V', currentIndex: 0, totalActivities: 6, completed: false, activity: { letter: 'Q', mode: 'speak' }, pendingFeedback: null }
          else if (p === '/kg-continuation/4/intro/start') data = { playbackId: 'a'.repeat(64) }
          else throw Error('Unexpected API request: ' + p)
          return await request.respond({ status: data === null ? 401 : 200, contentType: 'application/json',
            headers: { 'Access-Control-Allow-Origin': base },
            body: JSON.stringify({ success: data !== null, data }) })
        }
        if (u.origin !== base && !['data:', 'blob:'].includes(u.protocol)) return await request.abort()
        if (/\.(mp4|webm|mp3|wav)(?:$|\?)/.test(u.pathname)) mediaRequests.push(u.pathname)
        await request.continue()
      } catch (e) {
        errors.push(e.message)
        if (!request.isInterceptResolutionHandled()) await request.abort().catch(() => {})
      }
    })
    const started = performance.now()
    await page.goto(base + '/login/student', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('input[inputmode="numeric"]', { visible: true })
    const loginScreenMs = performance.now() - started
    const mediaBeforePin = [...mediaRequests]
    if (i === 0) await page.screenshot({ path: path.join(out, 'student-login.png') })
    await page.type('input[inputmode="numeric"]', '00000')
    const clicked = performance.now()
    await page.click('form button[type="submit"]')
    await page.waitForFunction(() => location.pathname === '/student/kg/level-4' && Boolean(document.querySelector('video')))
    const pinToIntroScreenMs = performance.now() - clicked
    await page.waitForFunction(() => {
      const v = document.querySelector('video'); return v && (v.readyState >= 2 || v.error)
    })
    const metrics = await page.metrics()
    const state = await page.evaluate(() => ({ ...window.__startup,
      videoReady: document.querySelector('video')?.readyState,
      videoError: document.querySelector('video')?.error?.code || null,
      resources: performance.getEntriesByType('resource').map(r => ({ type: r.initiatorType, bytes: r.transferSize })) }))
    assert.equal(state.microphoneRequests, 0, 'No microphone before mandatory intro completion')
    assert.deepEqual(errors, [])
    assert.deepEqual(mediaBeforePin, [], 'Nonessential media must not download before PIN')
    if (i === 0) await page.screenshot({ path: path.join(out, 'kg-mandatory-intro.png') })
    samples.push({ loginScreenMs, pinToIntroScreenMs, apiRequests, mediaBeforePin, mediaRequests,
      longTasks: state.longTasks, cls: state.cls, heapBytes: metrics.JSHeapUsedSize,
      resourceRequests: state.resources.length, transferredBytes: state.resources.reduce((n,r)=>n+r.bytes,0),
      videoReady: state.videoReady, videoError: state.videoError, failures })
    await context.close()
  }
  const percentile = (key, p) => { const values = samples.map(s=>s[key]).sort((a,b)=>a-b); return Math.round(values[Math.ceil(p*values.length)-1]) }
  const report = { scenario: 'Production UI, synthetic authenticated KG4 resume, fresh browser context per sample',
    revision, browser: await browser.version(), apiDelayMs, runs, physicalSpeechTested: false,
    pinToIntroScreenMs: { p50: percentile('pinToIntroScreenMs', .5), p95: percentile('pinToIntroScreenMs', .95) },
    loginScreenMs: { p50: percentile('loginScreenMs', .5), p95: percentile('loginScreenMs', .95) },
    samples }
  await writeFile(path.join(out, 'startup.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ ...report, samples: undefined }, null, 2))
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}

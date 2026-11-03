/** Real Chromium + production Next UI. Only HTTP responses/accounts are synthetic.
 * No auth bypass is shipped, no school database or speech provider is contacted.
 */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import puppeteer from 'puppeteer-core'

const require = createRequire(import.meta.url)
const base = process.env.STAFF_TEST_CLIENT_URL || 'http://127.0.0.1:3111'
let browser, server
before(async () => {
  if (!process.env.STAFF_TEST_CLIENT_URL) {
    server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3111'], { stdio: 'pipe' })
    let log = ''
    server.stdout.on('data', chunk => { log += chunk })
    server.stderr.on('data', chunk => { log += chunk })
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw Error(`Next exited: ${log}`)
      if (await fetch(base).then(r => r.ok).catch(() => false)) break
      await new Promise(resolve => setTimeout(resolve, 200))
      if (i === 99) throw Error(`Next did not start: ${log}`)
    }
  }
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || (process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome'),
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] })
})
after(async () => { await browser?.close(); server?.kill('SIGTERM') })

const school = { id: '111111111111111111111111', name: 'Isolated Curriculum School', code: 'BROWSERQA' }
const teacher = { id: '222222222222222222222222', name: 'Test Educator', email: 'teacher@example.test' }
const student = { id: '333333333333333333333333', fullName: 'Synthetic Learner', grade: 1, avatarType: 'GIRL' }
const token = role => `test.${Buffer.from(JSON.stringify({ role, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`
const levels = grade => Array.from({ length: 10 }, (_, i) => ({
  address: `g${String(grade).padStart(2, '0')}-l${String(i + 1).padStart(2, '0')}`, grade, level: i + 1,
  plannedTitle: `Recorded class ${grade} level ${i + 1}`, objective: 'School-scoped fixture', skills: ['speaking'],
  syllabusReviewRequired: true, classId: `class-${grade}`, levelId: `level-${grade}-${i + 1}`,
  actualTitle: null, version: 'isolated-browser-test', status: 'DRAFT', publication: 'UPCOMING', lessons: [],
}))
async function fixture() {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const errors = [], reads = [], writes = []
  let role = null, blockedGrade = null, releaseGrade
  let unauthorized = false
  const delayed = new Promise(resolve => { releaseGrade = resolve })
  page.on('pageerror', error => errors.push(error.message))
  await page.evaluateOnNewDocument(() => {
    window.__staffMicrophoneRequests = 0
    navigator.mediaDevices.getUserMedia = async () => {
      window.__staffMicrophoneRequests++
      throw Error('Staff explorer must not record speech')
    }
  })
  await page.setRequestInterception(true)
  page.on('request', async request => {
    const url = new URL(request.url())
    const path = url.pathname.replace(/^\/qa-api(?=\/)/, '/api')
    const headers = { 'Access-Control-Allow-Origin': new URL(base).origin,
      'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }
    const json = (data, status = 200) => request.respond({ status, headers, contentType: 'application/json',
      body: JSON.stringify(status < 400 ? { success: true, data } : { success: false, error: { message: data, code: 'TEST_DENIED' } }) })
    try {
      if (!path.startsWith('/api/')) {
        if (url.origin === new URL(base).origin || url.protocol === 'data:' || url.protocol === 'blob:') return await request.continue()
        return await request.abort()
      }
      if (request.method() === 'OPTIONS') return await request.respond({ status: 204, headers })
      if (request.method() === 'GET') reads.push(path)
      else writes.push(path)
      if (/\/auth\/(teacher|school)\/login$/.test(path)) {
        const body = JSON.parse(request.postData())
        if (body.password !== 'fixture-password') return await json('Invalid fixture credentials', 401)
        role = path.includes('/teacher/') ? 'TEACHER' : 'SCHOOL_ADMIN'
        return await json({ token: token(role), teacher, school })
      }
      if (path.endsWith('/auth/student/pin-login')) { role = 'STUDENT'; return await json({ token: token(role), student, school }) }
      if (path.endsWith('/auth/logout')) { role = null; return await json({}) }
      if (path.endsWith('/auth/me')) return await json(unauthorized || !role ? 'Sign in required' : { role, teacher, student, school }, unauthorized || !role ? 401 : 200)
      const match = /\/curriculum-map\/grades\/(\d+)(?:\/levels\/(\d+))?$/.exec(path)
      if (match) {
        if (!['TEACHER', 'SCHOOL_ADMIN'].includes(role)) return await json('Educator access required', 403)
        const grade = Number(match[1])
        if (grade === blockedGrade) await delayed
        if (role === 'TEACHER' && grade === 0) return await json('School administrator required for KG live records', 403)
        return await json(match[2] ? levels(grade)[Number(match[2]) - 1] : {
          grade, name: `Class ${grade}`, classId: `class-${grade}`, classStatus: 'draft', total: 10,
          mappedCount: 10, publishedCount: 0, levels: levels(grade), note: 'Synthetic records',
        })
      }
      // Unrelated dashboard/home reads are empty fixtures, never real HTTP.
      if (path.endsWith('/schools/overview')) return await json({ school, studentCount: 0, activeStudentCount: 0, teacherCount: 1, averageProgress: 0, totalLearningMinutes: 0 })
      if (path.endsWith('/analytics/overview')) return await json({ totalAttempts: 0, avgAccuracy: 0, totalLearningTimeMinutes: 0, activeTodayCount: 0, gradeBreakdown: [] })
      if (path.endsWith('/students/me/curriculum')) return await json({ grade: 1, units: [], totals: {} })
      if (/\/classes\/class-\d+$/.test(path)) return await json({ id: path.split('/').at(-1), grade: Number(path.split('-').at(-1)), name: 'Authorized class' })
      return await json([])
    } catch (error) {
      errors.push(`Interception: ${error.message}`)
      if (!request.isInterceptResolutionHandled()) await request.abort().catch(() => {})
    }
  })
  async function login(kind = 'teacher', invalid = false) {
    await page.goto(`${base}/login/${kind}`, { waitUntil: 'networkidle0' })
    if (kind === 'student') {
      // Exercise the real PIN form rather than injecting browser credentials.
      await page.type('input[inputmode="numeric"]', '12345')
    } else {
      await page.type('input[placeholder="YOUR SCHOOL CODE"]', school.code)
      if (kind === 'teacher') await page.type('input[type="email"]', teacher.email)
      await page.type('input[type="password"]', invalid ? 'wrong-password' : 'fixture-password')
    }
    await page.click('form button[type="submit"]')
    if (!invalid) await page.waitForFunction(() => location.pathname.startsWith('/school/') || location.pathname.startsWith('/student/'))
  }
  async function explorer(query = '') {
    await page.goto(`${base}/school/curriculum-map${query}`, { waitUntil: 'networkidle0' })
    await page.waitForSelector('[aria-label="Choose a class"]')
    await page.waitForFunction(() => document.querySelectorAll('[aria-label$=" level map"] button').length > 0)
  }
  return { context, page, errors, reads, writes, login, explorer,
    delayGrade: grade => { blockedGrade = grade }, releaseGrade,
    expire: () => { unauthorized = true },
    check: async () => {
      assert.equal(await page.evaluate(() => window.__staffMicrophoneRequests), 0)
      assert.deepEqual(writes.filter(path => !path.includes('/auth/')), [], 'Explorer wrote learning/curriculum data')
      assert.deepEqual(errors, [], 'Browser JavaScript errors')
    },
  }
}
async function using(run) {
  const f = await fixture()
  try { await run(f) } finally { f.releaseGrade(); await f.context.close() }
}
const text = page => page.$eval('body', el => el.innerText)
const waitText = (page, value) => page.waitForFunction(value => document.body.innerText.includes(value), {}, value)
async function clickText(page, label) {
  for (const button of await page.$$('button')) {
    if ((await button.evaluate(el => el.textContent.trim())) === label && await button.isVisible()) return button.click()
  }
  throw Error(`Visible button missing: ${label}`)
}

for (const kind of ['teacher', 'school']) {
  test(`${kind} login opens all 110 addresses; class/unit/search and coverage are interactive`, { timeout: 60000 }, () => using(async f => {
    const { page } = f
    await f.login(kind)
    await f.explorer()
    assert.equal(await page.$eval('[aria-label="Authorized school"]', el => el.disabled), true)
    await page.select('[aria-label="Choose a class"]', 'all')
    await page.waitForFunction(() => document.querySelectorAll('[aria-label$=" level map"] button').length === 110)
    await page.select('[aria-label="Choose a class"]', '10')
    await page.waitForFunction(() => document.querySelectorAll('[aria-label="Class 10 level map"] button').length === 10)
    await page.select('[aria-label="Choose a class"]', '1')
    await waitText(page, 'Class 1, carefully mapped.')
    await page.select('[aria-label="Filter textbook unit"]', '1')
    await page.waitForFunction(() => document.querySelectorAll('[aria-label="Class 1 level map"] button').length === 3)
    await page.click('#explorer-tab-coverage')
    await page.click('[aria-label="Lesson coverage"] button')
    await waitText(page, 'Clap your hands.')
    assert.match(await text(page), /35|NUMBERED TEXTBOOK ACTIVITIES MAPPED/)
    await page.type('[aria-label="Search curriculum"]', '1.5')
    await page.waitForFunction(() => document.querySelectorAll('#explorer-panel-coverage article[aria-label]').length === 1)
    assert.match(await text(page), /Fun with Special Letters/)
    await f.check()
  }))
}
test('invalid credentials stay on login; anonymous and student sessions cannot inspect staff plans', { timeout: 60000 }, () => using(async f => {
  await f.login('teacher', true)
  await waitText(f.page, 'Invalid fixture credentials')
  assert.match(f.page.url(), /\/login\/teacher/)
  await f.page.goto(`${base}/school/curriculum-map`)
  await f.page.waitForFunction(() => location.pathname === '/login/school')
  await f.login('student')
  f.reads.length = 0
  await f.page.goto(`${base}/school/curriculum-map`)
  await f.page.waitForFunction(() => location.pathname.startsWith('/student/'))
  assert.equal(await f.page.$('[aria-label="Choose a class"]'), null)
  assert.deepEqual(f.reads.filter(path => path.includes('/curriculum-map/')), [])
}))
test('teacher KG denial stays unavailable and does not become a published state', { timeout: 60000 }, () => using(async f => {
  await f.login()
  await f.explorer('?grade=0&level=6')
  await waitText(f.page, 'Live school records unavailable.')
  assert.match(await text(f.page), /Family Words/)
  assert.doesNotMatch(await text(f.page), /Live Kindergarten: 10\/10 mapped/)
  await f.check()
}))
test('a late previous-class response cannot replace the selected class', { timeout: 60000 }, () => using(async f => {
  await f.login('school')
  await f.explorer()
  f.delayGrade(2)
  await f.page.select('[aria-label="Choose a class"]', '2')
  await f.page.waitForFunction(() => document.querySelector('[aria-label="Class 2 level map"]'))
  await f.page.select('[aria-label="Choose a class"]', '3')
  await waitText(f.page, 'Live Class 3:')
  f.releaseGrade()
  await f.page.waitForNetworkIdle()
  assert.match(await text(f.page), /Live Class 3:/)
  assert.doesNotMatch(await text(f.page), /Live Class 2:/)
  await f.check()
}))
test('planning notes survive reload and do not leak to another staff account', { timeout: 60000 }, () => using(async f => {
  await f.login()
  await f.explorer()
  await f.page.type('#notes-g01-l01', 'Check every written exercise')
  await f.page.select('#review-g01-l01', 'revise')
  await f.page.reload({ waitUntil: 'networkidle0' })
  await f.page.waitForSelector('#notes-g01-l01')
  assert.equal(await f.page.$eval('#notes-g01-l01', el => el.value), 'Check every written exercise')
  await f.login('school')
  await f.explorer()
  assert.equal(await f.page.$eval('#notes-g01-l01', el => el.value), '')
  await f.check()
}))
test('expired authentication removes the explorer and redirects to school sign-in', { timeout: 60000 }, () => using(async f => {
  await f.login()
  await f.explorer()
  f.expire()
  await f.page.reload({ waitUntil: 'networkidle0' })
  await f.page.waitForFunction(() => location.pathname === '/login/school')
  assert.equal(await f.page.$('[aria-label="Choose a class"]'), null)
  assert.equal(await f.page.evaluate(() => localStorage.getItem('talkora_token')), null)
}))
test('teaching preview waits and retries the same prompt with Hindi and Marathi support without writing progress', { timeout: 60000 }, () => using(async f => {
  await f.login()
  await f.explorer('?grade=1&level=2&view=teaching&sample=chapter-1.5')
  const { page } = f
  const address = () => new URL(page.url()).searchParams.get('level')
  await clickText(page, 'Start this teaching turn')
  await clickText(page, 'Open the child’s turn')
  await waitText(page, 'WAIT FOR THE CHILD')
  await page.waitForNetworkIdle()
  assert.equal(address(), '2')
  await clickText(page, 'Needs support')
  await page.select('[aria-label="Hint language"]', 'hi')
  await waitText(page, 'अच्छी कोशिश')
  await page.select('[aria-label="Hint language"]', 'mr')
  await waitText(page, 'छान प्रयत्न')
  await clickText(page, 'Try the same prompt again')
  await clickText(page, 'Open the child’s turn')
  await clickText(page, 'No response')
  await waitText(page, 'GIVE TIME & REASSURE')
  assert.equal(address(), '2')
  assert.equal(await page.$eval('[aria-label="Preview chapter or activity"]', el => el.value), 'chapter-1.5')
  await f.check()
}))

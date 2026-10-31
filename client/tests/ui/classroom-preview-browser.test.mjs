import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import puppeteer from 'puppeteer-core'

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BROWSER_PATH = existsSync(EDGE_PATH) ? EDGE_PATH : (existsSync(CHROME_PATH) ? CHROME_PATH : null)
const BASE_URL = process.env.TEST_CLIENT_URL || null

test('Browser E2E: Production route-access restriction and HTML removal verification', async (t) => {
  if (!BROWSER_PATH) {
    t.skip('No compatible Chromium/Edge browser found')
    return
  }

  if (!BASE_URL) {
    t.skip('Set TEST_CLIENT_URL to run live browser check against this worktree')
    return
  }

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // 1. Standalone public HTML is 404 or redirected
    const htmlResponse = await page.goto(`${BASE_URL}/classroom-preview.html`, { waitUntil: 'networkidle0' })
    const finalUrl = page.url()
    assert.ok(
      htmlResponse?.status() === 404 || !finalUrl.endsWith('classroom-preview.html'),
      'Standalone classroom-preview.html must not be publicly served',
    )

    // 2. Anonymous access to /classroom-preview displays Access Restricted
    await page.goto(`${BASE_URL}/classroom-preview`, { waitUntil: 'networkidle0' })
    const bodyText = await page.$eval('body', el => el.textContent || '')
    assert.match(bodyText, /Access Restricted|Verifying educator/i)

    // 3. Confirm interactive teaching stage and sandbox beacon are NOT rendered
    const stage = await page.$('[aria-label="Smart Learning Board"]')
    assert.equal(stage, null, 'Smart Learning Board must not be mounted for unauthorized users')
  } finally {
    await browser.close()
  }
})

/** Isolated Chrome: real Audio/MediaRecorder/VAD; synthetic mic and mocked API only.
 * Never contacts Atlas, Groq, S3, or a real student account. */
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const base = process.env.KG_TEST_CLIENT_URL || 'http://localhost:3000'
const manifest = JSON.parse((await readFile(new URL('../../backend/src/scripts/kg-level1-lines.json', import.meta.url), 'utf8')).replace(/^\uFEFF/, ''))
const letters = ['apple', 'ball', 'cat', 'dog'].map((word, i) => ({ letter: 'ABCD'[i], word, color: '#ea718f', emoji: '' }))
let browser
before(async () => {
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--no-proxy-server', '--no-sandbox', '--disable-gpu'] })
})
after(async () => { await browser?.close() })

function wave() {
  const samples = 2400
  const bytes = Buffer.alloc(44 + samples * 2)
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8)
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22)
  bytes.writeUInt32LE(16000, 24); bytes.writeUInt32LE(32000, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34)
  bytes.write('data', 36); bytes.writeUInt32LE(samples * 2, 40)
  for (let i = 0; i < samples; i++) bytes.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 440 / 16000) * 500), 44 + i * 2)
  return bytes
}

async function fixture({ outcome = 'correct', denied = false, lostResponse = false, silent = false, feedbackFailure = false, waitForRecording = false } = {}) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const diagnostics = []
  const requests = []
  page.on('pageerror', (error) => diagnostics.push(error.message))
  page.on('requestfailed', (request) => diagnostics.push(`request failed: ${new URL(request.url()).pathname} (${request.failure()?.errorText})`))
  page.on('response', (response) => { if (response.status() >= 400) diagnostics.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`) })
  let index = 0; let releaseAnswer; let received
  const firstAttempt = new Promise((resolve) => { received = resolve })
  const gate = new Promise((resolve) => { releaseAnswer = resolve })
  const ids = []; let saved
  const state = () => ({ version: 'kg-alphabet-v1', level: 1, title: 'ABCD Picture Garden', currentIndex: index,
    totalActivities: 8, audioVersion: 'v1', introSeen: true, completed: false, completedAt: null, level2Unlocked: false, level2Available: false,
    letters, activity: { id: `say-${'abcd'[index % 4]}`, letter: 'ABCD'[index % 4], mode: 'speak', audioId: `say-${'abcd'[index % 4]}` },
    audio: Object.fromEntries(manifest.clips.map((clip) => [clip.id, { text: clip.text, url: `/kg-alphabet/audio/v1/${clip.id}` }])) })
  await page.evaluateOnNewDocument(({ denied, silent }) => {
    const encoded = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
    sessionStorage.setItem('talkora_token', `test.${encoded}.test`)
    window.__kgMedia = { requests: 0, streams: 0, recorders: 0, overlap: false }
    let fakeFullscreenElement = null
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fakeFullscreenElement })
    Element.prototype.requestFullscreen = async function () {
      fakeFullscreenElement = this
      document.dispatchEvent(new Event('fullscreenchange'))
    }
    document.exitFullscreen = async () => {
      fakeFullscreenElement = null
      document.dispatchEvent(new Event('fullscreenchange'))
    }
    const NativeRecorder = window.MediaRecorder
    window.MediaRecorder = class extends NativeRecorder {
      start(...args) { window.__kgMedia.recorders++; return super.start(...args) }
      stop() { if (this.state !== 'inactive') window.__kgMedia.recorders--; return super.stop() }
    }
    const originalPlay = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function (...args) {
      if (window.__kgMedia.recorders) window.__kgMedia.overlap = true
      if (this instanceof HTMLVideoElement && this.getAttribute('src')?.includes('/lessons/kg/videos/fullkg.mp4')) {
        const video = this
        Object.defineProperty(video, 'duration', { configurable: true, value: 63.018 })
        Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 0 })
        Object.defineProperty(video, 'seeking', { configurable: true, value: false })
        setTimeout(() => {
          video.dispatchEvent(new Event('play'))
          for (let second = 1; second <= 63; second++) {
            video.currentTime = second
            video.dispatchEvent(new Event('timeupdate'))
          }
          video.dispatchEvent(new Event('ended'))
        }, 10)
        return Promise.resolve()
      }
      return originalPlay.apply(this, args)
    }
    navigator.mediaDevices.getUserMedia = async () => {
      window.__kgMedia.requests++
      if (denied) throw new DOMException('Test denied permission', 'NotAllowedError')
      const audio = new AudioContext()
      await audio.resume()
      const destination = audio.createMediaStreamDestination()
      const oscillator = audio.createOscillator(); const gain = audio.createGain()
      oscillator.connect(gain); gain.connect(destination)
      gain.gain.setValueAtTime(0, audio.currentTime)
      gain.gain.setValueAtTime(silent ? 0 : 0.3, audio.currentTime + 0.15)
      gain.gain.setValueAtTime(0, audio.currentTime + 0.55)
      oscillator.start()
      const stream = destination.stream
      window.__kgMedia.streams++
      for (const track of stream.getTracks()) {
        const stop = track.stop.bind(track)
        let stopped = false
        track.stop = () => { if (!stopped) { stopped = true; window.__kgMedia.streams--; void audio.close() } stop() }
      }
      return stream
    }
  }, { denied, silent })
  await page.setRequestInterception(true)
  page.on('request', async (request) => {
    const url = new URL(request.url())
    requests.push(`${request.method()} ${url.origin}${url.pathname}`)
    const headers = { 'Access-Control-Allow-Origin': new URL(base).origin, 'Access-Control-Allow-Headers': 'authorization,content-type,x-kg-intro-playback', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }
    const json = (data, status = 200) => request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ success: true, data }) })
    try {
      if (request.method() === 'OPTIONS') return await request.respond({ status: 204, headers })
      if (url.pathname.endsWith('/auth/me')) return await json({ role: 'STUDENT',
        student: { _id: '111111111111111111111111', fullName: 'Automated Test', grade: 0, avatarType: 'GIRL', kgAlphabetPilotEnabled: true },
        school: { _id: '222222222222222222222222', name: 'Isolated Test School' } })
      if (url.pathname.includes('/kg-alphabet/audio/')) {
        if (feedbackFailure && url.pathname.endsWith('/great')) return await request.respond({ status: 404, headers: { ...headers, 'Cache-Control': 'no-store' }, contentType: 'application/json', body: JSON.stringify({ success: false, error: { message: 'Test missing feedback clip' } }) })
        return await request.respond({ status: 200, headers, contentType: 'audio/wav', body: wave() })
      }
      if (url.pathname.endsWith('/feedback-audio')) {
        if (feedbackFailure) return await request.respond({ status: 404, headers: { ...headers, 'Cache-Control': 'no-store' }, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code: 'KG_AUDIO_MISSING', message: 'Test missing feedback clip' } }) })
        return await request.respond({ status: 200, headers, contentType: 'audio/wav', body: wave() })
      }
      if (url.pathname.endsWith('/feedback-played')) {
        return await json({ state: state() })
      }
      if (url.pathname.endsWith('/kg-alphabet/intro/start')) return await json({ playbackId: 'a'.repeat(64) })
      if (url.pathname.endsWith('/kg-alphabet/intro-seen')) return await json({ introSeen: true })
      if (url.pathname.endsWith('/kg-alphabet/state')) return await json(state())
      if (url.pathname.endsWith('/kg-alphabet/attempt')) {
        const body = JSON.parse(request.postData())
        ids.push(body.submissionId)
        received()
        if (body.noSpeech) {
          assert.equal(body.audioBase64, undefined)
          return await json({ outcome: 'unclear', state: state(), feedbackAudioId: 'silence' })
        }
        assert.ok(body.audioBase64.length > 128)
        if (lostResponse && ids.length === 1) {
          index = 1; saved = { outcome: 'correct', submissionId: body.submissionId, state: state(), feedbackAudioId: 'great' }
          return await request.abort('failed')
        }
        if (lostResponse) return await json(saved)
        await gate
        if (outcome === 'correct') index = 1
        return await json({ outcome, submissionId: body.submissionId, state: state(), feedbackAudioId: outcome === 'correct' ? 'great' : outcome === 'incorrect' ? 'try-again' : 'repeat' })
      }
      if (url.pathname.startsWith('/api/') || url.origin !== new URL(base).origin) return await request.abort()
      return await request.continue()
    } catch (error) {
      diagnostics.push(`Request interception failed: ${error instanceof Error ? error.message : String(error)}`)
      if (!request.isInterceptResolutionHandled()) {
        await request.abort().catch((abortError) => {
          diagnostics.push(`Request abort failed: ${abortError instanceof Error ? abortError.message : String(abortError)}`)
        })
      }
    }
  })
  await page.goto(`${base}/student/kg`, { waitUntil: 'domcontentloaded' })
  // Fullscreen media normally needs one real gesture; microphone permission is
  // requested only after the server-verified story completes.
  try {
    await page.waitForFunction(() => document.querySelector('.kg-story-play') || window.__kgMedia.requests > 0, { timeout: 20000 })
  } catch (error) {
    console.error('Isolated KG browser setup diagnostic:', JSON.stringify({
      url: page.url(),
      errors: diagnostics,
      requests,
      text: (await page.$eval('body', (element) => element.innerText)).slice(0, 1000),
    }))
    await context.close()
    throw error
  }
  const storyPlay = await page.$('.kg-story-play')
  if (storyPlay) await storyPlay.click()
  try {
    if (denied) {
      await page.waitForFunction(() => document.body.innerText.includes('Please allow microphone access'), { timeout: 20000 })
    } else if (waitForRecording) {
      await page.waitForFunction(() => window.__kgMedia.recorders === 1, { timeout: 20000 })
    } else {
      await page.waitForFunction(() => window.__kgMedia.requests > 0, { timeout: 20000 })
    }
  } catch (error) {
    console.error('Isolated KG browser diagnostic:', JSON.stringify({ url: page.url(), errors: diagnostics, requests, media: await page.evaluate(() => window.__kgMedia), attempts: ids, text: (await page.$eval('body', (element) => element.innerText)).slice(0, 1000) }))
    await context.close()
    throw error
  }
  return { page, context, firstAttempt, releaseAnswer, ids, diagnostics, requests, restoreFeedback: () => { feedbackFailure = false } }
}

for (const outcome of ['correct', 'incorrect', 'unclear']) {
  test(`real browser playback and recorder: ${outcome} uses the server result without audio-driven advancement`, { timeout: 40000 }, async () => {
    const fixtureData = await fixture({ outcome })
    const { page, context, firstAttempt, releaseAnswer } = fixtureData
    try {
      await firstAttempt
      assert.equal(await page.evaluate(() => window.__kgMedia.streams), 0)
      assert.equal(await page.evaluate(() => window.__kgMedia.overlap), false)
      assert.match(await page.$eval('h1', (element) => element.textContent), /A.*apple/)
      // All prompt playback has ended, but the unanswered server request cannot advance.
      assert.equal(await page.evaluate(() => document.querySelector('[aria-label="0 of 8 garden adventures"]') !== null), true)
      releaseAnswer()
      if (outcome === 'correct') await page.waitForFunction(() => document.querySelector('h1')?.textContent.includes('ball'))
      else {
        await page.waitForFunction(() => window.__kgMedia.requests >= 3)
        assert.match(await page.$eval('h1', (element) => element.textContent), /A.*apple/)
      }
      assert.equal(await page.evaluate(() => window.__kgMedia.overlap), false)
    } finally { releaseAnswer(); await context.close() }
  })
}

test('real browser denied permission keeps the first question and sends no audio', { timeout: 40000 }, async () => {
  const { page, context, ids } = await fixture({ denied: true })
  try {
    assert.equal(ids.length, 0)
    assert.equal(await page.evaluate(() => window.__kgMedia.streams), 0)
  } finally { await context.close() }
})

test('real browser retries a lost response with the original submission ID', { timeout: 40000 }, async () => {
  const { page, context, ids, diagnostics } = await fixture({ lostResponse: true })
  try {
    try { await page.waitForFunction(() => document.querySelector('h1')?.textContent.includes('ball'), { timeout: 12000 }) }
    catch (error) {
      console.error('Lost-response diagnostic:', JSON.stringify({ ids, diagnostics, text: await page.$eval('main', (element) => element.textContent), media: await page.evaluate(() => window.__kgMedia) }))
      throw error
    }
    assert.ok(ids.length >= 2)
    assert.equal(ids[0], ids[1])
  } finally { await context.close() }
})

test('real browser session expiry stops capture before the STT request', { timeout: 40000 }, async () => {
  const { page, context, ids } = await fixture({ waitForRecording: true })
  try {
    await page.waitForFunction(() => window.__kgMedia.recorders === 1)
    await page.evaluate(() => window.dispatchEvent(new Event('talkora:auth-invalidated')))
    await page.waitForFunction(() => window.__kgMedia.streams === 0 && window.__kgMedia.recorders === 0)
    assert.equal(ids.length, 0)
  } finally { await context.close() }
})

test('real browser silence retries twice, saves only silence events, and offers manual retry', { timeout: 45000 }, async () => {
  const { page, context, ids } = await fixture({ silent: true })
  try {
    try {
      // Three silence recordings are required. A separate permission preflight
      // occurs only when the browser needs a post-video Start gesture.
      await page.waitForFunction(() => document.body.innerText.includes('That was quiet.') && window.__kgMedia.requests >= 3, { timeout: 26000 })
    } catch (error) {
      console.error('Silence retry diagnostic:', JSON.stringify({ requests: await page.evaluate(() => window.__kgMedia), attempts: ids, text: await page.$eval('body', (element) => element.innerText) }))
      throw error
    }
    assert.equal(ids.length, 3)
    assert.equal(await page.evaluate(() => window.__kgMedia.streams), 0)
    assert.equal(await page.evaluate(() => window.__kgMedia.overlap), false)
    assert.match(await page.$eval('h1', (element) => element.textContent), /A.*apple/)
  } finally { await context.close() }
})

test('real browser retries missing praise without resubmitting the saved correct answer', { timeout: 40000 }, async () => {
  const fixtureData = await fixture({ feedbackFailure: true })
  const { page, context, firstAttempt, releaseAnswer, restoreFeedback, ids } = fixtureData
  try {
    await firstAttempt; releaseAnswer()
    try {
      await page.waitForFunction(() => document.body.textContent.includes('reply needs another try'), { timeout: 12000 })
    } catch (error) {
      console.error('Missing praise diagnostic:', JSON.stringify({ requests: await page.evaluate(() => window.__kgMedia), requestLog: fixtureData.requests, attempts: ids, text: await page.$eval('body', (element) => element.innerText) }))
      throw error
    }
    assert.equal(ids.length, 1)
    restoreFeedback()
    const buttons = await page.$$('button')
    for (const button of buttons) if ((await button.evaluate((element) => element.textContent)).includes('Try again')) { await button.click(); break }
    try {
      await page.waitForFunction(() => document.querySelector('h1')?.textContent.includes('ball'), { timeout: 20000 })
    } catch (error) {
      console.error('Missing praise retry diagnostic:', JSON.stringify({ requests: await page.evaluate(() => window.__kgMedia), requestLog: fixtureData.requests, attempts: ids, text: await page.$eval('body', (element) => element.innerText), diagnostics: fixtureData.diagnostics }))
      throw error
    }
    assert.equal(ids.length, 1)
  } finally { releaseAnswer(); await context.close() }
})

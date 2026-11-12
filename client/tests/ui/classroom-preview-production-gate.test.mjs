import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('classroom preview is explicitly dev-only at the Next.js request boundary', async () => {
  const proxy = await read('../../proxy.ts')
  assert.match(proxy, /export function proxy\(/)
  assert.match(proxy, /process\.env\.NODE_ENV !== 'development'/)
  assert.match(proxy, /status:\s*404/)
  assert.match(proxy, /'Cache-Control':\s*'no-store'/)
  assert.match(proxy, /NextResponse\.next\(\)/)
  assert.match(proxy, /matcher:\s*\['\/classroom-preview',\s*'\/classroom-preview\.html'\]/)
})

test('standalone preview is not distributed from the public asset folder', () => {
  assert.equal(existsSync(new URL('../../public/classroom-preview.html', import.meta.url)), false)
})

test('development preview still identifies simulation and gives students an exit', async () => {
  const preview = await read('../../app/classroom-preview/page.tsx')
  assert.match(preview, /STAFF &(?:amp;)? DEVELOPER SANDBOX/)
  assert.match(preview, /Simulated Demo \(0 XP Awarded\)/)
  assert.match(preview, /href="\/student\/continue"/)
  assert.doesNotMatch(preview, /MediaRecorder|getUserMedia\(/)
})

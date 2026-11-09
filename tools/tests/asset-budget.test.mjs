import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { overBudget, VIDEO_LIMIT, OTHER_LIMIT } from '../check-asset-budget.mjs'
import { ffmpegArgs } from '../compress-lesson-videos.mjs'

test('flags oversized videos and images, accepts files at the limit', () => {
  const dir = mkdtempSync(join(tmpdir(), 'budget-'))
  mkdirSync(join(dir, 'a'))
  writeFileSync(join(dir, 'a', 'big.mp4'), Buffer.alloc(VIDEO_LIMIT + 1))
  writeFileSync(join(dir, 'a', 'ok.mp4'), Buffer.alloc(VIDEO_LIMIT))
  writeFileSync(join(dir, 'huge.png'), Buffer.alloc(OTHER_LIMIT + 1))
  const bad = overBudget(dir).map((b) => b.file.replace(/\\/g, '/')).sort()
  assert.deepEqual(bad, ['a/big.mp4', 'huge.png'])
})

test('compression keeps fast start, 480p cap and mono audio', () => {
  const args = ffmpegArgs('in.mp4', 'out.mp4').join(' ')
  assert.match(args, /\+faststart/)
  assert.match(args, /min\(480,ih\)/)
  assert.match(args, /-ac 1/)
})

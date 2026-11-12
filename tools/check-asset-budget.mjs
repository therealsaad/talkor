#!/usr/bin/env node
/** Fails when a file in client/public is too heavy for a slow connection. Videos 10 MB, everything else 4 MB. */
import { readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const VIDEO_LIMIT = 10 * 1024 * 1024
export const OTHER_LIMIT = 4 * 1024 * 1024
const isVideo = (name) => /\.(mp4|webm|mov)$/i.test(name)

export function overBudget(dir, base = dir) {
  const bad = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) { bad.push(...overBudget(path, base)); continue }
    const size = statSync(path).size
    const limit = isVideo(entry.name) ? VIDEO_LIMIT : OTHER_LIMIT
    if (size > limit) bad.push({ file: path.slice(base.length + 1), size, limit })
  }
  return bad
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'client', 'public')
  const bad = overBudget(publicDir)
  for (const b of bad) console.error(`TOO BIG ${(b.size / 1048576).toFixed(1)} MB (limit ${b.limit / 1048576} MB): ${b.file}`)
  if (bad.length) { console.error('Run: node tools/compress-lesson-videos.mjs'); process.exit(1) }
  console.log('Asset budget ok')
}

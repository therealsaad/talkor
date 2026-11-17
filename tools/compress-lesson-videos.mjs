#!/usr/bin/env node
/**
 * Re-encodes oversized lesson videos in client/public to a phone-friendly size, keeping the same file names so no
 * code or link changes. 480p, H.264 crf 28 capped at 900 kbps, mono AAC 64k, moov atom first (starts before the file
 * finishes downloading). Skips files already under the limit. Needs ffmpeg.
 *
 *   node tools/compress-lesson-videos.mjs            # compress every video over the limit, in place
 *   node tools/compress-lesson-videos.mjs --dry-run  # only list what would change
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const MAX_VIDEO_BYTES = 10 * 1024 * 1024
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'client', 'public')

export function findVideos(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...findVideos(path))
    else if (/\.(mp4|webm|mov)$/i.test(entry.name)) found.push(path)
  }
  return found
}

export function ffmpegArgs(input, output) {
  return ['-y', '-i', input, '-vf', "scale=-2:'min(480,ih)'", '-c:v', 'libx264', '-preset', 'medium', '-crf', '28',
    '-maxrate', '900k', '-bufsize', '1800k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k', '-ac', '1',
    '-movflags', '+faststart', '-f', 'mp4', output]
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dry = process.argv.includes('--dry-run')
  if (!dry && spawnSync('ffmpeg', ['-version']).status !== 0) { console.error('ffmpeg is required'); process.exit(1) }
  for (const file of findVideos(root)) {
    const before = statSync(file).size
    const label = file.slice(root.length + 1)
    if (before <= MAX_VIDEO_BYTES) { console.log(`ok      ${(before / 1048576).toFixed(1)} MB  ${label}`); continue }
    if (dry) { console.log(`would   ${(before / 1048576).toFixed(1)} MB  ${label}`); continue }
    const temp = `${file}.tmp.mp4`
    try {
      execFileSync('ffmpeg', ffmpegArgs(file, temp), { stdio: 'ignore' })
      const after = statSync(temp).size
      if (after >= before) { console.log(`kept    ${label} (re-encode was not smaller)`); continue }
      renameSync(temp, file)
      console.log(`shrunk  ${(before / 1048576).toFixed(1)} -> ${(after / 1048576).toFixed(1)} MB  ${label}`)
    } finally { if (existsSync(temp)) rmSync(temp) }
  }
}

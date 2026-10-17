import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const map = await readFile(new URL('../../components/student/kg-adventure-map.tsx', import.meta.url), 'utf8')
const levels = await readFile(new URL('../../app/student/levels/page.tsx', import.meta.url), 'utf8')
const login = await readFile(new URL('../../app/login/student/page.tsx', import.meta.url), 'utf8')
const portal = await readFile(new URL('../../components/student/shell/student-portal-shell.tsx', import.meta.url), 'utf8')
const lesson = await readFile(new URL('../../components/lessons/lesson-experience.tsx', import.meta.url), 'utf8')
const intro = await readFile(new URL('../../components/student/lesson/kg-lesson-intro.tsx', import.meta.url), 'utf8')
const picture = await readFile(new URL('../../components/student/lesson/immersive-lesson-stage.tsx', import.meta.url), 'utf8')

test('Grade 0 opens the new ABCD Level 1 while the older pilot remains separate', () => {
  assert.ok(levels.includes('if (student?.grade === 0)'))
  assert.ok(levels.includes('KGAlphabetMap'))
  assert.ok(login.includes("signedIn.student?.grade === 0 ? '/student/kg' : '/student/continue'"))
  assert.ok(portal.includes("session?.student?.grade === 0 && pathname === '/student/home'"))
  assert.ok(portal.includes("router.replace('/student/kg/map')"))
  assert.ok(map.includes('curriculum?.units.slice(0, 8)'))
  assert.ok(map.includes('LockKeyhole'))
})

test('optional lesson videos are probed as real local files and never block a lesson when absent', () => {
  assert.ok(intro.includes("method: 'HEAD'"))
  assert.ok(intro.includes("const extensions = ['webm', 'mp4']"))
  assert.ok(intro.includes('if (!available.length)'))
  assert.ok(intro.includes('onEnded={finishIntro}'))
  assert.ok(intro.includes('aria-label="Skip introduction"'))
  assert.ok(intro.includes('talkora:kg-intro:'))
  assert.ok(lesson.includes("introState !== 'done' || !activity"))
  assert.ok(lesson.includes('<KGLessonIntro'))
  assert.ok(lesson.includes('Replay Miss Julie’s story intro'))
})

test('picture-choice UI renders only READY authored pictures and pauses scoring if a file fails to load', () => {
  assert.ok(picture.includes("item.status === 'READY'"))
  assert.ok(picture.includes('/kg/pictures/'))
  assert.ok(picture.includes('onError={() => setPictureLoadFailed(true)}'))
  assert.ok(picture.includes('isJulieSpeaking || pictureLoadFailed'))
  assert.ok(picture.includes('missing picture cannot count as a successful picture activity'))
})

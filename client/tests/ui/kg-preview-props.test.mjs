import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (file) => readFile(new URL(file, import.meta.url), 'utf8')

test('school Level 1 preview keeps preview props on its existing lesson branch', async () => {
  const [page, map, lesson] = await Promise.all([
    read('../../app/school/kg-preview/level-1/page.tsx'),
    read('../../features/lessons/grades/kg/level-01/components/LevelMap.tsx'),
    read('../../features/lessons/grades/kg/level-01/LevelExperience.tsx'),
  ])
  assert.match(page, /import \{ KGAlphabetMap \} from ['"]@\/features\/lessons\/grades\/kg\/level-01\/components\/LevelMap['"]/)
  assert.match(page, /import KGLevel1Experience from ['"]@\/features\/lessons\/grades\/kg\/level-01\/LevelExperience['"]/)
  assert.doesNotMatch(page, /lazy\(|Suspense/)
  assert.match(page, /KGAlphabetMap preview onPreviewPlay/)
  assert.match(page, /<KGLevel1Experience key=\{step\} preview previewStartIndex=\{step\}/)
  assert.match(page, /step === null[\s\S]*?KGAlphabetMap preview onPreviewPlay=\{setStep\}[\s\S]*?KGLevel1Experience key=\{step\}/)
  assert.match(map, /if \(preview\) \{\s*setState\(makeKGPreviewState\(\)\)/)
  assert.match(lesson, /export default function LevelExperience/)
  assert.match(lesson, /<Suspense fallback=\{<main className="kg-alpha kg-alpha-loading"/)
  assert.match(lesson, /<KGAlphabetLesson \{\.\.\.props\} \/>/)
  assert.match(lesson, /if \(preview\) \{[\s\S]*?makeKGPreviewState\(previewStartIndex\)/)
})

test('KG Level 6 stays staff-only and previews its supplied video with audible playback recovery', async () => {
  const [page, preview, config, schoolLayout, schoolShell, assets] = await Promise.all([
    read('../../app/school/kg-preview/page.tsx'),
    read('../../features/lessons/grades/kg/level-06/Level6VideoPreview.tsx'),
    read('../../features/lessons/grades/kg/level-06/config.ts'),
    read('../../app/school/layout.tsx'),
    read('../../components/school/school-shell.tsx'),
    read('../../features/lessons/grades/kg/level-06/assets.json'),
  ])
  const assetManifest = JSON.parse(assets)
  assert.match(page, /setShowLevel6\(true\)/)
  assert.match(page, /if \(showLevel6\) \{[\s\S]*?return \([\s\S]*?<RegisteredLevelExperience/)
  assert.match(page, /<RegisteredLevelExperience[\s\S]*?level=\{6\}[\s\S]*?staffPreview/)
  assert.ok(preview.includes("const VIDEO_URL = '/lessons/kg/level-06/vowels.MOV'"))
  assert.equal(assetManifest.introVideo, '/lessons/kg/level-06/vowels.MOV')
  assert.match(preview, /<video[\s\S]*?playsInline/)
  assert.match(preview, /controls=\{false\}/)
  assert.doesNotMatch(preview, /<button/)
  assert.match(preview, /Tap the video to start Miss Julie/)
  assert.match(preview, /onClick=\{tapVideoToPlay\}/)
  assert.match(preview, /controls=\{false\}/)
  assert.doesNotMatch(preview, /<button/)
  assert.match(page, /Level 6 · Video preview/)
  assert.match(page, /document\.documentElement\.requestFullscreen\(\)/)
  assert.match(preview, /objectFit: 'cover'/)
  assert.match(config, /studentPlayable: false/)
  assert.match(config, /staffOnlyPreview: true/)
  assert.match(schoolLayout, /role === 'SCHOOL_ADMIN' \|\| role === 'TEACHER'/)
  assert.match(schoolLayout, /role === 'STUDENT'/)
  assert.match(schoolShell, /\['\/school\/kg-preview', 'KG Preview', Shapes\]/)
})

test('KG Level 6 preview plays only the intro video and omits the follow-up lesson', async () => {
  const [experience, activities] = await Promise.all([
    read('../../features/lessons/grades/kg/level-06/LevelExperience.tsx'),
    read('../../features/lessons/grades/kg/level-06/activities.ts'),
  ])
  assert.deepEqual([...activities.matchAll(/id: '(say-[^']+)'/g)].map((match) => match[1]), [])
  assert.match(experience, /Level6VideoPreview/)
  assert.doesNotMatch(experience, /AnimatedMissJulie|watchVoiceActivity|requestKGMicrophone|kg-vowel-preview/)
  assert.doesNotMatch(experience, /<button/)
})

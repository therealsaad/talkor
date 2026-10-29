import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const flowUrl = new URL('../features/lessons/grades/kg/level-05/level5-flow.ts', import.meta.url)
const { LEVEL5_LETTERS, resolveLevel5Attempt, createSubmissionGate } = await import(flowUrl.href)

test('W X Y Z progresses only after correct submissions', () => {
  assert.deepEqual([...LEVEL5_LETTERS], ['W', 'X', 'Y', 'Z'])
  assert.equal(resolveLevel5Attempt('W', 'correct').letter, 'X')
  assert.equal(resolveLevel5Attempt('X', 'correct').letter, 'Y')
  assert.equal(resolveLevel5Attempt('Y', 'correct').letter, 'Z')
  assert.equal(resolveLevel5Attempt('Z', 'correct').complete, true)
})

test('incorrect and unclear answers never advance', () => {
  for (const outcome of ['incorrect', 'unclear']) {
    assert.equal(resolveLevel5Attempt('W', outcome).retry, true)
    assert.equal(resolveLevel5Attempt('W', outcome).complete, false)
  }
})

test('microphone submission callback is claimed once', () => {
  const claim = createSubmissionGate()
  assert.equal(claim(), true)
  assert.equal(claim(), false)
})

test('Level 05 entry is gated by the real video ended event and lesson video is unmounted', () => {
  const source = fs.readFileSync(new URL('../features/lessons/grades/kg/level-05/LevelExperience.tsx', import.meta.url), 'utf8')
  assert.match(source, /onEnded=\{finishIntroduction\}/)
  assert.match(source, /controls=\{false\}/)
  assert.doesNotMatch(source, /controls\s*>/) 
  assert.match(source, /introComplete\) return/) // lesson UI remains gated
  assert.match(source, /kg-level5-introduction/)
  assert.doesNotMatch(source, /kg-level5-video-card|videoRef|toggleVideo|videoPlaying/) 
})

test('Level 05 uses the shared Miss Julie media handoff without duplicate fallback pose', () => {
  const source = fs.readFileSync(new URL('../features/lessons/grades/kg/level-05/LevelExperience.tsx', import.meta.url), 'utf8')
  assert.match(source, /level-01\/styles\/kg-level1-polish\.css/)
  assert.equal((source.match(/<AnimatedMissJulie/g) || []).length, 1)
})

test('video and letter paths are real public assets', () => {
  const source = fs.readFileSync(new URL('../features/lessons/grades/kg/level-05/LevelExperience.tsx', import.meta.url), 'utf8')
  assert.match(source, /W to Z Untitled_Scene_10-16_10_07_17_20261016160313\.mp4/) 
  assert.ok(fs.existsSync(new URL('../public/lessons/kg/level-05/W to Z Untitled_Scene_10-16_10_07_17_20261016160313.mp4', import.meta.url)))
})

test('W X Y Z use the matching local illustrations and image labels', () => {
  const source = fs.readFileSync(new URL('../features/lessons/grades/kg/level-05/LevelExperience.tsx', import.meta.url), 'utf8')
  const assets = JSON.parse(fs.readFileSync(new URL('../features/lessons/grades/kg/level-05/assets.json', import.meta.url), 'utf8'))
  const mappings = [
    ['W', 'Wolf', 'wolf.jpg'],
    ['X', 'Xylophone', 'xylophone.jpg'],
    ['Y', 'Yak', 'Yak.jpg'],
    ['Z', 'Zebra', 'zebra.jpg'],
  ]

  assert.deepEqual(assets.images, mappings.map(([, , image]) => `/kg/pictures/level-5/${image}`))
  for (const [letter, word, image] of mappings) {
    const path = `/kg/pictures/level-5/${image}`
    assert.ok(source.includes(`${letter}: { word: '${word}', picture: '${path}'`))
    assert.ok(assets.images.includes(path), `${word} is registered in the Level 05 manifest`)
    const imageBytes = fs.readFileSync(new URL(`../public${path}`, import.meta.url))
    assert.equal(imageBytes[0], 0xff, `${word} image is a JPEG`)
    assert.equal(imageBytes[1], 0xd8, `${word} image is a JPEG`)
  }
  assert.match(source, /alt=\{`\$\{lesson\.word\} for letter \$\{letter\}`\}/)
})

test('Level 05 keeps its supplied background and contains responsive animated images', () => {
  const source = fs.readFileSync(new URL('../features/lessons/grades/kg/level-05/LevelExperience.tsx', import.meta.url), 'utf8')
  const styles = fs.readFileSync(new URL('../features/lessons/grades/kg/level-05/level-05.css', import.meta.url), 'utf8')

  assert.match(styles, /level-05-jungle-background\.png/)
  assert.match(styles, /\.kg-level5-picture img\{[^}]*object-fit:contain/)
  assert.match(source, /<motion\.img/)
  assert.match(source, /reducedMotion \? \{ y: 0 \}/)
  assert.match(styles, /@media\(max-width:760px\)/)
  assert.match(styles, /@media\(max-width:390px\)/)
})

test('KG preview Level 05 link resolves to the matching Next.js route', () => {
  const preview = fs.readFileSync(new URL('../app/school/kg-preview/page.tsx', import.meta.url), 'utf8')
  const levelPage = new URL('../app/school/kg-preview/level-5/page.tsx', import.meta.url)
  const letterPage = new URL('../app/school/kg-preview/level-5/[letter]/page.tsx', import.meta.url)

  assert.match(preview, /['"]\/school\/kg-preview\/level-5['"]/) 
  assert.ok(fs.existsSync(levelPage))
  assert.ok(fs.existsSync(letterPage))
})

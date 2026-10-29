import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (name) => readFileSync(path.join(root, name), 'utf8')
const models = read('features/lessons/grades/class-01/class1-preview-scaffolds.ts')
const curriculum = read('features/lessons/grades/class-01/balbharati-curriculum.ts')
const preview = read('features/lessons/grades/class-01/Class1TeachingPreview.tsx')
const routing = read('features/lessons/LevelDraftPreview.tsx')

test('every Balbharati chapter has an original short English modeling phrase', () => {
  const chapters = [...curriculum.matchAll(/chapter:'(\d\.\d+)'/g)].map((m) => m[1])
  const examples = [...models.matchAll(/^  '(\d\.\d+)': '([^\n]+)',$/gm)]
  assert.equal(examples.length, 44)
  assert.deepEqual(examples.map((m) => m[1]).sort(), chapters.sort())
  assert.ok(examples.every((m) => m[2].length > 0 && m[2].length < 70))
})

test('staff preview shows only Class 1 draft levels, never the live student lesson', () => {
  assert.match(routing, /config\.grade === 1 && config\.level >= 2 && config\.staffOnlyPreview && !config\.studentPlayable/)
  assert.match(preview, /publicationApproved: false/)
  assert.match(preview, /requiresIndependentEducatorApproval: true/)
  assert.match(preview, /microphone is intentionally OFF/)
  assert.match(preview, /role="dialog" aria-label="Landscape preview"/)
  assert.match(preview, /requestFullscreen\(\)/)
  assert.doesNotMatch(preview, /fetch\s*\(|axios|apiClient\s*\(|getUserMedia|speechSynthesis|studentController/)
})

test('Miss Julie previews English, Hindi and Marathi with support scaffolds', () => {
  assert.match(models, /language === 'hi'/)
  assert.match(models, /language === 'mr'/)
  assert.match(models, /mode === 'MODEL'/)
  assert.match(models, /mode === 'GUIDE'/)
  assert.match(models, /mode === 'PRACTISE'/)
  assert.match(models, /हळू म्हण/)
  assert.match(models, /धीरे बोलें/)
  assert.match(preview, /src="\/miss-julie\/welcome\.webp"/)
  assert.doesNotMatch(preview, /student-avatar|cartoon-child|kid\.webp/)
})

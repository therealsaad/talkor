const assert = require('node:assert/strict')

const EXPLORER = 'client/features/curriculum-explorer/'
const STUDIO = 'client/app/school/curriculum-studio/[grade]/[level]/page.tsx'
const PREVIEW_ROUTES = [
  STUDIO,
  'client/app/school/curriculum-map/page.tsx',
  'client/app/school/classes/[id]/page.tsx',
  'client/app/school/kg-preview/page.tsx',
  ...Array.from({ length: 5 }, (_, i) => `client/app/school/kg-preview/level-${i + 1}/page.tsx`),
  ...[2, 3, 5].map(n => `client/app/school/kg-preview/level-${n}/[letter]/page.tsx`),
]
const PREVIEW_COMPONENTS = [
  'CurriculumExplorer.tsx',
  'LevelMap.tsx',
  'LevelDetail.tsx',
  'CoverageView.tsx',
  'SchoolLessonRecords.tsx',
  'TeachingPreview.tsx',
  'JulieAvatar.tsx',
  'PlanReview.tsx',
  'model.ts',
  'plan-loaders.ts',
  'route-options.ts',
  'teaching-flow.ts',
].map(file => EXPLORER + file)
const STAFF_PREVIEW_FILES = [...PREVIEW_ROUTES, ...PREVIEW_COMPONENTS]

/** Structural verification only. Backend authorization and runtime tests remain required. */
function verifyStaffPreviewBoundaries(read) {
  const studio = read(STUDIO)
  const explorer = read(EXPLORER + 'CurriculumExplorer.tsx')
  const model = read(EXPLORER + 'model.ts')

  // Route wrappers delegate inspection to the shared, authenticated component.
  // The old page-local studio API/theme check is now the full 110-entry catalog
  // comparison in verify-110-levels.cjs, plus live response identity checks here.
  assert.match(studio, /initialGrade=\{Number\(grade\)\}/, 'Studio must preserve the selected grade')
  assert.match(studio, /initialLevel=\{Number\(level\)\}/, 'Studio must preserve the selected level')
  assert.match(studio, /initialView="teaching"/, 'Studio must open the shared teaching preview')
  assert.match(studio, /if\s*\([\s\S]*?\)\s*notFound\(\)/, 'Studio must reject invalid grade/level routes')
  assert.match(explorer, /status\s*===\s*['"]authenticated['"]\s*&&\s*isEducator\(role\)/, 'Explorer must require an authenticated educator')
  assert.match(explorer, /if\s*\(!allowed\)\s*return/, 'Explorer must not render for a rejected role')
  assert.match(model, /function isEducator\([^)]*\):\s*boolean\s*\{\s*return role === ['"]TEACHER['"]\s*\|\|\s*role === ['"]SCHOOL_ADMIN['"]\s*\}/, 'Only teacher and school-admin roles may inspect the explorer')

  assert.match(explorer, /gradeLevelMapService\s*\.grade\(\s*selectedGrade\s*\)/, 'Shared explorer must read authenticated grade records')
  assert.match(explorer, /gradeLevelMapService\s*\.level\(\s*grade\s*,\s*level\s*\)/, 'Shared explorer must read authenticated level records')
  assert.match(explorer, /isValidLiveMap\(data,\s*selectedGrade\)/, 'Live grade responses must match the selected class')
  assert.match(explorer, /data\.address !== id\s*\|\|\s*data\.grade !== grade\s*\|\|\s*data\.level !== level/, 'Live level responses must match the requested address')

  for (const file of PREVIEW_ROUTES) {
    assert.match(read(file), /CurriculumExplorerPage/, `${file} must use the shared staff explorer`)
  }
  for (const file of STAFF_PREVIEW_FILES) {
    assert.doesNotMatch(read(file), /RegisteredLevelExperience|loadStudentWorkspace|<[\w.]*LevelExperience\b|<[\w.]*StudentExperience\b|getUserMedia|MediaRecorder|submitAttempt\s*\(|progressService|method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/, `${file} must not mount student runtimes, capture audio, or write learning data`)
  }
}

module.exports = { verifyStaffPreviewBoundaries, STAFF_PREVIEW_FILES }

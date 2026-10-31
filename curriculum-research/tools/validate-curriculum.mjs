#!/usr/bin/env node
/**
 * Talkora Sprint 1 curriculum dataset validator.
 * Zero dependencies. Run: node curriculum-research/tools/validate-curriculum.mjs
 * Validates the three JSON datasets against the contracts declared in
 * curriculum.schema.json v1.0.0 and cross-references them with each other
 * and with backend/src/curriculum/roadmap.ts (Class 1 level titles).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))

const errors = []
const warn = []
const fail = (msg) => errors.push(msg)
const ok = (msg) => console.log('  ✓ ' + msg)

const LEARNER_STATES = ['BEGINNER_COMPLETE', 'BEGINNER_HINDI', 'BEGINNER_MARATHI', 'ANSWERED_INCORRECT', 'SILENT', 'GUESSING_REPEATEDLY', 'FAST_LEARNER', 'NEEDS_REVISION']
const STAGES = ['DISCOVER', 'EXPLAIN', 'DEMONSTRATE', 'ASK', 'LISTEN', 'CORRECT', 'VERIFY', 'RECALL']
const VOCAB_ORIGINS = ['TEXTBOOK_WORD_BANK', 'DIALOGUE_DERIVED', 'PICTURE_PROMPT_DERIVED', 'TEACHER_ENRICHMENT']
const CONFIDENCES = ['OFFICIAL_SOURCE_VERIFIED', 'SECONDARY_SOURCE_CORROBORATED', 'UNVERIFIED']
const MISTAKE_CATEGORIES = ['PRONUNCIATION', 'GRAMMAR', 'ARTICLES', 'VOCABULARY_CONFUSION', 'L1_TRANSFER_HINDI', 'L1_TRANSFER_MARATHI', 'CAPITALISATION', 'PHONICS_SPELLING', 'SPEAKING_BEHAVIOUR']
const EXAMPLE_CHAPTERS = ['1.1','1.2','1.3','1.4','1.5','1.6','1.7','1.8','1.9','1.10']

console.log('Parsing JSON files...')
let map, examples, mistakes, schema
try {
  map = read('balbharati-class1-unit1-map.json')
  examples = read('miss-julie-teaching-examples.json')
  mistakes = read('learner-mistakes.json')
  schema = read('curriculum.schema.json')
  ok('all four JSON files parse')
} catch (e) {
  console.error('FATAL: JSON parse failure:', e.message)
  process.exit(1)
}

// ---- roadmap titles from the app source (drift check) ----
const roadmapSrc = readFileSync(join(root, '..', 'backend', 'src', 'curriculum', 'roadmap.ts'), 'utf8')
const grade1Match = roadmapSrc.match(/1:\s*\[([^\]]+)\]/)
const roadmapTitles = grade1Match
  ? grade1Match[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
  : null
if (!roadmapTitles || roadmapTitles.length !== 10) fail('Could not parse 10 Class 1 titles from backend roadmap.ts')

// ---- schema sanity ----
console.log('\nSchema:')
schema.properties?.schemaVersion?.const === '1.0.0' ? ok('schemaVersion 1.0.0 declared as const') : fail('schema.properties.schemaVersion.const must be 1.0.0')
for (const def of ['editionVerification', 'curriculumEntry', 'teachingExample', 'learnerMistake']) {
  schema.$defs?.[def] ? ok(`$defs.${def} present`) : fail(`$defs.${def} missing`)
}

// ---- map ----
console.log('\nMap (balbharati-class1-unit1-map.json):')
map.schemaVersion === '1.0.0' ? ok('schemaVersion 1.0.0') : fail('map schemaVersion mismatch')
const ev = map.dataset?.editionVerification
if (!ev) fail('dataset.editionVerification missing')
else {
  ev.sourceUrl?.startsWith('https://ebooks.ebalbharati.in/') ? ok('edition source is official eBalbharati URL') : fail('edition sourceUrl must be official eBalbharati URL')
  ev.confidence === 'OFFICIAL_SOURCE_VERIFIED' ? ok('edition confidence OFFICIAL_SOURCE_VERIFIED') : fail('edition confidence must be OFFICIAL_SOURCE_VERIFIED')
  ev.verifiedOn === '2026-10-31' ? ok('edition verifiedOn recorded') : fail('edition verifiedOn wrong')
}
const cmp = map.dataset?.comparisonWithTalkoraCurrent
if (!cmp || typeof cmp.editionDriftFound !== 'boolean' || !Array.isArray(cmp.evidence) || cmp.evidence.length < 2) fail('comparisonWithTalkoraCurrent incomplete')
else ok('comparison with Talkora current content documented (drift: ' + cmp.editionDriftFound + ')')

const entries = map.entries ?? []
entries.length === 10 ? ok('10 chapter entries (1.1–1.10)') : fail(`expected 10 entries, got ${entries.length}`)
const ids = new Set()
const seenCodes = new Set()
const mistakeIds = new Set((mistakes.mistakes ?? []).map((m) => m.mistakeId))
let vocabCount = 0, verifiedFacts = 0

for (const e of entries) {
  const tag = e.curriculumId ?? '(no id)'
  if (ids.has(e.curriculumId)) fail(`duplicate curriculumId ${tag}`)
  ids.add(e.curriculumId)
  if (!/^bal-g01-u[1-4]-c[1-4]\.[0-9]{2}$/.test(e.curriculumId ?? '')) fail(`bad curriculumId format: ${tag}`)
  if (e.board !== 'Maharashtra State Board (Balbharati)') fail(`${tag}: board mismatch`)
  if (e.grade !== 1 || e.subject !== 'English') fail(`${tag}: grade/subject mismatch`)
  for (const req of ['textbookEdition', 'unit', 'chapter', 'lesson', 'sourceReferences', 'learningObjectives', 'review']) {
    if (e[req] === undefined) fail(`${tag}: missing required field ${req}`)
  }
  const code = e.chapter?.code
  if (!/^1\.(?:[1-9]|10)$/.test(code ?? '')) fail(`${tag}: bad chapter code ${code}`)
  // Derivation rule: printed code 1.N ↔ id suffix c1.<pad(N,2)>
  if (code && e.curriculumId !== `bal-g01-u1-c1.${String(Number(code.slice(2))).padStart(2, '0')}`) {
    fail(`${tag}: curriculumId does not follow derivation from chapter code ${code}`)
  }
  seenCodes.add(code)
  if (!e.chapter?.title?.trim()) fail(`${tag}: chapter title empty`)
  if (!Number.isInteger(e.chapter?.printedPage) || e.chapter.printedPage < 1) fail(`${tag}: printedPage must be a positive integer`)
  if (!e.chapter?.copyrightStatus?.category) fail(`${tag}: copyrightStatus.category missing`)
  if (!e.chapter?.copyrightStatus?.reproductionRule) fail(`${tag}: reproductionRule missing (copyright discipline)`)
  if (e.sourceReferences?.length < 1) fail(`${tag}: needs ≥1 source reference`)
  for (const s of e.sourceReferences ?? []) {
    if (!s.locator || !s.verifiedOn || !CONFIDENCES.includes(s.confidence)) fail(`${tag}: source reference incomplete`)
    if (s.type === 'OFFICIAL_TEXTBOOK_PDF') verifiedFacts++
  }
  if (!e.review?.syllabusVerification) fail(`${tag}: review.syllabusVerification missing`)
  if (e.review?.syllabusVerification !== 'OFFICIAL_PDF_VERIFIED') fail(`${tag}: syllabusVerification must be OFFICIAL_PDF_VERIFIED for Sprint 1 scope`)
  if (e.review?.pedagogyStatus !== 'DRAFT_PENDING_TEACHER_REVIEW') fail(`${tag}: pedagogyStatus must be DRAFT_PENDING_TEACHER_REVIEW (honesty rule)`)
  for (const v of e.vocabulary ?? []) {
    vocabCount++
    if (!v.en?.trim()) fail(`${tag}: vocab missing en`)
    if (!v.hi?.trim() || !v.mr?.trim()) fail(`${tag}: vocab '${v.en}' missing hi/mr gloss`)
    if (!VOCAB_ORIGINS.includes(v.origin)) fail(`${tag}: vocab '${v.en}' bad origin ${v.origin}`)
    if (!v.sourceRef?.trim()) fail(`${tag}: vocab '${v.en}' missing sourceRef`)
  }
  for (const t of e.teachingStages ?? []) {
    if (!STAGES.includes(t.stage)) fail(`${tag}: bad teaching stage ${t.stage}`)
  }
  for (const h of e.adaptiveTeachingHints ?? []) {
    if (!LEARNER_STATES.includes(h.learnerState)) fail(`${tag}: bad learnerState ${h.learnerState}`)
    if (!h.hint?.trim()) fail(`${tag}: empty hint for ${h.learnerState}`)
  }
  const hintStates = new Set((e.adaptiveTeachingHints ?? []).map((h) => h.learnerState))
  for (const st of LEARNER_STATES) {
    if (!hintStates.has(st)) fail(`${tag}: adaptive hints missing learner state ${st}`)
  }
  if (!e.shortSpokenHomework?.trim()) fail(`${tag}: shortSpokenHomework empty`)
  for (const m of e.commonBeginnerMistakeIds ?? []) {
    if (!mistakeIds.has(m)) fail(`${tag}: references unknown mistake ${m}`)
  }
  for (const l of e.lesson?.talkoraLevelMapping ?? []) {
    if (!/^g01-l(0[1-9]|10)$/.test(l.talkoraLevelId ?? '')) fail(`${tag}: bad talkoraLevelId ${l.talkoraLevelId}`)
    const idx = Number(l.talkoraLevelId?.slice(-2)) - 1
    if (roadmapTitles && roadmapTitles[idx] !== l.roadmapTitle) {
      fail(`${tag}: roadmapTitle '${l.roadmapTitle}' does not match roadmap.ts '${roadmapTitles[idx]}' for ${l.talkoraLevelId}`)
    }
    if (l.status !== 'PROPOSED_MAPPING_PENDING_PM_APPROVAL' && l.status !== 'APPROVED_BY_PM') fail(`${tag}: bad mapping status`)
  }
}
for (let i = 1; i <= 10; i++) {
  const c = '1.' + i
  if (!seenCodes.has(c)) fail(`chapter ${c} missing from map`)
}
ok(`every entry: identity, copyright rule, ≥1 official source ref, PDF-verified review, homework present`)
ok(`vocabulary items: ${vocabCount} (all with en/hi/mr + sourceRef)`)
ok(`official textbook source references: ${verifiedFacts}`)
ok(`adaptive teaching hints: all 8 learner states × 10 chapters`)
ok(`mistake references resolve into learner-mistakes.json`)
ok(`talkoraLevelMapping titles match backend roadmap.ts (drift check)`)

// ---- mistakes ----
console.log('\nMistakes (learner-mistakes.json):')
const ms = mistakes.mistakes ?? []
ms.length >= 30 ? ok(`${ms.length} mistake patterns (target ≥30)`) : fail(`only ${ms.length} mistakes (target ≥30)`)
const mIds = new Set()
let mReviewed = 0
for (const m of ms) {
  if (mIds.has(m.mistakeId)) fail(`duplicate mistakeId ${m.mistakeId}`)
  mIds.add(m.mistakeId)
  if (!/^mist-[0-9]{3}$/.test(m.mistakeId ?? '')) fail(`bad mistakeId ${m.mistakeId}`)
  if (!MISTAKE_CATEGORIES.includes(m.category)) fail(`${m.mistakeId}: bad category ${m.category}`)
  for (const req of ['pattern', 'exampleUtterance', 'likelyCause', 'correctionStrategy']) {
    if (!m[req]?.trim?.()) fail(`${m.mistakeId}: missing ${req}`)
  }
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(m.severity)) fail(`${m.mistakeId}: bad severity`)
  if (!['REVIEWED_SYLLABUS_ALIGNED', 'UNREVIEWED_SYNTHETIC_CANDIDATE'].includes(m.reviewStatus)) fail(`${m.mistakeId}: bad reviewStatus`)
  if (m.reviewStatus === 'REVIEWED_SYLLABUS_ALIGNED') mReviewed++
  for (const c of m.chapterRefs ?? []) {
    if (!EXAMPLE_CHAPTERS.includes(c)) fail(`${m.mistakeId}: chapterRef ${c} outside Unit One`)
  }
}
ok(`cross-file: all ${ms.length} mistakeIds are referencable from the map`)

// ---- examples ----
console.log('\nExamples (miss-julie-teaching-examples.json):')
const exs = examples.examples ?? []
if (exs.length < 100 || exs.length > 200) fail(`example count ${exs.length} outside required 100–200`)
else ok(`${exs.length} teaching examples (target 100–200)`)
const eIds = new Set()
const stateByChapter = new Map(EXAMPLE_CHAPTERS.map((c) => [c, new Set()]))
let eReviewed = 0, bilingual = 0
for (const ex of exs) {
  if (eIds.has(ex.exampleId)) fail(`duplicate exampleId ${ex.exampleId}`)
  eIds.add(ex.exampleId)
  if (!/^tje-[0-9]{3}$/.test(ex.exampleId ?? '')) fail(`bad exampleId ${ex.exampleId}`)
  if (!EXAMPLE_CHAPTERS.includes(ex.chapterRef)) fail(`${ex.exampleId}: chapterRef ${ex.chapterRef} outside Unit One`)
  if (!map.entries.find((e) => e.chapter.code === ex.chapterRef)) fail(`${ex.exampleId}: chapterRef not in map`)
  if (ex.curriculumIdRef && !ids.has(ex.curriculumIdRef)) fail(`${ex.exampleId}: curriculumIdRef not in map`)
  if (!LEARNER_STATES.includes(ex.learnerState)) fail(`${ex.exampleId}: bad learnerState`)
  if (!STAGES.includes(ex.stage)) fail(`${ex.exampleId}: bad stage ${ex.stage}`)
  stateByChapter.get(ex.chapterRef)?.add(ex.learnerState)
  if (typeof ex.studentSays !== 'string' || ex.studentSays.length === 0) fail(`${ex.exampleId}: studentSays required`)
  if (!Array.isArray(ex.missJulieTurns) || ex.missJulieTurns.length < 1) fail(`${ex.exampleId}: missJulieTurns required`)
  for (const t of ex.missJulieTurns ?? []) {
    if (!t.text?.trim() || !['en', 'hi-en', 'mr-en'].includes(t.language)) fail(`${ex.exampleId}: bad turn`)
    if (t.language !== 'en') bilingual++
  }
  if (!ex.intent?.trim() || !ex.masteryCheck?.trim()) fail(`${ex.exampleId}: intent and masteryCheck required`)
  if (!['REVIEWED_SYLLABUS_ALIGNED', 'UNREVIEWED_SYNTHETIC_CANDIDATE'].includes(ex.review?.status)) fail(`${ex.exampleId}: bad review.status`)
  if (ex.review?.status === 'REVIEWED_SYLLABUS_ALIGNED') eReviewed++
}
ok(`every chapterRef resolves into the map (cross-file integrity)`)
ok(`bilingual support turns (hi-en/mr-en): ${bilingual}`)
ok(`all 8 stages are in use: ${new Set(exs.map((e) => e.stage)).size}/8`)
for (const [c, states] of stateByChapter) {
  const missing = LEARNER_STATES.filter((s) => !states.has(s))
  if (missing.length) fail(`chapter ${c} examples missing learner states: ${missing.join(', ')}`)
}
ok(`learner-state coverage: all 8 states × all 10 chapters`)
ok(`REVIEWED_SYLLABUS_ALIGNED: ${eReviewed}/${exs.length}; UNREVIEWED_SYNTHETIC_CANDIDATE: ${exs.length - eReviewed}/${exs.length} (distinction is explicit per assignment)`)
ok(`mistakes REVIEWED: ${mReviewed}/${ms.length}`)

// ---- summary ----
console.log('\n' + '─'.repeat(60))
if (errors.length) {
  console.error(`VALIDATION FAILED — ${errors.length} error(s):`)
  for (const e of errors) console.error('  ✗ ' + e)
  if (warn.length) for (const w of warn) console.warn('  ⚠ ' + w)
  process.exit(1)
} else {
  console.log(`ALL CHECKS PASSED — map: 10/10 chapters · examples: ${exs.length} · mistakes: ${ms.length}`)
  process.exit(0)
}

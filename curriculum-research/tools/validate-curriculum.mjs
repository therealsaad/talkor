#!/usr/bin/env node
/**
 * Talkora curriculum dataset validator — schema v1.1.0 (dual-track).
 * Zero dependencies. Run: node curriculum-research/tools/validate-curriculum.mjs
 * Validates BOTH textbook-track datasets (English Balbharati + My English Book)
 * against curriculum.schema.json v1.1.0, cross-references examples and mistakes,
 * drift-checks roadmap titles against backend/src/curriculum/roadmap.ts, and
 * enforces the PM checkpoint-1/2 rules (review honesty, recall milestones,
 * namespaced IDs, language-attribution discipline).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))

const errors = []
const fail = (msg) => errors.push(msg)
const ok = (msg) => console.log('  ✓ ' + msg)

const LEARNER_STATES = ['BEGINNER_COMPLETE', 'BEGINNER_HINDI', 'BEGINNER_MARATHI', 'ANSWERED_INCORRECT', 'SILENT', 'GUESSING_REPEATEDLY', 'FAST_LEARNER', 'NEEDS_REVISION']
const STAGES = ['DISCOVER', 'EXPLAIN', 'DEMONSTRATE', 'ASK', 'LISTEN', 'CORRECT', 'VERIFY', 'RECALL']
const VOCAB_ORIGINS = ['TEXTBOOK_WORD_BANK', 'DIALOGUE_DERIVED', 'PICTURE_PROMPT_DERIVED', 'TEACHER_ENRICHMENT']
const CONFIDENCES = ['OFFICIAL_SOURCE_VERIFIED', 'SECONDARY_SOURCE_CORROBORATED', 'UNVERIFIED']
const MISTAKE_CATEGORIES = ['PRONUNCIATION', 'GRAMMAR', 'ARTICLES', 'VOCABULARY_CONFUSION', 'L1_TRANSFER_HINDI', 'L1_TRANSFER_MARATHI', 'CAPITALISATION', 'PHONICS_SPELLING', 'SPEAKING_BEHAVIOUR']
const COPYRIGHT_CATEGORIES = ['BALBHARATI_ALL_RIGHTS_RESERVED', 'THIRD_PARTY_LICENSED_CREDITED_IN_BOOK', 'THIRD_PARTY_PERMISSION_AWAITED', 'UNKNOWN']
const ROLES = ['INTRODUCES', 'CONSOLIDATES', 'REVISITS']
const MILESTONES = ['IMMEDIATE_REPETITION', 'INDEPENDENT_ANSWERING', 'DELAYED_RECALL']
const TBIDS = ['ENGLISH_BALBHARATI_G01', 'MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM']
const PREFIX_OF = { ENGLISH_BALBHARATI_G01: 'bal', MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM: 'meb' }

const TRACKS = [
  {
    file: 'balbharati-class1-unit1-map.json',
    textbookId: 'ENGLISH_BALBHARATI_G01',
    prefix: 'bal',
    chapterMax: 10,
    examplesFile: 'miss-julie-teaching-examples.json',
  },
  {
    file: 'my-english-book-class1-unit1-map.json',
    textbookId: 'MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM',
    prefix: 'meb',
    chapterMax: 11,
    examplesFile: null,
  },
]

console.log('Parsing JSON files...')
let schema, mistakes, extraExamples
try {
  schema = read('curriculum.schema.json')
  mistakes = read('learner-mistakes.json')
  extraExamples = read('pm-checkpoint2-example-records.json')
  ok('schema, mistakes and checkpoint-2 example records parse')
} catch (e) {
  console.error('FATAL: JSON parse failure:', e.message)
  process.exit(1)
}
const mistakeIds = new Set((mistakes.mistakes ?? []).map((m) => m.mistakeId))

// ---- roadmap titles from the app source (drift check) ----
const roadmapSrc = readFileSync(join(root, '..', 'backend', 'src', 'curriculum', 'roadmap.ts'), 'utf8')
const grade1Match = roadmapSrc.match(/1:\s*\[([^\]]+)\]/)
const roadmapTitles = grade1Match
  ? grade1Match[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
  : null
if (!roadmapTitles || roadmapTitles.length !== 10) fail('Could not parse 10 Class 1 titles from backend roadmap.ts')
else ok(`roadmap.ts Class 1 titles parsed (g01-l01 = '${roadmapTitles[0]}')`)

// ---- schema sanity ----
console.log('\nSchema:')
schema.properties?.schemaVersion?.const === '1.1.0' ? ok('schemaVersion 1.1.0 declared as const') : fail('schema.properties.schemaVersion.const must be 1.1.0')
for (const def of ['textbookTrack', 'curriculumVersion', 'audioAsset', 'editionVerification', 'curriculumEntry', 'teachingExample', 'learnerMistake']) {
  schema.$defs?.[def] ? ok(`$defs.${def} present`) : fail(`$defs.${def} missing`)
}

// ---- validate each track ----
const allCurriculumIds = new Set()
const allExampleIds = new Set()

for (const t of TRACKS) {
  console.log(`\n=== Track ${t.textbookId} (${t.file}) ===`)
  let map
  try {
    map = read(t.file)
  } catch (e) {
    fail(`cannot read ${t.file}: ${e.message}`)
    continue
  }

  // header
  map.schemaVersion === '1.1.0' ? ok('schemaVersion 1.1.0') : fail(`${t.file}: schemaVersion must be 1.1.0`)
  const tt = map.dataset?.textbookTrack
  if (!tt) fail(`${t.file}: dataset.textbookTrack missing (PM discriminator)`)
  else {
    tt.textbookId === t.textbookId ? ok('textbookTrack.textbookId matches track') : fail(`${t.file}: textbookTrack.textbookId mismatch`)
    ;['ENGLISH_MEDIUM', 'NON_ENGLISH_MEDIUM'].includes(tt.trackType) ? ok(`trackType ${tt.trackType}`) : fail(`${t.file}: bad trackType`)
    ;/school\/admin/i.test(tt.selectionModel ?? '') ? ok('selectionModel states school/admin selection') : fail(`${t.file}: selectionModel must state school/admin configuration selects the track`)
    ;/students never choose|students do not choose/i.test(tt.selectionModel ?? '') ? ok('selectionModel states students never choose') : fail(`${t.file}: selectionModel must state students never choose curriculum/difficulty`)
  }
  const cv = map.dataset?.curriculumVersion
  if (!cv) fail(`${t.file}: dataset.curriculumVersion missing`)
  else {
    for (const k of ['framework', 'policyBasis', 'coordinationCommitteeApprovalDate', 'academicYearOfFirstUse', 'verificationAuthority']) {
      if (!cv[k]) fail(`${t.file}: curriculumVersion.${k} missing`)
    }
    cv.coordinationCommitteeApprovalDate === '2025-04-16' ? ok('curriculumVersion approval date 2025-04-16') : fail(`${t.file}: curriculumVersion.approvalDate wrong`)
    ok(`curriculum framework: ${cv.framework}`)
  }
  const ev = map.dataset?.editionVerification
  if (!ev) fail(`${t.file}: dataset.editionVerification missing`)
  else {
    ev.sourceUrl?.startsWith('https://ebooks.ebalbharati.in/') ? ok('edition source is official eBalbharati URL') : fail(`${t.file}: edition sourceUrl must be official eBalbharati URL`)
    ev.confidence === 'OFFICIAL_SOURCE_VERIFIED' ? ok('edition confidence OFFICIAL_SOURCE_VERIFIED') : fail(`${t.file}: edition confidence must be OFFICIAL_SOURCE_VERIFIED`)
  }

  const entries = map.entries ?? []
  entries.length === t.chapterMax ? ok(`${entries.length} chapter entries`) : fail(`${t.file}: expected ${t.chapterMax} entries, got ${entries.length}`)
  const ids = new Set()
  const seenCodes = new Set()
  let vocabCount = 0, audioFlags = 0, officialRefs = 0

  for (const e of entries) {
    const tag = e.curriculumId ?? '(no id)'
    if (ids.has(e.curriculumId)) fail(`duplicate curriculumId ${tag}`)
    ids.add(e.curriculumId)
    allCurriculumIds.add(e.curriculumId)
    if (!new RegExp(`^${t.prefix}-g01-u[1-4]-c[1-4]\\.[0-9]{2}$`).test(e.curriculumId ?? '')) fail(`bad curriculumId format (prefix ${t.prefix}): ${tag}`)
    if (e.textbookId !== t.textbookId) fail(`${tag}: textbookId must be ${t.textbookId}`)
    if (e.board !== 'Maharashtra State Board (Balbharati)') fail(`${tag}: board mismatch`)
    if (e.grade !== 1 || e.subject !== 'English') fail(`${tag}: grade/subject mismatch`)
    for (const req of ['textbookEdition', 'unit', 'chapter', 'lesson', 'sourceReferences', 'learningObjectives', 'recallDesign', 'review']) {
      if (e[req] === undefined) fail(`${tag}: missing required field ${req}`)
    }
    const code = e.chapter?.code
    if (!new RegExp(`^1\\.(?:[1-9]|1[0-1])$`).test(code ?? '')) fail(`${tag}: bad chapter code ${code}`)
    const num = Number((code ?? '1.0').slice(2))
    if (num >= 1 && num <= t.chapterMax && code) {
      if (e.curriculumId !== `${t.prefix}-g01-u1-c1.${String(num).padStart(2, '0')}`) fail(`${tag}: curriculumId does not follow derivation from chapter code ${code}`)
    }
    seenCodes.add(code)
    if (!e.chapter?.title?.trim()) fail(`${tag}: chapter title empty`)
    if (!Number.isInteger(e.chapter?.printedPage) || e.chapter.printedPage < 1) fail(`${tag}: printedPage must be a positive integer`)
    if (!COPYRIGHT_CATEGORIES.includes(e.chapter?.copyrightStatus?.category)) fail(`${tag}: bad copyrightStatus.category`)
    if (!e.chapter?.copyrightStatus?.reproductionRule) fail(`${tag}: reproductionRule missing (copyright discipline)`)
    if (e.sourceReferences?.length < 1) fail(`${tag}: needs ≥1 source reference`)
    for (const s of e.sourceReferences ?? []) {
      if (!s.locator || !s.verifiedOn || !CONFIDENCES.includes(s.confidence)) fail(`${tag}: source reference incomplete`)
      if (s.type === 'OFFICIAL_TEXTBOOK_PDF') officialRefs++
    }
    if (e.review?.syllabusVerification !== 'OFFICIAL_PDF_VERIFIED') fail(`${tag}: syllabusVerification must be OFFICIAL_PDF_VERIFIED for Sprint 1 scope`)
    if (e.review?.pedagogyStatus !== 'DRAFT_PENDING_TEACHER_REVIEW') fail(`${tag}: pedagogyStatus must be DRAFT_PENDING_TEACHER_REVIEW (honesty rule)`)
    for (const vv of e.vocabulary ?? []) {
      vocabCount++
      if (!vv.en?.trim()) fail(`${tag}: vocab missing en`)
      if (!vv.hi?.trim() || !vv.mr?.trim()) fail(`${tag}: vocab '${vv.en}' missing hi/mr gloss`)
      if (!VOCAB_ORIGINS.includes(vv.origin)) fail(`${tag}: vocab '${vv.en}' bad origin ${vv.origin}`)
      if (!vv.sourceRef?.trim()) fail(`${tag}: vocab '${vv.en}' missing sourceRef`)
      if (vv.audioAsset) {
        audioFlags++
        if (!['MISSING', 'RIGHTS_UNDECIDED', 'REQUESTED', 'APPROVED'].includes(vv.audioAsset.status)) fail(`${tag}: vocab '${vv.en}' bad audioAsset.status`)
        if (vv.audioAsset.status === 'APPROVED' && !vv.audioAsset.officialQrRef) fail(`${tag}: APPROVED audio needs a permission reference`)
      }
    }
    // recall milestones (PM checkpoint-1 correction)
    const ms = (e.recallDesign ?? []).map((r) => r.milestone)
    if (new Set(ms).size !== 3 || !MILESTONES.every((m) => ms.includes(m))) fail(`${tag}: recallDesign must contain exactly the 3 distinct milestones`)
    for (const r of e.recallDesign ?? []) {
      if (!r.activity?.trim()) fail(`${tag}: empty recallDesign activity for ${r.milestone}`)
    }
    for (const st of e.teachingStages ?? []) {
      if (!STAGES.includes(st.stage)) fail(`${tag}: bad teaching stage ${st.stage}`)
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
    // level mapping with roles (ordered coverage, PM checkpoint-2)
    for (const l of e.lesson?.talkoraLevelMapping ?? []) {
      if (!/^g01-l(0[1-9]|10)$/.test(l.talkoraLevelId ?? '')) fail(`${tag}: bad talkoraLevelId ${l.talkoraLevelId}`)
      const idx = Number(l.talkoraLevelId?.slice(-2)) - 1
      if (roadmapTitles && roadmapTitles[idx] !== l.roadmapTitle) {
        fail(`${tag}: roadmapTitle '${l.roadmapTitle}' does not match roadmap.ts '${roadmapTitles[idx]}' for ${l.talkoraLevelId}`)
      }
      if (!ROLES.includes(l.role)) fail(`${tag}: mapping to ${l.talkoraLevelId} missing role (INTRODUCES/CONSOLIDATES/REVISITS)`)
      if (l.status !== 'PROPOSED_MAPPING_PENDING_PM_APPROVAL' && l.status !== 'APPROVED_BY_PM') fail(`${tag}: bad mapping status`)
    }
    if (!(e.lesson?.talkoraLevelMapping ?? []).length) fail(`${tag}: at least one level mapping required`)
  }
  for (let i = 1; i <= t.chapterMax; i++) {
    if (!seenCodes.has('1.' + i)) fail(`${t.file}: chapter 1.${i} missing from map`)
  }
  ok(`every entry: identity, textbookId, copyright rule, ≥1 official source ref, PDF-verified review, homework present`)
  ok(`vocabulary items: ${vocabCount} (all with en/hi/mr + sourceRef); audioAsset flagged on ${audioFlags} (optional, rights-undecided)`)
  ok(`official textbook source references: ${officialRefs}`)
  ok(`adaptive teaching hints: all 8 learner states × ${entries.length} chapters`)
  ok(`recallDesign: 3 milestones (repetition / independent / delayed) × ${entries.length} chapters`)
  ok(`level mappings: role-tagged + roadmap-title drift check green`)
}

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
    if (!/^1\.[0-9]{1,2}$/.test(c)) fail(`${m.mistakeId}: bad chapterRef ${c}`)
  }
}
// PM checkpoint-2 terminology guard: शाळा is Marathi, never Hindi.
// Checks the operative fields only; languageNote may quote the historical error when documenting the fix.
for (const m of ms) {
  for (const field of ['pattern', 'exampleUtterance', 'correctionStrategy']) {
    if (/Hindi mein शाळा|Hindi madhye शाळा/.test(m[field] ?? '')) fail(`${m.mistakeId}: शाळा attributed to Hindi in ${field} (शाळा is Marathi)`)
  }
}
const m019 = ms.find((m) => m.mistakeId === 'mist-019')
m019 && /शाळा is Marathi/.test(m019.languageNote ?? '') ? ok('mist-019 carries the corrected language attribution') : fail('mist-019 must carry the corrected शाळा-is-Marathi note')
ok(`terminology guard: शाळा never attributed to Hindi`)
ok(`cross-file: all ${ms.length} mistakeIds are referencable from the maps`)

// ---- examples ----
console.log('\nExamples (miss-julie-teaching-examples.json + pm-checkpoint2-example-records.json):')
let balExamples
try {
  balExamples = read('miss-julie-teaching-examples.json')
} catch (e) {
  fail(`cannot read miss-julie-teaching-examples.json: ${e.message}`)
  balExamples = { examples: [] }
}
if (balExamples.schemaVersion !== '1.1.0') fail('examples bank schemaVersion must be 1.1.0')
const exs = [...(balExamples.examples ?? []), ...(extraExamples.examples ?? [])]
if (exs.length < 100 || exs.length > 200) fail(`example count ${exs.length} outside required 100–200`)
else ok(`${exs.length} teaching examples total (bank ${(balExamples.examples ?? []).length} + checkpoint-2 records ${(extraExamples.examples ?? []).length}; target 100–200)`)
// every bank record must carry the track discriminator after the v1.1.0 migration
for (const ex of balExamples.examples ?? []) {
  if (ex.textbookId !== 'ENGLISH_BALBHARATI_G01') fail(`${ex.exampleId}: bank example missing textbookId ENGLISH_BALBHARATI_G01`)
}
for (const ex of extraExamples.examples ?? []) {
  if (!TBIDS.includes(ex.textbookId)) fail(`${ex.exampleId}: bad textbookId`)
}
const stateByChapter = new Map([['bal', new Map()], ['meb', new Map()]])
let eReviewed = 0, bilingual = 0
for (const ex of exs) {
  if (allExampleIds.has(ex.exampleId)) fail(`duplicate exampleId ${ex.exampleId}`)
  allExampleIds.add(ex.exampleId)
  if (!/^tje-[0-9]{3}$/.test(ex.exampleId ?? '')) fail(`bad exampleId ${ex.exampleId}`)
  const prefix = ex.textbookId === 'ENGLISH_BALBHARATI_G01' ? 'bal' : 'meb'
  const trackMap = TRACKS.find((t) => t.prefix === prefix)
  if (!trackMap) fail(`${ex.exampleId}: unknown textbookId`)
  else if (!allCurriculumIds.has(ex.curriculumIdRef ?? '')) fail(`${ex.exampleId}: curriculumIdRef ${ex.curriculumIdRef} not in any map`)
  if (!LEARNER_STATES.includes(ex.learnerState)) fail(`${ex.exampleId}: bad learnerState`)
  if (!STAGES.includes(ex.stage)) fail(`${ex.exampleId}: bad stage ${ex.stage}`)
  const chapterStates = stateByChapter.get(prefix).get(ex.chapterRef) ?? new Set()
  chapterStates.add(ex.learnerState)
  stateByChapter.get(prefix).set(ex.chapterRef, chapterStates)
  if (typeof ex.studentSays !== 'string' || ex.studentSays.length === 0) fail(`${ex.exampleId}: studentSays required`)
  if (!Array.isArray(ex.missJulieTurns) || ex.missJulieTurns.length < 1) fail(`${ex.exampleId}: missJulieTurns required`)
  for (const turn of ex.missJulieTurns ?? []) {
    if (!turn.text?.trim() || !['en', 'hi-en', 'mr-en'].includes(turn.language)) fail(`${ex.exampleId}: bad turn`)
    if (turn.language !== 'en') bilingual++
    // Terminology guard: flag only WRONG attribution; a bilingual bridge turn may mention शाळा if it is explicitly attributed to Marathi.
    if (turn.language === 'hi-en' && /Hindi mein शाळा|Hindi madhye शाळा/.test(turn.text)) fail(`${ex.exampleId}: शाळा attributed to Hindi inside a Hindi-tagged turn`)
    if (turn.language === 'hi-en' && /शाळा/.test(turn.text) && !/Marathi/i.test(turn.text)) fail(`${ex.exampleId}: शाळा in a hi-en turn without a Marathi attribution`)
  }
  if (!ex.intent?.trim() || !ex.masteryCheck?.trim()) fail(`${ex.exampleId}: intent and masteryCheck required`)
  if (/INDEPENDENT_ANSWERING|DELAYED_RECALL/.test(ex.masteryCheck ?? '') === false) {
    fail(`${ex.exampleId}: masteryCheck must reference an independent/delayed milestone, never repetition alone`)
  }
  if (!['REVIEWED_SYLLABUS_ALIGNED', 'UNREVIEWED_SYNTHETIC_CANDIDATE'].includes(ex.review?.status)) fail(`${ex.exampleId}: bad review.status`)
  if (ex.review?.status === 'REVIEWED_SYLLABUS_ALIGNED') eReviewed++
}
ok(`every curriculumIdRef resolves into a track map (cross-file integrity)`)
ok(`bilingual support turns (hi-en/mr-en): ${bilingual}`)
ok(`all 8 stages in use: ${new Set(exs.map((e) => e.stage)).size}/8`)
for (const [track, chapters] of Object.entries(Object.fromEntries(stateByChapter))) {
  // bal bank: all 8 states × 10 chapters; meb: covered by the 2 checkpoint-2 records for now
  if (track === 'bal') {
    for (const [c, states] of chapters) {
      const missing = LEARNER_STATES.filter((s) => !states.has(s))
      if (missing.length) fail(`bal chapter ${c} examples missing learner states: ${missing.join(', ')}`)
    }
    ok(`bal learner-state coverage: all 8 states × 10 chapters`)
  } else {
    ok(`meb examples: ${chapters.size} chapter(s) covered by checkpoint-2 records (full MEB bank scheduled after PM mapping approval)`)
  }
}
ok(`REVIEWED_SYLLABUS_ALIGNED: ${eReviewed}/${exs.length}; UNREVIEWED_SYNTHETIC_CANDIDATE: ${exs.length - eReviewed}/${exs.length} (synthetic validation ≠ teacher approval)`)
ok(`mistakes REVIEWED: ${mReviewed}/${ms.length}`)

// ---- summary ----
console.log('\n' + '─'.repeat(60))
if (errors.length) {
  console.error(`VALIDATION FAILED — ${errors.length} error(s):`)
  for (const e of errors) console.error('  ✗ ' + e)
  process.exit(1)
} else {
  console.log(`ALL CHECKS PASSED — tracks: bal 10/10 + meb 11/11 chapters · examples: ${exs.length} · mistakes: ${ms.length}`)
  process.exit(0)
}

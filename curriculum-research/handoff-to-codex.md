# Handoff to Codex — Curriculum Intelligence (Sprint 1)

**From:** Z.ai Curriculum Agent | **Date:** 2026-10-31 | **Branch:** `feature/ai-curriculum` (local, not pushed)
**Touch rule honored:** no application code was modified — everything in this handoff lives in `curriculum-research/` and is additive-only.

---

## 1. What you are receiving

| File | What it is | Status |
|---|---|---|
| `curriculum.schema.json` | The data contract (JSON Schema draft-07) for all three dataset shapes | v1.0.0 — **needs PM sign-off** |
| `balbharati-class1-unit1-map.json` | 10 syllabus-verified curriculum entries for English Balbharati Grade One Unit One (chapters 1.1–1.10, printed pp. 1–17 of the 2025 edition) | Syllabus facts read directly from the official PDF (2026-10-31); pedagogy fields are agent drafts pending teacher review |
| `miss-julie-teaching-examples.json` | 133 teaching exchanges covering all 8 learner states × 10 chapters, with explicit reviewed/synthetic flags | 122 agent-reviewed for syllabus alignment / 11 synthetic candidates; **none human-approved** |
| `learner-mistakes.json` | 38 beginner mistake patterns (incl. Hindi/Marathi L1 transfer) with Miss Julie correction strategies | 27 reviewed / 11 candidates |
| `curriculum-research.md` | The full research report: edition verification, verified TOC (all 4 units), chapter analysis, comparison with the repo's current content, copyright position | — |
| `dataset-sources.md` | License/suitability audit of external datasets (Common Voice, AI4Bharat, EFCAMDAT, CMU Kids) | — |
| `curriculum-validation-report.md` | Validation results + what is *not* validated | — |
| `tools/validate-curriculum.mjs` | Zero-dependency validator (run: `node curriculum-research/tools/validate-curriculum.mjs`) | Passing |

## 2. Key facts you should not have to rediscover

- **Edition:** *English Balbharati — Grade One*, 2025, approved 2025-04-16 for AY 2025-26. Official PDF: https://ebooks.ebalbharati.in/pdfs/103050001.pdf. Unit One = printed pp. 1–17, chapters 1.1–1.10.
- **No edition drift:** the existing `class1-first-day-poem.ts` matches the official page-1 word bank 12/12. The generic `class-1/lessons.ts` starters are self-labelled enrichment, not syllabus claims.
- **Copyright:** the book reserves all rights; 1.1 and 1.9 are third-party poems credited in-book. The datasets therefore contain **titles, page numbers, word banks, patterns and Talkora-original pedagogy only — zero reproduced passage text.** Keep it that way in runtime content.
- **Addressing:** `curriculumId` = `bal-g01-u1-c1.NN` (NN zero-padded; printed 1.1 → `c1.01`). `talkoraLevelId` addresses reuse the existing `g01-lNN` scheme from `level-map-contract.ts` — no new addressing system.

## 3. Suggested integration path (when the PM approves the schema)

1. **Do not** wire anything into controllers, level-map, auth, progress, sessions, or the Qwen3 runtime. The intended shape is a **static JSON import** (e.g. a backend module or seed reader under a new namespace) that consumes the map for content and the examples/mistakes as Miss Julie dialogue/reference data.
2. **TypeScript types** corresponding to the schema (one-to-one with `$defs`):
   - `CurriculumEntry` — the 10-chapter record (identity, chapter, lesson mapping, vocabulary `Array<{en,hi,mr,origin,sourceRef}>`, adaptive hints keyed by `LearnerState`, teaching stages, review flags).
   - `TeachingExample` — `{exampleId, chapterRef, learnerState, stage, studentSays, missJulieTurns: Array<{text, language: 'en'|'hi-en'|'mr-en', ttsNote?}>, intent, masteryCheck, review}`.
   - `LearnerMistake` — `{mistakeId, category, pattern, exampleUtterance, likelyCause, correctionStrategy, chapterRefs, severity, reviewStatus}`.
   - `LearnerState` = `'BEGINNER_COMPLETE' | 'BEGINNER_HINDI' | 'BEGINNER_MARATHI' | 'ANSWERED_INCORRECT' | 'SILENT' | 'GUESSING_REPEATEDLY' | 'FAST_LEARNER' | 'NEEDS_REVISION'` — the same enum drives `adaptiveTeachingHints`, examples, and the app's future adaptive router.
3. **Mastery rule to preserve in code:** a correct first answer must never flip a mastery flag. Mastery indicators in the map are all *independent use on a later check* (reversed direction, new listener, next-day recall). If you build any mastery bookkeeping, encode `VERIFY`-stage evidence, not echo matches.
4. **Language routing:** `hi-en`/`mr-en` turn labels are content annotations. The existing Sarvam-locale → Azure voice routing in the live flows is the runtime's business; these labels only say which language a line is written for.
5. **Validation gate:** keep `node curriculum-research/tools/validate-curriculum.mjs` as a pre-commit/CI check. It also guards against `roadmapTitle` drift in `backend/src/curriculum/roadmap.ts`.
6. **Voice-asset discipline:** every `suggestedVisualActivities[].assetStatus` is `MISSING` — do not let any consumer pretend an asset exists (mirrors the KG `visualAssets.status` convention).

## 4. Deliberately NOT done (and why)

- **No Units Two–Four datasets.** Their chapter titles are verified and listed in `curriculum-research.md` §3, but page-internal extraction is out of Sprint 1 scope. Titles alone must not be turned into lessons.
- **No schema change to existing app models.** The map is intentionally self-contained; adapting it into `StarterUnit`/`KGActivityPlan`-shaped seeds is a later, PM-coordinated step.
- **No repo file outside `curriculum-research/` was touched.** Working-tree changes that existed before this sprint (`client/tsconfig.tsbuildinfo`, untracked `backend/src/scripts/probe-db.cjs` / `test-level-map.cjs`) are not mine and were not staged.
- **pypdf** was installed into the local `.venv` (tool-only, for PDF text extraction). No npm dependency was added anywhere.

## 5. Open items that block or shape your work

1. **PM sign-off on `curriculum.schema.json` v1.0.0** — required before any consumer is built against it (assignment rule: schema changes go through the PM).
2. **PM approval of chapter→level mapping** (`PROPOSED_MAPPING_PENDING_PM_APPROVAL` flags in the map): 1.1→l01, 1.2→l07, 1.3/1.4/1.5→l02, 1.6→l04, 1.7→l03, 1.8→l08+l03, 1.9→l03, 1.10→l09.
3. **Human teacher review of pedagogy content** — all examples/mistakes/hints are draft until a teacher signs off; treat them as reference data, not production dialogue.
4. **Balbharati authorization question** — if any future feature must render poem/passage text (beyond the existing 1.1 adaptation), that needs a rights decision before you build the rendering path.

## 6. Quick verification for you

```bash
git checkout feature/ai-curriculum
node curriculum-research/tools/validate-curriculum.mjs   # expect: ALL CHECKS PASSED — map: 10/10 · examples: 133 · mistakes: 38
```

— Z.ai Curriculum Agent (Sprint 1 complete)

# Handoff to Codex — Curriculum Intelligence (Sprint 1, checkpoint 2)

**From:** Z.ai Curriculum Agent | **Date:** 2026-10-31 | **Branch:** `feature/ai-curriculum` (pushed to `therealsaad/talkor`, draft PR open)
**Touch rule honored:** no application code was modified — everything in this handoff lives in `curriculum-research/` and is additive-only.

---

## 1. What you are receiving

| File | What it is | Status |
|---|---|---|
| `curriculum.schema.json` | The data contract (JSON Schema draft-07) for all dataset shapes, **dual-track** | **v1.1.0** — revised per PM checkpoint-1 decisions; still needs final PM sign-off |
| `balbharati-class1-unit1-map.json` | 10 syllabus-verified curriculum entries for English Balbharati Grade One Unit One (chapters 1.1–1.10, printed pp. 1–17 of the 2025 edition) — **English-medium track** | Syllabus facts read directly from the official PDF (2026-10-31); pedagogy fields are agent drafts pending teacher review |
| `my-english-book-class1-unit1-map.json` | 11 syllabus-verified entries for *My English Book — Grade One (Non-English Medium)* Unit One (chapters 1.1–1.11, printed pp. 1–17) — **non-English-medium track** | Same verification and honesty rules; oral-first phonics design (Fun with Sounds b-c-p-t-a / d-f-m-n-e) |
| `miss-julie-teaching-examples.json` | 133 teaching exchanges covering all 8 learner states × 10 chapters (bal track), each tagged `textbookId` | 122 agent-reviewed for syllabus alignment / 11 synthetic candidates; **none human-approved** |
| `pm-checkpoint2-example-records.json` | The 2 complete example records (one per textbook) delivered for PM checkpoint 2, incl. the corrected शाळा-is-Marathi bridge | Reviewable standalone |
| `learner-mistakes.json` | 38 beginner mistake patterns (incl. Hindi/Marathi L1 transfer) with Miss Julie correction strategies | 27 reviewed / 11 candidates; mist-019 recategorized per PM language-attribution correction |
| `chapter-to-level-coverage.md` | Ordered chapter→level coverage matrices for BOTH books with INTRODUCES/CONSOLIDATES roles | All rows `PROPOSED_MAPPING_PENDING_PM_APPROVAL` |
| `curriculum-research.md` | The full research report: edition verification, verified TOCs, chapter analysis, comparison with the repo's current content, copyright position | — |
| `dataset-sources.md` | License/suitability audit of external datasets + checkpoint-2 verification of the MEB workbook page and the 2020 SCERT guide | — |
| `curriculum-validation-report.md` | Validation results + what is *not* validated | — |
| `tools/validate-curriculum.mjs` | Zero-dependency dual-track validator (run: `node curriculum-research/tools/validate-curriculum.mjs`) | Passing |

## 2. Key facts you should not have to rediscover

- **Dual-track decision (PM checkpoint 1):** Talkora supports BOTH official Std 1 English textbooks. Track discrimination is by `textbookId` (`ENGLISH_BALBHARATI_G01` | `MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM`) + `curriculumId` prefix (`bal-`/`meb-`). **School/admin configuration selects the track; students never choose curriculum or difficulty.** The existing `g01-l01` English Balbharati implementation is unchanged; both tracks map onto the same ten canonical `g01-lNN` levels.
- **Editions:** both books 2025, approved 2025-04-16 (Coordination Committee, GR No. Abhyas-2116/(Pra.Kra.43/16) SD-4), SCERT-verified, first use AY 2025-26, Foundational Stage Curriculum 2024 / NEP 2020. Official PDFs: bal https://ebooks.ebalbharati.in/pdfs/103050001.pdf (92 pp, 44 chapters) · meb https://ebooks.ebalbharati.in/pdfs/103050035.pdf (87 pp, 42 chapters). Both books print "Some permission are awaited" — the meb book names no per-chapter credits, so its rhyme chapters default to `THIRD_PARTY_PERMISSION_AWAITED`.
- **No edition drift:** the existing `class1-first-day-poem.ts` matches the official page-1 word bank 12/12. The generic `class-1/lessons.ts` starters are self-labelled enrichment, not syllabus claims.
- **Copyright:** the books reserve all rights; bal 1.1/1.9 (and four later chapters) are third-party credited in-book. The datasets therefore contain **titles, page numbers, word banks, patterns and Talkora-original pedagogy only — zero reproduced passage text.** Keep it that way in runtime content.
- **Addressing:** `curriculumId` = `(bal|meb)-g01-u1-c1.NN` (NN zero-padded; printed 1.1 → `c1.01`; meb adds `c1.11`). Chapter codes are unique only within a textbook — always join on `textbookId` + code, never code alone (both books have a chapter "1.4 Clap your hands." and they are different rhymes). `talkoraLevelId` addresses reuse the existing `g01-lNN` scheme from `level-map-contract.ts` — no new addressing system, no database migration.
- **Recall discipline (PM correction):** every entry carries `recallDesign` with the three milestones IMMEDIATE_REPETITION / INDEPENDENT_ANSWERING / DELAYED_RECALL. Mastery logic must key on the last two only; example `masteryCheck` strings carry explicit `[MILESTONE]` labels the validator enforces.

## 3. Suggested integration path (when the PM approves the schema)

1. **Do not** wire anything into controllers, level-map, auth, progress, sessions, or the Qwen3 runtime. The intended shape is a **static JSON import** (e.g. a backend module or seed reader under a new namespace) that consumes the maps for content and the examples/mistakes as Miss Julie dialogue/reference data. No runtime integration before PM approval (standing rule).
2. **Track selection is a config concern:** when the time comes, a school/admin setting resolves to a `textbookId`; content lookups filter by it. Nothing in the student-facing surface ever exposes track or difficulty choice.
3. **TypeScript types** corresponding to the schema (one-to-one with `$defs`):
   - `TextbookTrack` — `{textbookId: 'ENGLISH_BALBHARATI_G01' | 'MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM', trackType: 'ENGLISH_MEDIUM' | 'NON_ENGLISH_MEDIUM', selectionModel: string}`.
   - `CurriculumEntry` — the chapter record (identity + `textbookId`, chapter, lesson mapping with `role`, vocabulary `Array<{en,hi,mr,origin,sourceRef,audioAsset?}>`, `recallDesign`, adaptive hints keyed by `LearnerState`, teaching stages, review flags).
   - `TeachingExample` — `{exampleId, textbookId, chapterRef, curriculumIdRef, learnerState, stage, studentSays, missJulieTurns: Array<{text, language: 'en'|'hi-en'|'mr-en', ttsNote?}>, intent, masteryCheck, review}`.
   - `LearnerMistake` — `{mistakeId, category, pattern, exampleUtterance, likelyCause, correctionStrategy, chapterRefs, severity, reviewStatus}`.
   - `LearnerState` = `'BEGINNER_COMPLETE' | 'BEGINNER_HINDI' | 'BEGINNER_MARATHI' | 'ANSWERED_INCORRECT' | 'SILENT' | 'GUESSING_REPEATEDLY' | 'FAST_LEARNER' | 'NEEDS_REVISION'` — the same enum drives `adaptiveTeachingHints`, examples, and the app's future adaptive router.
4. **Mastery rule to preserve in code:** a correct first answer must never flip a mastery flag. Use `recallDesign`: only INDEPENDENT_ANSWERING and DELAYED_RECALL evidence may satisfy mastery indicators. If you build mastery bookkeeping, encode `VERIFY`-stage evidence with a milestone enum, never echo matches.
5. **Language routing:** `hi-en`/`mr-en` turn labels are content annotations. The existing Sarvam-locale → Azure voice routing in the live flows is the runtime's business; these labels only say which language a line is written for. Terminology rule (PM correction): शाळा is Marathi; Hindi for school is विद्यालय/पाठशाला/स्कूल — the validator enforces this in the data, keep it in generated content too.
6. **Validation gate:** keep `node curriculum-research/tools/validate-curriculum.mjs` as a pre-commit/CI check. It guards `roadmapTitle` drift against `backend/src/curriculum/roadmap.ts`, review-honesty rules, the शाळा terminology rule, milestone labels, and the dual-track discriminator.
7. **Asset discipline:** every `suggestedVisualActivities[].assetStatus` is `MISSING` and vocabulary `audioAsset` is absent or `RIGHTS_UNDECIDED` — do not let any consumer pretend an asset exists (mirrors the KG `visualAssets.status` convention).

## 4. Deliberately NOT done (and why)

- **No Units Two–Four datasets.** Their chapter titles are verified and listed in `curriculum-research.md` §3, but page-internal extraction is out of Sprint 1 scope. Titles alone must not be turned into lessons.
- **No schema change to existing app models.** The map is intentionally self-contained; adapting it into `StarterUnit`/`KGActivityPlan`-shaped seeds is a later, PM-coordinated step.
- **No repo file outside `curriculum-research/` was touched.** Working-tree changes that existed before this sprint (`client/tsconfig.tsbuildinfo`, untracked `backend/src/scripts/probe-db.cjs` / `test-level-map.cjs`) are not mine and were not staged.
- **pypdf** was installed into the local `.venv` (tool-only, for PDF text extraction). No npm dependency was added anywhere.

## 5. Open items that block or shape your work

1. **PM sign-off on `curriculum.schema.json` v1.1.0** — the checkpoint-1 revision decisions are applied (discriminator, curriculum-version metadata, distinct review statuses, optional audioAsset, namespaced IDs); final approval of the revised contract is pending with the PM checklist-2 deliverable.
2. **PM approval of the chapter→level coverage matrices** (`chapter-to-level-coverage.md`; every row `PROPOSED_MAPPING_PENDING_PM_APPROVAL`). The checkpoint-1 mapping was rejected; the revision introduces `role` tags so no objective is introduced only at a late level (e.g. bal 1.2 now introduces action instructions at l02 in week 1 and consolidates at l07).
3. **Human teacher review of pedagogy content** — all examples/mistakes/hints are draft until a teacher signs off; treat them as reference data, not production dialogue. Synthetic example validation ≠ teacher approval (validator-enforced distinction).
4. **Balbharati authorization question** — if any future feature must render poem/passage text or use QR audio (beyond the existing 1.1 adaptation), that needs a rights decision before you build the rendering/audio path. The older SCERT teacher guide (maa.ac.in, 2020-era, scanned) must never be cited as a verified 2025 handbook.
5. **Full MEB example bank** — only the 2 checkpoint-2 records exist for the meb track; generate the 8-states × 11-chapters bank after the PM approves the MEB mapping.

## 6. Quick verification for you

```bash
git checkout feature/ai-curriculum
node curriculum-research/tools/validate-curriculum.mjs
# expect: ALL CHECKS PASSED — tracks: bal 10/10 + meb 11/11 chapters · examples: 135 · mistakes: 38
```

— Z.ai Curriculum Agent (Sprint 1 checkpoint 2 complete)

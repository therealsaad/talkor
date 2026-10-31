# Curriculum Dataset Validation Report — Sprint 1 (checkpoint 2)

**Date:** 2026-10-31 | **Validator:** `tools/validate-curriculum.mjs` (zero-dependency Node script) | **Result: ALL CHECKS PASSED**

Run: `node curriculum-research/tools/validate-curriculum.mjs`

---

## 1. What is validated

The validator enforces the contracts declared in `curriculum.schema.json` **v1.1.0** (dual-track revision, PM checkpoint-1 decisions) plus cross-file integrity and cross-repo drift checks that a JSON Schema alone cannot express:

**Schema file**
- `schemaVersion` declared as const `1.1.0`; all seven `$defs` present (textbookTrack, curriculumVersion, audioAsset, editionVerification, curriculumEntry, teachingExample, learnerMistake).

**balbharati-class1-unit1-map.json (English-medium track)**
- Exactly 10 entries covering chapter codes `1.1`–`1.10`; unique `curriculumId`s in the `bal-g01-u1-c1.NN` address space with an enforced derivation rule (printed `1.N` ↔ id suffix `c1.<pad(N,2)>`).
- `dataset.textbookTrack`: `textbookId: ENGLISH_BALBHARATI_G01`, `trackType: ENGLISH_MEDIUM`, and a selectionModel that must state school/admin selection **and** that students never choose curriculum/difficulty (machine-checked).
- `dataset.curriculumVersion`: framework/policy/approval-date/first-use/verification-authority preserved (approval 2025-04-16 enforced).
- Every entry: `textbookId` discriminator matching the ID prefix; ≥1 source reference with locator/date/confidence; `copyrightStatus.category` **and** `reproductionRule`; `syllabusVerification: OFFICIAL_PDF_VERIFIED` **and** `pedagogyStatus: DRAFT_PENDING_TEACHER_REVIEW` (validator fails on any overclaim of teacher approval).
- Vocabulary: 107 items, each with English + Hindi + Marathi gloss, origin enum, `sourceRef`; optional `audioAsset` allowed only with a valid status (never `APPROVED` without a permission reference).
- **recallDesign (PM correction):** exactly the three distinct milestones — IMMEDIATE_REPETITION, INDEPENDENT_ANSWERING, DELAYED_RECALL — with non-empty activities, per chapter.
- **Level mappings (PM correction):** every mapping carries `role` (INTRODUCES/CONSOLIDATES/REVISITS); `roadmapTitle` strings are parsed from and matched against the live `backend/src/curriculum/roadmap.ts` (drift guard); all mappings remain `PROPOSED_MAPPING_PENDING_PM_APPROVAL`.
- Adaptive hints: all 8 learner states × 10 chapters; `commonBeginnerMistakeIds` resolve; `shortSpokenHomework` present.

**my-english-book-class1-unit1-map.json (non-English-medium track)**
- Same contract at 11 entries (`meb-g01-u1-c1.01` … `c1.11`, printed pp. 1–17), `trackType: NON_ENGLISH_MEDIUM`; 106 vocabulary items all glossed hi/mr with sourceRefs; 10 vocabulary items carry `audioAsset: RIGHTS_UNDECIDED` (PM made audioAsset optional; nothing claims an asset exists); copyright defaults to `THIRD_PARTY_PERMISSION_AWAITED` for the song/rhyme chapters because the official Index names no per-chapter credits and says permissions are awaited.

**learner-mistakes.json**
- 38 patterns (target ≥30); unique `mist-NNN` ids; valid enums; all fields non-empty; chapterRefs well-formed.
- **Terminology guard (PM correction):** fails if `शाळा` is attributed to Hindi in any operative field — शाळा is Marathi; mist-019 was recategorized `L1_TRANSFER_MARATHI` with a correction note documenting the earlier mislabel.

**miss-julie-teaching-examples.json + pm-checkpoint2-example-records.json**
- **135 examples** (bank 133, all tagged `textbookId: ENGLISH_BALBHARATI_G01`, + the 2 checkpoint-2 records, one per track); unique `tje-NNN` ids; every `curriculumIdRef` resolves into its own track's map; all 8 stages in use.
- Learner-state coverage: **all 8 states × all 10 bal chapters** (MEB example bank starts with the checkpoint-2 records; the full MEB bank is scheduled after PM mapping approval).
- Bilingual support turns (hi-en/mr-en): 42.
- **Mastery discipline (PM correction):** every `masteryCheck` must carry an `[INDEPENDENT_ANSWERING]` or `[DELAYED_RECALL]` milestone label — repetition alone can never satisfy a mastery check. (The 133 bank records were migrated with keyword-classified labels; classification is documented in the dataset header and remains subject to teacher review.)
- Bridge-turn guard: a hi-en turn may mention `शाळा` only with an explicit Marathi attribution.
- Review-status distinction: **124 REVIEWED_SYLLABUS_ALIGNED / 11 UNREVIEWED_SYNTHETIC_CANDIDATE** — synthetic example validation is never conflated with teacher approval.

**Cross-repo**
- Edition comparisons recorded for both tracks; bal word-bank match 12/12 (`editionDriftFound: false`); MEB is new (nothing to drift from).

## 2. Actual output (2026-10-31, checkpoint 2)

```
ALL CHECKS PASSED — tracks: bal 10/10 + meb 11/11 chapters · examples: 135 · mistakes: 38
  ✓ bal:  vocabulary items: 107 … audioAsset flagged on 0 (optional, rights-undecided)
  ✓ meb:  vocabulary items: 106 … audioAsset flagged on 10 (optional, rights-undecided)
  ✓ recallDesign: 3 milestones (repetition / independent / delayed) × both tracks
  ✓ level mappings: role-tagged + roadmap-title drift check green (both tracks)
  ✓ mist-019 carries the corrected language attribution
  ✓ terminology guard: शाळा never attributed to Hindi
  ✓ 135 teaching examples (target 100–200); bal coverage 8 states × 10 chapters
  ✓ REVIEWED_SYLLABUS_ALIGNED: 124/135; UNREVIEWED_SYNTHETIC_CANDIDATE: 11/135
```

Checkpoint-2 migration errors surfaced and fixed before the green run: (1) validator declaration-order bug; (2) the first terminology guard matched its own correction note — narrowed to wrong-attribution patterns only; (3) all 133 bank masteryChecks lacked explicit milestone labels — migrated per the PM's repetition/independent/delayed distinction.

## 3. What is NOT validated (honest limits)

- **Pedagogical quality** — no automated check confirms a correction strategy or bilingual gloss is pedagogically sound; human teacher review remains pending everywhere (`DRAFT_PENDING_TEACHER_REVIEW`).
- **Milestone-label accuracy in the migrated bank** — labels were keyword-classified during migration; the authoritative per-chapter design lives in each map entry's `recallDesign`. Teacher review should spot-check the labels.
- **Official JSON Schema validation** — purpose-built structural checker, not a draft-07 engine; wire `ajv` in the backend test suite if engine-grade validation is wanted (no dependency added here by design).
- **Textbook visual content** — picture-dependent exercises were extracted as text; the older SCERT guide is scanned images with no text layer (152 pages, created 2020-12-04) and has NOT been OCR-matched to the 2025 syllabus — it is recorded as a historical reference only, never as a verified 2025 handbook.
- **PDF source authenticity** — fetched over HTTPS from `ebooks.ebalbharati.in`; internal approval text matches the 2025-26 rollout; no cryptographic signature exists for Balbharati PDFs.

## 4. Re-run instructions

```bash
node curriculum-research/tools/validate-curriculum.mjs   # exit 0 = pass
```

The validator also fails (by design) if any `roadmapTitle` stops matching `backend/src/curriculum/roadmap.ts`, if a textbook track's selection model stops stating school/admin selection, or if any record claims teacher approval — it doubles as the honesty/drift guard for future edits.

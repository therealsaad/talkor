# Curriculum Dataset Validation Report — Sprint 1

**Date:** 2026-10-31 | **Validator:** `tools/validate-curriculum.mjs` (zero-dependency Node script) | **Result: ALL CHECKS PASSED**

Run: `node curriculum-research/tools/validate-curriculum.mjs`

---

## 1. What is validated

The validator enforces the contracts declared in `curriculum.schema.json` v1.0.0 plus cross-file integrity and cross-repo drift checks that a JSON Schema alone cannot express:

**Schema file**
- `schemaVersion` declared as const `1.0.0`; all four `$defs` present (editionVerification, curriculumEntry, teachingExample, learnerMistake).

**balbharati-class1-unit1-map.json**
- Exactly 10 entries covering chapter codes `1.1`–`1.10`; unique `curriculumId`s in the `bal-g01-u1-c1.NN` address space with an enforced derivation rule from the printed chapter code (printed `1.N` ↔ id suffix `c1.<pad(N,2)>`).
- Every entry: board/grade/subject identity; edition verification pointing at the official eBalbharati URL with `OFFICIAL_SOURCE_VERIFIED` confidence and verifiedOn date; ≥1 source reference with locator/date/confidence; `copyrightStatus.category` **and** a `reproductionRule` (copyright discipline is machine-enforced, not just documented).
- Review honesty: every entry is `syllabusVerification: OFFICIAL_PDF_VERIFIED` (Sprint 1 scope) **and** `pedagogyStatus: DRAFT_PENDING_TEACHER_REVIEW` — the validator fails if any entry overclaims pedagogical approval.
- Vocabulary: 107 items, each with English + Hindi + Marathi gloss, a valid origin enum, and a per-item `sourceRef`.
- Adaptive teaching hints: all 8 learner states present for all 10 chapters (80 hint sets).
- `commonBeginnerMistakeIds` resolve against `learner-mistakes.json`.
- `talkoraLevelMapping.roadmapTitle` strings are parsed from and matched against the live `backend/src/curriculum/roadmap.ts` — mapping titles cannot drift from the app without failing validation.
- `shortSpokenHomework` present in all entries.

**learner-mistakes.json**
- 38 patterns (target ≥30); unique `mist-NNN` ids; valid category/severity/reviewStatus enums; required fields (pattern, example utterance, likely cause, correction strategy) non-empty; all chapterRefs inside Unit One.

**miss-julie-teaching-examples.json**
- **133 examples** (required range 100–200); unique `tje-NNN` ids; every `chapterRef` resolves into the map; learner states and stages use the canonical enums; all 8 teaching stages in use.
- Learner-state coverage: **all 8 states × all 10 chapters** (no blind spots in the adaptive design).
- Bilingual support turns (hi-en/mr-en): 39.
- Review-status distinction (assignment requirement): **122 REVIEWED_SYLLABUS_ALIGNED / 11 UNREVIEWED_SYNTHETIC_CANDIDATE** — the split is explicit per example, and the dataset header states that *no* example is human-teacher-approved yet.

**Cross-repo**
- Edition comparison recorded: Talkora's implemented 1.1 poem content matches the official 2025 edition (word bank 12/12); `editionDriftFound: false` with 4 evidence items.

## 2. Actual output (2026-10-31)

```
ALL CHECKS PASSED — map: 10/10 chapters · examples: 133 · mistakes: 38
  ✓ vocabulary items: 107 (all with en/hi/mr + sourceRef)
  ✓ official textbook source references: 10
  ✓ adaptive teaching hints: all 8 learner states × 10 chapters
  ✓ talkoraLevelMapping titles match backend roadmap.ts (drift check)
  ✓ 133 teaching examples (target 100–200)
  ✓ learner-state coverage: all 8 states × all 10 chapters
  ✓ REVIEWED_SYLLABUS_ALIGNED: 122/133; UNREVIEWED_SYNTHETIC_CANDIDATE: 11/133
  ✓ mistakes REVIEWED: 27/38
```

(First validation run surfaced 29 errors: the ID pattern in the schema disagreed with the zero-padded chapter suffix used in the data. Fixed by formalizing the derivation rule in `curriculum.schema.json` and tightening the validator — documented here because it is exactly the kind of contract ambiguity the PM sign-off should confirm.)

## 3. What is NOT validated (honest limits)

- **Pedagogical quality** — no automated check can confirm that a correction strategy or bilingual gloss is pedagogically sound; that requires the human teacher review recorded as pending throughout.
- **Official JSON Schema validation** — the validator is a purpose-built structural checker, not a full draft-07 engine; if Codex wants engine-grade validation, wire `ajv` in the backend test suite (no dependency was added here by design).
- **Textbook visual content** — picture-based exercises (1.3 maze artwork, 1.10 clock face) were extracted as text; visual verification of the PDF pages is pending (no PDF renderer available in this environment).
- **PDF source authenticity** — the PDF was fetched over HTTPS from `ebooks.ebalbharati.in` and its internal approval text matches the known 2025-26 rollout; no cryptographic signature check exists for Balbharati PDFs.

## 4. Re-run instructions

```bash
node curriculum-research/tools/validate-curriculum.mjs   # exit 0 = pass
```

The validator also fails (by design) if any `roadmapTitle` in the map stops matching `backend/src/curriculum/roadmap.ts`, so it doubles as a mapping drift guard for future edits.

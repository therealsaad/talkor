# Talkora Curriculum Agent — Checkpoint 1 to PM

**Date:** 2026-10-31 | **Branch:** `feature/ai-curriculum` @ `c0d493b` (+ this checkpoint) | **Schema status: DRAFT v1.0.0 — not locked, awaiting PM coordination**
**Code rule honored:** zero backend/frontend modifications; all work is additive in `curriculum-research/`.

---

## 1. Verified textbook edition and Unit One lesson mapping

**Edition verified directly from official source** (downloaded + text-extracted on 2026-10-31, not from memory or secondary sources):

| Field | Value |
|---|---|
| Title | *English Balbharati — Grade One* |
| Publisher | Maharashtra State Bureau of Textbook Production and Curriculum Research, Pune (Balbharati) |
| Approval | Coordination Committee meeting 2025-04-16 (per GR No. Abhyas-2116/(Pra.Kra.43/16) SD-4); SCERT-verified; Foundational Stage Curriculum 2024 / NEP 2020 |
| First use | AY 2025-26 |
| Source | [Official PDF](https://ebooks.ebalbharati.in/pdfs/103050001.pdf), 92 pages, 4 units / 44 chapters |
| Confidence | OFFICIAL_SOURCE_VERIFIED |

**Unit One (printed pp. 1–17, 10 chapters), with proposed Talkora level mapping (all `PROPOSED_MAPPING_PENDING_PM_APPROVAL`):**

| Ch. | Title (as printed) | Page | → Talkora level |
|---|---|---|---|
| 1.1 | My First Day (poem, third-party credited) | 1 | g01-l01 *Little Words & My First Day* |
| 1.2 | Clap your hands. | 2 | g01-l07 *Action Words* |
| 1.3 | I know my alphabet. | 3 | g01-l02 *My School* |
| 1.4 | Let us read. | 5 | g01-l02 |
| 1.5 | Fun with Special Letters | 7 | g01-l02 |
| 1.6 | The Rainbow | 8 | g01-l04 *Colours and Counting* |
| 1.7 | Meet my family. | 10 | g01-l03 *People and Family* |
| 1.8 | Let us know each other. | 11 | g01-l08 *Simple Questions* + g01-l03 |
| 1.9 | Everybody has a name. (poem, third-party credited) | 14 | g01-l03 |
| 1.10 | My Daily Routine | 16 | g01-l09 *My Day* |

**Cross-check with the repo:** the implemented `class1-first-day-poem.ts` matches the official page-1 word bank 12/12 — **no edition drift**. The generic `class-1/lessons.ts` starters are self-labelled enrichment, correctly not presented as syllabus.

**⚠ New finding needing your decision (details in §6):** checkpoint research verified a **second official Std 1 English textbook for AY 2025-26** — *My English Book, Grade One (**Non-English Medium**)*, [official PDF](https://ebooks.ebalbharati.in/pdfs/103050035.pdf) — i.e., the English book used by Marathi/Hindi/Urdu-medium schools. Its Unit One has **11 chapters** with a different structure (oral-first; "Fun with Sounds" phonics strand). Sprint 1's map covers only the English-medium book. This decides what "Class 1 Unit One" means for Talkora.

## 2. Draft curriculum JSON schema (v1.0.0 — NOT locked)

`curriculum.schema.json` (draft-07) defines four `$defs`, one-to-one with TypeScript interfaces in the handoff:

- **curriculumEntry** — the full chapter record: `curriculumId` (`bal-g01-u1-c1.NN`), board/grade/subject, `textbookEdition` (verified-edition block with source URL + confidence), `unit`, `chapter` (code/title/printed page/category/**copyrightStatus + reproductionRule**), `lesson.talkoraLevelMapping` (with roadmap-title echo for drift detection), `sourceReferences` (locator/URL/date/confidence), learning objectives, prerequisite skills, `vocabulary` (`en`/`hi`/`mr`/origin/`sourceRef`), phonics, grammar, comprehension, speaking, visual activities (**assetStatus always MISSING — cannot fake assets**), teacher explanation examples (EN/HI/MR), expected answers, `adaptiveTeachingHints` (all 8 learner states, machine-enforced), remediation, assessment, mastery indicators, revision, spoken homework, `teachingStages` (subset of DISCOVER…RECALL), and a two-part `review` block (`syllabusVerification` vs `pedagogyStatus`) that the validator uses to block overclaiming.
- **teachingExample**, **learnerMistake** — the other two dataset shapes (explicit reviewed/synthetic distinction).
- **editionVerification / sourceReference / confidence** — shared verification vocabulary.

**Decisions I need from you before locking (each currently blocked on you by design):**
1. **Second-book policy** (see §6): dual-track or English-medium-only? If dual-track, `curriculumId` gains a book segment and the schema gains a `textbook` discriminator — I will not change IDs unilaterally.
2. Confirm the **chapter→level mapping** above (esp. 1.3–1.5 all → l02).
3. Confirm the **`bal-g01-…` ID grammar** and the zero-padded suffix derivation (printed `1.1` → `c1.01`) — this was formalized during validation and should be signed off.
4. Confirm `pedagogyStatus: DRAFT_PENDING_TEACHER_REVIEW` as the mandatory initial state (validator fails on any entry that claims teacher approval).
5. Whether to add an `audioAsset` field per vocabulary item now (the textbook has official QR audio; rights undecided) or defer.

## 3. Official sources, copyright/licensing findings and uncertainties

**Findings:**
- The textbook copyright page reserves all rights to Balbharati (Pune); reproduction beyond referencing needs written permission. Six chapters book-wide are third-party works credited in the Contents; **Unit One has two**: 1.1 (*A to Z Teacher's Stuff*) and 1.9 (*Jean Warren*).
- Datasets therefore contain **titles, page numbers, word banks, activity types and Talkora-original pedagogy only — zero reproduced passage text**; the validator enforces a per-chapter `reproductionRule`. (The pre-existing 1.1 poem implementation in the repo carries its own authorization decision and is referenced, not extended.)
- Workbooks/teacher handbooks: a separate section exists in the eBalbharati library; **no Std 1 English teacher-handbook PDF was located** — teacher material may route through DIKSHA/the eBalbharati app. Uncertainty, flagged.
- External datasets (full audit in `dataset-sources.md`): Common Voice (**CC0**; Hindi/Marathi are **small** per-release: 15.6 / 18.94 validated hrs), AI4Bharat IndicVoices (23.7k hrs, adult, license per-dataset-card), Kathbath (1,684 hrs, 12 languages), EFCAMDAT (adult L2 *written*, request-only), CMU Kids (real child speech but LDC-licensed, US accent, ages 6–11). **No open dataset fits Maharashtra Class 1 child English speech** — consented in-house recording is the only credible future source.

**Uncertainties (honest list):**
1. Which syllabus-year bucket the 2025-released books sit under in the library UI (2025 vs 2026 filter) — the PDFs themselves are unambiguous.
2. Picture-dependent exercise content (1.3 maze artwork, 1.10 clock face) extracted as text only — no PDF renderer available.
3. Balbharati QR audio rights (likely needed for any word-bank audio).
4. Whether Balbharati will grant any reuse permission at all — untested.

## 4. Example original teaching activities (all Talkora-original; full set: 133 examples / 10 chapters / 8 learner states)

- **1.1, silent learner:** Miss Julie: "No words needed yet. Show me with your hands — clap like this. Wonderful! Now, when you are ready, tell the clap its name." (action-channel before speech; any voice counts)
- **1.1, Hindi beginner:** Student: "शाळा!" → "Very good! Hindi mein शाळा. English mein school. Can you say school?" (the PM's bridge pattern, applied to verified word-bank words)
- **1.5, incorrect answer:** Student reads `s_n` as "son" → "Both words are real — the picture is the referee: /sʌn/ sun in the sky, /sʌn/ son in a family. Which one does our picture show?" (minimal-pair with pictures deciding, never "wrong")
- **1.6, articles:** "Listen to the trick: **an** elephant — because 'elephant' begins with a special-letter sound. **A** box — normal letter. **The** sun — there is only one!" (the book's own rule, child-framed)
- **1.8, guessing learner:** "Nobody guesses where YOU live — only you know this treasure!" (personal-fact questions structurally block guessing)
- **1.9, shy learner:** whisper-then-loud name ladder — the child's own name as the safest first English word.
- Mastery rule throughout: a correct first answer never declares mastery; mastery = reversed check (Miss Julie acts, child names), new-listener retell, or next-day recall.

## 5. Files created, branch and status

**Committed on `feature/ai-curriculum` (commit `c0d493b`, + checkpoint commit):**
`curriculum-research/` → `curriculum-research.md` · `curriculum.schema.json` (draft) · `balbharati-class1-unit1-map.json` (10 chapters, 107 bilingual vocab) · `miss-julie-teaching-examples.json` (133: 122 aligned / 11 synthetic, all teacher-review pending) · `learner-mistakes.json` (38: 27 / 11) · `dataset-sources.md` · `curriculum-validation-report.md` · `handoff-to-codex.md` · `tools/validate-curriculum.mjs` · `checkpoint-1-pm.md` (this file)

**Validation:** `node curriculum-research/tools/validate-curriculum.mjs` → **ALL CHECKS PASSED** (10/10 chapters, 133 examples in the 100–200 range, 8×10 learner-state coverage, cross-file refs resolve, roadmap-title drift guard green). First run surfaced 29 ID-pattern errors → fixed by formalizing the ID derivation; documented in the validation report.

**Branch hygiene:** commit is additive-only (9 files, +4875 lines, no app code). Note: this shared working tree is concurrently used by other agents (frontend-QA owns the checkout; teaching-engine and student-UI agents work in linked worktrees). My commits were made via a temporary worktree to avoid disturbing their checkout; `curriculum-research/` also exists as untracked copies in the main tree — safe to ignore or delete once my branch is checked out.

## 6. New findings from continued research (awaiting your review)

1. **⚠ DECISION — second official Std 1 English book.** *My English Book — Grade One (Non-English Medium)*, same approval date, [official PDF](https://ebooks.ebalbharati.in/pdfs/103050035.pdf). Verified Unit One (11 chapters): 1.1 Body Body Pop Pop · 1.2 What is your name? · 1.3 My Home · 1.4 Clap your hands. *(a different rhyme from English Balbharati's same-titled 1.2)* · 1.5 Chit Chat · 1.6 Fun with Sounds (b-c-p-t-a) · 1.7 What can you do? · 1.8 My Classroom · 1.9 Fun with Sounds (d-f-m-n-e) · 1.10 Tip-Tap, Tip-Tap · 1.11 We want rain. Its design is **oral-first** (Listen/Speak/Act icons; sounds before letter names; TPR games like "Queen Says"; assembly instructions; greetings-by-time-of-day). **Question:** does Talkora's Class 1 track the English-medium book, the non-English-medium book (the majority population), or both? My recommendation: **dual-track**, finish both Unit Ones, with the schema gaining a book discriminator — but this is squarely your call, and it changes IDs, so I've held.
2. **Correction applied:** Common Voice Hindi/Marathi validated hours are ~15–19 hrs per release snapshot (verified against [Hindi v26.0](https://mozilladatacollective.com/datasets/cmqiod71900zgnr07uiyw57br) / [Marathi v27.0](https://mozilladatacollective.com/datasets/cmu5vlwjk009xo107s7i4qmzm) on Mozilla Data Collective) — an earlier draft of `dataset-sources.md` said "hundreds"; fixed with a correction note in place.
3. **Schema stays draft** until you answer §2 items 1–5. Everything else (map data, examples, mistakes, validator) is ready and re-runnable at any time.

— Z.ai Curriculum Agent

# Talkora Curriculum Agent — Checkpoint 2 Deliverable (PM response)

**Date:** 2026-10-31 | **Branch:** `feature/ai-curriculum` (pushed to `therealsaad/talkor`; draft PR open, links in §8)
**Scope rule honored:** zero backend/frontend runtime changes; everything is additive inside `curriculum-research/`. No runtime integration until PM approval.

---

## Deliverable 1 — Both textbook Unit One maps

**A. English Balbharati — Grade One (English-medium track)** — `balbharati-class1-unit1-map.json`, 10 chapters, printed pp. 1–17, verified against the official PDF (2026-10-31):

| Ch. | Title (as printed) | Page | Level mapping (role) |
|---|---|---|---|
| 1.1 | My First Day | 1 | l01 (INTRODUCES) — *implemented lesson unchanged* |
| 1.2 | Clap your hands. | 2 | **l02 (INTRODUCES)** + l07 (CONSOLIDATES) |
| 1.3 | I know my alphabet. | 3 | l02 (INTRODUCES) |
| 1.4 | Let us read. | 5 | l02 (CONSOLIDATES) |
| 1.5 | Fun with Special Letters | 7 | l02 (INTRODUCES) |
| 1.6 | The Rainbow | 8 | l04 (INTRODUCES) |
| 1.7 | Meet my family. | 10 | l03 (INTRODUCES) |
| 1.8 | Let us know each other. | 11 | l08 (INTRODUCES) + l03 (INTRODUCES) |
| 1.9 | Everybody has a name. | 14 | l03 (CONSOLIDATES) |
| 1.10 | My Daily Routine | 16 | l09 (INTRODUCES) |

**B. My English Book — Grade One, Non-English Medium (non-English-medium track)** — `my-english-book-class1-unit1-map.json`, **new**, 11 chapters, printed pp. 1–17, verified against the official PDF (87 pages; title-page approval chain identical: SCERT-verified, Coordination Committee 2025-04-16, AY 2025-26):

| Ch. | Title (as printed) | Page | Level mapping (role) |
|---|---|---|---|
| 1.1 | Body Body Pop Pop | 1 | l01 (INTRODUCES — oral TPR opener) |
| 1.2 | What is your name? | 2 | l03 (INTRODUCES) + l08 (INTRODUCES) |
| 1.3 | My Home | 3 | l05 (INTRODUCES) |
| 1.4 | Clap your hands. | 4 | l02 (INTRODUCES) + l07 (INTRODUCES) — *a different rhyme from bal 1.2; separate meb-…-c1.04 ID* |
| 1.5 | Chit Chat | 5 | l09 (INTRODUCES) + l08 (INTRODUCES) |
| 1.6 | Fun with Sounds (b-c-p-t-a) | 8 | l02 (INTRODUCES) |
| 1.7 | What can you do? | 10 | l07 (CONSOLIDATES) + l08 (INTRODUCES) |
| 1.8 | My Classroom | 12 | l02 (INTRODUCES) |
| 1.9 | Fun with Sounds (d-f-m-n-e) | 14 | l02 (CONSOLIDATES) |
| 1.10 | Tip-Tap, Tip-Tap | 16 | l10 (INTRODUCES) |
| 1.11 | We want rain. | 17 | l10 (INTRODUCES) |

Each MEB entry carries the full record set: 106 vocabulary items with Hindi/Marathi glosses and per-item sourceRefs, learning objectives, phonics concepts, 8 adaptive learner-state hints, remediation/assessment/mastery, three-milestone recall design, Talkora-original visual activities (assetStatus never faked), and `pedagogyStatus: DRAFT_PENDING_TEACHER_REVIEW` throughout.

## Deliverable 2 — Revised draft schema

`curriculum.schema.json` **v1.1.0** (draft-07). Your decisions, applied verbatim:
1. **Textbook discriminator** — `textbookTrack.textbookId` (`ENGLISH_BALBHARATI_G01` | `MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM`) on the dataset and on every entry, plus the `bal-`/`meb-` ID prefix; validator enforces prefix↔discriminator consistency.
2. **Edition + curriculum-version metadata preserved** — `editionVerification` (title/publisher/year/approval/sourceUrl/confidence) and new `curriculumVersion` (framework, policy basis, 2025-04-16 committee approval, AY 2025-26, verification authority).
3. **Distinct review statuses preserved** — `syllabusVerification` (source fidelity) and `pedagogyStatus` (human teacher sign-off) stay separate; synthetic validation can never upgrade the latter.
4. **`DRAFT_PENDING_TEACHER_REVIEW` initial** — validator fails any entry claiming `REVIEWED_BY_TEACHER`.
5. **`audioAsset` optional** — statuses `MISSING/RIGHTS_UNDECIDED/REQUESTED/APPROVED`; `APPROVED` requires a permission reference. 10 MEB vocabulary items carry `RIGHTS_UNDECIDED` flags for the official QR audio; nothing claims an asset exists.
6. **Namespaced entry IDs, no migration** — `(bal|meb)-g01-uN-cN.NN`; chapter codes are unique only within a textbook, so all joins are textbookId+code. No existing canonical level ID or chapter ID is reused or changed.
7. **Mapping pending review** — every mapping row is `PROPOSED_MAPPING_PENDING_PM_APPROVAL` and now carries `role` (INTRODUCES/CONSOLIDATES/REVISITS) for the ordered coverage matrix.
8. **New v1.1.0 fields from your educational corrections** — `recallDesign` (IMMEDIATE_REPETITION / INDEPENDENT_ANSWERING / DELAYED_RECALL, exactly three per entry), milestone-labeled `masteryCheck` on examples, articles rule documented as vowel-**sound** based, `THIRD_PARTY_PERMISSION_AWAITED` copyright category (both 2025 books print "Some permission are awaited").

## Deliverable 3 — Two complete example records (one per book)

`pm-checkpoint2-example-records.json` — **tje-134** (bal 1.1, BEGINNER_HINDI, the corrected शाळा bridge) and **tje-135** (meb 1.2, BEGINNER_MARATHI, Marathi-first name exchange with role reversal per the book's own chain-drill note). Both carry textbookId, curriculumIdRef, bilingual turns, milestone-based masteryCheck, and `REVIEWED_SYLLABUS_ALIGNED` review notes that explicitly state this is not teacher approval.

## Deliverable 4 — Ordered chapter-to-level coverage proposal

`chapter-to-level-coverage.md` — whole-book matrices for both textbooks. Key fixes to the rejected checkpoint-1 mapping:
- **bal 1.2** no longer sits only at l07 (level 7 of 10): it **introduces** action instructions at l02 in week 1 and **consolidates** at l07.
- No objective is introduced only at a late level: every chapter that consolidates at a late level also introduces early (or its objective's introduction is carried by an earlier chapter, shown in the matrix).
- Levels without a Unit-One feeder (bal l05/l06/l10; meb l04/l06) are **fed in order by named later-unit chapters** (verified full-book indexes: bal 44 chapters, meb 42) rather than force-fitted — nothing is skipped across the year, and the existing 10-level experience is preserved for both tracks.
- Existing progress untouched: the only implemented mapping (bal 1.1 → g01-l01) is unchanged, and all ten canonical level IDs/titles are byte-identical to `roadmap.ts` (drift-checked).

## Deliverable 5 — Corrected bilingual teaching examples

- **शाळा terminology:** mist-019 recategorized `L1_TRANSFER_HINDI → L1_TRANSFER_MARATHI`; correction note documents the error; the validator now fails any dataset that attributes शाळा to Hindi (school = Hindi विद्यालय/पाठशाला/स्कूल, Marathi शाळा).
- **Articles:** child framing recorded as "**an** before vowel *sounds* — an elephant, an egg; **a** before consonant sounds — a box; **the** for the one we all know" — no letter-based rule, no written-language exceptions at Grade 1. Wired into bal 1.5/1.6 grammarConcepts and the meb phonics chapters' an-preview.
- **Bilingual example validation:** all 213 vocabulary glosses scanned for cross-language contamination (0 suspects); all 136 example turns scanned for hi/mr mislabeling (0 suspects); the two checkpoint-2 records use the corrected bridge with each language named correctly.
- **Synthetic ≠ approved:** every example review note states that syllabus alignment is agent verification only; 11 examples remain explicitly `UNREVIEWED_SYNTHETIC_CANDIDATE`; the whole corpus stays `DRAFT_PENDING_TEACHER_REVIEW`.
- **Memory milestones:** all 21 map entries carry `recallDesign` (repeat / independent / delayed), and all 133 bank examples' masteryChecks now begin with an explicit `[INDEPENDENT_ANSWERING]` or `[DELAYED_RECALL]` label — repetition alone can never satisfy a mastery check (validator-enforced).
- **Pre-literate concreteness:** MEB hints privilege action, gesture, picture and real-object channels (point/sort/fetch/mime are valid first answers) — explanations never assume the child can read.

## Deliverable 6 — Dataset source and copyright notes

`dataset-sources.md` §checkpoint-2. Highlights:
- **books.ebalbharati.in/ebookmeb.aspx** is a plain download page for a numbered **MEB workbook series** ("My English Book 1–8", no editions/years shown). It is NOT the Std 1 textbook library and must not be conflated with *My English Book — Grade One (Non-English Medium)*. Workbook PDFs unopened → `UNVERIFIED`.
- **maa.ac.in ShikshakMargdarshikaStdOne.pdf**: 152 pages, scanned images only (no text layer), PDF created **2020-12-04** → an older-generation guide, recorded as **historical reference only; never presented as a verified 2025 handbook** (the 2025 books post-date it).
- **Copyright:** both 2025 books print "Some permission are awaited. Acknowledgement to them will be made in subsequent reprint." bal names 6 third-party credits (Unit One: 1.1 *A to Z Teacher's Stuff*, 1.9 *Jean Warren*); **meb names none** → its rhyme chapters default to `THIRD_PARTY_PERMISSION_AWAITED`. Datasets remain titles/pages/word-banks/pedagogy only — zero reproduced passage text.
- **Common Voice citation rule** recorded as standing convention: exact release per claim (e.g. Hindi v26.0 = 15.6 validated hrs, Mozilla Data Collective snapshot 2026-10-31).

## Deliverable 7 — Validator results

```
$ node curriculum-research/tools/validate-curriculum.mjs
ALL CHECKS PASSED — tracks: bal 10/10 + meb 11/11 chapters · examples: 135 · mistakes: 38
```
Guards now include: dual-track discriminator + prefix consistency; selectionModel wording (school/admin selects; students never choose); curriculumVersion completeness; three-milestone recallDesign; role-tagged mappings + roadmap-title drift check vs `backend/src/curriculum/roadmap.ts`; review-honesty (no teacher-approval claims); शाळा terminology rule; milestone labels on every masteryCheck; audioAsset honesty. Full detail: `curriculum-validation-report.md`.

## Deliverable 8 — Branch, commit and draft PR

- Branch `feature/ai-curriculum` built in an **isolated worktree** (`D:\talkor\talkor-wt-curriculum`); the shared checkout and all other agents' branches untouched; no resets, no force-push.
- Pushed to `therealsaad/talkor` (`origin/feature/ai-curriculum`).
- **Draft PR open against `main`, containing only `curriculum-research/` files** — no runtime code. PR URL will be posted to issue #64 immediately after this commit (see final section once opened).

## What I did NOT do

- No runtime integration, no schema consumption by app code, no changes to `g01-l01` implementation, canonical level IDs, or any chapter ID.
- No Units Two–Four datasets (whole-book indexes verified and listed; page-level extraction awaits scope).
- No Balbharati permission requests, no QR audio use, no citation of the 2020 guide as 2025 evidence.

**Awaiting from you:** approval of the coverage matrices (§4) and final schema v1.1.0 sign-off; the full MEB teaching-example bank (8 states × 11 chapters) is queued behind matrix approval.

— Z.ai Curriculum Agent

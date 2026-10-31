# Talkora Curriculum Research — Balbharati Class 1, Unit One

**Sprint 1 deliverable | Prepared by:** Z.ai Curriculum Agent | **Date:** 2026-10-31
**Branch:** `feature/ai-curriculum` | **Status:** Research complete; pedagogy fields pending human teacher review

---

## 1. Scope and headline findings

This sprint researched the official Maharashtra State Board (Balbharati) English curriculum for Grade One and produced a machine-readable Unit One dataset for Miss Julie. Headline findings:

1. **Edition verified.** The current official textbook is *English Balbharati — Grade One* (2025), approved by the Coordination Committee on **April 16, 2025, for use from academic year 2025-26 onwards**, aligned with the Foundational Stage Curriculum 2024 (NEP 2020) and verified by SCERT Maharashtra. Source: official eBalbharati PDF, read directly this sprint — [ebooks.ebalbharati.in/pdfs/103050001.pdf](https://ebooks.ebalbharati.in/pdfs/103050001.pdf).
2. **No edition drift in Talkora's implemented Class 1 content.** The repo's `backend/src/curriculum/class1-first-day-poem.ts` cites "English Balbharati Grade One (2025), printed p.1, 1.1 My First Day" — and all 12 words of its `FIRST_DAY_POEM_WORD_BANK` appear in the official page-1 "Look and say" word bank. The claim checks out against the official source.
3. **The generic Class 1 starters are correctly self-labelled.** `backend/src/curriculum/class-1/lessons.ts` (Animals & Objects, My School Things) is generic enrichment, and `backend/src/curriculum/types.ts` explicitly says *"School-editable starter curriculum content; not an approved textbook syllabus."* No reconciliation needed — but these units are not Balbharati-derived, and this sprint's map gives the app its first verified syllabus backbone.
4. **Unit One is well-suited to Miss Julie's speaking pedagogy:** it opens with an action poem, body-action rhymes, early phonics, a colours poem with a gentle articles lesson, two dialogue/self-introduction chapters, and a daily-routine chapter — all speakable, all adaptable to the DISCOVER → … → RECALL design language.

## 2. Edition verification (all facts below were read from the official PDF on 2026-10-31)

| Field | Value | Confidence |
|---|---|---|
| Title | English Balbharati — Grade One | OFFICIAL_SOURCE_VERIFIED |
| Publisher | Maharashtra State Bureau of Textbook Production and Curriculum Research, Pune (Balbharati) | OFFICIAL_SOURCE_VERIFIED |
| Edition year | 2025 (first use AY 2025-26) | OFFICIAL_SOURCE_VERIFIED |
| Approval | Coordination Committee meeting held April 16, 2025 (GR No. Abhyas-2116/(Pra.Kra.43/16) SD-4 dated April 25, 2016) | OFFICIAL_SOURCE_VERIFIED |
| Alignment | Foundational Stage Curriculum 2024, based on NEP 2020; verified by SCERT Maharashtra | OFFICIAL_SOURCE_VERIFIED |
| Extent | 92 PDF pages; 4 units; 44 chapters; Unit One = printed pages 1–17 | OFFICIAL_SOURCE_VERIFIED |
| Source URL | https://ebooks.ebalbharati.in/pdfs/103050001.pdf (eBalbharati ebook library; syllabus-year filter 2026 current, 2025 selectable) | OFFICIAL_SOURCE_VERIFIED |

**Verification method:** the official PDF was downloaded and its text extracted (pypdf) during this sprint. No chapter title, page number, or word bank in the dataset files was inferred from memory or secondary sources; everything was read from the PDF. The Contents page (PDF page 10) lists all four units and credits six third-party poems.

## 3. Official table of contents (verified, cited for reference only — no chapter text reproduced)

**UNIT ONE (printed pp. 1–17)** — the scope of this sprint's dataset:
1.1 My First Day (p.1, poem — third-party credit: *A to Z Teacher's Stuff*) · 1.2 Clap your hands. (p.2) · 1.3 I know my alphabet. (p.3) · 1.4 Let us read. (p.5) · 1.5 Fun with Special Letters (p.7) · 1.6 The Rainbow (p.8) · 1.7 Meet my family. (p.10) · 1.8 Let us know each other. (p.11) · 1.9 Everybody has a name. (p.14, poem — third-party credit: *Jean Warren*) · 1.10 My Daily Routine (p.16). Activity Time (newspaper-cap folding, p.15) sits inside the 1.9 block.

**UNIT TWO (pp. 18–40):** 2.1 It's Time to Play (p.18, credit *Devon Thagard/Troy McDonald*) · 2.2 Avni's Visit to a Park · 2.3 In the Classroom · 2.4 My House · 2.5 Weather · 2.6 Magic Words · 2.7 Things I Do · 2.8 Classroom Library · 2.9 Our Vehicles · 2.10 Himani and the Ladybug · 2.11 My Flower (credit *Margaret Schroeder*) · 2.12 Festivals.

**UNIT THREE (pp. 41–60):** 3.1 Opposites · 3.2 Suyog makes friends. · 3.3 The Fox and the Crow · 3.4 Books are my best friends. · 3.5 Open a book. · 3.6 Raghu goes to the market. · 3.7 The Squirrel · 3.8 Alia falls sick. · 3.9 The Ant and the Grasshopper · 3.10 Minku, the Monkey · 3.11 My Kitty Cat (credit *Ryan Gibbs*).

**UNIT FOUR (pp. 61–80):** 4.1 A boy went walking · 4.2 Harry, the Hippo · 4.3 Singing is Fun! · 4.4 A Walk in Nature · 4.5 The Elephant and the Ants · 4.6 Off to Mars! · 4.7 Honest Abhi · 4.8 A Joyful Day · 4.9 A Gift for Mother · 4.10 Cookout (credit *Lauren Shirk*) · 4.11 Summer Holidays.

Unit One is delivered as `balbharati-class1-unit1-map.json` (10 entries). Units Two–Four are listed here for planning only and are **out of Sprint 1 scope**; their titles are verified but their page-internal content has not been extracted into datasets yet.

## 4. Unit One chapter analysis (pedagogy mapping)

Each chapter was mapped to Miss Julie's teaching design. Full per-chapter detail (vocabulary with Hindi/Marathi glosses, adaptive hints per learner state, mastery indicators, remediation) lives in `balbharati-class1-unit1-map.json`; the summary:

| Chapter | Verified core content | Teaching design highlights |
|---|---|---|
| 1.1 My First Day | Poem; 12-word "Look and say" bank (see, skip, walk, grin, bell, rings, jump, play, school, Grade, everyone, hurray) | TPR first (act before say); already implemented in repo — dataset cross-links to it |
| 1.2 Clap your hands. | Action rhyme; 14-word body/action bank; teacher note: swap actions by colour scheme; numbers one–five woven in | Command game (child commands Miss Julie); instruction-following without modelling |
| 1.3 I know my alphabet. | Letter sets Aa…Zz (sampled pairs); capital/small card game "We go together"; middle-'e' sound maze | Letter-name vs letter-sound distinction; b/d twin disambiguation |
| 1.4 Let us read. | Word families (am/an/as/at; be/he/me/we; if/in/is/it; of/on/or); sight words go no so by my up us; build with _en/_an/_in/_op/_un; break-downs man-go, pen-cil, win-window, pop-popcorn, sun-Sunday | Word-family train; onset-first decoding; unseen-word transfer as the mastery gate |
| 1.5 Fun with Special Letters | a, e, i, o, u as "special letters"; red vowels/blue consonants colour coding; words ball, dog, cup, ice, tree, onion, zebra, umbrella; missing vowels (s__n, c__t, f__sh, __gg, __wl) | Sick-word healing narrative; minimal-pair listening courts |
| 1.6 The Rainbow | Colour poem; seven colour bands; word bank (rainbow, peeping, sky, clouds, orange, indigo); "Do you know?" prompts; **articles lesson** — a/an/the with ~26 practice words incl. Ganga, Earth, Mars (the book's own teacher notes state the a/an/the rules) | Article decision test (first sound) instead of rule lectures; boss-'the' story for unique things |
| 1.7 Meet my family. | Home-visit dialogue; Hello/Namaste/Welcome home/Nice to meet you; family members incl. the book's own Marathi kin terms Aaji, Ajoba, Kaka, Kaki; politeness box: Thank you → You are welcome / It's my pleasure | Role-play loops; register game (elder vs friend greetings); both-names rule for kin terms |
| 1.8 Let us know each other. | Six animal self-introductions (rabbit hops, cat eats fish, dog guards houses, monkey swings, tiger = national animal of India, deer runs fast); capital letters for special names; introduction pattern I am / I live in / I study in; "What is your name?"; Onion Ring game; cities Nashik, Mumbai, Palghar, Nagpur, Pune | Three-keys introduction built one at a time; animal-voice rehearsal for silent learners |
| 1.9 Everybody has a name. | Name poem (credit Jean Warren — **not reproduced**); fill-in frames (My name is ___ / My mother's name is ___ …); teacher notes: label belongings, every name is special; Activity Time paper-cap folding | Whisper-then-loud ladder; possessive 's as a "hug"; do-checks via the folding activity |
| 1.10 My Daily Routine | Picture speaking + clock (7.00 am); sentence frames with Help Box: get up, teeth, hair, school, breakfast, study, uniform, play, park, bed, family (frames add brush, bath, walk, homework, dinner, friends) | Timeline sequencing before production; mime-and-say pairs |

**Teaching paths.** All ten chapters carry adaptive hints for all eight learner states (complete beginner, Hindi-speaking beginner, Marathi-speaking beginner, answered incorrectly, silent, guessing repeatedly, fast learner, needs revision), plus remediation strategies and mastery indicators that require *independent use on a later check* — a first correct answer never declares mastery (per the PM's philosophy).

**Bilingual support.** Every vocabulary item carries Hindi and Marathi glosses written for Talkora (not copied from the textbook, which is English-only). The gloss style matches the repo's existing pattern in `class1-first-day-poem.ts` (Devanagari glosses inside code-mixed support lines).

## 5. Comparison: Talkora's current content vs the official edition

| Talkora artefact | Claim/Content | Official check | Verdict |
|---|---|---|---|
| `class1-first-day-poem.ts` | "English Balbharati Grade One (2025), printed p.1, 1.1 My First Day" + poem adaptation + 12-word bank | Official p.1 confirms chapter, placement, and word bank (12/12 match) | ✅ Aligned, no drift |
| `class-1/lessons.ts` (StarterUnits) | Animals & Objects; My School Things | Generic enrichment; file header and `types.ts` explicitly disclaim syllabus status | ✅ Correctly labelled; not Balbharati-derived |
| `level-map-contract.ts` / `roadmap.ts` | g01 addresses l01–l10 with editorial titles ("Little Words & My First Day" … "Story Time") | Editorial plan, no textbook claim ("Publishers must separately attach syllabus-verified content") | ✅ No conflict; this sprint proposes chapter→level mappings for PM approval |
| KG curriculum | Enrichment marked `schoolSyllabusApproved: false` | Out of scope (KG Balbharati mapping would be a separate sprint) | ➖ No action |

**Proposed chapter→level mapping (all marked `PROPOSED_MAPPING_PENDING_PM_APPROVAL` in the JSON):** 1.1→g01-l01; 1.2→g01-l07 (Action Words); 1.3/1.4/1.5→g01-l02 (My School — early reading block); 1.6→g01-l04 (Colours and Counting); 1.7→g01-l03 (People and Family); 1.8→g01-l08 + g01-l03; 1.9→g01-l03; 1.10→g01-l09 (My Day). The `roadmapTitle` field echoes the roadmap's exact title so future drift is detectable.

## 6. Copyright and licensing position

- The textbook's copyright page reserves all rights to Balbharati: *"No part of this book should be reproduced without the written permission of the Director, Maharashtra State Bureau of Textbook Production and Curriculum Research, Pune."*
- Six chapters across the book are third-party works credited in the Contents (Unit One: **1.1 My First Day** — *A to Z Teacher's Stuff*; **1.9 Everybody has a name** — *Jean Warren*).
- **What this dataset therefore does:** stores chapter titles, page numbers, word banks, exercise word lists, dialogue patterns and activity descriptions as *syllabus references*, plus Talkora-original pedagogy. **It does not reproduce** poem stanzas, dialogue text, or any passage text. Where the existing repo already implements an adaptation of 1.1, that code carries its own header note and is governed by its own authorization decision — this dataset adds no new reproduction.
- Practical implication for Codex: any new runtime content for 1.1/1.9 must continue to work from word banks and patterns, not full text. School-level authorization for textbook-content reuse is an open question for the PM (see §9).

## 7. Confidence and limitations

- All syllabus facts (titles, pages, word banks, activity types, exercise items, teacher notes): **OFFICIAL_SOURCE_VERIFIED** — read from the official PDF this sprint.
- PDF text extraction of a designed textbook is imperfect: picture-dependent content (the 1.10 clock face details, some exercise images in 1.3/1.6) was extracted as text labels and may miss visual detail. Chapter-level syllabus structure is unaffected.
- All pedagogy fields (objectives, hints, remediation, teaching examples, mistake predictions): **Talkora-original, agent-authored, pending human teacher review.** They are designed, not verified; the JSON marks the distinction explicitly (`review.pedagogyStatus`, `review.status: UNREVIEWED_SYNTHETIC_CANDIDATE`).
- Predicted student error forms (e.g. 'istamp', 'wery') are linguistically grounded in known Hindi/Marathi transfer patterns but must be validated against real classroom/ASR data.

## 8. Deliverable inventory

| File | Purpose | Verification status |
|---|---|---|
| `curriculum-research.md` | This report | — |
| `curriculum.schema.json` | JSON Schema (draft-07) for all three dataset shapes | Validated (see validation report) |
| `balbharati-class1-unit1-map.json` | 10 verified Unit One curriculum entries | Syllabus facts OFFICIAL_PDF_VERIFIED; pedagogy DRAFT_PENDING_TEACHER_REVIEW |
| `miss-julie-teaching-examples.json` | 133 teaching exchanges across 8 learner states × 10 chapters | 122 REVIEWED_SYLLABUS_ALIGNED (agent-verified alignment) / 11 UNREVIEWED_SYNTHETIC_CANDIDATE; all pending human teacher review |
| `learner-mistakes.json` | 38 mistake patterns with correction strategies | 27 REVIEWED / 11 candidate; all pending teacher review |
| `dataset-sources.md` | External dataset audit (Common Voice, AI4Bharat, EFCAMDAT, CMU Kids, …) | URLs and licenses web-verified 2026-10-31 |
| `curriculum-validation-report.md` | Automated validation results | Produced by `tools/validate-curriculum.mjs` |
| `handoff-to-codex.md` | Backend integration contract | — |

## 9. Unresolved questions for the PM

1. **Textbook-content authorization:** does Talkora have (or plan to seek) Balbharati permission for anything beyond references — e.g., rendering poem text in the app (the 1.1 implementation already exists)? This decides how far Units 2–4 datasets may go.
2. **Chapter→level mapping approval:** confirm or amend the proposed g01-l01…l10 mapping before any runtime wiring.
3. **Schema contract sign-off:** `curriculum.schema.json` v1.0.0 needs PM approval before Codex builds consumers against it.
4. **Human teacher review:** who reviews the pedagogy fields and the 133 examples? Until then they are draft-only and must not drive production dialogue verbatim.
5. **Scope of next sprint:** Units Two–Four extraction (titles verified already), or deepening Unit One (audio word banks, visual assets, teacher handbook cross-check)?

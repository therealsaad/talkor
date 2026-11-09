# Class 1 / Level 02 — Action Beats & Rainbow Words

**Code:** `g01-l02` · **Status:** original teacher-review draft, NOT PUBLISHED · **Source mapping:** existing editorial English Balbharati Standard One (2025; 2026 reprint), chapters 1.2–1.6, printed pp. 2–9.

## What's actually authored

- `../balbharati-curriculum.ts` anchors five original activities to chapters 1.2–1.6: clap, alphabet B, c-a-t letter building, vowel a/e/i/o/u identification, and red colour identification.
- `teaching-plan.ts` provides five corresponding original narrated teacher lines, optional Hindi/Marathi hints, evidence rubrics, six additional practice/review/homework activities, an original storyboard and six image briefs. It now also includes **five linked English target/model/retry records** (`CLASS1_LEVEL2_VOICE_SCENES`), each mapped to one of chapters 1.2–1.6 with an explicit teacher/media/device review gate. These are authoring models, not a newly installed student teaching engine.
- `exercise-checkpoints.ts` adds 19 numbered original **staff-only checkpoint drafts**, one for each exercise in 1.2–1.6. Movement, writing, poem performance and workbook evidence still require separate adult inspection.
- `activities.ts` exposes 30 staff-preview draft activities (5 introductions + 6 supplementary reviews + 19 exercise checkpoints), all `approved:false`; `studentPlayable:false` and `syllabusVerified:false` remain. No backend publication or voice-model inference was added.
- `interactions.ts` specifies the modes used by these authored drafts. `assets.json` deliberately lists no media that doesn't exist.

The 1.5 vowel teaching mismatch was corrected in the staff draft. The 19 numbered **checkpoints** now each have a draft review prompt, but this package does **not** yet deliver the full textbook exercises in a student-playable format. Tracing, the complete action rhyme, rainbow recitation, written articles and peer work require teacher-led activities, signed-off evidence rubrics, reviewed illustrations and licensed or original audio. 

## Critical release gates

1. Qualified school teacher compares the official book and approves all five 1.2–1.6 chapter mappings, original visuals, language examples and inclusive UX.
2. Create an **original, reviewed**, full introductory video. The future runtime must enforce intro completion after an initial user gesture; no in-app skip. A file path or config flag alone does not implement that security.
3. Create and optimize approved original pictures and voice lines for every teaching cue. Miss Julie's approved neutral character design must be preserved; never ship copyrighted textbook art without permission.
4. Wire the authored activities through the **existing** student lesson/grade/microphone/Azure/Sarvam system, NOT a parallel fake playground. Backend owns grading and saved progress. Audibly verified feedback receipt must precede any new credit, with no double award for review.
5. Run supervised school mic + speaker tests, Hindi/Marathi support and voice-first keyboard-free navigation, as well as the correct fresh PIN resume after a real next visit. Publish only through authorized existing curriculum approval controls, not by changing `studentPlayable`.

**Staff preview:** `/school/curriculum-studio/1/2`. Students must continue to the first unfinished **published** lesson. The draft is not a production-ready Class 1 L2 runtime.

## Reproducible coverage and release audit

Run `cd client && node scripts/report-class1-level2-readiness.mjs` to report the five source chapters, five authored English voice models with Hindi/Marathi support, and **all 19 individual exercise checkpoints**. The audit checks printed-page mapping, chapter order, per-chapter checkpoint numbering, English model presence, bilingual help, and that every scene is explicitly marked `reviewed:false` and `studentPlayable:false`. GitHub CI runs the regression test, including negative cases for lost exercises and false publication flags.

A clean report means the **draft authoring is internally consistent**, not that the teacher verified the syllabus, the source audio exists, or students can enter Level 2. All 19 workbook/listening/movement tasks still need individualized educator signoff, and the five short voice models must not be mistaken for completing them. This level remains blocked until the existing backend safely publishes fully approved Lesson/Activity records and the real mic-to-speaker/next-day-resume classroom test passes.

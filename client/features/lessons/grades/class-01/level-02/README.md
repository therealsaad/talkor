# Class 1 / Level 02 — Action Beats & Rainbow Words

**Code:** `g01-l02` · **Status:** original teacher-review draft, NOT PUBLISHED · **Source mapping:** existing editorial English Balbharati Standard One (2025; 2026 reprint), chapters 1.2–1.6, printed pp. 2–9.

## What's actually authored

- `../balbharati-curriculum.ts` anchors five original activities to chapters 1.2–1.6: clap, alphabet B, c-a-t letter building, vowel a/e/i/o/u identification, and red colour identification.
- `teaching-plan.ts` provides five corresponding original narrated teacher lines, optional Hindi/Marathi hints, evidence rubrics, six additional practice/review/homework activities, an original storyboard and six image briefs. These are not copied from the textbook or a publisher audio source.
- `activities.ts` exposes eleven staff-preview draft activities, each `approved:false`; `studentPlayable:false` and `syllabusVerified:false` stay in place. No backend publication or voice-model inference was added.
- `interactions.ts` specifies the modes used by these authored drafts. `assets.json` deliberately lists no media that doesn't exist.

The 1.5 vowel teaching mismatch was corrected in the staff draft. This package is still five introductory chapter demonstrations plus additional practice, **not the full 19 numbered textbook exercises** mapped on printed pp. 2–9. Written work, article activities, full action rhyme and rainbow recitation require separately signed-off teaching and evidence. 

## Critical release gates

1. Qualified school teacher compares the official book and approves all five 1.2–1.6 chapter mappings, original visuals, language examples and inclusive UX.
2. Create an **original, reviewed**, full introductory video. The future runtime must enforce intro completion after an initial user gesture; no in-app skip. A file path or config flag alone does not implement that security.
3. Create and optimize approved original pictures and voice lines for every teaching cue. Miss Julie's approved neutral character design must be preserved; never ship copyrighted textbook art without permission.
4. Wire the authored activities through the **existing** student lesson/grade/microphone/Azure/Sarvam system, NOT a parallel fake playground. Backend owns grading and saved progress. Audibly verified feedback receipt must precede any new credit, with no double award for review.
5. Run supervised school mic + speaker tests, Hindi/Marathi support and voice-first keyboard-free navigation, as well as the correct fresh PIN resume after a real next visit. Publish only through authorized existing curriculum approval controls, not by changing `studentPlayable`.

**Staff preview:** `/school/curriculum-studio/1/2`. Students must continue to the first unfinished **published** lesson. The draft is not a production-ready Class 1 L2 runtime.

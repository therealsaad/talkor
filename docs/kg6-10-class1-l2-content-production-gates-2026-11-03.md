# Talkora KG6–10 + Class 1 Level 2 — accelerated authoring packs

**Date:** 3 November 2026. **Status:** content drafts wired into staff-only previews, **NOT** school-syllabus approved, NOT student-playable, and NOT certified by a real classroom test.

## What changed — concrete work, not blank roadmap placeholders

- KG6, 7, 8, 9, and 10 each now have **8 original instructor-authored activity beats** (40 total), including picture recognition, listen/find, repeat-after-Julie, one simple guided exchange, a review and spoken homework. They are displayed by each existing staff curriculum studio workspace (`/school/curriculum-studio/0/6` through `/0/10`). Every activity remains `approved:false`.
- `client/features/lessons/grades/kg/future-level-drafts.ts` carries measurable evidence, age-appropriate words, original picture generation briefs, full-intro storyboard outlines and a teacher safety checklist for each level. No fake image/audio URL or pre-approved activity was introduced.
- For Class 1 Level 2, the existing five Balbharati 1.2–1.6 editorial activities are retained, with **six added original review/conversation/homework beats** (11 staff-preview activities total). `teaching-plan.ts` supplies five chapter-specific English teacher lines, short optional Hindi/Marathi hints, visible evidence, original animation storyboard and art briefs. **No textbook imagery or original publisher audio is reproduced.**
- The editorial KG roadmap titles now accurately reflect the existing KG3–5 letter pilots (K–P, Q–V, W–Z), and Class 1 roadmap titles match the ten existing source-linked Balbharati draft units. These source-only roadmap labels do not rewrite existing Mongo records.
- `config.learningPolicy.introRequired` / `introMustComplete` are set on these draft preview configs to express the future media requirement. **Design flags do not enforce a full-screen browser intro**; actual guarded media and signed backend introduction tickets are still missing for KG6–10 / Class 1 Level 2.

## KG teaching progression

| Level | Content draft | Model language | Avoid |
|---|---|---|---|
| 6 | Family Words | “family”, “baby”, “parent”, “grandparent” | personal family questions and household assumptions |
| 7 | My Classroom | “book”, “pencil”, “chair”, “A book, please” | real classroom/student identifiers |
| 8 | Feelings & Greetings | “happy”, “hello”, “thank you” | guessing a learner's real mood |
| 9 | Opposites & Directions | “big/small”, “up/down”, “left/right” | compulsory physical movement and accent penalties |
| 10 | Original Mini Story | a cat, ball, book, sun; retell one word | copyrighted reading passages and forced disclosure |

These are authoring ideas, not yet grounded in a verified school syllabus. Level 10 completes the outline only after teacher sign-off and real student-progression work.

## Class 1 Level 2 — source-linked editorial split

The existing `balbharati-curriculum.ts` identifies Standard One chapters 1.2 to 1.6 and printed pp. 2, 3, 5, 7 and 8. The first five draft exercises map to each chapter, and the next six are **supplemental original practice**. Respect the syllabus sequence; do not skip textbook content or mistake an editorial rubric for an assessed, published student activity.

The approved Level 1 First Day v3 gating and previous student data stay untouched; do not migrate or overwrite records to test Level 2. Approved revised intro, lesson-specific optimized art, real cloud voice, tolerant STT, safe scoring, sample lesson sessions, and teacher/student sign-offs are still required.

## Definition of done before publishing each level

1. School/teacher signs off exact educational targets, visuals, wording and any language bridge with native speakers; media rights cleared.
2. Approved original full-screen intro is playable, audible and verified without an in-app skip; server records an eligible completed intro before activities. Browser OS controls are not tamperproof, use managed kiosk where needed.
3. All optimized media exists, its URLs are checked, Miss Julie's neutral identity is consistent, accessibility and reduced motion work.
4. Students can enter only when the **previous approved level** is actually complete; URL deep-links cannot bypass the published-level sequence.
5. Real microphone → Sarvam → safe grade/rule/Qwen where justified → Azure → full audio receipt → Mongo progress is verified on a supervised device; correctness requires an independently spoken English answer and safe retries.
6. School teacher validates no duplicate XP, no prior curriculum loss, previous completed lessons can still be revised, and **next-day** clean PIN login resumes the first unfinished activity.
7. Latency analyzed from actual backend logs and physical mouth-to-ear observation, with a defined local p95 budget rather than synthetic numbers.

**Neither this draft PR nor synthetic CI may be used as permission to enable KG6–10 or Class 1 Level 2 in production.**

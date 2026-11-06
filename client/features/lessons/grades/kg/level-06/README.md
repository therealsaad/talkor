
# Kindergarten Level 6 — Vowel Garden

**Code:** `g00-l06` · **Design:** Rainbow Valley · **Status:** DRAFT / NOT STUDENT PLAYABLE · **Teacher approval:** required.

## 1. Approved Staff Preview — Vowel Garden

The approved staff preview plays `/lessons/kg/level-06/vowels.MOV` full-screen as the introduction. When the video ends, it continues into Vowel Garden and teaches what a vowel sound is, then practices the five short vowel sounds in order:

- A /æ/
- E /ɛ/
- I /ɪ/
- O /ɒ/
- U /ʌ/

It does not teach “A for apple” word pairs.

The garden uses a teacher-and-learning-board layout inspired by the Level 4 preview: Miss Julie appears beside the active vowel sound, with a progress strip and a speech bubble. The intro video is no longer on screen during this phase, so only one Julie is visible.

There are no distractors or lesson-control buttons. Miss Julie speaks each prompt and feedback, pauses five seconds, then listens automatically for the learner.

Each card shows only its vowel letter, IPA sound, and a mouth-position cue, and the cards advance in order.

Speech requests use the existing staff-only preview authorization and rate limit. Attempt audio and transcripts are processed for the preview response only; this flow does not save student progress, recordings, or transcripts.

## 2. Curriculum and Staff Authoring Pack

Inclusive fictional people and family words; no questions about the student's household.

This workspace now sources **eight original, concrete educator-review beats** from `../future-level-drafts.ts`.

The pack includes a Miss Julie intro storyboard, original picture design briefs, target and review vocabulary, measurable evidence and short spoken homework.

Teacher and school have not approved the content. It is neither a generated AI lesson nor a connected student progress engine yet.

- `activities.ts` calls `kgFutureDraftActivities(6)`: every step is `approved:false`.
- `config.ts` deliberately preserves `studentPlayable:false`, `syllabusVerified:false`, `boardReviewRequired:true`, and marks full intro required **before any future publication**.
- `assets.json` contains no invented URLs; intro video, art, audio and browser playback remain uncreated and unverified.
- `LevelExperience.tsx` is a staff-only preview, not the student route.
- `interactions.ts` now permits the authored guided dialogue in the staff preview.

## 3. Release Blockers

1. Teacher validates content against the actual KG school syllabus, safeguarding and required age-level understanding.
2. Produce and approve an original full-screen video using the approved neutral Miss Julie character. Enforce an actual no-skip intro ticket on the server, not only the design flag.
3. Produce real optimized illustrations, accessible alt text, voices, safe retries and listening/English-mastery rubrics. Never fabricate media paths.
4. Implement and test authenticated server-owned activity sequence, new progress persistence and **correct + fully played voice feedback** before student unlock. One login must always resume first unfinished level, not allow URL bypass.
5. Supervised lab acceptance: real microphone, Sarvam, appropriate bounded AI, Azure/approved TTS, no double XP, and next-day PIN resume.

## 4. Publication and Student Access Restrictions

This level remains unpublished:

- `studentPlayable` is `false`.
- `staffOnlyPreview` is `true`.
- `syllabusVerified` is `false`.
- `boardReviewRequired` is `true`.

Do not route students to it or publish it without curriculum review and authorization.

**Staff preview:** `/school/curriculum-studio/0/6`

KG6–10 remain locked in the authoritative student catalog and map.

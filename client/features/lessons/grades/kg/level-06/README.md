# Kindergarten Level 6 — staff authoring pack

**Code:** `g00-l06` · **Status:** DRAFT / NOT STUDENT PLAYABLE · **Teacher approval:** required.

## Curriculum

Inclusive fictional people and family words; no questions about the student's household.

This workspace now sources **eight original, concrete educator-review beats** from `../future-level-drafts.ts`. The pack includes a Miss Julie intro storyboard, original picture design briefs, target and review vocabulary, measurable evidence and short spoken homework. Teacher and school have not approved the content. It is neither a generated AI lesson nor a connected student progress engine yet.

- `activities.ts` calls `kgFutureDraftActivities(6)`: every step is `approved:false`.
- `config.ts` deliberately preserves `studentPlayable:false`, `syllabusVerified:false`, `boardReviewRequired:true`, and marks full intro required *before any future publication*.
- `assets.json` contains no invented URLs; intro video, art, audio and browser playback remain uncreated and unverified.
- `LevelExperience.tsx` is a staff-only preview, not the student route.
- `interactions.ts` now permits the authored guided dialogue in the staff preview.

## Release blockers

1. Teacher validates content against the actual KG school syllabus, safeguarding and required age-level understanding.
2. Produce and approve an original full-screen video using the approved neutral Miss Julie character. Enforce an actual no-skip intro ticket on the server, not only the design flag.
3. Produce real optimized illustrations, accessible alt text, voices, safe retries and listening/English-mastery rubrics. Never fabricate media paths.
4. Implement and test authenticated server-owned activity sequence, new progress persistence and **correct + fully played voice feedback** before student unlock. One login must always resume first unfinished level, not allow URL bypass.
5. Supervised lab acceptance: real microphone, Sarvam, appropriate bounded AI, Azure/approved TTS, no double XP, and next-day PIN resume.

**Staff preview:** `/school/curriculum-studio/0/6`. KG6–10 remain locked in the authoritative student catalog and map.

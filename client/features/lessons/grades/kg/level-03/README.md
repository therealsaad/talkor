# Kindergarten / Level 03 — Letters K to P

**Code:** `g00-l03` · **Design:** Coral Lagoon · **Status:** draft

- `LevelExperience.tsx` — staff-only preview of the supplied introduction, six-letter selection, and sequential speaking activities. K–P letter responses are graded transiently; attempts, transcripts, and student progress are not stored.
- `config.ts` — grade-specific objectives, theme, animation mood, audio policy, and resume behavior.
- `activities.ts` — real approved activities (empty until authored); ideas do not count as activities.
- `interactions.ts` — available voice/touch/corrective-feedback modes.
- `assets.json` — references to approved media; never add dead placeholder URLs.
- `index.ts` — exports used by the lazy-loaded 110-level registry.

## Authoring workflow

1. Verify the official syllabus and update `config.syllabus` with school-approved outcomes; set `syllabusVerified` only after review.
2. Build real prompts, answer rubrics, and follow-up hints in `activities.ts` using the shared activity engine. Keep activities empty until end-to-end tests exist.
3. Store optimized per-level art/media in `client/public/lessons/kg/level-03/`; register real paths in `assets.json`.
4. Use the existing Azure/Groq/STT backend providers; static clips may use S3, while spontaneous corrections are uncached.
5. Preview via `/school/kg-preview` and choose Level 3; test the introduction, all six letter choices, microphone, playback, reduced motion, and permission boundaries.
6. Publish only using authorized existing DB publication workflow after approval. Do not set `studentPlayable: true` merely to make the preview look complete.

This remains a draft workspace: `activities.ts` must stay empty and `studentPlayable` must stay `false` until the curriculum, assets, interactions, and end-to-end checks are approved. The student route must not expose it before that review.

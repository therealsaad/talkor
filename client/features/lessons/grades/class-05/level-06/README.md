# Class 5 / Level 06 — Asking Follow-up Questions

**Code:** `g05-l06` · **Design:** Rainbow Valley · **Status:** draft

- `LevelExperience.tsx` — staff-only visual design prototype. Never directly route students here.
- `config.ts` — grade-specific objectives, theme, animation mood, audio policy, and resume behavior.
- `activities.ts` — real approved activities (empty until authored); ideas do not count as activities.
- `interactions.ts` — available voice/touch/corrective-feedback modes.
- `assets.json` — references to approved media; never add dead placeholder URLs.
- `index.ts` — exports used by the lazy-loaded 110-level registry.

## Authoring workflow

1. Verify the official syllabus and update `config.syllabus` with school-approved outcomes; set `syllabusVerified` only after review.
2. Build real prompts, answer rubrics, and follow-up hints in `activities.ts` using the shared activity engine. Keep activities empty until end-to-end tests exist.
3. Store optimized per-level art/media in `client/public/lessons/class-05/level-06/`; register real paths in `assets.json`.
4. Use the existing Azure/Groq/STT backend providers; static clips may use S3, while spontaneous corrections are uncached.
5. Preview via `/school/curriculum-studio/5/6`; test microphone, playback, reduced motion, student resume, and permission boundaries.
6. Publish only using authorized existing DB publication workflow after approval. Do not set `studentPlayable: true` merely to make the preview look complete.

This is an intentionally blank level workspace. The student route must not expose it until approved.

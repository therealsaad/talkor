# Kindergarten / Level 02 — Letters E to J

**Code:** `g00-l02` · **Design:** Letter Garden · **Status:** staff-only draft preview

- `PreviewIntro.tsx` — staff-only, full-video intro. E activity entry requires its one-use session marker.
- `LevelExperience.tsx` — transient E–J speaking preview. It records no student progress.
- `level2-flow.ts` — E–J bounds, video completion checks, and transient answer transitions.
- `services/kg-level2-preview-service.ts` — fixed narration and answer requests to authenticated backend preview endpoints.
- `config.ts` — grade-specific objectives, theme, animation mood, audio policy, and resume behavior.
- `activities.ts` — E–J speaking preview definitions. These are not publication approval.
- `interactions.ts` — the microphone-based repeat-after-Miss-Julie mode.
- `assets.json` — references the verified intro video only; voice is synthesized by the backend.
- `index.ts` — exports used by the lazy-loaded 110-level registry.

## Authoring workflow

1. Verify the official syllabus before setting `syllabusVerified`.
2. The intro video is `/lessons/kg/level-02/level-2-e-to-j.mp4`.
3. Staff narration is fixed E–J text synthesized uncached by the authenticated Azure voice endpoint; speech answers are graded server-side.
4. Preview via `/school/kg-preview/level-2`; test the full intro, microphone, retries, and permission boundaries.
5. Publish only through the authorized curriculum workflow after approval. Keep `studentPlayable: false` and `staffOnlyPreview: true`.

Student routes must not expose this staff preview. Preview attempts and progress are never persisted.

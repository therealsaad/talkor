# Kindergarten / Level 01 - ABCD Picture Garden

**Code:** `g00-l01` | **Design:** Petal Garden | **Status:** existing runtime

- `LevelExperience.tsx` - canonical live KG Level 1 experience used by students and staff preview.
- `config.ts` - registry metadata, theme, audio policy, and resume behavior.
- `activities.ts` - metadata for the eight approved speak and picture activities.
- `interactions.ts` - available voice, touch, and corrective-feedback modes.
- `assets.json` - the real intro, picture, Miss Julie animation, music, and authenticated audio sources.
- `components/`, `hooks/`, `services/`, and `styles/` - lesson-owned runtime code relocated from app-wide folders.
- `index.ts` - exports consumed by the lazy-loaded 110-level registry.

## Runtime integration

1. `client/features/lessons/registry.ts` maps `g00-l01` to this directory.
2. `/student/kg` is a thin `RegisteredLevelExperience` wrapper and contains no lesson implementation.
3. `/school/kg-preview` resolves this same module with preview props, so it never writes student progress.
4. The backend keeps grading, intro tickets, persistence, authorization, reporting, Groq STT, and S3/Azure voice behind the existing `/kg-alphabet` endpoints.
5. Levels 2-10 remain draft workspaces and are rejected by the student resolver.

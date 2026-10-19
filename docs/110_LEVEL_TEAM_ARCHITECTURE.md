# Talkora 110-Level Team Architecture — Oct 2026

## Non-negotiable design constraints

**Keep the user's current frontend as the source of truth.** This release adds a staff-only design/authoring preview to the existing school dashboard. It does not recreate student navigation, replace KG Level 1, or overwrite the Class 4 learning system.

- Classes KG (`grade=0`) through Class 10 (`grade=10`); level numbers 1–10, ID `g00-l01` through `g10-l10`.
- **One existing backend**: Express routes, controllers, MongoDB `CurriculumClass -> Level -> Lesson -> Activity`; `backend/src/scripts/map-110-curriculum.ts` creates *draft* placeholders only.
- **110 independent frontend workspaces**, one per grade/level; one shared lightweight staff preview, one lazy-importing registry, not 110 copies of authentication/STT logic.
- **Different taste for every level**: 110 unique color palettes/theme IDs, class-appropriate interaction policies, 10 visual-world motifs per grade, grade/topic-specific copy and editable assets. Content and final visual assets must be authored by the team.
- **Student player unchanged**: `client/app/student/lesson/[id]/page.tsx` continues using the authenticated ActivityEngine, with the KG ABCD pilot at `/student/kg`.
- **Never use the staff preview as a student lesson**. Its activity list is intentionally empty; publication must validate real activities, syllabus sign-off, teacher approval, and server authorization.

## Directory architecture

```text
Talkora/
  client/
    app/student/kg/page.tsx                  EXISTING KG ABCD runtime
    app/student/kg/map/page.tsx              optional KG revisit map
    app/student/lesson/[id]/page.tsx         EXISTING secure lesson player
    app/school/curriculum-map/page.tsx       EXISTING 110-level planning index
    app/school/curriculum-studio/[grade]/[level]/page.tsx  NEW staff-only design preview
    features/lessons/
      types.ts                               shared typed authoring contracts
      LevelDraftPreview.tsx                  NEW staff-only preview (no grading)
      level-studio.module.css                responsive thematic stage
      registry.ts                            110 literal lazy imports
      grades/
        kg/level-01/...level-10/
        class-01/level-01/...level-10/
        ...
        class-10/level-01/...level-10/
    public/lessons/{grade}/level-{number}/     empty asset directories (.gitkeep)
    public/miss-julie-animations/              seven alpha-channel video clips
    public/kg/audio/garden-ambience-v1.mp3    separate music track
    public/kg/videos/fullkg.mp4               compulsory KG1 video
  backend/src/
    curriculum/roadmap.ts                     existing editorial topic source
    curriculum/level-design-manifest.json     NEW staff theme catalog for 110
    curriculum/studio-catalog.ts              NEW validation/access helpers
    scripts/map-110-curriculum.ts             existing safe mapping migration
    controllers/level-map.controller.ts       staff studio metadata endpoint
    routes/level-map.routes.ts                authenticated staff-only routing
    models/{CurriculumClass,Level,Lesson,Activity}.ts existing data model
  tools/verify-110-levels.cjs                 dependency-free structural check
```

## Per-level editor contract

Each `client/features/lessons/grades/{grade}/level-XX/` contains:

| File | Responsibility |
|---|---|
| `config.ts` | Grade, level, approved objectives, theme palette, ambient sound, adaptive/resume policies. `staffOnlyPreview: true`. |
| `activities.ts` | Approved activities array, initially `[]`, plus distinct creative proposals for a teammate. |
| `interactions.ts` | Available touch/speak/roleplay modes; stop music while microphone captures; seven Miss Julie states. |
| `assets.json` | Explicit asset registry; no non-existent image, video or TTS URLs. |
| `LevelExperience.tsx` | Imports the common *staff* preview. Can later be replaced by an original lesson experience, but never routed to students before publishing. |
| `index.ts` | Typed exports registered by lazy import. |
| `README.md` | Local authoring/review checklist. |

**Teacher workflow:** open `/school/curriculum-map` -> select grade/level -> `Open design workspace` -> see distinct theme -> edit its folder in Git -> create real Activities/API packages -> run review. A staff preview is not a new MongoDB curriculum record.

## Contract between frontend and backend

- Existing staff APIs: `GET /api/v1/curriculum-map/grades`, `/grades/:grade`, `/grades/:grade/levels/:level` (exact prefix comes from Express route mounting).
- New staff metadata API: `GET /api/v1/curriculum-map/grades/:grade/levels/:level/studio`; *never returns private student data*. It requires authentication, School Admin/Teacher role, validated grade/level, and uses existing KG teacher restrictions.
- Existing student endpoints continue deriving the student’s class from the authenticated identity, NOT from a URL or client payload.
- Each content address maps to existing `CurriculumClass` / `Level` / `Lesson` / `Activity`; no 110 duplicated controllers. Blank draft lessons have no active Activity records.
- Make authoring/publishing transactional (or safely idempotent); add explicit approval and rollout gates before allowing unpublished designs into student queries.

## Audio and animation pipeline

- High-quality Miss Julie 3D poses: silence/idle, speaking, listening, thinking, pointing, encouraging, celebrating. New animation pack is placed at `/miss-julie-animations/`. **Pose state video does not equal phoneme lip-sync.** True lip-sync requires aligned visemes or per-line rendered audio/video.
- Static syllabus phrases: pre-generate once via local AI service or Azure, store optimized versions in private S3/CDN with explicit version keys. Existing KG runtime now prefers Azure live prompts where configured. Dynamic student-specific corrections: Azure on-demand; do not persist private individual voices. Groq/STT evaluation remains backend-authoritative.
- Music separate from TTS, duck on speech, silence when recording, respect school mute/reduced-motion; no music baked into each lesson voice clip.
- Backend keys only in `backend/.env`, never `NEXT_PUBLIC_*` or Git. Proper API throttling must be user/school aware in labs.

## Mandatory video

KG Level 1 video remains `/kg/videos/fullkg.mp4` and is protected by an authenticated watch ticket and completion handler. Browsers cannot force F11 or block the OS escape key. Managed Chrome/Edge kiosk policy is required for enforced fullscreen, with server refusing progression until valid completion. Browser events/timing alone cannot prove human attention.

## Grade-appropriate lesson design

| Grade band | Theme system | Default exercises |
|---|---|---|
| KG | Colorful 3D gardens/animals/objects; mostly voice and large touch targets | Tap pictures; speak letters; listen and find |
| Classes 1–3 | Story villages, picture scenes and playful quizzes | Guided dialogue; picture choice; word builder |
| Classes 4–6 | World journeys, stories, presentations and sentence puzzles | Role-play; sentence builder; listening comprehension |
| Classes 7–10 | More mature interview/debate scenarios, studio and media settings | Scenario decision; sustained conversation; speaking reflection |

The 110 topics come from the **existing Talkora roadmap**, not an independently verified NCERT/school syllabus. A subject teacher must confirm chapter mapping, vocabulary, prompts and rubrics before publication.

## Four-person team split and PR process

1. **Lead / integrator:** owns `client/features/lessons/types.ts`, registry, authenticated routes, DB publication, CI, integration, and regression approval. Protects `main`.
2. **Junior designer:** owns `client/features/lessons/grades/kg/` and `class-01`–`class-03`, plus their `client/public/lessons/` assets. Coordinate any changes to live KG1.
3. **Middle designer:** owns `class-04`–`class-06` workspaces. Never overwrite existing working Class 4 runtime; edits are additional/new levels only.
4. **Senior/AI engineer:** owns `class-07`–`class-10` workspaces and backend voice/STT/teacher correction integration; coordinate shared services with the lead.

Example branch `feature/class-01-level-01`, edit `.../class-01/level-01/*`, `git add client/features/lessons/grades/class-01/level-01 client/public/lessons/class-01/level-01`, commit and PR. No `git push --force` on main. Review both schema and actual lesson playback in staging before merge.

## Verification and deployment gates

1. `node tools/verify-110-levels.cjs` must report 110/110, unique themes, no publication leakage.
2. `cd backend; pnpm install --frozen-lockfile; pnpm build; pnpm test` (needs package registry and test DB).
3. `cd client; pnpm install --frozen-lockfile; pnpm build` (needs package registry).
4. With staging MongoDB: `cd backend; pnpm curriculum:map:dry-run`; inspect and back up before optional `pnpm curriculum:map:apply`.
5. Test five-digit PIN against every school role, lab logout, intro/ticket replay, KG touch and speech, teacher preview, progress report security and Class 4 regressions.
6. Test S3 and Azure under rate limits, Groq/STT microphone path in secure HTTPS context, actual browser autoplay policy, video fullscreen and kiosk deployment.
7. Use provided `tools/load` load scripts with real expected concurrency and monitor p95 audio latency, DB indexes, memory, bandwidth and failure rates. 10K accounts ≠ 10K concurrent requests.

**Not production-approved:** This is a complete *editable architecture and design atlas*, not 110 finished lesson bodies or a 20/20 operational certification.

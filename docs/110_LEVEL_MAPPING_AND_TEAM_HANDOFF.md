# Talkora — 110-level mapping, authoring and integration handoff

**This is a data-driven full-stack curriculum ADDRESS MAP, not 110 published lessons.** Each existing `CurriculumClass -> Level -> Lesson -> Activity` model is reused as designed. A separate model/controller/route PER LEVEL would be unnecessary duplication and harder to secure.

## Exact coverage and identifiers

- Grades: `0` = Kindergarten, `1`–`10` = Class 1–10.
- Levels per grade: exactly `1`–`10`; stable external address `g00-l01` through `g10-l10`.
- All 110 titles and initial educational goals live in `backend/src/curriculum/roadmap.ts`. They are **editorial titles, not school-approved textbook syllabuses**. Existing Class 4 published MongoDB titles override planning titles in the school preview; nothing renames them.
- `backend/src/curriculum/level-map-contract.ts` validates addresses and publication status.
- `backend/src/services/level-map.service.ts` projects actual Mongo class, level, lesson and activity status in bounded grade-specific reads.
- `backend/src/controllers/level-map.controller.ts` and `backend/src/routes/level-map.routes.ts` serve all addresses. Staff API is registered in the **existing** `backend/src/routes/index.ts`.
- `backend/src/models/Level.ts` accepts `unitNumber` 1–10 (the previous 1–8 limit would make levels 9 and 10 collide). Existing published 1–8 records are unchanged.
- `backend/src/scripts/map-110-curriculum.ts` creates missing curriculum class documents, Level documents, and one **empty draft** Lesson document per NEW Level. It writes **zero** Activity documents; no placeholder is student-playable.
- Frontend client uses `client/services/grade-level-map.ts`; school staff preview is `client/app/school/curriculum-map/page.tsx`, accessed from the **existing SchoolShell** navigation. Original student lesson pages, Class 4 UI and role-based routes remain in place.

## API contract (staff-only, existing `/api/v1` prefix)

| Method | URL | Function |
| --- | --- | --- |
| GET | `/api/v1/curriculum-map/grades` | List 11 grade addresses |
| GET | `/api/v1/curriculum-map/grades/4` | Real/expected 10 slots for Class 4, with draft/readiness status |
| GET | `/api/v1/curriculum-map/grades/0/levels/1` | KG Level 1 editorial + current Mongo mapping (school admins only) |
| GET | `/api/v1/classes` | **Existing** published curriculum class browse |
| GET | `/api/v1/classes/:classId/levels` | **Existing** active unit level browse |
| GET | `/api/v1/levels/:levelId/lessons` | **Existing** active lesson browse |
| GET | `/api/v1/lessons/:lessonId/activities` | **Existing** student-safe/educator activity browse |
| GET | `/api/v1/students/me/next-lesson` | **Existing** grade-derived automatic resume |
| GET | `/api/v1/students/me/lessons/:lessonId` | **Existing** access-controlled lesson package |

All new mapping endpoints require a bearer token and role `TEACHER` or `SCHOOL_ADMIN`; teacher access to draft KG is denied, consistent with existing policy. Student accounts cannot request an unpublished roadmap. Staff map never includes answer keys, PINs, or personal progress.

### Example mapped slot response (illustrative)

```json
{
  "success": true,
  "data": {
    "address": "g05-l07",
    "grade": 5,
    "level": 7,
    "plannedTitle": "Role-play",
    "classId": "<MongoClassId or null>",
    "levelId": "<MongoLevelId or null>",
    "actualTitle": "Role-play",
    "status": "DRAFT",
    "publication": "UPCOMING",
    "lessons": [{"id":"<MongoLessonId>","title":"Role-play — authoring placeholder","order":1,"status":"draft","activityCount":0,"placeholder":true}]
  }
}
```

## How to create the actual Mongo mappings — one time, test DB first

**Safe check:**

```powershell
cd Talkora\backend
pnpm install --frozen-lockfile
pnpm curriculum:map:dry-run
```

Review the counts and the database URI pointing to a test/staging MongoDB. Apply only with explicit approval:

```powershell
pnpm curriculum:map:apply
```

The mapper is idempotent: running it a second time leaves existing documents alone. It never changes already-authoritative Class 4 or KG level records, never deletes content, and never publishes a draft. It uses the existing unique `{classId, number}` index. **Back up live databases before any migration.** Inspect the final school map at `/school/curriculum-map`.

## Future content authoring rules per level

1. Verify the school's actual syllabus, textbooks, objectives, language support, difficulty, grade and term; the editorial roadmap alone is NOT school approval.
2. Populate the existing draft lesson with age-appropriate listening/speaking/reading/writing activities. Attach image, animation, prompt, TTS manifest and assessment evidence. Store and validate any answer keys **server-side only**.
3. Approve the voice media and accessibility; exercise the real STT/AI fallback; attach optional homework, hinting, and progress evidence.
4. Mark a lesson/level playable only after content review, runtime validation, safe asset check, RBAC and progress flow tests. The map does not contain an unaudited "publish" toggle.
5. Confirm every student's grade is server-derived. An editorial draft must never be unlocked by a frontend URL or CSS.
6. Run teacher/principal/parent report checks for grade isolation, low scores, repeated attempts and resumed lessons.

## Team ownership without changing the live UI

- Frontend teammate: preserve school/student designs, implement age-specific published activities and animation state bindings via existing components. Leave placeholders clearly unpublished.
- Backend teammate: enforce role/student/school authorization and data model ownership through existing controllers, routes, models; review grade-index query plans and Mongo migrations.
- Curriculum/AI teammate: syllabus review by grade, prerecorded voice manifest, animated media optimization, STT/AI feedback, safe bilingual correction and adaptive policies.
- Integrator/QA: PIN security, 63-second kiosk validation, reports/PDF delivery, cross-grade tests, audit logs, dependency/build passes and staging load profiling.

## KG intro non-negotiable

`client/public/kg/videos/fullkg.mp4` is 63.018 seconds. Existing primary `/student/kg` route and `/kg-alphabet` controller require a fresh, completed per-visit playback ticket before accepting attempts. The generic KG-first-lesson intro component is also fail-closed, fullscreen and unskippable for `kg-g0-u1-l1`; optional intros elsewhere are allowed. Browsers cannot enforce F11 or prevent exiting via Esc/OS controls: use managed kiosk deployment for hardware-level fullscreen lockdown. Time elapsed and playback completion are not proof of human attention.

## Acceptance gating

| Level | Required evidence |
| --- | --- |
| Source | Node test suite for 110 addresses; parser check; original source comparison |
| Build | `pnpm install --frozen-lockfile`, backend TypeScript build, Next production build |
| Functional | Authenticated school map; KG video; voice upload/playback; S3; class 4 regressions; parent exports |
| Scale | Staging load tests with authorized synthetic students; monitor memory, latency, DB indexes and cloud costs |
| Release | Security review (five-digit PIN, device sessions, rate limits, school isolation); school syllabus sign-off; kiosk validation |

No 10K production student accounts were generated, and no load test has been run against a live system.

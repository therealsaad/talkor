# Talkora V4 — scope and completion audit

**Release type: DEVELOPMENT / STAGING. The 110 grade-level addresses are mapped; the other 109 interactive lessons are intentionally BLANK as explicitly requested. This is not a claim that 20/20 features are production tested.** The original V3 archive is the source baseline; no inherited V3 files were dropped.

## What this ZIP actually adds

- Authenticated, staff-only `GET /api/v1/curriculum-map/grades`, `/grades/:grade`, `/grades/:grade/levels/:level` routes for all 110 addresses.
- Existing `CurriculumClass` / `Level` / `Lesson` / `Activity` models remain authoritative. **One generic controller/service/routes module covers all grades and levels** — there is no duplicate per-grade backend.
- Safe `pnpm curriculum:map:dry-run` and explicit `pnpm curriculum:map:apply` scripts. Appends only missing Level + empty Lesson draft records (no fake activities). Preserves KG pilot and all original Class 4 data.
- Raised existing `Level.unitNumber` schema maximum from 8 to 10 to allow unambiguous grade levels 9/10.
- New `/school/curriculum-map` inside the original school navigation; real DB statuses and expected roadmap titles shown separately.
- The alternate generic KG Level 1 intro has no in-app skip, does not cache "watched" at video start, requires video end after 60+ seconds in fullscreen, pauses if fullscreen is exited, and fails closed on missing compulsory video. Primary `/student/kg` still has the server-verified intro ticket.
- Optional private report CSV-to-PDF tooling using a local Chrome binary and operator scheduling; parser/unit tests passed, full Chrome rendering NOT validated in this environment.
- Includes V3 KG homework, AI/audio plumbing, reporting export, and cache improvements unchanged.

## Requirement-by-requirement status (source + remaining acceptance work)

| # | Requirement | V4 status / missing step |
|---|---|---|
| 1 | KG–Class 10, 110 mapped levels | **YES for all 110 addresses, models, controllers, routes and blank draft lessons.** Only KG1 and existing Class 4 activities exist; others are intentionally unpublished, per revised scope. Editorial topics require school syllabus sign-off. |
| 2 | 10K student accounts | **NOT TESTED**, per user instruction; no synthetic live load generated. |
| 3 | Animated Miss Julie | **PARTIAL**: seven state poses and opt-in WebM state player available; user-generated high-fidelity videos were NOT present in supplied ZIPs. |
| 4 | Mandatory 63-second KG1 intro | **IMPLEMENTED IN SOURCE**, server ticket on primary KG route; genuine unexitable F11 is impossible via browser alone and requires a managed school kiosk. Needs real-device test. |
| 5 | Voice-first | **PARTIAL**: KG1 voice-first pilot; blank grades have no interactive runtime content. |
| 6 | AI bilingual adaptive teacher | **PARTIAL**: existing AI/STT boundary and KG Hindi/English hints; full live generative teaching not verified or developed for blank levels. |
| 7 | Adaptive progression | **PARTIAL**: existing recorded attempt/recommendation services retained; other levels need authored activities. |
| 8 | Auto resume | **SOURCE RETAINED**: existing `/students/me/next-lesson` and progress flow, requires live regression tests. |
| 9 | Animated interactive lessons | **PARTIAL**: KG ABCD and existing Class 4 modules retained; blank draft levels unplayable. |
| 10 | AI TTS + private S3 caching | **SOURCE RETAINED** including V3 bounded audio cache; requires valid `.env`, audio upload and live S3 tests. |
| 11 | Five-digit PIN + lab sessions | **SOURCE RETAINED**; school-shared device flow and attack resistance require security tests. |
| 12 | Teacher dashboard | **SOURCE RETAINED**, plus staff map; actual browser regression pending. |
| 13 | Principal dashboard | **SOURCE RETAINED**, browser regression pending. |
| 14 | Parent-facing individual reports (no separate parent dashboard) | **SOURCE RETAINED**: existing printable staff-mediated reports, live verification pending. |
| 15 | Scheduled daily/weekly/monthly PDFs | **PARTIAL**: V3 export job for private daily/weekly/monthly CSV; V4 optional private PDF renderer/PowerShell pipeline. Chromium smoke test timed out here, scheduler and parent-specific PDF delivery not configured. |
| 16 | Short spoken homework | **PARTIAL**: KG1 source included; MP3 must be generated/uploaded, blank levels require authored prompts. |
| 17 | Production performance | **PARTIAL**: compressed video, bounded S3 memory cache, Mongo report aggregates; real app profiling missing. |
| 18 | Security | **PARTIAL / NOT CERTIFIED**: source RBAC, isolation, protected staff map, session expiration and rate limits; risk review for five-digit PIN/child privacy and penetration tests remain. |
| 19 | Scalable Node/Next/Mongo/AI/S3 architecture | **EXISTING ARCHITECTURE RETAINED**, migration is bounded, staging k6 tool retained; 10K concurrent load untested. |
| 20 | Original UI and Class 4 work | **SOURCE PRESERVED**: all 599 V3 archive files retained; 10 inherited files updated (including 3 release documents, the model limit, route/nav, intro safeguard, tooling and one test import fix), live functional regression pending. |

**Count of production-verified 20/20 features: not asserted.** Source tests are not live production acceptance tests.

## External things you must supply/test

1. Real high-quality Miss Julie animated WebMs: `/client/public/miss-julie/animations/{idle,speaking,listening,thinking,pointing,encouraging,celebrating}.webm`. Existing artwork remains as fallback. Set `NEXT_PUBLIC_MISS_JULIE_ANIMATIONS=1` only when all clips exist and are optimized.
2. Actual school-approved class-wise syllabus source PDFs (editorial topics are placeholders). Student IDs/test accounts in a **staging school**, not actual child data.
3. Your working backend `.env`, AI service at your configured address (if using Python locally, `http://127.0.0.1:8001`), S3 connection and generated `homework-abcd` voice. Do NOT commit credentials.
4. Node/pnpm dependency installation and full Next/Express builds; the packaging environment cannot access the npm registry. Staging MongoDB `--apply` run is needed to create DB records.
5. Chromium installed and PDF smoke-tested on your report worker (the packaging sandbox renderer timed out), plus private school scheduling/retention.
6. Real kiosk provisioning if F11-style lock is required; JS cannot disable Esc, OS shortcuts or browser UI exit.
7. Browser regression, performance load/10K test, security review, and teacher/principal report sign-off.

## Do not confuse these terms

- **Mapped**: stable class/level address, DB placeholder, API, frontend editor UI, auth checks.
- **Authored**: actual grade-appropriate lesson activities, AI/TTS text, assessment, images, animations, homework.
- **Published**: teacher-reviewed and approved content, enabled for students.
- **Production verified**: real builds, browser flows, cloud operations, load and security acceptance.

This V4 package completes the requested **mapping**, not the skipped authoring/testing steps.

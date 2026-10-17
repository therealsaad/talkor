# Talkora V4 — Original UI + 110-Level Connected Curriculum Map

This version is based on the **actual V3 source previously delivered**, in turn based on the original `clientnew.zip` and `backendnew.zip`. It retains the working Next.js student/school UI, Class 4 modules, KG ABCD flow, Node/Express/Mongo models and auth, S3 voice, teacher/parent progress reports, the scheduler-ready CSV export, spoken KG homework and bounded audio cache.

## New in this version

- All **110 curriculum addresses** are wired through existing `CurriculumClass`, `Level`, `Lesson` and `Activity` models, with no duplicated backend per grade or parallel KG app.
- Bounded staff-facing APIs at `/api/v1/curriculum-map/grades/:grade[/levels/:level]`, protected by authentication and roles.
- A new planning page `/school/curriculum-map` integrated into the original SchoolShell.
- Safe migration: `pnpm curriculum:map:dry-run`, then (on your approved DB only) `pnpm curriculum:map:apply`. Existing records are never overwritten and new records are **drafts with zero activities**.
- The older generic KG first-lesson video component no longer has an in-app skip/bypass and fails closed if mandatory media fails. The primary KG intro retains its server-side watch ticket.
- 110-mapping runtime/mocked DB tests and source checks; preserve existing V3 tests.

## Please read

- `docs/110_LEVEL_MAPPING_AND_TEAM_HANDOFF.md` — detailed module/endpoint map, safe database apply, team responsibilities.
- `DELIVERY_STATUS.md` — precise requirement statuses, known missing assets, production gates.
- `VERIFICATION_RESULTS.md` — only the tests actually performed in this delivery.
- `docs/PRODUCTION_REPORT_SCHEDULING.md` — V3 private CSV report export process.
- `docs/PRIVATE_PDF_REPORTS.md` — V4 optional CSV-to-PDF report worker (actual Chrome rendering still requires staging validation).

## Windows verification (Node 22 / pnpm 10.18)

```powershell
cd Talkora
.\tools\verify-on-windows.ps1
```

Then configure a **staging** MongoDB and run `pnpm curriculum:map:dry-run` from `backend/`. Only run the `--apply` command after reviewing the count and taking a backup.

**Release classification: Development/staging; NOT production certified.** Complete high-quality animation media were not included in the uploaded archives; full build, live voice/cloud, automatic PDF distribution and 10K-capacity remain unverified/not implemented as noted. This is a mapped architecture, not 110 magically finished interactive lessons.

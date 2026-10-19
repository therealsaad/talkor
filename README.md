# Talkora — 110-Level Team Workspaces (Oct 19 2026)

**Actual user GitHub ZIP used as baseline.** This is the original Talkora V4 UI plus the latest focused KG voice/animation patch and a **new independent editable workspace for every KG–Class 10 level**.

- **Teammates:** start with [`docs/TEAM_QUICK_START.md`](docs/TEAM_QUICK_START.md).
- **Full engineering architecture:** [`docs/110_LEVEL_TEAM_ARCHITECTURE.md`](docs/110_LEVEL_TEAM_ARCHITECTURE.md).
- **20/20 requirement evidence and blockers:** [`docs/20_REQUIREMENTS_VERIFICATION.md`](docs/20_REQUIREMENTS_VERIFICATION.md).
- **Verify offline:** `node tools/verify-110-levels.cjs`.
- **Preview themes (staff login):** `/school/curriculum-map` → choose grade/level → Open design workspace.

**No student route was replaced.** Empty grade-level folders are draft authoring workspaces, **not 110 falsely completed lessons**. KG Level 1 and existing Class 4 screens retain their own runtime paths. Do not deploy without production builds and live security/audio/microphone tests.

---

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

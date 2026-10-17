# TALKORA V3 — original-UI integrated development source

**Release classification: DEVELOPMENT / STAGING ONLY — NOT PRODUCTION-CERTIFIED.**

This patch starts from the supplied `clientnew.zip` and `backendnew.zip` and extends the previous integrated KG1 source. It **does not** rebuild or replace the user's Next.js UI, Class 4 screens, school dashboards, routes, or Mongo models. The `backend/src/kg/alphabet-content.ts` directory is a lesson-content module imported by the **existing** KG controller, not a second backend application.

## What changed in this V3 development patch

1. **KG Level 1 spoken homework:** Added one audio-manifest line `homework-abcd` in `backend/src/kg/alphabet-content.ts`, corresponding preview speech, a child-friendly homework card on the existing finish screen, and a replay button. Playback runs after celebration but missing audio cannot erase completed progress. Upload the new MP3 with the existing `pnpm kg:audio` pipeline before testing the voice. Current S3 status is unknown.
2. **Bilingual KG coaching:** Existing KG attempt controller now includes deterministic, child-safe English/Hindi coaching hints for incorrect/unclear answers. The existing eight-activity rubric and grading remain authoritative; this is **not** a deployed LLM tutor.
3. **Scalable KG reporting queries:** List and student-detail KG reports use bounded MongoDB aggregations instead of transferring every historical raw attempt to Node.js. Original endpoints and report response shape are retained.
4. **Safe, staff-only report export:** Added `GET /api/v1/analytics/reports/export.csv`, teacher and school scope inherited from auth, keyset cursor paging (max 100 rows/request), bounded parallel report generation (four at a time), no-store headers, quoted/Excel-formula-safe fields. A small original-dashboard report card downloads pages of 30 students.
5. **Cron-compatible private reporting:** Added `pnpm reports:export -- --period daily|weekly|monthly --school <id>` with explicit authorization flag and locked-down private output directory. Writes daily/weekly/monthly CSV snapshots in pages and logs a checksum. **You must configure the scheduler and private file retention; this is not a live email delivery system.** For individual Unicode-safe parent PDFs, the existing print-ready report remains available to staff. Fully automatic PDF/email distribution is not built.
6. **KG audio reuse:** Added bounded, per-backend-process immutable-audio cache (`48` clips / `20 MB`) to reduce repeat S3 reads, after authentication. This is not a shared distributed cache.
7. **Tests/operations:** Added dependency-light behavior tests, private scheduling/runbook, a separate authorized k6 staging probe, and an on-Windows build/test checklist. No child accounts are created or real production load generated.

## Requirements status — no misleading checkmarks

| # | Required outcome | Status in this ZIP |
| - | - | - |
| 1 | 11 grades, 110 finished syllabus lessons | **Incomplete** — 110 editorial roadmap records, not 110 published interactive runtimes; existing Class 4 content preserved |
| 2 | Verified 10K accounts / concurrency | **Unverified** — read aggregation improvements; no live 10K load run |
| 3 | High-quality Miss Julie animations | **Partial** — original art and animated states preserved; high-fidelity generated video/lip-sync assets not supplied in available archives |
| 4 | Mandatory fullscreen KG intro | **Implemented in code with platform limits** — 63.018-second video, per-visit authenticated completion ticket, no in-app skip; F11/Esc exit prevention requires *managed kiosk mode* |
| 5 | Voice-first | **KG pilot**, other grades incomplete |
| 6 | Adaptive generative bilingual AI teacher | **Partial** — existing voice/AI boundaries + deterministic KG coaching; live AI not connected/tested end-to-end here |
| 7 | Invisible adaptive progression | **Partial** — recorded attempts and recommendation endpoint, not all lessons integrated |
| 8 | Resume previous work | **Existing code retained, unverified end-to-end** |
| 9 | All-grade animated interactions | **Partial** — KG1 and existing class content only |
| 10 | TTS → S3 cached audio | **Existing integration + new cache; needs live setup and new MP3 upload** |
| 11 | Secure 5-digit PIN login | **Code retained; security blocker** — public 5-digit PINs have low entropy and need a reviewed school-device/network protection strategy |
| 12 | Teacher progress dashboard | **Existing UI preserved; not regression-tested live** |
| 13 | Principal/school dashboard | **Existing UI preserved; not regression-tested live** |
| 14 | Parent PDF-ready individual reports | **Staff-only printable existing reports; no parent dashboard** |
| 15 | Automated daily/weekly/monthly PDFs and delivery | **Partial** — scheduler-ready CSV batch job; no configured scheduler, automated PDF or delivery |
| 16 | Spoken homework after lessons | **KG1 implemented in source** — S3 audio must be generated; other levels not done |
| 17 | Production performance | **Partial** — bounded Mongo queries, bounded S3 cache, optimized MP4; device profiling remains |
| 18 | Production security | **Not certified** — role/school checks exist; 5-digit PIN/pen testing, headers, data retention and infrastructure audit remain |
| 19 | Production scaling across 10K students | **Unverified** — architecture retained and staging k6 probe supplied, not run |
| 20 | Original UI/functionality preserved | **Source preserved** — final builds and live regression checks must still pass |

## Mandatory external dependencies and blockers

- **Actual generated Miss Julie animation clips:** supply state videos (`speaking`, `listening`, `thinking`, `pointing`, `encouraging`, `celebrating`, `idle`) as optimized assets at `client/public/miss-julie/animations/<state>.webm`. Only existing artwork/CSS motion is currently available. The optional existing animation player can then use these; this package cannot fabricate your pre-generated files.
- **Full production builds:** Run `tools/verify-on-windows.ps1`. No npm registry access or full project node_modules was available in this environment. TypeScript AST parse and mocked behavior tests are **not** equivalent to semantic type checking, Next.js builds, authenticated Mongo integration or live browsers.
- **Voice & S3:** Configure existing backend service/Azure/Python path, private S3 bucket, STT/AI provider, real `.env` outside Git. Upload and verify all KG MP3 manifests including `homework-abcd`.
- **Mandatory fullscreen:** Browsers cannot programmatically force F11, block Esc/OS controls or prove that someone watched a movie; school-managed kiosk mode is required for true lockdown. Never market ordinary browser fullscreen as OS-level unexitable mode.
- **Child safety/security:** Review parental reporting consent, PIN threat model, privacy/retention, school network access, student token expiry and school-level isolation with a security specialist before production.
- **10K usage:** Load staging with authorized fake/test students and k6 using `tools/load/README.md`. An account count is not a concurrency benchmark.

## Architecture and setup

Original Next.js at `client/`; Node/Express and MongoDB models/controllers/routes at `backend/`. No parallel KG application. Run the documented original database index script after review. Frontend remains on Next.js; separate local Python TTS service requires `.venv` only if selected.

Use a developer machine with network, Node 22 LTS, pnpm 10.18.0, and a nonproduction test database:

```powershell
cd Talkora
.\tools\verify-on-windows.ps1
```

Once builds pass, verify the parent report print page, all original Class 4 routes, S3 cold/warm audio, KG intro using a real fullscreen-supported browser, and 5-digit login/logout with actual shared-lab devices. Do not deploy this archive directly to students without those checks.

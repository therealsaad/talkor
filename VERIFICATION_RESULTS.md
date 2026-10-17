# Talkora V4 — reproducible checks, not a fake full build

Date: 2026-10-16 UTC. Baseline: supplied `Talkora_V3_Original_UI_Integrated_Development_Patch_2026-10-16.zip`, itself based on original `clientnew.zip`/`backendnew.zip`.

## Passes in this environment

- `node --test tools/test-curriculum-map.cjs`: **6/6 PASS**. Covers all 110 canonical stable grade/level addresses, strict parser, incomplete/draft status behavior, projection of existing Class 4 records, staff-route linkage, migration dry-run writing nothing, first apply creating only missing draft levels, and second apply remaining idempotent using in-memory Mongo-like mocks.
- Original V3 frontend test selection: **20/20 PASS**, including KG intro, S3 audio/runtime retries, report CSV service and KG coaching mock tests. Test runner temporarily linked to a globally installed TypeScript module; temporary symlink was deleted before packaging.
- `node --test tools/reports/csv-to-private-pdf.test.cjs`: **2/2 PASS** — CSV parsing, Unicode preservation, HTML escaping, size checks. This is NOT a successful Chrome PDF render test.
- `node tools/verify-source.cjs`: **411 TypeScript/TSX files parsed, 924 relative imports resolved, 0 parser/local-import errors**. Not a semantic `tsc` or Next build.
- `ffprobe client/public/kg/videos/fullkg.mp4`: **63.018 seconds; 8,863,030 bytes**.
- Archive-preservation comparison before adding release docs: **599/599 inherited V3 files retained, zero missing**. Only targeted old files changed; original student/Class 4 screens and auth modules not rewritten.
- Optional PDF smoke: tested with synthetic-only student names; Chromium timed out in the packaging sandbox. **NOT counted as passed.**

## Not run/passed

- Backend `tsc -p tsconfig.json --noEmit` **blocked** by missing package-managed type definitions `jest` and `node`; `pnpm install` needs a package registry but `registry.npmjs.org` is unreachable from this environment. No full Next.js build was possible. Do NOT mark builds green.
- No real MongoDB migration (`--apply`) executed; all migration writes validated with isolated in-memory mocks only.
- No live authenticated API suite, Mongo indexes, AI, S3, STT/TTS, private PDF end-to-end, 110 graded activities or Chrome kiosk playback verified.
- No 10,000-account provisioning or real concurrency load testing performed. These require staging and your approval.

## Reproduce on your Windows machine

```powershell
cd Talkora
.\tools\verify-on-windows.ps1
```

That script installs frontend/backend dependencies, runs source/runtime and existing regression tests, attempts real backend and Next builds, and runs a **read-only mapping dry-run against the configured database**. It does NOT apply a DB migration. Review the DB target before `pnpm curriculum:map:apply`.

**Release verdict: staging code, not 20/20 production-certified.** See `docs/110_LEVEL_MAPPING_AND_TEAM_HANDOFF.md` and `DELIVERY_STATUS.md`.

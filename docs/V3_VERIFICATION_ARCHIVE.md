# Evidence from this environment (V3 patch)

- **20/20** available dependency-light frontend Node tests passed: `node --test tests/ui/kg-pilot-experience.test.mjs tests/ui/student-enrollment-modal.test.mjs tests/kg-speech-runtime.test.mjs tests/ui/kg-v3-integration.test.mjs`. Existing 16 plus 4 new mocked/runtime tests.
- **403/403** frontend/backend TypeScript source files parsed by globally installed TypeScript compiler AST with **0 syntax diagnostics**.
- **902 relative imports** checked for local-file existence; only missing imports found were two expected generated Next.js `.next/types/*.d.ts` references in `client/next-env.d.ts` (Next build generates these).
- The new runtime tests exercise cached audio concurrency/missing-object retries, teacher-scoped report keyset pagination, CSV formula escaping, the expanded authoritative voice manifest, and child-friendly KG coaching. Tests do **not** substitute for a real database, Node dependency type resolution, Next.js build or authenticated deployed APIs.
- `ffprobe`: KG intro source 63.018 seconds, 8,863,030 bytes. Unskippable behavior is asserted in source tests, **not independently confirmed using a managed kiosk**.
- Original frontend files present in this patch: **282/285** filtered original files. The three excluded files are `.env` (secrets), generated `tsconfig.tsbuildinfo` and redundant `package-lock.json`. **268/282** of the retained original files are byte-identical. Changed files are largely the KG pilot and reporting integrations.

**Cannot claim passed:** Full `pnpm install`, `pnpm build` for either app, Jest/Mongo tests, real student/teacher/principal login in browsers, AWS S3 upload verification, actual STT/TTS/LLM latency, 3D animation playback, 10K-account/concurrency load, PDF automated delivery, kiosk-mode security and acceptance tests. `registry.npmjs.org` DNS is unavailable in this container and cloud credentials were not provided. Those must pass on approved developer/staging infrastructure.

**Verdict:** A meaningful, inspectable, test-backed incremental development patch; **not a release satisfying all 20 production requirements**.

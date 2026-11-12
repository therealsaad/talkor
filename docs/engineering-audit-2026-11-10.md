# Talkora engineering audit — 10 November 2026

Status: read-only audit completed before implementation. This is a development
baseline, not a production readiness certificate. No school database, real
learner, paid speech service, deployment, curriculum publication or merge was used.

## Revisions and overlapping work

| Source | Audited revision | Result |
| --- | --- | --- |
| App main | `b9da4b48c4641e74927e26f703fd2247521dc7e9` | Fresh clone; contains merged #123 and #124. Preserve both fixes. |
| AI main | `83b19973d28c41378a2b5be04bbaf7be4e3f8f4f` | Use `talkora-ai-starter/server.main`, not the old `qwen-service`. |
| App #117 | `ae7ff46008e58daafbb7a349639a177827d68728` | Open, GitHub reports merge conflicts. Thirty changed files, including shared Azure provider, auth provider and student levels. No integration or publication performed. |
| AI #20 | `0729bbf5fd8d339e33bd9ab10b7d57b146e09d17` | Open. Adds canonical scene keys, fast reviewed poem responses and protects against the old `at` response guard. Tested separately without merging. |

README sections 1–12 and release gates, backend architecture, 110-level
architecture, Class 1 release runbook, KG content gates, CI workflow, load guide,
speech/receipt contracts and AI package documentation were inspected. The local
Next 16.3 documentation and `client/AGENTS.md` apply to frontend changes.

## Actual execution paths

- Browser: Next App Router / React, `AuthProvider` restores `/auth/me`; tab-scoped
  five-digit PIN credentials lead through `/student/continue`. KG has its own
  progress APIs; other grades use `StudentLessonFastService` and the existing
  authenticated lesson player. Role layouts protect teacher/school surfaces.
- KG1: state → intro ticket → complete video → approved narration → microphone
  and Sarvam → shared teaching policy / bounded Qwen → saved attempt → Azure or
  approved audio → signed receipt after generation → browser `ended` → server
  ACK and cursor advancement. KG2 and KG3–5 use separate controllers/models with
  shared teaching, language and receipt helpers. KG6–10 are excluded.
- Class 1: authorized Activity/Lesson/Level → `StudentContextService` →
  `PythonAIProvider` → authenticated FastAPI `/v1/brain/respond` → reviewed policy
  or bounded local Qwen → validated response. Node owns evidence and completion.
  Azure recitation uses SSML rhythm, not singing. The v3 release and v4 poem draft
  are distinct; neither this audit nor AI #20 grants educator approval.
- Backend: Express/Helmet/CORS, signed JWT plus active student/auth-version
  lookup, Mongoose authorization and progress, private S3 delivery. Production
  already uses an atomic Mongo-backed rate-limit store. Earlier prose describing
  memory-only production limits is stale. Ingress/proxy configuration and actual
  replica behavior still require deployment evidence.

## Prioritized findings

Evidence types: **code** means a concrete inspected execution path; **measured**
means an executed local command; **hypothesis** needs profiling or device evidence.
P0 blocks a school release; P1 is high impact; P2 is a follow-up optimization.

| ID / severity | Evidence and root cause | Affected files and learner impact | Proposed implementation | Verification |
| --- | --- | --- | --- | --- |
| A1 / P0 | Code: `getMeInFlight` is global, independent of login token. `loadCurrentSession` writes user data and clears storage in its catch without checking ownership. `AuthProvider.restore` also accepts late results. #124 protects generic 401 handling but not these later mutations. | `client/services/auth-service.ts`, `client/components/auth/auth-provider.tsx`; an old restore can replace or log out the next lab learner. | Token-scoped in-flight restore; reject stale responses before writes; guard provider state and delayed logout cleanup. | Delayed A success/401/network failure after B login; same-token sharing; retry after failure; actual React provider behavior. |
| A2 / P0 | Code + measured media: KG2 and KG3–5 accept intro completion after 10 seconds. `ffprobe` reports KG2/3/4 are 90 seconds and KG5 is 60 seconds. Existing integration fixtures complete after 20 seconds. | `backend/src/controllers/kg-level2-student.controller.ts`, `kg-continuation.controller.ts`; an API caller can enter practice well before the full required film. | Server-owned per-level duration policy matching packaged media, small documented clock tolerance, retain ended event/ticket/expiry checks. | Refuse early valid-ticket ACK at 20 seconds and near threshold; accept only full-duration eligible tickets; wrong user/ticket/expiry/relogin tests. |
| A3 / P0 | Code: Class 1 `teacher-audio-played` accepts a completed VoiceSession ID without proof that audio was generated. KG correctly requires a signed scoped receipt. | `backend/src/services/voice.service.ts`, `controllers/voice.controller.ts`, client voice runtime; premature Class 1 progress is possible through direct ACK. | Add a server-owned feedback-audio endpoint and signed receipt bound to student, auth visit, session, text and activity; client ACK only on `ended`, preserve pending feedback recovery. | TTS failure/empty audio cannot mint a receipt; missing/forged/expired/cross-session receipts cannot award progress; idempotent genuine ACK. |
| A4 / P1 | Code: KG resume awaits KG1 state, then KG2 state, then continuation overview. Overview already queries KG1/2/3–5 together. | `client/app/student/continue/page.tsx`, continuation controller/service; up to three network round trips before the lesson route. | Extend the authorized overview with a next student route using existing exact gates. Share only simultaneous reads per token, never completed progress. | Synthetic Mongo states for every next level, unauthorized and cross-school/grade tests; request counts and delayed-response ownership; before/after production-browser traces. |
| A5 / P1 | Code: Morgan `combined`/`dev` logs original URLs; error handler logs `originalUrl`, arbitrary error messages and stack; Azure error logging includes upstream body text. | `backend/src/app.ts`, `middleware/error.ts`, `providers/voice/AzureVoiceProvider.ts`; query strings, resource identifiers or echoed speech can enter operational logs. | Method/static route/status/duration logs and bounded error categories; discard upstream bodies; retain useful fixed provider status/timing. | Send canary PIN/token/transcript/query/identifier data through failure paths and assert it never appears in log output. |
| A6 / P0 | Code: Class 1 intro checks full watch, unmuted media and duration in React, but no corresponding server intro ticket was found in `VoiceService.startSession`/curriculum authorization. | `Class1LessonIntro.tsx`, lesson and voice authorization services; direct API access does not prove intro eligibility. | Separate protocol change for a server-owned Class 1 intro visit and endpoint guards, with compatible client rollout and data-safe recovery. | Direct voice/attempt/AI calls before full intro denied; reload/new PIN revokes eligibility without losing progress. Do not infer this from a UI test. |
| A7 / P2 | Hypothesis: shared full-screen loader requests priority background/logo/Julie images during short transitions; several animation components use autoplay/preload auto. KG1 correctly delays narration prefetch until after intro. | `talkora-loader.tsx`, Miss Julie components and lesson stage; potential bandwidth/CPU contention. | Measure request/byte/long-task traces first, defer only demonstrated nonessential work, preserve approved paths and mandatory video. | Production build, cold/warm school-network profiles, screenshots, reduced-motion and audio-animation tests. |
| A8 / P2 | Code + hypothesis: context builder repeats authorization/lesson/activity reads and performs serial conversation/summary/count/progress reads. Next-lesson loops query each lesson/activity set serially. Indexes exist for key student/progress/attempt filters. | `student-context.service.ts`, `student-lesson-fast.service.ts`; likely DB overhead, magnitude unmeasured. | Use profiler/explain on disposable realistic data; consolidate independent reads without caching student authorization/progress or changing sequence. | Query count, explain plans, p50/p95 and cross-student isolation at realistic concurrency. No production indexes/migrations here. |
| A9 / P1 | Measured: AI main passes 196 tests; #20 passes 200, each with one optional seed skip. Code: current main can route stale poem context through legacy word repeat; Node guard already protects authored poem wording. | `talkora-ai-starter/server/class1*.py`, Node Python provider/context; wrong poem coaching and external latency remain concerns. | Review and land #20 through its existing PR; confirm Node/Python deployed revision/contract; add adversarial cases only where existing coverage is missing. | English/Hindi/Marathi `At at`, unknown scene, unrelated question, prompt injection, timeout/invalid output, actual recited pair and Azure spoken output. No model/voice success claimed from mocked tests. |
| A10 / P1 | Code: `/health` reports process liveness, not Mongo/shared limiter/provider readiness. Existing KG timings and opt-in browser speech telemetry do not cover all startup/Class 1 stages. | `app.ts`, speech/voice services, telemetry; operators cannot infer full teaching availability from HTTP 200. | Separate bounded readiness diagnostics and privacy-safe production-build startup/voice measurement. | Provider/Mongo fault injection; no secrets/text in metrics; record missing physical-audio measurements explicitly. |
| A11 / P1 | Unverified: no school-like concurrency, ingress, resource budget or physical microphone/speaker measurement exists in this fresh environment. | Load guide, operational runbooks and deployment environment; 10,000 enrolled accounts is not capacity proof. | Safe loopback-only synthetic load with bounded workers, throughput/p95/errors/CPU/RSS; later authorized staging NAT/replica/voice budgets and teacher device acceptance. | Exact scenario, revision, dataset, concurrency, duration and bottlenecks; never call production or paid speech in synthetic load. |
| A12 / P1 | GitHub metadata: main is reported unprotected; #117 changes shared Azure/auth files and lacks a PR body. Docs mix historical and current states. | Repository governance and handoff; accidental integration/regression risk. | Recommend required reviews/checks and coherent current release evidence; do not change repository security settings or merge #117 automatically. | Human owner review; reconcile #117 with current main, preserve poem/media/auth fixes, validate curriculum mismatch before acceptance. |

## Baseline evidence and limits

- Fresh production Next build passed: compile **7.8 s**, TypeScript **9.4 s** on
  this host. This is build time, not student startup latency.
- Structure job via `node tools/run-ci-locally.mjs --job structure --keep-going`:
  **4 passed, 0 failed, 0 skipped**.
- AI main: **196 passed, 1 skipped**; AI #20: **200 passed, 1 skipped**. Optional
  prototype seed absent; Starlette/httpx deprecation warning. Tests use mock
  transports, not installed Qwen or live speech providers.
- First frontend browser attempt could not launch system Chromium because the
  managed runtime rejects its Unix process-singleton socket. The separate cloud
  browser could not reach loopback. These are environment failures, not passing
  UI tests. A headless test runtime is being evaluated without changing app deps.
- Backend build passed using installed TypeScript. The first all-backend runner
  attempt was interrupted after the host's pnpm 11 performed incompatible
  dependency lifecycle validation. Re-running with the repo's pnpm **10.18.0**;
  no lockfile/dependency changes are proposed.
- Disposable MongoDB 7.0.14 starts on loopback with `--nounixsocket`; no existing
  database or real record is used. This flag avoids a sandbox socket restriction,
  not an application security or assertion bypass.
- Packaged durations: KG1 63.018 s, KG2/3/4 90 s, KG5 60 s. Compression from #122
  already exists; do not re-encode or repeat merged media/ownership work.

## Development order and release boundaries

1. Repair A1; prove delayed old-session responses cannot affect a new login.
2. Repair A2 using measured media durations and preserved ticket/visit rules.
3. Remove A4's proven resume waterfall using fresh authorized server state.
4. Harden A5 logging and capture synthetic operational/load evidence.
5. Address A3/A6 as explicit Class 1 protocol changes with coupled browser/server
   regressions; review AI #20 separately. They remain release blockers until fixed.

Each implementation uses its own branch and unmerged PR with regression evidence,
risks and rollback. No permission is inferred to publish material, enable KG6–10,
deploy, migrate, merge, change cloud permissions or touch real student progress.
The final delivery report records implemented versus outstanding rows and the
actual verification results; this audit's baseline must not be rewritten as if
the improvements had already existed on main.

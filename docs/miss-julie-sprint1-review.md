# Miss Julie Sprint 1: audit and contract review

Date: 2026-10-31. Status: proposed; runtime implementation awaits shared-contract review as required by the assignment.

## Publication checkpoint and review clarifications

This document contains historical audit snapshots below. At publication, the original checkout is on `feature/ai-frontend-qa` at `66eac2642b9d89b9d2ed1850c2e26492f75e24b3`, rather than the earlier Class 1 branch. Existing modified files are `client/package.json` and `client/tsconfig.tsbuildinfo`; existing untracked work includes the two backend scripts, frontend safety test, curriculum-research directory, frontend audit/QA/test-matrix documents, teaching-engine integration plan and these two audit drafts. They remain in the original checkout without staging or modification by this publication task.

Publication uses the separate worktree `D:\talkor\talkor-ai-audit` on `feature/ai-teaching-engine-audit`, based on freshly fetched `origin/feature/saad-class1-oct27` at `e1fc98f15f35287fcbfa79c04501e627a73c5c8b`. Only this review document and the standalone proposed TypeScript contract are included. Earlier statements about no implementation branch/commit/PR describe the audit checkpoint before this documentation publication. Publishing these documents does not approve the contract, authorize runtime implementation or authorize a migration. Audit observations describe the original inspected checkout, not a fresh re-audit of every runtime file at the publication base.

### A. Completion, independence and mastery

Activity completion is the existing server-owned activity gate. Lesson completion aggregates the required activities under current progression rules; neither certifies proficiency. Assisted correctness includes hints, selected options and repeating a supplied answer. Independent correctness requires a new unprompted response to an approved criterion without an answer-bearing hint. A single independent correct response is evidence, not automatic mastery. Retention/recall requires a separately scheduled or delayed, independently answered approved check; immediate repetition cannot establish it. Mastery eligibility requires all curriculum-owner-reviewed criteria and evidence dimensions, including retention where required. Missing criteria or unavailable assessment cannot yield mastery. Existing `COMPLETED_WITH_SUPPORT` remains distinct from `MASTERED`; historical completion records are preserved.

### B. Interrupted-lesson persistence

Prefer existing Conversation, ActivityAttempt, LearningEvent and Progress services as evidence and completion authorities. The proposed durable checkpoint needs curriculum version, activity/objective, teaching state, retry/support status, revision and a committed result reference for each accepted submission. Existing schemas do not fully represent that checkpoint. Review either an additive checkpoint schema or a documented event-metadata reconstruction protocol before implementation; neither is approved here. Resume reauthorizes the student and reconstructs the last committed state and evidence. An uncommitted model response cannot advance progress. Pending inference may be retried; previously committed progress must be replayed as a response, never re-awarded. Old curriculum versions require an explicit compatible-resume policy rather than silently rebasing evidence.

### C. Submission consistency and duplicate handling

Proposed protocol: scope an idempotency key to authenticated student, conversation and submission; persist a normalized payload digest with its result. Same key and same payload returns the stored result without inference or progress writes. Same key with different payload is a conflict. A submission carries expectedRevision; compare-and-set accepts only the current revision, rejecting stale submissions before inference admission. Before committing a generated response, recheck revision and authorization; discard stale inference output. Serialize active turns per student lesson across processes, with a durable revision as the final guard. A browser-only lock or an in-process queue is insufficient.

Checkpoint/evidence writes, result deduplication and existing progress updates need an atomicity strategy appropriate to the deployed Mongo topology. If transactions are unavailable, use a reviewed recoverable write protocol with idempotent progress application and reconciliation. A partial failure must not return success or trigger duplicate XP on retry. Existing ActivityAttempt idempotency indexes are reusable but do not alone make all conversation and progress writes atomic. Exact response/error types, lock scope and storage remain contract-review decisions.

### D. Existing gates remain authoritative

All proposed transitions must preserve curriculum authorization, published/draft-demo allowlists, grade/class-specific progression, existing introductory-video tickets, teacher-audio acknowledgement, Azure requirements and student authentication/session revocation. The model cannot waive any gate or unlock a lesson. Current KG/Class 1 completion behavior is preserved until a separately reviewed rollout explicitly changes it. Shared-computer identity changes cancel pending speech/inference and require fresh ownership checks before writes.

### E. Proposed reliability budget

For review, use the current 16-second Node AI deadline as the outer budget, with a shorter upstream deadline (for example 12 seconds) and propagated cancellation; retain KG feedback's existing seven-second cap. Allow at most one retry for transient transport/5xx failures only when it fits the original budget. Do not retry malformed output indefinitely. These are proposed values requiring measurement, not deployed changes. Validate model JSON shape, field lengths, approved actions and curriculum grounding; reject model progress/unlock claims. Use reviewed curriculum-authored en/hi/mr fallback wording on failure, preserve teaching state and add no evidence.

Retain current STT/TTS deadline boundaries (source defaults 18/12 seconds) and existing Azure-specific paths. STT failure/no speech is unavailable evidence, not an incorrect response. TTS failure retains pending playback/acknowledgement requirements and offers replay; it cannot auto-advance a listening gate. Retry speech only within bounded budgets and existing submission deduplication. Class 1 local-AI and dynamic-Azure failure behavior remains fail-closed; no silent cloud/provider substitution. These paths require fault-injection and live-provider verification before rollout.

### F. Verification provenance and final ownership

The 45 passing tests in six suites are historical results from the earlier audit turn, not fresh verification for this publication. Jest reported an open asynchronous handle after completing assertions; the process was subsequently interrupted. The handle was not diagnosed, and no full regression or live Qwen/Azure success is claimed. Publication validation consists of the staged two-file allowlist and whitespace checks; new engine behavior has not been implemented or tested.

The Project Manager's latest ownership order supersedes earlier proposed assignments below: Z.ai owns curriculum schemas and rubric content; Antigravity owns student classroom UI; Copilot owns frontend QA and regression tests; Codex owns backend/AI research, design proposals and later authorized backend work. Shared interfaces require Project Manager approval after reviewing relevant agents' findings. No agent-owned runtime files are changed here. Future unavailable-curriculum tests will use explicitly synthetic fixtures; this publication introduces no curriculum fixtures or official lesson content.

## Repository audit

- Main checkout: `D:\talkor\talkor`, branch `feature/saad-class1-oct27`, origin `https://github.com/therealsaad/talkor.git`.
- Pre-existing changes preserved: modified `client/tsconfig.tsbuildinfo`; untracked `backend/src/scripts/probe-db.cjs` and `backend/src/scripts/test-level-map.cjs`.
- Historical AI checkout exists at `D:\allabouttalkora\live_talkora\talkora1\talkora`. Its `.git/config` identifies origin `https://github.com/therealsaad/talkora.git`; `.git/HEAD` identifies `main`. Git status there is blocked by ownership checks. No global safe-directory exception was added; its worktree changes are unverified.
- Neither local remote identifies the supplied `talkora-ai-private` repository. That repository's contents, deployment and parity remain unverified. Do not treat these checkouts as identical or deploy one over another.
- No runtime, curriculum, frontend, database, model or configuration changes were made. No commit, push or PR was created. Dedicated implementation branch `feature/ai-teaching-engine` is deferred until the contract is reviewed.

## Current architecture and reusable boundaries

| Area | Inspected implementation | Reuse / constraint |
| --- | --- | --- |
| HTTP | `backend/src/routes/ai.routes.ts`, `voice.routes.ts`, controllers | Student-authenticated conversation start/turn/end; compatibility `/miss-julie`; voice session/transcript/audio acknowledgement. Extend existing services rather than lesson-specific controllers. |
| Curriculum | `models/{CurriculumClass,Level,Lesson,Activity}.ts`, `curriculum/types.ts`, curriculum/access services | Resolve authorized published activities and existing objectives. KG source plans explicitly include unapproved starter content; presence on disk does not imply official syllabus approval. |
| Teaching | `services/missJulie.service.ts`, `pedagogy.service.ts`, `first-day-evidence.ts` | Existing retry state, supported/independent evidence, skill detection and mastery statuses. Reuse evaluators behind objective-specific policies; current word/regex evidence does not establish all dimensions of comprehension. |
| Progress | `services/progress.service.ts`, `progress-completion.ts`, `models/{Progress,ActivityAttempt,LearningEvent}.ts` | Existing required-activity completion, XP, unlocks, idempotency keys and student-scoped attempts remain authoritative. Conversation completion and mastery must remain distinct. |
| Learning memory | `models/{Conversation,StudentMemory}.ts`, `services/memory.service.ts` | Conversation stores evidence, retries and mastery. Memory includes transcript/activity/conversation provenance. Preference facts are not mastery evidence. |
| Authentication | `auth.service.ts`, `middleware/auth.ts`, `utils/student-pin.ts` | PIN lookup plus password verification; token identity, school and authVersion checks. Never accept student identity from a turn body. |
| Shared computers | `client/lib/api-client.ts`, `components/auth/auth-provider.tsx` | Lab sessions use sessionStorage; provider contains automatic logout. Preserve frontend lifecycle; verify expiry/revocation in integration tests. JWT configuration defaults to 7 days; client logout and token expiry are different controls. |
| AI | `providers/ai/{AIProvider,QwenProvider,PythonAIProvider}.ts`, `schemas/ai.schema.ts` | Existing typed context and Zod response validation. Class 1 g01-l01 uses Python bridge on 8002 and fails closed on bridge failure. Other routes have provider fallback paths: a new local-only engine must not silently inherit cloud fallback. |
| Speech | `providers/speech/AzureSpeechProvider.ts`, `providers/voice/AzureVoiceProvider.ts`, `services/{voice,kg-speech,AudioCacheService}.ts` | Reuse STT/TTS, locale selection, audio caching and teacher-audio acknowledgements. Transcript matching is not acoustic pronunciation evidence. |
| KG L1 | `controllers/kg-alphabet.controller.ts`, `models/KGIntroPlayback.ts`, KG grading/progress models | Existing eight-step ABCD experience, intro ticket and student/school/expiry checks remain intact. Completion is not a general speaking proficiency certificate. |
| Class 1 L1 | `first-day-evidence.ts`, `missJulie.service.ts`, Python bridge and existing Class 1 voice tests | Current scene evidence allows appropriate English attempts, with special poem checks. Preserve intro/audio gates and scene progression. Do not reinterpret earlier completions under a new mastery rule. |
| Preview | `client/app/school/kg-preview/level-1/page.tsx` | Thin wrapper around existing KG experience with preview enabled. Excluded from backend implementation scope. |

Flow: authenticated student -> authorized curriculum/activity -> conversation/voice service -> deterministic evidence and retry policy -> provider-generated presentation -> validated response -> existing persistence/progress services -> existing UI/audio.

### Service configuration and cross-repository findings

Node source defaults: port 5000; AI bridge 8001; Class 1 override defaults to 8002; AI timeout 16 seconds; STT 18 seconds; TTS 12 seconds. These are source defaults, not verified deployment values. The historical Python service exposes `/v1/brain/respond`, `/v1/stt`, `/v1/tts` and pronunciation evaluation. It defaults to provider `openai`, Ollama URL `127.0.0.1:11434`, model `qwen3:4b-instruct`, and Ollama timeout 80 seconds. Thus a Qwen-named Node adapter alone does not prove local Qwen inference. Confirm effective provider, service authentication and model identity before rollout; do not change/download models.

The bridge translates Python `reaction` to Node `emotion` and recommended actions into the existing structured response. Keep that translation. Node and Python deadlines need a single request budget with cancellation propagated upstream; otherwise timed-out clients can leave expensive inference running. Listener enumeration returned no usable results in this sandbox; service availability and end-to-end latency were not established. Environment secrets were not read.

## Proposed engine and integration

One curriculum-driven orchestrator within the existing backend services serves grades 0–10. Its dependencies are an authorized curriculum reader, deterministic objective evaluators, a presentation-only AI adapter, existing speech adapters and an evidence repository. An objective must supply reviewed recognition, recall, understanding and application requirements where relevant; missing requirements produce NEEDS_PRACTICE or unavailable assessment, never implicit mastery.

Add an optional versioned `teaching` field to the current turn response; preserve every existing response field and route. Continue using `message`, `emotion`, `conversation.skillEvidence` and legacy progress behavior for current clients. Proposed interfaces are in `miss-julie-contract.proposed.ts`; they are review artifacts outside runtime compilation, not an approved API or implementation.

### State transitions proposed for review

| Current state | Accepted event / guard | Next state |
| --- | --- | --- |
| INTRODUCTION | Server-verified existing intro requirement satisfied | DISCOVERY |
| DISCOVERY | Diagnostic response evaluated | EXPLANATION or GUIDED_PRACTICE |
| EXPLANATION | Teacher audio acknowledged where required | GUIDED_PRACTICE |
| GUIDED_PRACTICE | Supported success | INDEPENDENT_PRACTICE |
| INDEPENDENT_PRACTICE | Verified independent response | FEEDBACK |
| FEEDBACK | Required practice evidence present | MASTERY_CHECK |
| FEEDBACK | Missing practice evidence | INDEPENDENT_PRACTICE |
| Any practice / MASTERY_CHECK | Wrong, partial or unsupported answer | REMEDIATION |
| REMEDIATION | Reviewed alternate explanation delivered | GUIDED_PRACTICE |
| MASTERY_CHECK | All reviewed dimensions have independent qualifying evidence | COMPLETED |
| MASTERY_CHECK | Evidence missing | REVISION |
| REVISION | Reviewed revision delivered | INDEPENDENT_PRACTICE |
| COMPLETED | Explicit new practice request | New conversation; preserve prior evidence |

Silence, off-topic input, speech failure, malformed AI output and AI timeout do not count as evidence or advance activities. Preserve state, return a bounded curriculum-authored prompt and offer retry/replay. Distinguish no speech from incorrect speech. Repeated mistakes select another approved explanation; exhaustion offers pause/revision rather than forced completion. Support-language answers may demonstrate a concept only if the objective rubric explicitly permits them; they do not automatically demonstrate independent English production.

Resume must recheck authentication, ownership, curriculum version, intro/audio requirements and saved evidence. Client state and model-suggested completion are never authoritative. Reject stale turns; deduplicate retries before calling inference or awarding progress. Bound retries and model input/output sizes. Generate only presentation fields from curriculum and minimized evidence; exclude name, PIN, tokens, raw personal memory and unrelated history from the new engine prompt. Validate output against Zod, permitted vocabulary/actions and length limits; JSON shape validation alone does not establish curriculum grounding. Use reviewed localized fallback lines for en/hi/mr. No model tool access.

### Persistence decision requiring review

Existing Conversation supports evidence and retry fields but has no explicit teachingState, curriculum version, dimension-specific evidence or optimistic revision field. A robust durable state machine cannot claim exact resumption using those fields alone. Do not repurpose summary or personal-memory fields as hidden engine storage.

Phase C can first implement and test a pure reducer with synthetic fixtures and an in-memory repository, without enabling production routes. Production activation requires a separately approved additive persistence design (and atomic write/idempotency strategy), or a reviewed complete reconstruction strategy using existing event metadata. No schema migration or index change is authorized by this document. Save failure must return failure with no claimed progress; completion and unlocks remain behind existing progress services until a safe migration is reviewed.

## Verification and performance plan

Baseline command from backend: `npm.cmd test -- --runTestsByPath tests/unit/pedagogy.service.test.ts tests/unit/firstDayEvidence.test.ts tests/unit/progressCompletion.test.ts tests/unit/kgLessonResume.test.ts tests/unit/pythonAIProviderBridge.test.ts tests/unit/kgStudentFlow.test.ts`.

Result: 6 suites, 45 tests passed. Existing ts-jest TS151002 warning; Jest reported an open asynchronous handle after completing assertions. This is a targeted baseline, not a full regression or live-service verification. No new runtime tests are claimed.

Phase C/D acceptance matrix: correct/wrong/partial answers; Hindi/Marathi conceptual and English-production distinctions; silence; repeated mistakes; off-topic and injection attempts; timeout and malformed JSON; STT/TTS failure and replay acknowledgements; save failure and retry deduplication; resume after restart; stale/concurrent requests; same-computer student switching and revoked sessions; missing/empty mastery requirements; supported evidence never upgraded without a new independent attempt. Re-run KG and Class 1 unit and integration suites, grade/locked-level security, curriculum progression, memory persistence, student isolation and voice retry tests. Use explicitly synthetic objectives until approved curriculum is available.

For scale testing, separate registered population from active sessions and inference concurrency. Measure a 10,000-student seeded dataset with increasing active-turn rates, queue depth, queue wait, p50/p95/p99 latency, tokens/sec, provider errors, event-loop lag, Mongo query plans and connection pool use. Add bounded inference admission, per-student serialization, backpressure, cancellation and circuit breaking before claiming capacity. Cache only nonpersonalized curriculum audio with locale/voice/version keys; bound conversation history and session retention. Verify crash recovery and duplicate delivery. Record IDs and latency without student transcripts. No production capacity has been benchmarked.

## Review requested

Project Manager and curriculum owner: review the proposed additive contract, state guards, objective evidence rules and persistence decision. Frontend owner: review optional `teaching` consumption and replay/action semantics. Confirm which AI repository/deployment is authoritative. Implementation, feature branch, new tests and PR follow this review; no schema change is implicitly approved.

## Project Manager coordination checkpoint

Repository state was rechecked for this checkpoint: same branch and origin, same three pre-existing changed/untracked files, plus the two audit review artifacts. No implementation branch, commit or PR has been created. The proposed contract remains unchanged and unapproved.

### Additional architecture findings

`StudentCurriculumService` resolves grade from the authenticated student, calls `CurriculumAccessService.context`, and delegates progress initialization to `ProgressService.getForStudent`. ProgressService owns initial unlock, published-level synchronization, curriculum version and grade security. The new registry must use these boundaries rather than accepting browser-selected grade/class identifiers. Controlled KG and Class 1 draft/demo access is an explicit exception with version/lesson markers; a registry that simply filters all drafts out would also break supported demos.

`ActivityStage` already describes curriculum stages such as WARM_UP, SPEAK, INTERACT and FINAL_CHALLENGE. These are distinct from the proposed teaching state machine and must not be renamed or replaced by it. Lesson settings and activity metadata are flexible fields, but that flexibility does not authorize new curriculum data or an undocumented state-storage protocol.

Provider selection lives in `providers/ai/index.ts`, `providers/speech/index.ts` and `providers/voice/index.ts`. The authorized Class 1 pilot can override the general AI provider. STT and TTS have separate provider configuration; an Azure class existing on disk does not establish that Azure is selected at runtime. Preserve the existing provider contracts and fail-closed Class 1 behavior.

There are also lesson-specific integration points that generic provider selection alone would miss: `KGQwenFeedbackService.compose` calls `/v1/brain/respond` using `TALKORA_KG1_AI_URL` (default 8002), a seven-second deadline and optional service authentication. It receives the deterministic grading outcome and generates wording only; silence and supported responses bypass inference, and rejected/error responses use guided feedback. Reuse this separation of grading from wording. `kg-speech.service.ts` can select Azure STT directly. `voice.service.ts` explicitly requires Azure for dynamic Class 1 conversation speech and fails with `CLASS1_AZURE_DYNAMIC_VOICE_UNAVAILABLE` when unavailable; it also maintains approved static-audio caching and in-flight deduplication. These direct paths must remain covered by compatibility tests.

`AudioCacheService` hashes normalized text, provider, voice, rate, pitch, format and optional version; it stores metadata in Mongo and audio in S3. Cache hits currently save hit-count/last-use metadata, creating a write per hit. Benchmark that overhead before assuming cache throughput. The key has no explicit locale field; verify locale is represented by voice/version when integrating multilingual curriculum audio. Do not place private personalized speech into a shared curriculum cache.

### Proposed ownership boundaries (pending team agreement)

| Owner | Files / responsibility | Checkpoint action |
| --- | --- | --- |
| Codex | Backend orchestration, provider adapters, deterministic evaluator integration, backend tests; `docs/miss-julie-*` review artifacts | Audit and proposal only now; implementation follows contract review. |
| Z.ai | Curriculum datasets, lesson objectives, rubric criteria, language equivalents and approved fallback wording; relevant curriculum/seed sources | Read-only to Codex. No official lesson content invented. |
| GitHub Copilot | Frontend components, lesson experiences, animations and client/shared consumer contracts | Read-only to Codex without approval. |
| Project Manager + consuming owners | API shape, action semantics, versioning, rollout and acceptance | Review before any shared contract is finalized or implemented. |
| Project Manager / data owner | Persistence schema, migration and index approval | Separate explicit approval before schema changes. |

The standalone `docs/miss-julie-contract.proposed.ts` is a review sample, not a shared runtime contract. Proposed envelope fields remain lessonId, activityId, teachingState, teacherUtterance, language, visualAction, expectedStudentAction, feedbackType, masteryEvidence, nextAllowedActions and progressUpdate, with version/conversation/revision context. Open decisions include speech acknowledgement events, progress write failure semantics, evidence identifiers, durable revision storage and curriculum-version changes during resume. These must be settled before publishing an API.

### Test inventory and remaining risks

Existing unit coverage includes pedagogy, first-day scene evidence, KG grading/speech/resume, provider bridge validation, multilingual prompts, intro URLs, Azure locale/audio policy and completion rules. Integration suites include curriculumProgressionV1, curriculumGradeSecurity, lockedLevel, learningProgress, memoryPersistence, studentIsolation, KG pilot/alphabet/homework, Class 1 demo access, voiceMultiTurn and voiceSubmissionRetry. Their existence is not a claim that they all passed this checkpoint.

Integration helpers use mongodb-memory-server (default MongoDB 7.0.14), requiring a cached binary or a download, and test setup selects mock AI. Consequently these suites cannot establish real Qwen/Azure quality or latency. The earlier 45-test targeted baseline remains the only reported execution; this checkpoint did not rerun it because runtime files have not changed.

Major compatibility risks remain: equating final scripted activity with proficiency; treating hinted/option answers as independent recall; conflating curriculum stage with engine state; replay/timeout retries double-writing progress; storing new state only in memory; bypassing draft-demo/grade authorization; silently switching local inference to cloud; and marking an unavailable microphone as an incorrect answer. Preserve existing completed records, intro tickets, teacher-audio acknowledgements, PIN authentication and temporary-session logout (currently a 20-minute frontend inactivity threshold checked every minute). Future missing-rubric tests must use clearly named synthetic fixtures only; none have been introduced during this audit.

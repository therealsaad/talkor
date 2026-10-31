# Talkora Sprint 2 — Node / Python synthetic teaching bridge

**Status: development-only draft; not a production student teaching API.**

The Python dev_harness in therealsaad/talkora-ai-private is a standalone, localhost-only, synthetic under/on lesson. It does not run in the live Python server or own real student progress. This branch provides a Node developer adapter and a seven-turn test client that exercise its contract without changing existing student routes, Class 1 QwenProvider/PythonAIProvider, MongoDB, Azure, Sarvam, S3, or the UI.

## Safety properties

- The new adapter is OFF unless TALKORA_NODE_SYNTHETIC_TEACHING_OPT_IN=true and TALKORA_ENABLE_TEACHING_HARNESS=true. It refuses any production environment and requires a 32+-character TALKORA_SERVICE_KEY.
- It calls only 127.0.0.1 on port 18000–18999, the exact /dev/teaching/turn path, with redirects refused. Production port 8002 is explicitly excluded.
- It uses exactly the synthetic fixture curriculum identity: synthetic / position-fixture / test-only / demo / positions / under / below-relation / v1. No caller-controlled scope. The transcript allowlist prevents accidental transmission of real child speech or personal data.
- It rejects false activityComplete, validatedLearning, acceptedEvidence, XP, unexpected student claims, mismatched revisions, identity swaps, HTTP errors, malformed JSON and invalid content types. No fallbacks can disguise upstream failures.
- The local script uses anonymous ephemeral UUIDs and reports only turn number, strategy and provider status. There is no live auth session, database write, progress, mastery, audio ACK or student release.

## Local opt-in reproduction

Run the Python source checkout at talkora-ai-starter, following dev_harness/README.md. Do not replace the active Python service on port 8002 and do not stop an existing Ollama process. Create a temporary random service key in local environment variables; use the same key in both processes and never commit or publish it.

Python harness launch (local development only):

    $env:TALKORA_ENV='development'
    $env:TALKORA_ENABLE_TEACHING_HARNESS='true'
    $env:TALKORA_CLASS1_QWEN_PILOT='true'
    # TALKORA_SERVICE_KEY must be set securely and be at least 32 characters
    python -m dev_harness --port 18152

Node synthetic smoke (a separate PowerShell terminal with the same temporary key):

    cd backend
    $env:TALKORA_ENV='development'
    $env:TALKORA_ENABLE_TEACHING_HARNESS='true'
    $env:TALKORA_NODE_SYNTHETIC_TEACHING_OPT_IN='true'
    $env:TALKORA_DEV_TEACHING_PORT='18152'
    pnpm exec tsx src/scripts/check-synthetic-teaching-harness.ts

Offline checks (do NOT require Python, Ollama, Azure, secrets or a cloud account):

    cd backend
    pnpm exec jest --runInBand tests/unit/syntheticTeachingHarness.test.ts
    pnpm build

GitHub CI only executes the offline mocked test. A green CI does not certify a real AI response, live 8002 parity, browser audio, or deployment readiness.

## Release gates for real Class 1 teaching

1. Close [curriculum issue #64](https://github.com/therealsaad/talkor/issues/64) only after qualified teacher approval, copyright clearance, school-medium selection, and an approved namespace/book/edition/track/lesson/activity/objective/version map. All 84 currently registered objectives are draft-only.
2. Compare installed Python 8002 executable/source/version/model with the reviewed AI repo. This development harness is not a substitute for the deployed service.
3. Build a separate approved student adapter using server-authenticated, curriculum-verified scope, minimized speech signals, and Node-owned durable idempotency, checkpoints, and replay protection. Python text and lexical matches never become accepted correctness, mastery, progress or XP.
4. Preserve the existing five-digit-PIN, shared-computer session isolation, mandatory intro/video gates, audio-played ACK, resume and historical Progress records. No errors or silent input may advance an activity.
5. Prove teacher-reviewed English/Hindi/Marathi spoken responses, real Sarvam -> Qwen -> Azure latency and playback on actual school-lab headsets, and fail-closed errors before any real-student opt-in. Publish only through a separately reviewed, default-OFF pilot flag and rollback plan.

Relevant source PRs: [Python teaching brain #14](https://github.com/therealsaad/talkora-ai-private/pull/14), [Python harness #17](https://github.com/therealsaad/talkora-ai-private/pull/17), [Miss Julie presentation #65](https://github.com/therealsaad/talkor/pull/65).

## Repository access warning

On 2026-10-31 GitHub reported therealsaad/talkora-ai-private as PUBLIC despite its name. Decide repository visibility in GitHub Settings, audit history/secrets and rotate exposed credentials if any. This code-only PR cannot change repository visibility or rotate keys.

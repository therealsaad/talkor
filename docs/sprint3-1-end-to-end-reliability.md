# Talkora Sprint 3.1 — real MongoDB reliability and Node/Python wire contract

**Scope: verified infrastructure, NOT production end-to-end child tutoring.** This work is an isolated continuation of merged PRs #77/#80. It adds automated integration tests; it does not publish textbook content, turn on teacher AI endpoints or change the current five-digit PIN/progress/audio/lesson routes.

## Actual tests introduced

1. `tests/integration/teachingCheckpointMongo.test.ts` connects to **real MongoDB 7**, creates unique indexes and an isolated disposable database, then tests restart/reconnect persistence, identical request replay, changed-request conflict, sixteen simultaneous competing requests at one revision, twelve identical concurrent retries, two students plus two book tracks and approved revisions, refusal of unpublished lesson access, no ActivityAttempt/Progress writes, and a hard limit of sixty-four advisory turns.
2. `tests/integration/syntheticTeachingWire.test.ts` opens an actual TCP/HTTP listener on **127.0.0.1:18152** and tests the Node client's request headers, exact synthetic body, strict advisory-response validation, identity mismatch, forbidden mastery and production deny. The listener is **a Node test fixture matching the Python development-harness contract, not the real Python service**.
3. Both tests run inside `talkora-110-level-checks.yml` on PRs. The backend job starts a disposable MongoDB 7 service container; the test accepts only the exact local URI `mongodb://127.0.0.1:27017` and writes only to a randomized `talkora_sprint31_*` database. CI credentials and students are not used.

## Reproducing without touching your existing local 5000/8002/11434 processes

From a local backend terminal:

    pnpm install --frozen-lockfile
    pnpm exec jest --runInBand tests/integration/syntheticTeachingWire.test.ts
    pnpm exec jest --runInBand tests/integration/teachingCheckpointMongo.test.ts

If the Mongo URI is omitted, the existing project dependency `mongodb-memory-server` downloads and launches a temporary genuine MongoDB process (first invocation may require internet access). Alternatively, run a disposable *local* Mongo 7 instance on port 27017 and set `TALKORA_CHECKPOINT_TEST_MONGO_URI=mongodb://127.0.0.1:27017`. The tests reject other external hosts or ports and use a unique test DB name. **Do not set this URI to any existing production/school Mongo instance.**

## Explicit limits

- The test replaces **only curriculum authorization** with a known stub, because no verified school-admin textbook assignment, qualified-teacher signature or approved objective-revision store is integrated yet. MongoDB CAS and database indexes are real. This is not an authenticated HTTP student request.
- The fake local teaching responder does not verify live Python port 8002, Ollama/Qwen generation, Sarvam STT, Azure/S3 sound, teacher approval, video-completion tickets or audible playback acknowledgment.
- No input child transcript, audio, personally identifying text, scoring, XP or real progress is stored in the new checkpoint. The experiment remains disabled by default and production forbidden; current `Conversation`, `Progress`, `ActivityAttempt`, `VoiceSession` are unchanged.
- MongoDB revisions are advisory state only. There is no transaction from inference through TTS and acknowledgment through mastery; that requires a reviewed, separately gated protocol.

## Next true production acceptance gate

On an approved, consented pilot account, verify: PIN login and shared-machine isolation; compulsory intro playback; authorized textbook/edition/objective; real Sarvam → Qwen → Azure → audible acknowledgment; deterministic independent evaluation; MongoDB checkpoint + existing Progress resume on restart; and failure/duplicate/silence recovery. Record teacher rights and content approval. This PR is necessary verification, not proof of that release gate.

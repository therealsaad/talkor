# Talkora Production Repair Implementation Plan

> **For agentic workers:** Use the inline execution workflow; keep the existing dirty workspace intact and do not delegate.

**Goal:** Restore the configured AI and Groq STT paths, make the student voice loop reliable, make KG Grade 0 student creation and published-curriculum resumption safe, and verify Talkora's existing builds and learning flows.

**Architecture:** Keep the existing client/backend split and MongoDB Atlas. Route all conversations through `AI_PROVIDER`, harden Groq upstream handling with safe structured errors, extend the existing recorder/VAD patterns to free-talk without adding providers or duplicating lesson flows, and map Grade 0 students through the existing grade-owned `CurriculumClass` access path.

**Tech Stack:** Next.js 16.3, React, TypeScript, Express, Jest/ts-jest, MongoDB/Mongoose, Groq Whisper, existing Azure/Groq voice providers.

**Spec:** `docs/superpowers/specs/2026-10-12-talkora-production-repair.md`

## Global Constraints

- Preserve the existing app and approved responsive UI; do not rebuild it.
- Honor `AI_PROVIDER`; never silently switch providers or invent model IDs.
- Never print or return API keys or raw provider error payloads.
- Preserve MongoDB Atlas and student progress; do not reset, reseed, or run destructive migrations.
- Never connect to local MongoDB or create a real test account during verification; use mocked models and APIs.
- Keep student PIN authentication, Lab Mode, and separate teacher/school logins intact.
- Measure latency before claiming performance improvements.
- Preserve unrelated user changes; do not stage or commit this mixed dirty working tree.

## Review Focus

- Free-talk must use the selected provider even when Gemini is unset; test a Groq selection and confirm Gemini is not called.
- Groq 401/403, 429, timeout, malformed payload, and 5xx must have safe, useful outcomes; test each with mocked fetch responses.
- STT must reject empty/unsupported audio and accept browser WebM/Opus and the recorder's maximum duration; test payload validation and upload parsing.
- Microphone permission denial, silence, max duration, repeated clicks, and Julie speech must not cause an infinite loop or overlapping recordings; test lifecycle transitions or the underlying decision helper.
- Student progress and class-wise curriculum must remain unchanged; run existing progression/isolation tests and avoid destructive database operations.
- Phone/tablet responsive changes already in the workspace must survive the frontend production build.

---

### Task 1: Configured conversation provider and safe AI errors

**Files:**
- Modify: `talkora-backend/src/config/env.ts`
- Modify: `talkora-backend/.env.example`
- Modify: `talkora-backend/src/services/missJulie.service.ts`
- Modify: `talkora-backend/src/providers/ai/GroqProvider.ts`
- Create: `talkora-backend/tests/unit/envConfig.test.ts`
- Modify: `talkora-backend/tests/unit/missJulieProvider.test.ts`
- Create: `talkora-backend/tests/unit/groqProvider.test.ts`

**Interfaces:** Free-talk and lesson turns both consume `getAIProvider()`; Groq maps upstream auth/rate-limit/transient errors to safe `ApiError`s and structured logs.

- [ ] Add an env-config regression test using test-only values for Gemini key/model fields; run it and observe those fields missing.
- [ ] Map the documented Gemini variables in `env.ts` and `.env.example`; run the env test and existing Gemini provider tests.
- [ ] Change the free-talk provider test to select Groq and assert Groq is called while Gemini is not; run it and observe the current Gemini-path failure.
- [ ] Route free-talk through `getAIProvider()` and run the focused test.
- [ ] Add failing mocked-provider tests for Groq 401, 429, timeout, and upstream body sanitization; run them red.
- [ ] Implement status-aware safe errors and non-sensitive timing/status logs; run all focused provider tests.

**Reviewable result:** the Gemini missing-key error no longer occurs when Groq is selected, and upstream errors explain what configuration/action is needed without leaking provider payloads.

### Task 2: Groq STT validation and failure mapping

**Files:**
- Modify: `talkora-backend/src/providers/speech/GroqSpeechProvider.ts`
- Modify: `talkora-backend/src/controllers/voice.controller.ts`
- Modify: `talkora-backend/src/schemas/voice.schema.ts`
- Create: `talkora-backend/tests/unit/groqSpeechProvider.test.ts`
- Create or modify: `talkora-backend/tests/unit/voiceUpload.test.ts`

**Interfaces:** keep the existing multipart and base64 route contracts; allow durations through 12 seconds to match the free-talk recorder; map provider throttling separately and sanitize other upstream failures.

- [ ] Add mocked-fetch tests for empty audio, WebM/Opus metadata, 401, 429, 5xx, timeout, and malformed JSON; run red.
- [ ] Align request duration limits and implement safe errors/logging; run focused tests.
- [ ] Exercise multipart parser content type, empty file, unsupported MIME, and size limit with mocked route/provider behavior.

**Reviewable result:** valid browser recordings reach Groq; client errors distinguish retryable throttle/network failures from invalid local uploads.

### Task 3: Safe KG (Grade 0) student and curriculum flow

**Files:**
- Modify: `talkora-backend/src/services/student.service.ts`
- Modify: `talkora-backend/src/services/curriculum-access.service.ts`
- Modify: `talkora-backend/src/services/progress.service.ts`
- Modify: `talkora-backend/src/services/auth.service.ts`
- Create: `talkora-backend/tests/unit/kgStudentFlow.test.ts`
- Modify: `talkora-client/app/school/students/page.tsx`
- Modify: `talkora-client/app/school/students/student-management-page.tsx`
- Modify: `talkora-client/app/school/classes/page.tsx`
- Modify: `talkora-client/app/school/classes/[id]/page.tsx`
- Modify: KG grade labels in student login/profile and school student detail/report views where they currently display `Class 0`.

**Interfaces:** retain Grade 0 in the existing student model and create/list/update validation; create students through the authenticated school-scoped route and the existing cryptographically generated five-digit PIN flow; resolve curriculum from the student's persisted grade; only return a playable KG lesson when KG curriculum is published; continue from existing progress without resetting it.

- [ ] Add mocked tests for Grade 0 student creation, unique-PIN duplicate-key retry, Grade 0 curriculum lookup, published/unpublished curriculum outcomes, and resuming the first unfinished lesson/activity with progress unchanged; run red without opening a MongoDB connection.
- [ ] Make the create form report whether published KG curriculum is available and retain the existing one-time PIN display; do not create a default PIN.
- [ ] Correct the Grade 0 student-list URL filter and use KG/Kindergarten labels across login, profile, admin, and reports.
- [ ] Show an actionable unavailable message when KG curriculum is unpublished; keep the existing read-only admin curriculum preview and label its Grade 0 levels as KG.
- [ ] Implement the minimal backend changes and run the mocked flow tests.

**Reviewable result:** an authorized school administrator can create a KG student with a unique, one-time five-digit PIN; their Grade 0 curriculum resolves by grade, unfinished work resumes, and unpublished curriculum is explained without seeding or changing existing records.

### Task 4: Free-talk hands-free voice lifecycle

**Files:**
- Modify: `talkora-client/hooks/use-audio-recorder.ts`
- Modify: `talkora-client/app/student/practice/talk/page.tsx`
- Reuse: `talkora-client/lib/voice-activity.ts`
- Modify or create a focused test only if the existing frontend tooling can run it without introducing an unnecessary framework.

**Interfaces:** the free-talk page may auto-start recording only after Julie finishes and microphone permission is already granted; the mic button remains the fallback. Silence and max-duration stop recording; explicit stop/replay/exit remain available.

- [ ] Trace playback completion and microphone status; add a regression test for any extracted pure permission/turn decision before changing it.
- [ ] Add a synchronous start guard and optional silence detection to the recorder, enabled only for free-talk.
- [ ] Auto-start after Julie audio only when permission is granted; retain tap-to-start when permission is prompt/denied/unsupported; stop Julie before manual interruption.
- [ ] Prevent duplicate turn submissions and honor spoken replay/exit commands; verify client TypeScript/build and existing backend turn/progression tests.

**Reviewable result:** free-talk can continue voice-first after a one-time permission grant and never opens a mic during Julie playback.

### Task 5: Full repository verification and repair audit

**Files:** modify only files implicated by an observed test/build failure; do not reformat or revert unrelated work.

- [ ] Run safe, mocked backend unit suites, backend TypeScript check, and backend production build. Do not run test suites that start MongoDB Memory Server while the no-local-Mongo constraint applies.
- [ ] Run the frontend lint and production build; inspect Next.js diagnostics and preserve responsive page changes.
- [ ] Run focused voice/STT/progression/isolation/TTS and KG-flow tests and report exact counts. A real-device microphone/Atlas check requires an authorized school-admin session and fresh test account; do not manufacture one during this repair.
- [ ] Review final diffs in both repositories and confirm no secrets, Atlas URI changes, destructive scripts, or unrelated assets were staged/altered by this repair.

**Reviewable result:** exact verification evidence and any external credential requirement are reported without claiming unmeasured latency gains or untested live behavior.

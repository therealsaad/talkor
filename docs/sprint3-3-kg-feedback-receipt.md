# Talkora Sprint 3.3 — KG audible-feedback receipt gate

**Status:** Pull request implementation, not production acceptance or acoustic verification. Reuses existing KG Level 1 routes, curriculum, approved static narration, Sarvam, Qwen, and Azure/Priya.

## Why

The old KG POST /kg-alphabet/attempt/:submissionId/feedback-played endpoint advanced an otherwise correct attempt as long as the caller sent the student token and the intro ticket, even if the app never requested or played voice feedback. Browser playback must remain part of the learning transaction, and a failed TTS response must not silently unlock an activity.

## Protocol

1. The authenticated attempt route records the deterministic grade once. It **does not** issue a playback receipt.
2. The authorized GET /kg-alphabet/attempt/:submissionId/feedback-audio verifies the per-visit completed intro ticket. Only after Azure or validated Priya fallback generates audio does it emit the response header X-KG-Feedback-Receipt.
3. The token is an HMAC-SHA256 authenticated receipt with a random nonce and a 15-minute expiration. It is bound to the actual student ID, school ID, submission ID, current intro-ticket hash, and teacher feedback text. The receipt does not contain names, transcripts, PINs or audio, and requires no database migration.
4. The KG browser reads the header from the **same** successful authenticated Blob response, plays the returned sound, and only puts the receipt into its in-memory ACK queue after the real audio.onended event. POST feedback-played now requires JSON { feedbackReceipt } and the same authenticated intro token.
5. Missing, forged, expired, wrong student, wrong attempt, changed teacher sentence or new intro-ticket receipts fail closed with HTTP 409. A valid duplicate ACK remains idempotent. Correct English word evidence still comes only from the backend and never from Qwen or the receipt.
6. The client audio Blob cache now includes student token and intro-ticket ownership, is short-lived for live feedback, and cannot reuse a previous learner's Blob across a lab account switch. The pending ACK map stays in tab memory.

The header is explicitly exposed through the existing allowlisted CORS configuration for the authenticated browser frontend. Audio bytes/feedback text are not stored in the signed receipt.

## What this guarantees — and what it doesn't

**Guarantees:** The normal client cannot advance a correct answer without first fetching server-generated audio and finishing its playback path; a TTS failure cannot mint the receipt; login/session switches cannot reuse a signed receipt; duplicate ACKs cannot grant duplicate progress. Existing lesson gates and DB checks remain authoritative.

**Does not guarantee:** A server cannot prove that a child physically heard the sound or that the device was not muted. A malicious authenticated client can fetch a token and forge a client-side end-of-playback event. Live school-lab acceptance and human review remain mandatory.

## Offline verification

    cd backend
    pnpm install --frozen-lockfile
    pnpm run build
    pnpm exec jest --runInBand tests/unit/kgFeedbackReceipt.test.ts
    pnpm exec jest --runInBand tests/integration/kgAlphabetAudio.test.ts -t 'requires generated voice receipt'
    pnpm exec jest --runInBand tests/integration/kgAlphabetAudio.test.ts

    cd ../client
    pnpm install --frozen-lockfile
    pnpm build
    node --test tests/ui/kg-ticket-feedback-headers.test.mjs
    node --test tests/ui/kg-audio-feedback-retry.test.mjs
    node --test tests/ui/kg-intro-session-ownership.test.mjs

Tests use fake STT/TTS, ephemeral local Mongo, no provider credentials and no student data. One real consenting pilot must also verify: actual speakers and audio.onended, page refresh between submitted attempt and audio playback, actual Azure outage and Priya outage, shared-lab student switch, old introduction replay, 15-minute receipt expiry, and safe retry of the same submission ID.

## Rollout

This changes both backend and browser ACK contracts; deploy them together, not as independently compatible versions. Keep a snapshot of the previous build for rollback. Do not publish other grade levels or alter existing historical student progress. Explicit supervised teacher approval and real device verification required before turning on in a school.

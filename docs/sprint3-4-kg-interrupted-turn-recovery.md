# Sprint 3.4 — KG interrupted-turn recovery and immutable teacher feedback

**Scope:** KG Level 1 only, built on the merged Sprint 3.3 audio-receipt gate. No new lesson publication, model training, XP rules, child-audio persistence, permissions, PIN changes or bypass of the mandatory intro video.

## Why this change

An STT answer was saved in MongoDB before the Qwen coaching sentence was finalized. A concurrent duplicate POST or feedback-audio GET could pick a deterministic fallback while the original Qwen request later overwrote the attempt with different teacher words. This creates contradictory audio/text on a retry and could invalidate a signed playback receipt. A fresh tab also lost the in-memory submission ID and asked a child to speak again despite an already-graded, unplayed turn.

## Production contract

1. The backend records the verdict once, without advancing.
2. While the submission lease remains active and the final feedbackText is absent, the duplicate POST, feedback-audio GET, and feedback ACK return retryable HTTP 409. Nothing provisional is spoken or signed.
3. At successful Qwen/guided completion, MongoDB stores the teacher sentence via first-writer-wins compare-and-set on an absent feedbackText. Audio, duplicate POSTs and receipt verification all read that frozen value.
4. If a backend process stops after grading but before finalizing feedback, an expired or missing lease allows a single deterministic, grade-safe fallback to be frozen with the same compare-and-set. It never calls STT or Qwen again. If an exceptionally late Qwen result arrives afterward, it cannot replace the frozen line.
5. New, non-replay KG attempts carry awaitingFeedbackPlayback=true. A verified audio receipt ACK advances or keeps progress as the grade permits and marks the attempt acknowledged. Older attempts without the flag are never automatically presented as unheard.
6. After a fresh full-screen introduction has been completed, the authenticated KG browser calls GET /api/kg-alphabet/pending-feedback with the per-visit intro ticket. The backend exposes only the latest 30-minute, current-activity, non-replay attempt. It returns its saved outcome and feedback without recording or regrading anything.
7. The browser shows a deliberate 'Try again' action to play the recovered sentence from server audio. Only a completed audio.onended event can queue its signed receipt, then POST feedback-played acknowledges it. Failed audio and missing receipt still fail closed.
8. If recovery cannot be checked, the completed video view shows a retry/error, rather than silently creating another answer for an in-flight saved turn.

## Safety and compatibility

- No raw child speech is sent to S3 or persisted by this recovery feature; it reads already recorded attempt metadata and server-owned feedback.
- Session and student scope are enforced on pending lookup, audio and ACK. A new lab visit must complete the mandatory introduction again.
- No old progress rows require migration. Older attempt records may still use the pre-3.4 recovery behavior, but cannot be auto-resumed as new unplayed turns.
- The 30-minute replay window is intentional: stale school-day attempts should not silently take over a fresh lesson.
- A signed receipt still does not prove a child physically heard a speaker. Real-device supervised checks are required.
- Backend/client must be rolled out together. Releasing the server independently can expose transient 409 responses to a pre-3.4 client without the new recovery UI.

## CI checks

Backend:

    cd backend
    pnpm install --frozen-lockfile
    pnpm run build
    pnpm exec jest --runInBand tests/integration/kgAlphabetAudio.test.ts -t "blocks duplicate submission|recovers an orphaned|never overwrites a recovered|resumes only the current unacknowledged|does not resume stale"

Frontend:

    cd client
    pnpm install --frozen-lockfile
    pnpm build
    node --test tests/ui/kg-pending-feedback-recovery.test.mjs
    node --test tests/ui/kg-feedback-receipt.test.mjs

The integration tests use the disposable local Mongo test instance and mocked providers. None of these CI gates is proof of genuine Sarvam, Qwen GPU or Azure voice availability or of a complete, consented student session.

## School pilot exit gate

With authorized KG credentials and a real browser microphone/speaker, confirm: PIN login; complete non-skippable intro; correct and wrong spoken word; language switching; end of voice before progress ACK; close/reload after the grade was stored but before sound finished; an offline Qwen request, offline STT, Azure and Priya outage; two concurrent duplicate submissions; pause/tab-hide and restart; and switching to another student on the same PC. Record wall-clock end-to-end timing separately. Do not mark production-ready until this controlled test and human pedagogy review are passed.

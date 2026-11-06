# Miss Julie advisory teaching checkpoint — isolated development experiment

**Issue #78 partial engineering deliverable. The real Class 1 student integration is NOT enabled.**

## Why this exists

The merged synthetic Node–Python adapter (#77) proves a bounded, de-identified test protocol. Its Python state is short-lived, not durable. The existing Talkora Conversation, VoiceSession, ActivityAttempt and Progress models already store student learning, but they do not yet express a versioned, strictly idempotent, step-by-step teaching revision for the proposed dual-textbook integration. This change prepares an additive MongoDB checkpoint model and an internal advisory-only service **without connecting any student route**.

## Safety and failure semantics

- Production and missing `TALKORA_TEACHING_CHECKPOINT_EXPERIMENT=true` always reject use. No Express endpoint, lesson service or model provider imports this service, and no data migration/index rebuild is run by the PR.
- `CurriculumAccessService.assertActivity` and a fresh student-grade/status check must approve the actual student, lesson and activity before any write. Draft Class 1/KG demos, unpublished levels and a mismatched lesson ID are forbidden even when the caller fabricates `approvedRevision`.
- The proposed exact namespace, book ID, school track, edition, lesson/activity IDs, objective and version are validated and hashed. English Balbharati and My English Book identities cannot be interchanged. The hash distinguishes later approved revisions without touching older checkpoints or historic g01-l01 progress.
- **This is not a live grant:** school-admin medium selection and qualified-teacher approvedRevision registry do not exist in the student backend. Therefore the module must not be wired into Express or used with real student requests until the #64 release gate is separately implemented and reviewed.
- Each advisory turn is a de-identified signal, strategy, support level and revision. MongoDB conditional `$inc` and `$push` on the same document make concurrent revision writers mutually exclusive. A request UUID with the same digest returns its stored receipt; reusing it with different signals or using a stale revision conflicts. At most 64 receipts per checkpoint; none are truncated.
- The ledger has **no raw student transcript, generated tutor wording, child name, PIN, JWT, audio, pronunciation score, XP, accepted evidence, completion or unlock fields**. A Qwen lexical suggestion cannot cause an ActivityAttempt or Progress write. `evidenceAccepted=false` and `xpAwarded=0` on all returns.
- This supports durable **advisory revision and retry** only. A future approved integration also needs a transactionally coordinated TTS/ACK/progress protocol, separately reviewed response-text replay policy, retention controls, and real MongoDB concurrent/restart tests. This branch does not claim complete end-to-end resume or exactly-once provider generation.

## Checks

    cd backend
    pnpm exec jest --runInBand tests/unit/teachingCheckpointService.test.ts
    pnpm build

CI runs mocked atomic-CAS and isolation tests without a real database or cloud accounts. Do not set the experiment flag in production. Do not apply DB migrations or invoke the service from existing controllers.

## Still needed before #78 may close

1. Qualified educator signs revised dual-book curricular objective and mapping; school admin authorizes book/medium independently from bilingual support language (#64).
2. Verify actual Python 8002 source revision/model and a non-synthetic, service-key-authenticated, versioned teacher advisory route. Do not send child identity, history or arbitrary instructions to Qwen.
3. Implement Node-owned authoritative independent-answer/retention checks and audio-playback ACK prior to progress. Preserve historic g01-l01 completion and current student session isolation.
4. Run real auth, turn replay, MongoDB concurrent writes, abrupt shutdown/resume, STT failure, bilingual teacher review and Azure playback E2E on a supervised test student. Explicitly document validated vs merely simulated behavior.

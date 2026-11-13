# Class 1 — Gentle Azure spoken poem-coaching copy (review only)

**Incident:** The previously approved Gentle Learning Engine recognizes a valid single English word and tracks supported learning, but the original poem fallback still ordered children to **“Say BOTH lines slowly.”** A six-year-old could feel they failed even when they identified the correct action.

## Change
- Existing `guardFirstDayPoemTurn` fallback teacher speech for uncertain/incorrect replies now invites **one relevant English word or both authored lines**. The complete five-section finale fallback invites one word from each section, with full-poem recitation optional for confident learners.
- The already authored line model stays intact, so the child can still hear complete English examples via **Azure**. The same hint text in Hindi/Marathi is retained and the brief introductory instruction is now beginner-friendly in those languages.
- New **future-only local draft stage** teacher prompts in `stage-class1-first-day-poem.ts` carry the same gentle alternatives; no existing MongoDB activity, published prompt, teacher-audio session, or learner progress is modified. The installer remains test-DB-only and requires its prior environment flags, and this patch does **not** run it.
- The fallback still rejects stale Qwen `at` responses and never grants XP or completion. Node independently evaluates recognized words and requires a signed playback acknowledgement before saving progress; this PR has no change to grading, student PIN/auth, Sarvam, AI provider, voice format, or rollout configuration.

## Tests
Existing `class1PoemTeachingGuard.test.ts` now checks English/Hindi/Marathi gentle fallback, approved poem modeling and zero completion/XP. The real HTTP/Mongo practice regression checks the new one-word coaching after an unclear reply and unchanged replay/ACK behavior.

The stage script affects **newly staged drafts only**. Already staged/school database `teacherPrompt` text can remain strict until explicitly reviewed and replaced by an authorized curriculum update (separate decision and migration plan required). No DB edit is part of this change.

## Limits
A text-only speech recognizer cannot accurately grade pronunciation. Live microphone → speaker latency, real child participation, and author/publisher approval remain outstanding. Do not merge or deploy without code review, green CI and a supervised classroom pilot.

Rollback: revert feature branch; there is no migration.

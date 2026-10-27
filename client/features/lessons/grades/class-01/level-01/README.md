# Class 1 / Level 01 — Little Words & My First Day

**Code:** `g01-l01` · **Status:** development/staff-preview draft · **Canonical student engine:** `/student/lesson/[id]`

This is **one level**, not a new controller or a second lesson engine. It is deliberately slower than the original two-letter-word pilot:

1. The supplied **90-second Miss Julie introduction video**, with sound, before the first activity. Teacher review is still required; nothing is silently skipped if it is missing.
2. Seven original foundation activities: practise all eight words (`am`, `an`, `at`, `in`, `is`, `it`, `on`, `up`) by listening, building, reading a short sentence and talking with Miss Julie.
3. Three original Balbharati-aligned activities: say `walk`, find `school`, and have a short supportive school conversation.
4. Short spoken homework, MongoDB-backed progress, and automatic resume via the existing authenticated activity engine.

**Textbook:** *English Balbharati Grade One* (2025 first edition, 2026 reprint), Unit One, 1.1 **My First Day**, page 1. This is an original teaching adaptation; do not copy protected poem text, illustrations, or publisher audio into the app without permission. Teacher approval remains mandatory.

## Files

- `LevelExperience.tsx`: staff-only visual preview. Microphone turns are clearly marked as requiring a real authenticated student; the preview never fabricates voice success or saves progress.
- `activities.ts`: **10-step** client design specification, ordered from foundations to textbook bridge.
- `config.ts`: syllabus, visual style, language policy, and draft publication gate.
- `interactions.ts`: available voice and tap modes; microphone is enabled in the real activity engine.
- `assets.json`: approved visual assets. The local 90-second MP4 and Class 1 map are supplied under `client/public/lessons/class-01/level-01/`.
- Backend `src/scripts/prepare-class1-l01-draft.ts`: guarded draft-only activity authoring; does not auto-publish.
- Backend `src/scripts/finalize-class1-l01-demo.ts`: draft metadata and Qwen review update; only updates the guided activity when it has no attempts of its own.
- Backend `src/scripts/class1-level1-ai4bharat-lines.json`: Priya/AI4Bharat prompt manifest for reviewed S3 narration.

## Required media and validation

Full 90-second video script, shot list, character rules, S3 delivery instructions and QA checklist: `docs/class1-level1-first-day-production.md` (repository root).

The first visit requires `miss-julie-first-day-intro.mp4` (90 seconds) with sound; fullscreen is requested after a tap when supported; inline playback remains available when blocked. There is no in-app skip or close button. Use `map.png` for the Class 1 levels map. The map has no student `YOU` portrait for this grade. Use the transparent Miss Julie WebM animations with the still-portrait fallback and reduced-motion support.

The level remains an unpublished draft until a teacher approves the media, Sarvam STT, Azure feedback, Qwen conversations, speech tolerance, database attempts and resume behavior. In development, `TALKORA_CLASS1_STUDENT_DEMO=true` plus `TALKORA_CLASS1_DEMO_ALL_STUDENTS=true` opens this exact draft to active Class 1 students; without the all-students flag, access stays limited to `TALKORA_CLASS1_DEMO_STUDENT_ID`. Production always uses published-only access. A video existing in S3 does **not** by itself publish the level.

Run the read-only `audit-class1-l01-readiness.ts` and `audit-class1-level1-audio.ts` scripts from `backend/` against the intended development/staging configuration. The preparation and finalization scripts are read-only by default; `prepare-class1-l01-draft.ts --apply` retains old activity IDs and attempts as optional legacy history, then adds new required activity IDs so saved progress is not falsely applied to changed content. Audio v2 must be listened to and approved before S3 upload.

# Class 1 / Level 01 — Little Words & My First Day

**Code:** `g01-l01` · **Status:** development/staff-preview draft · **Canonical student engine:** `/student/lesson/[id]`

This is **one level**, not a new controller or a second lesson engine. It is deliberately slower than the original two-letter-word pilot:

1. A complete **90-second Miss Julie introduction video**, with sound, before the first activity. The asset must be rendered and reviewed; nothing is silently skipped if it is missing.
2. Seven original foundation activities: recognise/build `at` and `in`, practise a tiny sentence, and speak `at` with Miss Julie.
3. Three original Balbharati-aligned activities: say `walk`, find `school`, and have a short supportive school conversation.
4. Short spoken homework, MongoDB-backed progress, and automatic resume via the existing authenticated activity engine.

**Textbook:** *English Balbharati Grade One* (2025 first edition, 2026 reprint), Unit One, 1.1 **My First Day**, page 1. This is an original teaching adaptation; do not copy protected poem text, illustrations, or publisher audio into the app without permission. Teacher approval remains mandatory.

## Files

- `LevelExperience.tsx`: staff-only visual preview. Microphone turns are clearly marked as requiring a real authenticated student; the preview never fabricates voice success or saves progress.
- `activities.ts`: **10-step** client design specification, ordered from foundations to textbook bridge.
- `config.ts`: syllabus, visual style, language policy, and draft publication gate.
- `interactions.ts`: available voice and tap modes; microphone is enabled in the real activity engine.
- `assets.json`: approved assets only. The new 90-second MP4 is **not bundled** and must be supplied.
- Backend `src/scripts/prepare-class1-l01-draft.ts`: guarded draft-only activity authoring; does not auto-publish.
- Backend `src/scripts/finalize-class1-l01-demo.ts`: safe draft metadata and first conversation update after preparation.
- Backend `src/scripts/class1-level1-ai4bharat-lines.json`: Priya/AI4Bharat prompt manifest for reviewed S3 narration.

## Required media and validation

Full 90-second video script, shot list, character rules, S3 delivery instructions and QA checklist: `docs/class1-level1-first-day-production.md` (repository root).

Set `NEXT_PUBLIC_TALKORA_CLASS1_INTRO_URL` to the approved S3-backed CDN video URL. The client also supports a local public MP4 during teacher testing, but **do not commit a placeholder or large video**. The first-visit intro requires a real 87–93-second video played with sound; fullscreen uses the browser Fullscreen API after a tap.

The level remains restricted to one explicitly allowlisted non-production Class 1 demo student until a teacher approves the media, Sarvam STT, Azure feedback, Qwen conversations, speech tolerance, database attempts and resume behavior. A video existing in S3 does **not** by itself publish the level.

Run source tests with `node tests/ui/class1-level1-experience.test.mjs` in `client/`. Run the read-only `audit-class1-l01-readiness.ts` and `audit-class1-level1-audio.ts` scripts from `backend/` against the intended **staging** configuration. The preparation and finalization scripts are read-only by default; explicit `--apply` refuses to change a draft with existing student attempts.

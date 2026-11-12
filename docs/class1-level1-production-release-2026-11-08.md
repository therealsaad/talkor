# Class 1 Level 1 — guarded production release (8 November 2026)

**Status:** Authoring code is not a published school lesson. This procedure covers the **ten original v3 First Day speaking scenes**, not historical two-letter v2 activities or the separate six-scene v4 poem draft. Actual activation happens in MongoDB only after approval.

## Existing pieces and missing external evidence

- The ten-scene authored First Day v3 curriculum, voice-first student runtime, staff map, secure PIN/resume, and Mongo progress checks exist.
- The bundled First Day introductory video in GitHub is about **83 MB**. It must not be assumed usable on slow school connections or automatically considered reviewed.
- Release needs an educator-approved 87–93-second video with sound and captions, hosted over HTTPS with size **1–28 MB** and valid HEAD headers; all ten original Priya WAV files must exist at immutable S3 version-3 keys under class-01/level-01/v3/.
- Code can check existence, MIME type and size; it cannot prove pedagogical accuracy, correct narration, physical audio playback, or school permission.

## 1. Prepare and review the intro media

The source is at client/public/lessons/class-01/level-01/miss-julie-first-day-intro.mp4. The following example uses FFmpeg on the existing approved source to make a smaller **review candidate**. Review the resulting sound, subtitles and duration with the educator before uploading. Re-encode as necessary to keep it under 28 MB without making the speech hard to hear.

~~~powershell
ffmpeg -i client/public/lessons/class-01/level-01/miss-julie-first-day-intro.mp4 -vf "scale=-2:720" -r 25 -c:v libx264 -preset medium -crf 29 -maxrate 1800k -bufsize 3600k -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart class1-first-day-v3-reviewed-720p.mp4
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 class1-first-day-v3-reviewed-720p.mp4
~~~

Host the reviewed version at a stable HTTPS URL with a working HEAD response reporting Content-Type: video/mp4 and Content-Length. Keep approved versions immutable.

## 2. Read-only database and hosted-asset checks

Follow README.md sections 8–10. Choose the exact intended database and environment, without pasting passwords, school PINs, transcripts or secrets into issues.

~~~powershell
cd backend
$env:TALKORA_FIRST_DAY_INTRO_URL = 'https://YOUR-REVIEWED-CDN/first-day-v3.mp4'
pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-release.ts --verify-media
~~~

Review blockers, firstDayV3Candidates, competingActiveLessons, completedLegacyLevelProgress, media.introBytes and media.audioReady. No database writes occur in read-only mode.

- If the v3 lesson is already staged, do **not** stage again. Use the publisher preflight.
- If Level 1 is active, belongs to a conflicting curriculum version or has completed legacy progress, do not overwrite it.
- Preserve the separate v4 poem as unpublished; it is not an approved substitution for this ten-scene v3 release.
- If any remote video or S3 audio check fails, fix the assets first.

## 3. Atomically stage missing Class 1 v3 content

After actual educator review, identify the MongoDB database name from the chosen connection, then supply the same exact name as a second confirmation. All flags must be explicitly approved by an authorized operator.

~~~powershell
$env:TALKORA_CLASS1_RELEASE_DB_NAME = 'YOUR_EXACT_DATABASE_NAME'
$env:TALKORA_CLASS1_L01_STAGE_APPROVED = 'YES'
$env:TALKORA_FIRST_DAY_INTRO_REVIEWED = 'YES'
$env:TALKORA_FIRST_DAY_AUDIO_REVIEWED = 'YES'
pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-release.ts --apply
~~~

This single MongoDB transaction creates only any missing Class 1/Level 1 **draft** shell, one v3 **draft** lesson, and ten **draft** voice activities. It never edits student attempts/progress, replaces old lessons, publishes a level, unlocks another grade, or awards XP. A transaction failure rolls the changes back.

The older development installer is intentionally restricted to a local MongoDB database named test. Do not remove that protection or point it at a school database.

## 4. Final publication gate

~~~powershell
pnpm exec tsx -r dotenv/config src/scripts/publish-class1-level1.ts --verify-media
~~~

Require no blockers, an optimized reviewed video and 10/10 approved S3 WAVs. Independently verify deployed Node/Mongo, Sarvam code-mix STT, the authenticated Qwen endpoint, Azure voice, S3 read access, and TALKORA_CLASS1_STATIC_AUDIO_APPROVED=true. A healthy local service does not prove deployed reachability.

The Python AI process must run the current **talkora-ai-starter/server.main** package (not the older qwen-service prototype). On both Node and Python, enable TALKORA_CLASS1_QWEN_PILOT=true. Set TALKORA_CLASS1_AI_URL on Node to an actually reachable protected Python 8002 endpoint, and configure the **same**, randomly generated TALKORA_SERVICE_KEY (32+ characters) on both services. Keep Ollama private/local to Python, load qwen3:4b-instruct, and run the existing synthetic backend check with pnpm exec tsx -r dotenv/config src/scripts/check-class1-ai-bridge.ts. A 200 /health response alone is insufficient evidence of a working authenticated student teaching turn.

A responsible school reviewer must approve the actual video, all narration, full textbook exercise coverage, accent-friendly Hindi/Marathi help, and a supervised end-to-end physical microphone/speaker test with real feedback playback and saved progress. Do not fake this review.

Only after that independent signoff and a verified MongoDB backup:

~~~powershell
$env:TALKORA_CLASS1_L01_RELEASE_APPROVED = 'YES'
$env:TALKORA_FIRST_DAY_INTRO_REVIEWED = 'YES'
$env:TALKORA_FIRST_DAY_AUDIO_REVIEWED = 'YES'
$env:TALKORA_CLASS1_L01_DEVICE_TESTED = 'YES'
pnpm exec tsx -r dotenv/config src/scripts/publish-class1-level1.ts --apply
~~~

The publisher promotes only the ten-scene Class 1 Level 1 v3 activity records, the owning Lesson, Level, and (when needed) Class to active/PUBLISHED in one transaction. Level 2 remains unpublished/locked. Clear approval variables afterwards and do not commit them to GitHub.

## 5. Required real-student acceptance

A school admin should see g01-l01 PUBLISHED with ten active activities at /school/curriculum-map?grade=1&level=1. A genuine Class 1 PIN session must open the first unfinished Mongo lesson through /student/continue, play the mandatory complete intro, then teach a spoken First Day scene with Miss Julie. Check correct, incorrect, silence and Hindi/Marathi student utterances; no unsupported English mastery, no duplicate grading and no progression before teacher audio finishes. Sign in again and verify resume. Attempt a direct URL to Level 2 and confirm it is denied.

Run the publisher's read-only preflight again and confirm ALREADY_PUBLISHED with no media blockers. Green CI and a map badge alone are not production evidence.

## Rollback

Keep a tested pre-release backup and immutable media. Both staging and publishing transactions roll back automatically on errors. Once students have begun using a published lesson, never delete activity IDs, discard progress or manually toggle active records to draft without a reviewed data-safe incident response.

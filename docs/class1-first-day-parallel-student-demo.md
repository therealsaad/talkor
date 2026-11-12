# Class 1 Level 1 — First Day production-shaped student demo

**Source of truth:** English Balbharati Grade One Unit 1.1 *My First Day*. Ten original school/action speaking scenes; no old AM/AN drill. The scene metadata, teacher text, S3 versioned narration, student mic, Sarvam STT, bounded local Qwen 8002, Azure dynamic TTS, spoken homework and progress remain in the existing Talkora services. Keep approved animated Miss Julie (WebM) consistent.

## Why the old screenshot happened

The student's old lesson URL loads a v2 tiny-words draft, while the client correctly refuses to pretend that it is Balbharati 1.1. The old replacement script refuses when attempts and progress exist. **Do not remove the client block, wipe student data, run destructive migrations, or grant school/teacher accounts special student access.**

This branch instead installs a **separate** Class 1 v3 lesson in the existing draft level, only when the required media is genuinely ready. The old lesson, attempt ObjectIds, conversations and progress stay untouched. Existing lesson bookmarks resolve to the new lesson for the authenticated Grade 1 student. Later classes and KG are not modified.

## Small, safe steps for a demo

1. **Review media.** In `backend/`, generate ten English Priya clips using port 8001:

   ```powershell
   cd D:\talkor\talkor\backend
   $env:NODE_ENV='development'
   $env:TALKORA_FIRST_DAY_GENERATE='YES'
   pnpm exec tsx -r dotenv/config src/scripts/generate-class1-first-day-voices.ts --generate --language en-IN --all
   Remove-Item Env:TALKORA_FIRST_DAY_GENERATE
   ```

   Files land in `backend/tmp/class1-first-day-v3`. Listen to all ten and confirm exact teacher script, warm clear pronunciation, no artifacts, and acceptable language. Do not claim that model health proves audio quality.

2. **Upload only reviewed recordings.** First preview the existing immutable S3 manifest without writing:
   
   ```powershell
   pnpm exec tsx -r dotenv/config src/scripts/upload-class1-first-day-voices.ts tmp/class1-first-day-v3
   ```

   Only after review and checking the destination, set the two *developer* opt-ins and upload:

   ```powershell
   $env:TALKORA_FIRST_DAY_AUDIO_REVIEWED='YES'
   $env:TALKORA_FIRST_DAY_S3_WRITE='YES'
   pnpm exec tsx -r dotenv/config src/scripts/upload-class1-first-day-voices.ts tmp/class1-first-day-v3 --upload
   Remove-Item Env:TALKORA_FIRST_DAY_S3_WRITE
   pnpm exec tsx -r dotenv/config src/scripts/audit-class1-level1-audio.ts
   ```

   The audit must show **10/10 present**. The optional Hindi and Marathi recorded cues are separate; live bilingual explanation uses Qwen + Azure. S3 uploads never overwrite a conflicting checksum.

3. **Supply an actual 87–93-second First Day video with sound.** The old tiny-word intro is not valid. Put the reviewed MP4 on an authorized HTTPS/CDN URL. This is **media QA by the Talkora developer**, not a school/teacher publish button; review language, audio/subtitles and Miss Julie's appearance. The lesson record carries the URL so Next.js needs no rebuild.

4. **Stage the new ten-scene draft alongside the old lesson.** Preview first:

   ```powershell
   pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-parallel.ts
   ```

   This stage is strictly limited to local development, MongoDB database name exactly `test`, reviewed media and explicit developer opt-in. It creates ONE new lesson plus ten v3 Activity records; it **does not write to any existing student/lesson/attempt/progress documents**. After checking the preview:

   ```powershell
   $env:NODE_ENV='development'
   $env:TALKORA_CLASS1_V3_STAGE='YES'
   $env:TALKORA_FIRST_DAY_AUDIO_REVIEWED='YES'
   $env:TALKORA_FIRST_DAY_INTRO_REVIEWED='YES'
   $env:TALKORA_FIRST_DAY_INTRO_URL='https://YOUR-REVIEWED-FIRST-DAY-VIDEO.mp4'
   pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-parallel.ts --apply
   Remove-Item Env:TALKORA_CLASS1_V3_STAGE
   ```

   Replace the placeholder HTTPS URL with the actual reviewed MP4. **Never run --apply against Atlas or another school database.** If it reports a partial stage, stop rather than running bulk cleanup.

5. **Start the student experience.** Keep the existing student PIN login. The backend must be running with `TALKORA_CLASS1_STUDENT_DEMO=true`. To let any authenticated, active Class 1 student in the **development** instance try this lesson without teacher/school permission, use `TALKORA_CLASS1_DEMO_ALL_STUDENTS=true` (restart backend). Do **not** enable this in production; developer preview flags do not publish curriculum. Set `TALKORA_CLASS1_STATIC_AUDIO_APPROVED=true` only when the actual ten S3 WAV objects are reviewed. Confirm `SPEECH_PROVIDER=sarvam`, `CONVERSATION_VOICE_PROVIDER=azure`, `TALKORA_CLASS1_QWEN_PILOT=true`, and point `TALKORA_CLASS1_AI_URL` at running Python 8002 with restored v3 coaching.

6. **Student QA (real hardware):** Open the screenshot's old lesson URL while logged in as a Grade 1 student. Verify it now opens all ten v3 scenes, starts the mandatory full-screen-first-gesture video, plays Priya narration, displays and animates Miss Julie, records the microphone, transcribes with Sarvam, corrects `jump` to `skip` without false praise, uses Hindi/Marathi only as scaffolding, plays Azure teacher feedback fully before marking progress, recovers on reload, and ends with spoken homework. Verify other grades have no cross-grade access.

**Do not report classroom-ready until Steps 1–6 really pass.** GitHub CI cannot use your private GPU, Sarvam/Azure billing, microphone, Mongo test DB or private S3.

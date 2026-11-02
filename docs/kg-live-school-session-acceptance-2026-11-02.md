# Talkora — real KG school-lab session + next-day PIN acceptance

**Status: live-device acceptance not yet performed.** Green automated tests, a real provider API reply, and successful PIN sign-in are NOT proof that a child watched the video, used a microphone, or heard the voice. This must be supervised on the actual school PC with an authorized, adult-operated pilot account. No real children's recordings in code, test fixtures or reports.

## Sprint 4.0: what changed

- Mongo lesson cursors, results, achievements, XP and feedback attempts survive a new visit.
- Each new student PIN/legacy login and logout revokes that student's still-valid KG Level 1 intro playback and KG Levels 2–5 intro-ticket fields. It does not erase learning progress or grant access to locked levels. This addresses a real cross-visit intro replay gap.
- The new read-only-after-login acceptance checker at backend/scripts/accept-kg-live-session.mjs authenticates with a **dedicated demo KG PIN**, reads actual backend progress and asserts the specific next level. Its ordinary PIN login does update login bookkeeping and invalidate old intro tickets; **never run it during an active browser lesson**.
- The optional paid probe calls real Sarvam STT and Azure TTS gateway endpoints with a consented **adult** audio sample; it prints no transcript or speech bytes.
- Disposable Mongo/Express regression now tests true PIN re-login, old intro rejection, audio receipt ACK, persistent cursor and re-entry. CI still mocks cloud providers.

## Preflight on your actual school workstation

Run the existing frontend (Next.js, usually port 3000), backend (Express/Mongo, usually port 5000), S3/Priya resources and Azure/Sarvam keys on a safe school pilot or local environment. Use a dedicated authorized KG demo PIN. The intended configuration is SPEECH_PROVIDER=sarvam, KG_ALPHABET_STT_PROVIDER=sarvam if explicitly set, and VOICE_PROVIDER=azure. KG3–5 letter grading is deterministic and does **not** call Qwen for every answer. KG1 uses bounded Qwen for unexpected speech only if configured; Class 1 has its own guided Qwen flow.

PowerShell from your existing backend folder:

    cd D:\talkor\talkor\backend
    $env:TALKORA_E2E_API_URL = "http://127.0.0.1:5000"
    $env:TALKORA_E2E_STUDENT_PIN = Read-Host "Enter dedicated demo KG PIN"
    node scripts/accept-kg-live-session.mjs --phase=before --expect-level=1

Change the expected level to the approved pilot student's actual unfinished level if already progressed. The checker rejects inconsistent server states, outputs a sanitized level/cursor and exits nonzero on failure. It never prints the PIN, JWT, transcript, child identity or response bodies. For nonlocal backends, it refuses insecure HTTP; use HTTPS.

### Optional paid provider probe

Use a short (.wav/.webm/.mp3/.ogg/.mp4/.m4a; 1 KiB–2 MiB) consented ADULT voice sample. The provider probe uses the normal student-authenticated speech/voice endpoints. It confirms an internally nonempty Sarvam response, Azure provider selection and a correctly formatted, nontrivial audio response; this does NOT prove live browser capture or speaker playback. Paid calls require explicit opt-in:

    $env:TALKORA_E2E_AUDIO_FILE = "D:\private\adult-speech.wav"
    $env:TALKORA_E2E_ALLOW_PAID_SPEECH = "YES"
    node scripts/accept-kg-live-session.mjs --phase=before --expect-level=1 --probe-voice

Do not run --probe-voice with real child recordings. The general voice endpoint may differ from the KG override; ensure both use Sarvam before accepting results. No automatic paid retries.

## Live supervised browser walkthrough (required)

1. Open a fresh private browser or managed kiosk on the actual school computer. Verify speakers/headset, microphone permission, working network and consent. Enter the demo five-digit PIN on /login/student.
2. Confirm /student/continue opens the first unfinished server-owned level without user-chosen level or another student's details. Watch the **entire** mandatory full-screen intro video, hear its audio, and confirm no in-app skip. OS/browser Escape cannot be prevented outside managed kiosk policy.
3. Let Miss Julie narrate. Use the **real microphone** to answer. Inspect that the lesson displays the matching word/letter, correct Sarvam recognition, a gentle retry for silence/wrong language, and no premature advancement. For KG1, optionally speak an unexpected harmless sentence and verify Qwen's bounded fallback when Qwen is actually configured.
4. **Hear the entire Azure feedback** in the browser. Verify no blank audio, clipping or overlapping prompts. Observe that the signed feedback ACK is sent only after audio playback ends; DB cursor advances only for a server-graded correct English response.
5. Finish the level, hear spoken homework, and verify the next *approved playable* level opens automatically. KG6–10 drafts remain locked; Classes 1–10 must not skip unpublished gaps.
6. Log out and close the student browser. **Only now** check actual saved Mongo progress with a fresh PIN sign-in through the acceptance checker. Example for finishing KG1:

       node scripts/accept-kg-live-session.mjs --phase=after --expect-level=2 --expect-completed=1 --expect-index=0

   For KG2 finishing, expect Level 3 and completed Level 2. Continue 3→4, 4→5. When KG5 is done, use --expect-level=map --expect-completed=5, not Level 6.
7. **On the next real school day**, repeat browser PIN login using a clean session. Verify it opens the first unfinished level from the saved cursor, shows a fresh mandatory intro, and does not expose yesterday's old session ticket. After the browser test ends, repeat --phase=after with the expected level and cursor. A same-day simulated re-login is not proof of next-day performance.
8. Repeat with a second **authorized demo** student to verify cross-student privacy and independent resume. Test unplugged mic, unavailable provider, and browser reload; no server progress should be falsely awarded.

## Evidence, privacy, no-go gates

Optional --report=D:\private\kg-before.json writes a new (never overwritten) local JSON report with timestamp, supplied commit SHA if set, level/cursor, safe provider status and latency. No audio, transcript, name, PIN, JWT, receipt or other student identifier is included. Store outside the repo; do not commit or upload. The operator and teacher must separately sign off real microphone, speaker, full video, feedback timing, failures, cross-student isolation and next-day resume. Record measured times only; do not invent p50/p95.

**NO-GO** if the video can be skipped in-app, audio is silent, STT isn't from the intended live provider, a level unlocks before correct + played feedback, the wrong level resumes, an old intro works after a new PIN login, student information leaks, or a required approved level is skipped.

## Automated checks

    cd backend
    pnpm run build
    pnpm exec jest --runInBand tests/integration/kgFullPilotJourney.test.ts
    pnpm exec jest --runInBand tests/integration/kgLevel2StudentJourney.test.ts
    pnpm exec jest --runInBand tests/integration/kgContinuationSequence.test.ts
    pnpm exec jest --runInBand tests/integration/kgNextVisitPinResume.test.ts
    node --test tests/kg-live-session-acceptance.node.test.mjs

Automated Mongo/Express tests mock speech providers and video. They cannot certify a real student session. Only the supervised browser/audio checks above can close that release gate.

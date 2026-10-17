# KG Task 3: speech test guide

Task 3 keeps the Task 1 private S3 clips, the Task 2 Garden and full intro, the existing five-digit PIN session, and the current eight activities. After an adult clicks **Allow microphone & start**, the four speaking activities continue automatically. The final four picture puzzles retain their intended touch interaction.

## Run locally (Windows PowerShell)

In one terminal:

```powershell
Set-Location 'D:\talkora-azuretts\talkora-backend'
npm run dev
```

In another terminal:

```powershell
Set-Location 'D:\talkora-azuretts\talkora-client'
npm run dev
```

The configured V2 backend is normally `http://127.0.0.1:5000`, **not port 8000**. Client API configuration must point to the reachable V2 backend `/api` URL. Open `http://localhost:3000/login/student` and use a dedicated authorized KG test student's PIN with staging/test data. This task did not use production child records. The normal lesson is `/student/kg`; `/school/kg-preview` is an isolated demonstration and does not test real STT or student persistence.

The backend needs its existing MongoDB, JWT, private S3 settings, and a working `GROQ_API_KEY`. `KG_ALPHABET_STT_PROVIDER=groq` is the default. KG uses the configured Groq fast STT model, automatic language detection, and `verbose_json` segment quality metadata. Class 4 retains its configured provider, language and response format. No expected-word prompt is sent to Whisper.

Production requires HTTPS for microphone access, a deployed V2 backend, and hosted Groq connectivity. Optional `KG_ALPHABET_STT_PROVIDER=python` uses the existing Faster-Whisper provider, but production rejects a loopback `AI_SERVICE_URL`. Do not deploy with STT pointing at a developer PC. There is no silent provider or voice fallback.

Production disables automatic Mongo indexes. Before enabling this version, apply the three KG models' indexes using the existing database configuration:

```powershell
Set-Location 'D:\talkora-azuretts\talkora-backend'
npm run kg:indexes
```

This command creates indexes only, including the unique submission lease and TTL cleanup. It does not edit student records or drop existing indexes. It was not run against production as part of this task.

## Manual speech cases

Use headphones in a quiet place first, then repeat with ordinary classroom noise. Watch the browser microphone indicator and the Network panel. Use the saved activity from `GET /api/kg-alphabet/state` to check progress.

| Case | Action | Expected behavior |
| --- | --- | --- |
| Initial permission | Finish the full intro, then click Allow microphone & start. | Permission is requested by that gesture. Julie plays the cached prompt before recording starts. |
| Correct | On A say “apple”; then say “ball”, “cat”, “dog” on their turns. | Recording ends after speech and about 1.1 seconds of quiet. The backend returns correct, Julie praises, then the saved activity advances once. No further click is needed between speaking turns. |
| Incorrect | On A clearly say “ball”. | Backend records incorrect, plays encouragement, and repeats A. Progress stays on A. |
| Unclear | Use a partial “appl”, mixed “apple or ball”, or an actual low-quality recording. | Unclear is saved, excluded from wrong grading, and the cached repeat prompt plays. Low-quality recognition is not guaranteed to transcribe in a particular way; automated provider tests inject the quality fields deterministically. |
| Silent | Stay quiet for the listening window. | Backend saves an unclear silence event without uploading audio to STT. Julie offers two automatic silence retries, then a manual Try again. Progress stays put. |
| Permission denied | Deny microphone permission. | Friendly permission instructions and Try again appear; no STT request or completion is sent. Manually restore browser permission before retrying. |
| Network failure | Interrupt the attempt response after recording, then restore the network. | Bounded retries and manual Try again reuse the same submission ID. A response lost after a saved answer is recovered without a second attempt or an extra advance. |
| Feedback failure | Fail the praise audio after a correct response, then retry. | The saved result is retained; retry replays feedback and continues without regrading the old answer. |
| Background/navigation/logout | Leave the Garden, hide the tab during capture, log out, or let the JWT expire. | Tracks, recording timers, analyser and pending requests stop. Late permission grants are immediately closed. Returning requires a deliberate resume action. |
| Replay | Replay a completed checkpoint. | Replay attempts have `replay=true`; original progress and completion time are preserved. |
| Final puzzle | Pick a wrong picture, then the correct picture. | Backend validates each choice. Only the configured final correct answer completes Level 1. Level 2 is not published. |

The current English curriculum requires Apple/Ball/Cat/Dog. English-word transcriptions written as `एप्पल`, `बॉल`, `कैट`, `डॉग` are supported; a Hindi translation such as `सेब` does not pass an English pronunciation question. Letter-only answers request a repeat when the activity asks for the word.

## Automated checks

```powershell
Set-Location 'D:\talkora-azuretts\talkora-backend'
$env:MONGOMS_IP = '127.0.0.1'
npm test -- tests/integration/kgAlphabetAudio.test.ts tests/unit/kgSpeech.test.ts tests/unit/groqSpeechProvider.test.ts tests/unit/kgAlphabetLesson.test.ts tests/unit/voiceContracts.test.ts tests/integration/voiceMultiTurn.test.ts tests/integration/voiceSubmissionRetry.test.ts
npm run build

Set-Location 'D:\talkora-azuretts\talkora-client'
npm run test:kg-speech
npm run test:kg-pilot-ui
npm run build
# With the current client running locally and Chrome installed:
npm run test:kg-speech:browser
```

Integration tests use isolated in-memory MongoDB, mocked STT and mocked S3. Runtime tests exercise cancellation, late permissions, bounded network retries, VAD, and audio completion. The isolated Chrome test uses real audio playback, MediaRecorder and VAD with synthetic audio and intercepted API responses; it never contacts real student data. Chrome must already be installed; set `CHROME_PATH` if its executable is elsewhere. Use `localhost` for the test URL because Next development-origin checks can reject assets from an alternate host. These tests do not certify live vendor credentials or classroom recognition accuracy.

Latest completed checks: both production builds passed; 32 backend tests passed, including the existing Class 4 voice suites; 11 client runtime/UI checks passed; all 8 isolated Chrome media tests passed.

## Live checks and current blockers

```powershell
Set-Location 'D:\talkora-azuretts\talkora-backend'
npm run kg:audio:verify
# Use a short non-child test recording; this only tests STT/validation, with no DB writes:
npm run kg:speech:check -- --audio 'C:\test-audio\apple.wav' --letter A --expect correct
npm run kg:speech:check -- --audio 'C:\test-audio\ball.wav' --letter B --expect correct
npm run kg:speech:check -- --audio 'C:\test-audio\cat.wav' --letter C --expect correct
npm run kg:speech:check -- --audio 'C:\test-audio\dog.wav' --letter D --expect correct
```

On 2026-10-15, the actual Groq request with a four-second public teacher-greeting fixture returned **401: configured key rejected**. S3 verification returned **0/29 verified, all 29 missing**. V2 backend `/health` on port 5000, frontend on 3000, and the old AI service on 8001 responded. Full live S3 → child microphone → hosted STT → Atlas progression cannot be certified until the Groq key is corrected and the Task 1 audio library is generated/approved/uploaded and verified. No production student documents were created or modified for testing.

## Data and failure behavior

Only transcript, outcome, activity, identity/school, timestamps, duration, replay flag and STT metadata are persisted. Raw recordings are transient request data; they are not stored in MongoDB, S3, browser storage, or server files. A pending request lives in browser memory only until success, navigation or logout. The submission lease stores a request hash and expires automatically. Incorrect/unclear/silent outcomes cannot advance; cached audio completion never submits a correct answer.

Groq quality flags use conservative starting thresholds (`avg_logprob < -0.7`, `no_speech_prob > 0.5`, or `compression_ratio > 2.4`), based on its [documented verbose segment metadata](https://console.groq.com/docs/speech-to-text#understanding-metadata-fields). Missing or invalid quality metadata requests a repeat. These are uncertainty rules, not calibrated pronunciation scores for children. Short-child-speech and classroom testing remains necessary.

Task 3 ends at speech testing. Task 4 reporting work is outside this change.

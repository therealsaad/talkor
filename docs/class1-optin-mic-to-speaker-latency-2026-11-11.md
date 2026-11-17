# Class 1 voice latency: opt-in supervised pilot

## Scope and invariants

This change instruments the existing Class 1 Level 1 browser teaching flow, not a second lesson engine. It extends the KG1–5 memory-only `lessonTurnTelemetry` object and reuses the supervised `?latency=1` report button. The code does **not** change Sarvam transcription, Qwen prompts, Azure synthesis, voice cache, session authorization, full-intro ticket, signed playback receipt, score, XP, progress, homework or publication.

No PIN, school/student identifier, raw audio, transcript, voice session ID, JWT, teacher text, or provider URL enters the report. A `crypto.randomUUID()` created for each observed microphone turn is **browser-only**, unrelated to Mongo session IDs. The existing in-memory owner fingerprint clears measurements when the login changes; `pagehide` clears the report. No telemetry network requests, storage, or upload are introduced. Without `?latency=1`, no measurements are collected and the button is hidden.

## How to collect on a real school computer

1. Use a test account on a supervised nonproduction deployment with a reviewed, accessible Class 1 Level 1 lesson and real microphone/speaker. Open the lesson URL with `?latency=1` **on the actual lesson page**; do not add this flag to an ordinary child session.
2. Finish the required Class 1 introduction normally. Do at least ten independent, audible microphone speaking turns; include retry/correction and successful completion turns on both a cold and warm run if practical.
3. Observe that Miss Julie speaks and that a valid final complete answer is acknowledged only after spoken playback. Tap **Latency report** to save the local anonymous JSON before leaving the page. A reload or page close intentionally discards in-memory data.
4. Repeat on the intended network/device, including an ordinary slower lab connection, and keep notes of browser, headset, microphone, first/cached audio conditions, failed attempts and dropped turns **outside the anonymous JSON**. No identifiable child data should be recorded.
5. Inspect `summary` for `childWait` and `recorderToAudio` p50/p95, and compare `speechToText`, `aiTeaching`, `toAudioStart`, and `ackWait`. Also inspect per-turn `complete` (signed progress acknowledgement), and count turns without `audioPlaying` separately. Do not report only the fastest or successful attempts.

### What the measurements mean

- `speechEnd → recorderStop` = observed speech-end estimate and silence wait, when the voice activity detector actually heard speech. Manually stopped recordings may not have a `speechEnd` timestamp.
- `recorderStop → audioPlaying` = Class 1 recording-stop-to-browser-start, including blob processing, Sarvam request, authorized Node/Qwen teaching and Azure audio request. `childWait` includes the observed silence interval when available.
- `requestStart → sttDone` = blob/upload and STT response; `teachingStart → teachingDone` = server teaching turn round trip, including Node-side work and any Qwen call.
- `apiResponse → audioPlaying` = teacher response received to browser playback start; `audioRequestStart → audioPlaying` is a useful combined synthesis/download/playback gap but is not currently a separately reported metric. The existing `audioDownload` metric is **not populated** by Class 1 because no precise download-complete event is exposed in this narrow patch. Do not invent one.
- `audioEnded → ackDone` = post-playback progress acknowledgement for eligible completed Class 1 turns. A correction/retry has no completion ACK and can legitimately show `complete:false` despite having audible playback.

All timestamps use `performance.now()` in the same browser instance; server and browser clocks are never subtracted. `audioPlaying` is recorded when the existing HTMLAudioElement `play()` promise resolves and passes the current-playback/session checks, not a proof that sound was physically heard. `audioEnded` is recorded after the existing playback promise resolves as `spoken`. The anonymous local ID cannot automatically join a server log; provider-specific stage timing still requires privacy-safe server-side diagnostics.

## Validation and limits

The existing frontend CI job runs `node --test tests/ui/lesson-turn-telemetry.test.mjs` with new Class 1 stage-metric and source-wiring assertions. Run from `client/` after the pinned dependencies are installed; run the existing frontend build and the full repository CI runner before review/merge. Test timing values are **synthetic**, not production evidence.

This patch does not claim that the live service meets a 2–3 second target, that the complete Class 1 child experience is school-approved, or that KG/Class 1 drafts are unlocked. Only a supervised real microphone-to-speaker pilot and production-equivalent load results can validate speed or readiness. Stop/rollback is a normal feature-branch revert; there is no DB migration, new environment variable, provider cost or permanent storage.

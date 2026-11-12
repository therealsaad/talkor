# Class 1 poem voice recovery — “Semi skip” and silent mic (2026-11-12)

## Observed from the local student pilot
1. The child recited a Balbharati poem line such as **See me skip**, but the Sarvam response displayed **Semi skip** in the Class 1 poem board. The existing evidence matcher accepts only an authored **see me + action** phrase, so it did not count that first line.
2. Another turn displayed a Hindi coaching prompt and then **No speech was detected. Please try again.** The Class 1 MediaRecorder previously set the global `recoverable_error` state for an empty Sarvam transcript and stopped voice-first listening.
3. The Class 1 poem VAD stopped after **1350 ms** of silence; a young learner pausing between two taught lines could lose the second line.

## Patch
- A narrowly bounded **textual STT alias** applies only to authorized Class 1 poem evidence and authored poem line coaching: the connected acoustic rendering `semi skip / semi run / semi walk / ...` can match `see me <verb>`. The original transcript is preserved; this is not pronunciation grading, phoneme analysis, or correction of arbitrary student words. Unknown English, Hindi, Marathi and unrelated scripts are not mapped to targets.
- Only a complete two-line **authored** poem pair can satisfy the existing server evidence gate; one recognized action, two disconnected words, a question or silence still cannot. All grade, XP, activity-complete and signed-Azure-audio-ACK rules remain unchanged.
- The current Class 1 poem's browser VAD now uses **1900 ms** post-voice silence (a bounded 550 ms increase). The existing 8-second no-voice timeout, 10-second recording ceiling, 420 ms minimum speech and noise threshold stay; other grades retain 1350 ms. This intentionally trades modest extra wait for fewer cut-off second lines.
- A **single automatic Class 1 microphone reopen** occurs after an empty/undetected speech clip, with an encouraging message and a 1400 ms pause; further consecutive silence leaves an explicit microphone retry so the device cannot record endlessly. The unused server VoiceSession is cancelled **before** any new microphone session opens. A valid nonempty transcript clears the silence counter. Network, permission, Azure and other provider errors remain manual recovery, never silently mistaken for silence.
- **No second STT request**, no new provider, DB change, TTS voice change, content publication, grade or app rewrite. Azure remains the teacher audio; Sarvam remains the current STT.

## Validation
- `backend/tests/unit/firstDayEvidence.test.ts`: `Semi skip. See me run.` is complete pair evidence but `Semi skip.` alone is not, and unrelated scenes/question/partial lines are rejected.
- `backend/tests/unit/firstDayPracticeScaffold.test.ts`: authored small-line coaching moves to `See me run` after `Semi skip`, but neither the intermediate line nor scaffold grants mastery/XP.
- `client/tests/ui/class1-first-day-adventure.test.mjs`: the Class 1 silence state machine auto retries once, then requires an explicit tap; other failure classes remain explicit. Source wiring checks preserve zero extra STT calls and audio acknowledgement boundaries.
- CI checks are synthetic and **do not** prove real microphone audio, STT accuracy or 2–3s latency. Test with live `?latency=1` on the target PC: say both taught lines with a short natural pause, try a single line, then let the mic record silence twice. Check that retry does not skip or reset the poem, and that the manual microphone control stays available.
- Browser output may still reflect the raw STT error `Semi skip`. We deliberately do not rewrite the child's displayed answer or send a fabricated transcript to the language model; classroom pilot evidence is needed before expanding aliases.

## Rollback
Revert the feature PR. All changes are isolated to Class 1 browser speech handling and server-side textual evidence/scaffold; no migration or school deployment. Keep the source/child-safety and progress gates unchanged.

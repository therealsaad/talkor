# Class 1 — instant, honest turn feedback (13 November 2026)

This is an **experience/UI-only pilot**. It improves how quickly the existing classroom communicates that it is working; it does **not** by itself reduce audio generation, STT time or speech-to-speaker latency.

## Why this matters

Previously the illustrated `FirstDayPoemClassroom` had a generic `isProcessing` flag, which could show the previous teacher sentence while the app transcribed the child's answer, ran its teaching policy or waited for an Azure audio download. The browser often felt frozen even when the network request was still running.

## Proposed Class 1 behavior

The actual state machine, not a guessed time estimate, controls a small visual cue:

| Existing phase | Visible feedback | No evaluation claim |
| --- | --- | --- |
| `julie_preparing` | Opening our next little lesson | Picture activity |
| `transcribing` | Working out your words | The transcript has not been evaluated yet |
| `student_submitted`, `julie_thinking` | Choosing your next little step | No approval or XP is promised |
| `julie_text_ready`, `julie_audio_pending` | Getting Miss Julie's voice ready | Azure audio has not started yet |
| `student_recording`, `julie_speaking`, `retry_required`, `recoverable_error`, `activity_complete` | No waiting cue | Use the existing real microphone/speaker/result states |

- A tiny CSS **opacity-only three-dot indicator** is accessible via `role=status` and `aria-live=polite`. It obeys reduced-motion settings; it is not a large artificial progress bar or spinner.
- During the wait, this replaces the stale teacher text in the poem feedback area so the child can see what is actually happening. The original approved lesson, poem image, teacher speech and interaction controls are untouched.
- The existing state guards also keep mic and replay buttons disabled while teacher audio is pending. No extra request, timer, cache, transcript logging, new dependency, model, pronunciation score or provider is introduced.
- This initial change uses the existing Class 1 state. **It does not activate a background audio filler.**

## About the suggested spoken filler

A vocal filler can be useful when the lesson is genuinely slow, but **a fresh Azure filler call would increase latency and compete with the real teacher turn**. The safe future design should only use a human-approved, immutable, preloaded short clip (e.g. an ungraded “Let's think together”) and never announce “Correct” before the backend has evaluated the child's answer.

Before implementing any spoken filler, require:

1. Real `?latency=1` samples on the actual school machine: p50/p95 from end-of-child-speech to first audible teacher response, plus silence wait, STT, Node/Qwen and Azure timing.
2. A reviewed, stable voice asset in each approved language, with no per-child text, no runtime TTS round trip, fixed hash/version and bounded memory size.
3. Delay/threshold rules: skip filler on fast turns; never play filler while the microphone is open; play at most one short clip on a demonstrably slow turn.
4. A single playback arbiter that prevents overlap and does not treat a filler as a signed lesson feedback acknowledgement. Only the *actual* final teacher audio can unlock progression.
5. Cancellation, avatar-mouth/animation synchronization, autoplay recovery, reduced-motion support, shared student logout isolation, and regression tests that quantify any added delay.

The preferred speed work remains **reduce actual end-to-end wait**: measure the existing Class 1 1900 ms post-speech VAD delay, preserve hesitant-child safety, avoid Qwen on known words, fetch reviewed static audio with zero LLM/TTS requests, and investigate Azure's current buffer-before-playback implementation. Do not change thresholds until the microphone pilot supports them.

## Review and test

New deterministic UI test exercises each real phase, confirms non-waiting states stay unchanged, and checks that no new network/audio/grading actions exist in the cue helper. The frontend and full repo CI still need to pass before any review/merge. Real-device acceptance must check status appears on the *first* STT request, switches to an Azure pending cue during audio loading, disappears when Miss Julie actually starts speaking, and never remains stuck after denial, logout, timeout or a retry.

**Release boundary:** no merge, deployment, curriculum publication, existing media replacement, DB write or new audio asset. This change is the low-risk visual half of a larger measured teacher-turn speed program.

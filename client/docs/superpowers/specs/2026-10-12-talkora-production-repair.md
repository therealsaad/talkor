# Talkora production repair requirements

Source: user-provided `TALKORA — Complete Production Repair & Performance Optimization` attachment, with the follow-up runtime error `Talkora AI is not configured (missing GEMINI_API_KEY)`.

## Required behavior

- Preserve Talkora's existing Next.js, Express, MongoDB Atlas, student PIN, teacher/school login, Lab Mode, curriculum, and progress architecture.
- Use the configured AI provider consistently for both lesson and free-talk conversations. The current backend configuration selects Groq; never switch providers silently.
- Keep Groq Whisper as the configured STT provider. Diagnose upstream status/timeout behavior, return safe actionable errors, and never expose credentials or raw provider payloads to the browser.
- Keep Miss Julie's speech and microphone lifecycle serialized. Start hands-free recording only after speech ends and browser permission allows it; keep a clear tap-to-start fallback. Stop on silence, hard timeout, or explicit user action; avoid duplicate requests and stale callbacks.
- Preserve KG through Class 10 curriculum and existing Atlas progress. Do not reset, reseed, or migrate production data as part of this repair.
- Keep the approved responsive UI and avoid changing the established page hierarchy unless a functional issue requires it.
- Run the frontend and backend builds and the applicable mocked-provider, upload, voice lifecycle, progression, and existing test suites. Report external-credential limits separately from code/test results.

## Current evidence

- `/student/practice/talk` sends a free-talk turn without a lesson ID.
- `MissJulieService.converse` hard-codes `GeminiConversationProvider` for free talk, bypassing `AI_PROVIDER`.
- The backend `.env` selects Groq and has a Gemini key entry, but the browser error shows the running request reached the Gemini missing-key guard.
- A safe auth-only request to Groq's models endpoint returned HTTP 401. A valid Groq key is required for live provider verification; no audio was sent.
- Lesson activities already include permission-aware microphone startup, silence detection, hard recording limits, and auto-advance. Free-talk practice still requires repeated manual mic clicks and its recorder permits 12 seconds while the backend accepts at most 10 seconds.

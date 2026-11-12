# Class 1 · Miss Julie live adaptive voice pilot

## What is actually live

The existing `g01-l01` student lesson keeps the authoritative MongoDB activity,
5-digit PIN, voice session and progress policy. A real student speaks into the
browser microphone. Sarvam STT returns a transcript and **sometimes** a language
code. The same transcript turn goes through Node `MissJulieService` to the
authenticated Python Class 1 brain. Miss Julie's response is displayed on the
teaching board and spoken through the existing Azure TTS pipeline.

The Class 1 pilot supports a syllabus-bound, original companion to Balbharati
Unit 1.1 *My First Day*. It models little words and the two approved original
school sentences: "I am at school" and "I walk to school". A short word gets a
sentence model; a supported sentence gets a follow-up; a struggling student
rehearses before extending. Hindi and Marathi are **explanation languages**,
while every target sentence remains English.

## Important guarantees

- **No new Azure or Sarvam requests.** The provider's existing single STT call
  now returns optional `languageCode` (`en-IN`, `hi-IN`, `mr-IN`) instead of
  discarding it. The browser forwards it in the existing voice-session submit.
- The server accepts only the allowlisted codes and uses them solely for
  canonical Class 1 Level 1 conversations. Unknown codes preserve explicit
  spoken language choice and conversation-history behavior.
- Devanagari text alone is **not** classified as Hindi versus Marathi. Sarvam
  detection is a fallible hint; supervise both languages with real devices.
- Node owns student authorization, progress, mastery, idempotency and activity
  transitions. Python must not claim IQ, acoustic pronunciation, or award XP.
- QLoRA research adapter still **fails** its held-out quality gate and remains
  disabled. Keep `TALKORA_CLASS1_HINTS_APPROVED=false`; deterministic authored
  feedback remains available if Ollama is cold or absent.
- The voice lesson and its existing intro/fullscreen/orientation behavior are
  unchanged. Other grades remain on the original STT/teacher path.
- Levels 2–10 and all 44 authored Balbharati chapter drafts remain **staff-only
  and unpublished** until educator, visual and audio approval.

## Supervised credit-capped check

1. Confirm `/school/curriculum-studio/1/2` etc. are still staff-only.
2. Test **without paid calls**: run Python `pytest tests` and Node/frontend CI.
3. On a designated Class 1 test PIN, run **one brief real speech turn** in
   English, then a separate turn requesting Hindi or Marathi support. Verify
   the language code only affects explanations, not mastery.
4. Listen to localized Azure voices after staff permission; the voice toggle
   `TALKORA_CLASS1_BILINGUAL_TTS=true` is opt-in and requires supervised human
   review. Disable it again until the review is accepted.
5. Inspect only redacted logs: service latency and status, never child audio,
   names or full transcripts. Do not run paid smoke loops repeatedly.

**No teacher review, student trial or live deployment was performed by this
change.** It improves the existing L1 flow; it does not publish L2–L10.

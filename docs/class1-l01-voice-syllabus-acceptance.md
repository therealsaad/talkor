# Class 1 Level 1: Foundations → Balbharati 1.1 → adaptive school talk

Source reviewed: user-supplied **English Balbharati, Grade One**, first edition
2025 / reprint 2026, published by Maharashtra State Bureau of Textbook
Production and Curriculum Research, Unit One **1.1 My First Day**, printed
page **1**. Its learning context includes first-day-to-school actions and
words such as school, walk, run, skip, jump, play and bell. Do not recite the
copyrighted rhyme, reproduce its artwork or pretend these generated activities
are official Balbharati material.

## Existing learner path (activity IDs unchanged)

| Server order | Canonical v2 activity key | What Miss Julie guides | Learning material |
| --- | --- | --- | --- |
| 1–6 | `listen-am` through `it-is-up` | Listen to tiny words; answer by voice; spell `a and n` aloud without a keyboard | **Talkora foundation**, not a textbook excerpt |
| 7 | `review-little-words` | Authenticated conversation; reduce hints on success, model on struggle | Talkora foundation |
| 8 | `say-walk` | Say `walk`, relate speech to school-day movement | Original activity related to Balbharati 1.1 |
| 9 | `find-school` | Hear/identify `school` from pictures by **speaking** the word | Original activity related to Balbharati 1.1 |
| 10 | `school-talk` | One-word answer becomes a modeled sentence, then a very short related sentence; Hindi/Marathi explanations when needed | Original adaptive conversation related to Balbharati 1.1 |

The illustrated **two-page word book** now changes on each live activity:
magnetic `A + M` / `A + N` letter tiles, an original ball-on-box scene for `ON`,
an animated `UP` arrow, school and movement illustrations, then short school
dialogues. It shows live listen/think/retry/completed status from the existing
lesson state. This book is **a visual scaffold, not a PDF copy**, does not
issue new paid speech calls, and cannot judge a student's pronunciation.
Miss Julie remains larger beside the book on landscape displays, and the
cartoon student remains absent on the Class 1 scene. `g01-l01` uses the existing automatic microphone trigger,
automatic silence detection, protected server attempts, progress and
post-feedback advancement. The school-story Python bridge also recognizes
original short practice sentences for *run, skip, jump, play, bell, grin*.

## Do not silently change scoring

- The database activity IDs, ordering, answer keys, lesson publication status
  and saved attempts **do not change** in this UI/coaching patch. Existing
  seed data in MongoDB keeps authority. Visual words are scaffolds, not grading.
- Teacher must verify the Unit 1.1 word list, audio, visuals and spoken
  examples and sign off before public student release.
- Audio/content for Balbharati 1.2 onwards is not yet student-approved. The
  other Class 1 levels are staff-only drafts.
- Keep QLoRA adapter hints OFF: held-out contract tests previously failed.
- Hindi/Marathi is for explanations. Do not infer IQ, learning disability or
  phoneme-level pronunciation from Sarvam transcripts.

## Supervised zero-click verification

1. Open the existing student lesson via the 5-digit **test** PIN, tap only the
   initial browser audio/fullscreen permission when required by the browser.
   Run with a landscape monitor or managed kiosk device.
2. In the foundations, verify the magnetic letters and original mini-scenes on
   the book. Say `am`, `a and n`, `at`, `on`, `up`. The backend must verify
   choices/attempts; visual success happens **only** after a validated result.
   Check that correct responses advance automatically and that the page updates.
3. At `say-walk`, speak `walk`. At `find-school`, say `school`. At `school-talk`,
   say `jump`, then `I can jump`. Miss Julie should first model `I can jump`,
   then invite one next action (`I can play`) if no support is needed.
4. Say `मला समजत नाही` and `हिंदी में समझाओ` in separate staff-authorized test
   turns: the reply can explain in Marathi or Hindi but the English practice
   target remains unchanged. Sarvam's detected language can be wrong, so
   compare results manually.
5. Verify single STT + single TTS calls for each **intentional** speech turn,
   completion thresholds, redacted logs, session inactivity cleanup and
   resumed progress. Avoid repeated paid smoke loops.

### Platform limits

Browsers cannot force device physical rotation or permanently lock F11-style
fullscreen; the app uses best-effort fullscreen after user activation and a
portrait rotate prompt. Browser audio and mic permission may need one teacher
gesture. A school-managed kiosk policy is required for enforced fullscreen.

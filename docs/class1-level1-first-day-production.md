# Class 1 Level 1 — Miss Julie's First Day Adventure (teacher-review draft)

## Learning order (one canonical `g01-l01` level)

1. **90-second Miss Julie video**, watched with sound before the first activity. The browser requests fullscreen after a user tap when supported; inline playback remains available when fullscreen is blocked. It must not be skipped in-app. On a later visit, a student who has saved activity progress goes straight to their unfinished activity.
2. **Talkora original foundation:** teach all eight short words (`am`, `an`, `at`, `in`, `is`, `it`, `on`, `up`) through listening, word building, a short sentence and a bounded Qwen review.
3. **Balbharati bridge:** say `walk`, identify `school`, and tell Miss Julie a tiny fact about school in a two-turn conversation. Miss Julie praises meaning expressed in Hindi or Marathi, models English, and gently invites an English attempt.
4. **Home speaking task:** tell a family member one simple school sentence. The authenticated engine, not the video or Qwen, owns attempts and progress.

Textbook reference: *English Balbharati Grade One*, first edition 2025 / reprint 2026, Unit One, lesson **1.1 My First Day**, page 1. Official source: https://ebooks.ebalbharati.in/pdfs/103050001.pdf. These are **original teaching prompts** based on the chapter's listening, actions, and school vocabulary; do not reproduce the rhyme, illustrations, or book audio without the publisher's written permission.

## Video: exactly 1 minute 30 seconds

Format: 16:9, 1920×1080 or 1280×720, 30 fps, H.264 MP4, clear AAC audio, no jump cuts, no flashing imagery, strong contrast for lab screens, subtitles that do not cover the character. Avoid overwhelming text, frantic motion, or distracting music during speech. The supplied local MP4 at `client/public/lessons/class-01/level-01/miss-julie-first-day-intro.mp4` is 90 seconds and is the Class 1 first-visit story. Keep it required before the first activity and provide no in-app skip or close control.

| Time | Original Miss Julie script (Hindi/English scaffold) | Animation and teaching cue |
| --- | --- | --- |
| 00:00–00:10 | "Namaste, beta ji! Welcome! Main Miss Julie hoon. Aaj hum saath milkar chhote-chhote English words seekhenge!" | Bright garden school entrance. Julie arrives at child scale and waves. Two students look at her. Camera steady. |
| 00:10–00:23 | "A aur M milkar AM. A aur N milkar AN. Main AM bolun, aap bhi bolo!" | Julie builds `am` and `an` from clear letter blocks. One short pause after each word. |
| 00:23–00:36 | "The book is IN a bag. The book is ON the table. We are AT school." | Show each simple phrase with an original picture; highlight `in`, `on`, and `at` once each. |
| 00:36–00:49 | "It is up! Look UP! These little words help us read a short sentence." | A kite rises above the school. Julie points to `it`, `is`, and `up` in `It is up.`; one calm pause for the child. |
| 00:49–01:03 | "Aaj hum school jaa rahe hain. Ye SCHOOL hai. Hindi mein school, Marathi mein shala! English mein bolo: SCHOOL!" | Camera moves gently along a path to a welcoming school sign. A school bell icon glows once. Two-second response gap. |
| 01:03–01:17 | "Chalo mere saath! Main chal rahi hoon. English mein isko WALK kehte hain. Walk, walk! Ab aap bolo: WALK!" | Julie walks slowly, with visible stepping feet and the large word `WALK`. A child imitates; pause for response. |
| 01:17–01:25 | "Dekha? Aapne kitna accha try kiya! Galti ho toh koi baat nahi. Hum phir se seekhenge, pyaar se!" | Julie smiles and gives a small encouraging thumbs-up. Tiny stars, no giant celebratory effects. |
| 01:25–01:30 | "Ready, beta ji? Ab mere saath practice karein! Let's go!" | The path becomes the Level 1 meadow. Video fades gently into the interactive lesson screen. |

**Voice directing:** positive only, never shame or use labels such as "wrong child". Short clear phrases; model each target word clearly without drilling `at` repeatedly. If a teacher prefers more Marathi support, record an approved alternate *whole* narration, not a second voice patched into the middle of the video. Do not ask the child to use the live microphone during a prerecorded video; the microphone opens in the interactive activities immediately afterwards.

**Character look:** the approved Miss Julie model — friendly 3D cartoon teacher, long wavy brown hair, warm brown eyes, pearl earrings, light blue blazer, white blouse, beige trousers. Keep her at natural teacher-to-child scale and outside card-style UI. One consistent face, no random outfit or facial changes. Use a calm school garden palette matching `two-letter-word-meadow.webp`.

## Delivery and review gates

1. Review the supplied local 90-second MP4 or render an updated one. Confirm its duration is **87–93 seconds** and that all eight target words are taught. Have an English teacher approve content, Hindi/Marathi translation, caption spelling, voice consistency, pacing, and visuals.
2. Upload the reviewed MP4 **once** to the school's media distribution backed by private S3/CloudFront. Configure `NEXT_PUBLIC_TALKORA_CLASS1_INTRO_URL` in the frontend build (the public URL must never include S3 write credentials). Alternatively, place it at `client/public/lessons/class-01/level-01/miss-julie-first-day-intro.mp4` for **local preview only**; do not commit a large binary into Git.
3. For fixed lesson prompts, use `backend/src/scripts/class1-level1-ai4bharat-lines.json` to generate **Priya** recordings offline. Listen and approve every line. Use `audit-class1-level1-audio.ts` to check S3; the revised prompts use new immutable `v2` audio keys, and existing versions must never be overwritten.
4. Keep dynamic child-specific teaching **Qwen → Azure TTS, uncached**, with **Sarvam STT** on the child's mic turn. Hindi/Marathi understanding earns encouragement, not false English word mastery; STT text is not an acoustic pronunciation grade.
5. Run the *read-only* draft and media audits first. `prepare-class1-l01-draft.ts --apply` and `finalize-class1-l01-demo.ts --apply` are explicitly gated and only mutate the owned **development/staging draft**. The preparation script retains original activity IDs and attempts as optional history, then adds fresh required IDs; it never deletes a student's attempt or progress ID. Do **not** point the scripts at live Atlas school data.
6. The user-approved development setup opens this exact draft to active Class 1 students with `TALKORA_CLASS1_DEMO_ALL_STUDENTS=true`; production remains published-only. Verify full video playback → S3 narration → real mic → Sarvam → server-authorized attempt → Qwen feedback → Azure reply → saved progress → browser refresh/resume. School staff must approve the full experience before any publication.

## Suggested acceptance walkthrough

- First visit: the video is required; a missing/corrupt/too-short clip blocks the pilot with a teacher-friendly explanation. No silent, muted, or skipped completion.
- Say a two-letter word after Julie; speak with a normal Marathi or Hindi accent. The student gets an encouraging follow-up, never a humiliating red error.
- At the school bridge, a learner saying `chalna` for `walk` is praised and gently prompted for `walk`; only demonstrated English competence counts as independent mastery.
- Pause/reload after a saved activity; the student resumes that activity instead of being made to watch the 90-second intro again.
- A non-Class 1 student, a KG student, or a production account never gains access to the development Class 1 draft.

# Talkora Class 1 — Balbharati voice-first lesson blueprint (draft)

**Source checked:** English Balbharati, Standard One, 2025 first edition / 2026 reprint, [official PDF](https://ebooks.ebalbharati.in/pdfs/103050001.pdf). The mapping covers all 44 lessons from four units. These are chapter references and original Talkora exercises; no protected textbook story, poem, audio, or image has been reproduced.

## How Miss Julie should teach

1. The child enters the **landscape classroom** with Miss Julie and a large, dynamic English board; no fictional child character is displayed.
2. Miss Julie models one tiny skill with a reviewed, reusable audio line (prefer approved S3 or pre-rendered audio, never synthesize the same fixed sentence for every pupil).
3. The child answers aloud. Sarvam STT provides **a transcript**, not a pronunciation or IQ score. A missing/unclear transcript must not be interpreted as low ability.
4. Node resolves the actual authorized chapter/activity and session history. Python chooses one of **MODEL → GUIDE → PRACTISE → EXTEND**, based on the *current evidence*, hint count, mistakes and retries; the student's grade is never inferred from speech.
5. Miss Julie explains briefly in Hindi or Marathi **when requested or session-selected**, but keeps the English learning target visible and spoken. A Marathi support request, for example, models “at” with Marathi instructions, then asks for one English attempt.
6. The board changes to the next tiny task when canonical progress rules permit it. A single LLM hint cannot award XP, certify speech, or unlock a level.

## Proposed Talkora 10-level grouping

| Talkora level | Balbharati chapter references | Printed-page starts | Voice-first learning focus |
| --- | --- | --- | --- |
| 1 | 1.1 | 1 | First day, short English words and school talk (existing demo) |
| 2 | 1.2–1.6 | 2, 3, 5, 7, 8 | Actions, letters, blending, rainbow colours |
| 3 | 1.7–1.10 | 10, 11, 14, 16 | Family, greetings, names, routine |
| 4 | 2.1–2.4 | 18, 19, 21, 23 | Play, park, classroom, home |
| 5 | 2.5–2.8 | 26, 27, 28, 31 | Weather, polite words, actions, books |
| 6 | 2.9–2.12 | 33, 35, 37, 38 | Vehicles, insects, flowers, festivals |
| 7 | 3.1–3.5 | 41, 42, 44, 45, 46 | Opposites, friendship and reading |
| 8 | 3.6–3.11 | 48, 51, 52, 55, 57, 59 | Market talk, kindness, animals |
| 9 | 4.1–4.6 | 61, 63, 65, 66, 67, 69 | Nature, movement, music, imagination |
| 10 | 4.7–4.11 | 71, 73, 75, 77, 78 | Honesty, joy, gifts, food, holidays |

The code in `client/features/lessons/grades/class-01/balbharati-curriculum.ts` contains **one distinct original prompt and evidence rubric per chapter**. Levels 2–10 reference that data but remain `draft`, `studentPlayable: false`, and `staffOnlyPreview: true`. **The source chapter references have been checked; educational suitability, bilingual wording, visuals, rubrics, pacing and recording privacy have not been teacher-approved.**

## Real technical boundaries

- `g01-l01` already uses the canonical Node voice-session path, Python Class 1 response guard, Mongo progress rules, Sarvam STT and Azure TTS. Do **not** create separate controllers for each level.
- The prior 1.7B QLoRA adapter failed held-out response validation. Keep `TALKORA_CLASS1_HINTS_APPROVED` disabled until a new model has passed offline adversarial checks and educator review. Python now provides local, original, mode-sensitive bilingual scaffolds even with the model-hint gate disabled.
- `TALKORA_CLASS1_BILINGUAL_TTS=true` is an **opt-in** for Azure Hindi/Marathi voice selection based on localized teacher text; no second TTS request is made. Keep it disabled until approved voices sound natural in a supervised headset test. The initial English voice remains `en-IN-NeerjaNeural`.
- The voice choice alone does **not** guarantee that spoken Hindi and Marathi will be correctly recognized; live Sarvam STT Hindi/Marathi recordings and code-mixed follow-ups require QA.
- Browser fullscreen and orientation locking are **best effort**, require a user gesture and cannot force F11/override device rotation settings. Computer-lab kiosk policies are a deployment option.

## Educator sign-off required before publishing each chapter

- Check the objective against the exact chapter in the school's edition of Balbharati.
- Approve **original** dialogue, visual assets, bilingual Hindi and Marathi wording and fallback/help lines.
- Try with children at beginner/average/advanced English ability, including low-confidence and noisy microphone transcripts; observe evidence of *learning*, not speech accent.
- Confirm microphone retry, audio-on-mute, fullscreen/rotation, 2G/slow connection, screen-reader text and automatic next-step behavior.
- Check privacy policy/guardian consent where required; do not put student recordings in permanent public assets or logs.
- Compare one non-paid local dry run, one approved Sarvam+Azure test and cached narration reuse; budget and monitor production spend.
- Have the teacher and school approve a **published** curriculum version. Do not mistake `activities.ts` authoring drafts for MongoDB-published lessons.

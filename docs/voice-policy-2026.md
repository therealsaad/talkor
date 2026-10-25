# Talkora speech policy — KG through Class 10

This is the shared policy for the existing student voice flow, not a request to
add a controller per level. Reuse the existing voice services and curriculum
registry. **KG Level 1 is the only currently implemented interactive KG pilot;**
Levels 2–10 remain drafts until their activities, audio, tests and approval exist.

| Grade | Hearing a fixed curriculum line | Hearing a response to the student's speech | Listening to the student |
| --- | --- | --- | --- |
| KG (0) | Approved AI4Bharat **Priya v6** MP3 from private S3 | Deterministic, positive **Priya v6 S3 clip** chosen by server outcome and lesson target. No per-student S3 objects. | **Sarvam Saaras v4**, English/Hindi/Marathi, codemix |
| Classes 1–10 | Human-reviewed, versioned private S3 narration when an approved `activity.content.audioKey` exists | **Azure** TTS for genuinely new replies; no persistent S3/Atlas cache for individualized coaching | **Sarvam Saaras v4**, same global STT provider |

## Kindergarten learning contract

1. Speak the fixed prompt: "A for apple! Can you say apple?"
2. Capture short student speech. Only server-side Sarvam transcription can be
   used for grading, not a transcript asserted by the browser.
3. If the child says *seb*, *सेब* or *सफरचंद*, record `supported`, speak the
   approved `bridge-a` Priya clip, praise their understanding, model *apple*,
   and invite another English attempt. **Do not advance speaking progress.**
4. A clear English *apple* or an explicitly allowed preschool approximation
   records `correct` and progresses. Wrong or unclear speech selects a positive
   `model-a` or `silence` clip and retries without shame.
5. After two attempts, the existing assisted-picture accessibility flow can
   move the child forward while recording `supported` instead of pronunciation
   mastery. Its audio is `picture-support`, not a fake English success.
6. The intro/video ticket, student PIN, school/grade authorization,
   idempotency, replay and progress writes remain server-owned and intact.

KG response clips are shared immutable recordings: no Qwen call per answer,
no live Azure synthesis in the normal S3 mode, and no student-specific S3 key.
Reused S3 audio is delivered by an authenticated backend route and a bounded
worker cache. Staff must review the **pinned Priya voice** and upload all new
manifest IDs before a rollout. `KG_VOICE_PROVIDER=azure` exists only as an
explicit emergency alternative and **does not cache**.

## Class 1–10 rules

- Keep content, level and activity IDs in the existing curriculum models.
- A fixed narration line may carry a reviewed key such as
  `class-01/level-01/v1/listen-at.wav` or
  `class-10/level-10/v1/example.mp3`. A validated key and authorized activity
  are required; arbitrary S3 keys never come from the client.
- Qwen, when configured and available, may author bounded, positive coaching
  text. Its answer must never directly grant XP or unlock a level.
- Azure speaks new teaching/feedback turns. Its dynamic endpoint **must not**
  put per-child corrections in S3 or `AudioCache`. Speech results may be
  transient; progress/attempt metadata follows existing privacy rules.
- The reviewed curriculum script—not the generated correction—is the only
  intended permanent audio asset.

## One backend configuration for every grade

```dotenv
SPEECH_PROVIDER=sarvam
SARVAM_API_KEY=<server-only-key>
SARVAM_STT_MODEL=saaras:v4
SARVAM_STT_LANGUAGE=unknown
SARVAM_STT_MODE=codemix
KG_VOICE_PROVIDER=s3
VOICE_PROVIDER=azure
CONVERSATION_VOICE_PROVIDER=azure
```

`KG_ALPHABET_STT_PROVIDER` is a legacy **optional** override, not an example
for creating ten more variables. For an existing `.env` containing
`SPEECH_PROVIDER=groq`, change that key explicitly: adding Sarvam credentials
alone cannot override it. Groq credentials can remain for legacy AI use.
Never commit `.env` or expose credentials through a `NEXT_PUBLIC_` variable.

## Rollout gates

1. Review bilingual wording and pronunciation with a teacher, especially
   Marathi/Sarvam transcription against real local school microphone samples.
2. Use `pnpm exec tsx src/scripts/kg-level1-audio.ts --all --dry-run` from
   `backend/`; generate/listen to the sample; create the full local library;
   review S3 upload targets; upload only with authorized credentials; verify.
3. Run backend build, focused STT/feedback tests, client type-check and UI
   tests. Integration tests need a working MongoDB test runner.
4. Publish KG Levels 2–10 and Classes 1–10 only when their own curriculum,
   S3 recordings and student runtime are complete. Do not expose drafts.

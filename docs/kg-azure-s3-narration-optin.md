# KG fixed Azure/S3 narration — staged controller integration

**Release state:** merged code may be present, but cache routing remains **OFF by default**. It is **not** an authorization to publish additional KG levels or to store learner audio.

## Exact switch and rollback

The Node backend reads `TALKORA_KG_FIXED_NARRATION_CACHE` at request time. Unless its value is exactly `true`, controllers run the pre-existing KG narration path. To roll back: unset it, or set it to `false`, and restart/redeploy the backend under normal change control. No migration or data rewrite is necessary.

When enabled, only these **server-authored fixed narration** endpoints use `getKGAzureNarrationAudio`:

- KG Level 1 entries with `AUDIO_MANIFEST.kind === 'curriculum_static'`, after existing authenticated student, staff preview, version and ID guards.
- KG Level 2–5 narration in existing **staff preview** controllers, from their checked-in `LEVELn_NARRATION` maps.

Dynamic KG teaching prompts, Qwen-generated feedback, student recording submissions, transcript handling, playback acknowledgments, progress updates, grades, PIN sessions and the compulsory KG introductory video remain on their existing paths. Staff preview availability does **not** publish KG Levels 2–5 to students.

The cache is content-addressed by server text, selected Azure voice and locale, voice rate/pitch, output format and version. It uses bounded worker memory, optionally reads/writes private S3 audio objects, and falls back to Azure on cache miss or transient S3 outage. S3 **AccessDenied** fails closed. No raw student speech, personal data or generated feedback is passed into the cache.

Controller output validates the declared audio format and length before streaming. Level 1 preserves an authenticated, private response, media ETag/304 handling, and never marks a video or feedback as acknowledged.

## Verification before rollout

Automated PR tests:
- `cd backend && pnpm run test:kg-azure-audio`
- `cd backend && pnpm exec jest --runInBand tests/integration/kgAlphabetAudio.test.ts -t 'opt-in KG fixed narration'`
- Backend TypeScript build and existing auth, KG video and feedback-ack regressions in GitHub Actions.

**Not automated here:** Authorized real Azure TTS + S3 smoke, 403/IAM policy behavior against actual credentials, spoken language and voice-quality review by a school teacher, low-spec school-lab playback. No live provider claim is made without those tests.

After the publisher/teacher explicitly approves **each** fixed narration line and S3 policy, an operator may separately run `cd backend && pnpm run kg:azure:warm` using the existing approved Azure/AWS environment. This script **writes cloud objects and incurs costs**: do not run it as a CI job or without deployment approval. A successful warmup does not mean any curriculum preview is student-published.

Monitor only non-sensitive cache status (`MEMORY`, `S3`, `AZURE`) and transient error rates; never log student audio or tokens. If cold/invalid audio, S3 access or voice mismatches occur, disable the flag and investigate without modifying student progress.

## Remaining acceptance gates

Issue #74 can close only after current PR CI is green **and** a real provider/integration acceptance has been recorded for the target environment. Human review of language and assets is independent of code tests. Keep the issue open with a truthful blocker if real credentials and school review are unavailable.

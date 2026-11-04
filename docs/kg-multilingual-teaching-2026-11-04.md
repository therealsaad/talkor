# KG multilingual teaching turn — implementation and release gates (4 Nov 2026)

## Goal and scope
Miss Julie must respond to the *meaning* of a learner's speech before requiring an English answer. Example: at KG1 C, `billi / बिल्ली` is a **supported Hindi translation** of `cat`; Miss Julie says the English word, asks the child to repeat it, but **does not award English mastery** for the Hindi answer. At KG3 L, `sher / शेर` similarly teaches `lion`, then the existing letter-L task must still be completed correctly.

## Source-of-truth
- `backend/src/teaching/kg-teaching-turn.ts` is the common, pure classification/response policy plus bounded question/Qwen adapter.
- Existing KG1, KG2 and KG3–5 **student controllers** call the shared policy. They retain their original authentication, intro ticket, server-owned speech grading, audio receipts, Mongo progress, idempotency, and next-level boundaries.
- KG1 still grades independent English *words*; KG2–5 pilot tasks still grade English *letters*. Recognizing an English picture word during a letter checkpoint does **not** silently count as the correct letter.
- KG2 currently has E–J letters **without approved matching picture words**; do not invent an E/elephant or J/jug lesson on the student server.
- KG6–10 have staff-only target word inventories mirroring the existing drafts. `approvedForStudent:false` is mandatory. No routes, progress models, publication, videos or media rights are created by this change. Translation variants for these levels must be approved before enabling them.
- The lesson's approved English objective remains the completion criterion. The LLM's text can **never** change verdicts, XP, levels or student identity.

## Flow
1. Server-authorized student attempts microphone speech after the required intro. Sarvam transcribes with optional detected language and no client-selected locale.
2. Existing immutable lesson grading verifies the actual objective. Shared policy classifies `correct_english`, `correct_letter`, `translation_hi_mr`, `wrong_word`, `silence_or_noise`, and `question_or_offtopic`.
3. Known translations get a deterministic native-language bridge and English practice instruction; uncertain/negated/question utterances do not get translation mastery. Exact variants only: fuzzy guesses for similar short words are unsafe.
4. A bounded Python/Qwen request is attempted only for a relevant child question. It receives lesson/word/letter, not student PII, and its reply is validated; otherwise the reviewed deterministic fallback is used.
5. The final text and selected response locale are saved on the existing KG2–5 attempt record. Retries and interrupted playback reuse the same text and locale, never a new AI turn.
6. Azure uses localized Hindi/Marathi then English Neerja `Say ...` in one synthesis request when a native-language coaching line ends with an English practice prompt. Fallback Priya remains in place if Azure fails. Audio receipt/ACK continues to guard progression.

## Regression and acceptance
From `backend/`:
```sh
pnpm install --frozen-lockfile
pnpm build
pnpm exec jest --runInBand tests/unit/kgSharedTeachingTurn.test.ts tests/unit/kgFeedbackRouting.test.ts tests/unit/kgAzureBilingualLocale.test.ts
node --test tests/kg-live-voice.node.test.cjs tests/kg-feedback-audio.node.test.cjs
pnpm exec jest --runInBand tests/integration/kgAlphabetAudio.test.ts tests/integration/kgLevel2StudentJourney.test.ts tests/integration/kgContinuationSequence.test.ts
```
CI must also guard KG1 `billi`/Marathi, KG3 `sher`, KG4 `khargosh`, delayed/failed Qwen, mixed-language transcript, silence, wrong word, real progress not advancing on a translation, cross-school access, crash reload, and previously graded audio.

## Mandatory before production
- Independent qualified educator review of *every* grade-level word, Romanized and Devanagari Hindi/Marathi variant and resulting speech line; do not accept generated lexicons as approved translations.
- Explicit review and licensing of all intro videos, artwork and fixed audio. No broad release of KG6–10 or changed KG2 vocabulary until student lessons really exist.
- Real school mic → Sarvam → policy/Qwen (where relevant) → Azure (actual speaker) run, with bilingual switches and pronunciation confirmed on devices. Measure STT false negatives/positives on consented local test recordings, and actual mouth-to-ear latency p50/p95.
- Release/staff approval, security checks, concurrent lab-device testing, next-day five-digit PIN resume and zero regression in progress/XP.
- Important: code review and CI are **not** a certified real-child or physical-speaker test. Not all possible utterances or code-mixed pronunciations can be safely recognized by finite spelling lists. On uncertainty, retry instead of awarding mastery.

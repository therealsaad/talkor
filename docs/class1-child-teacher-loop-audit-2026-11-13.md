# Talkora: Class 1 Level 1 — learner/teacher loop audit (13 November 2026)

Status: **engineering review draft, not school acceptance**. No publishing, merging, deployment or teacher-data migration is authorized by this file.

## Guiding educational contract
A Class 1 learner should be able to **listen → understand a short meaning → attempt a word or sentence → hear specific encouragement → try the next small goal**. A right word counts as a right *word*, not proof of perfect pronunciation, full-sentence fluency, or independent mastery. Repeated silence or confusion must never fake completion, trigger infinite recordings, or humiliate the learner.

| Situation | Miss Julie should do | Node should record | May advance? |
| --- | --- | --- | --- |
| “Run” on skip/run pair | “Great! I heard run. Now say skip.” | Current pair / target **run** observed | Not until both targets in separate mic turns |
| “Semi skip” | Allow only authored see-me variant in the relevant scene | Raw STT plus bounded recognized target | Word credit only |
| Child says both authored lines independently | Celebrate real recitation | Independent full-pair textual evidence | Yes, **MASTERED**, after signed Azure playback acknowledgement |
| “What is run?” | Explain run in an available home language, model short English word | Help request, never achievement | No |
| Child repeats “run” four times | Encourage, show/voice the *other* word and an example | Repeated known word; no new evidence | No |
| Nothing heard | One Azure-spoken re-listen, then available manual mic | No answer / no XP | No |
| 5-section finale | Give a choice: one relevant word for each current section or both lines | Match section 1 with words for section 1, etc. | Supported after 5 aligned clips; independent full poem still separate |
| Incorrect and off-topic | One bounded explanation; do not demand perfect pronunciation | Unclear/needs practice | No |
| Azure fails | Visible manual retry; keep pending server turn | No signed playback confirmation | No |

## What the repository actually does

- **Intro and authorization:** strict 90-second Class 1 video and student session access gates exist. Do not bypass for perceived speed.
- **Poem pair:** `backend/src/services/gentle-first-day-poem.ts` already supports 5 authored pair rules. Short recognized English words and bounded variants are tracked per current authorized Mongo conversation. Two distinct target turns can earn `COMPLETED_WITH_SUPPORT`; independent full lines remain stronger evidence.
- **Teacher:** Node chooses skill evidence and completion. Qwen helps for ambiguous replies but does not own grades. Short recognized-word praise avoids a Qwen call. Azure TTS speaks Miss Julie's feedback; an audio completion receipt is required before saving Class 1 attempts.
- **UI:** learner has Speak/Hear-again choices and a visible current-word hint. The client owns only recording playback and the current local five-piece finale buffer, not grading.
- **The remaining integrity problem:** the finale previously combined five STT clips with spaces. The backend could see ordered keywords, but not which recording they came from. A single utterance containing a five-word bank could be accepted as supported finale evidence, even if the child did not demonstrate each section. That is an **assessment error**, not a model training problem.

## Patch in this review PR

1. In the *existing* five-short-clips finale path, normalize only internal whitespace and submit one line per recorded clip, separated by four newline boundaries. This uses one already existing last-session transcript request. No extra STT, Qwen, database fields, paid services, browser-side scoring or route changes.
2. The authorized Node finale evaluator requires **exactly five nonempty ordered section transcripts**, each containing an approved keyword for *that* section only, and rejects help, off-topic script, missing/reordered/extra sections. One word from all five sections in a **single** recording is no longer sufficient for assisted achievement.
3. Keep `poemEvidence` independent full-recitation checks, `COMPLETED_WITH_SUPPORT` versus `MASTERED`, and the existing signed Azure reply completion/teacher-audio acknowledgement unchanged.
4. Change transitional teacher speech from “Now recite them” to “Say one word from these lines, or try both lines.” Do **not** imply the earlier clip was correct before the backend evaluated it.

**Limitations:** Client-provided text separators are not a cryptographic proof that a particular child uttered five separate clips; this is a lesson integrity improvement within the already authenticated, single Sarvam clip per browser recording design. A malicious client could fabricate transcript text; school security and STT provenance require a separate reviewed architectural plan. This PR intentionally does **not** change existing published MongoDB teacher introductions or repair local browser resume mid-finale (which restarts that section). It does not provide acoustic pronunciation grades.

## Acceptance checklist for the next supervised school-PC pilot

1. After introduction, listen to a complete Azure model, say only “skip”, then “run”. It should move forward **with support** without making the child say “See me skip. See me run” a third time.
2. Repeat “run” or ask “What is run?”; get helpful coaching with no false credit.
3. Enter the finale; record “skip”, “school”, “grin”, “jump”, “hurray” in **five successive prompted parts**; the backend should classify supported participation, play the full teacher feedback via Azure, then save the attempt on acknowledgement.
4. Put all five keywords into the first recording but speak irrelevant words in later parts: the finale must **not** complete. Repeat with any one missing/incorrect section.
5. Recite the full poem across five clips: preserve stronger independent **MASTERED** when authored source evidence rules are satisfied.
6. Speak Hindi/Marathi help requests, silence twice, deliberately block Azure, and replay; confirm the learner never gets stuck without a visible recoverable action and no unauthorized progress appears.
7. Test an interrupted final recording and the next PIN login; existing saved word evidence resumes, while unfinished five-clip finale may restart. Confirm student A/B and school/PIN isolation.
8. With `?latency=1`, measure **microphone-stop → STT → Node decision → Azure audio-start → audio-end** on real slow hardware. The 1.9s no-speech voice-activity pause currently makes the 2–3s microphone-to-speaker goal hard; don't claim the goal from CI. Record p50/p95 and acceptable classroom tolerances before changing timers.

## After this PR: what to build next (separate reviews)

- A **server-owned per-section coaching turn**: once clip boundaries are proven, add explicit `heard target / partial / help / unclear` feedback per authorized section, with no extra LLM call for recognized words. The current finale speaks a generic transition between early recordings; it does not yet grade those individual clips.
- A **teacher-reviewed learning-evidence ledger** for each objective: (word recognized, help provided, independent line, supported line, repeat difficulty), with safe summaries for staff. Never show children a “low score” or infer pronunciation confidence from uncalibrated STT text.
- More reliable **Hindi/Marathi comprehension bridges** and short-prompt Qwen guard against irrelevant `at` tutoring, with source-pinned response tests.
- Preserve **student agency**: re-hear line, repeat one small word, try both lines, ask for translation; keep visible large controls and managed-lab keyboard/mic behavior.
- Calibrate STT against real age-6 to age-8 voices across Hindi/Marathi/English accents, include legitimate refusals/help requests, and get teacher consent and safety review for any voice samples. Never save raw child audio as an artifact merely to run CI.
- Review and safely update historical persisted `teacherPrompt` data after curriculum approval; code changes to the staging script do not rewrite existing lessons.
- Only after Class 1 micro-to-speaker evidence is credible, package the shared teaching policy and approved Balbharati chapter data for KG–10.

**Rollback:** revert the feature PR. Neither student records nor publication status is mutated by this code review.

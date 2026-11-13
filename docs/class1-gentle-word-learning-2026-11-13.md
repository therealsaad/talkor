# Talkora Gentle Learning Engine — Class 1 Level 1, first reviewed slice
**Scope:** English Balbharati 1.1 *My First Day*, five authorized two-line poem pairs only. Do not publish, merge or deploy automatically.

## Why
In the real student test, Sarvam returned short utterances such as "Run" while the exact phrase gate expected "See me run." The UI also displayed a generic "add more words" message intended for general open conversation. Children with beginner English were being asked repeatedly to recite perfect complete sentences, even after demonstrating the taught actions. STT text is not a phonetic pronunciation score.

## Implementation
1. `gentle-first-day-poem.ts` recognizes one current, approved **keyword or bounded English inflection per speaking turn**. It requires a server-provided grade-1 `LessonTeachingContext`, an authorized current two-line v4 poem scene, and `inputMode:MIC`. It rejects questions, help, silence, negations, unrelated speech, multi-target word banks and non-English attempts. No unbounded Levenshtein guess or acoustic pronunciation claim.
2. A version-scoped `gentlePoem` structure in the existing Mongo Conversation retry state records which of **two** authored line targets were recognized (indices only, no audio or new transcript store). It is isolated by the existing student, activity and lesson access checks, with a hash of the current revision, activity, lines and vocabulary. Restarting/resuming retains the state. A new revision/scene starts without borrowed evidence.
3. One recognized word means **good effort and move to the next small word**, NOT activity completion. Two distinct approved words across **separate microphone turns** can complete the current pair as `COMPLETED_WITH_SUPPORT`. The original full two-line `firstDaySceneSkills` gate remains the route to independent `MASTERED`. The scene and progress are still server-controlled and still require signed end-of-actual-Azure-audio confirmation before the ActivityAttempt is saved and unlocked.
4. Recognized words use short deterministic praise (no Qwen round trip). Ambiguous, off-topic or help requests retain bounded Qwen plus the approved poem guard and local coaching. Azure remains the voice provider. The UI no longer mistakes a one-word Class 1 answer for a failed general three-word response. Hindi/Marathi response prompts retain the supported explanation preference.
5. Same engine/data flow only; no new Student/Progress collections, no DB migration, no broad KG–10 changes, no curriculum publication or hardcoded client grading, no extra speech-recognition calls.

## Examples
| Authored pair | Spoken first take | Spoken second take | Result after actual signed audio |
| --- | --- | --- | --- |
| See me skip / See me run | "Skip" | "Running" | Completed with support |
| See me skip / See me run | "Run" | "Skip" | Completed with support, flexible order |
| See me skip / See me run | "Run" | "Run" | Still practising the other word |
| See me skip / See me run | "Skip run" | — | Not accepted as two separate attempts |
| See me skip / See me run | "What is run?" | — | Explanation/help, no progress |
| See me skip / See me run | "See me skip. See me run." | — | Independent gate still applies |
| Grade One / Hurray | "Grade One" | "Hooray" | Completed with support |

## Acceptance & limitations
Tests in `backend/tests/unit/firstDayEvidence.test.ts` exercise all five pairs, connected speech "semi", questions/negation, cross-lesson hashes and zero-XP wording. Real HTTP/Mongo tests in `backend/tests/integration/firstDayPracticeScaffold.test.ts` test resume, isolated students, forged client state, pending progress, signed Azure audio receipt and idempotent completion. The frontend build also verifies the existing poem experience. Run the README local CI runner and GitHub CI, then use a real microphone, speaker and `?latency=1` on a nonproduction test PIN.

This is **slice 1**, deliberately restricted to the five individual poem pairs. The ten-line **poem-full finale** currently retains its stronger, existing combined-recital rule and five 2-line microphone clips. It must receive its own bounded assisted-recital acceptance design and reviewed tests before declaring the entire Class 1 pilot effortless for a beginner. Teacher-reviewed curriculum data, KG–10 rollout, and measured 2–3 second latency remain separate acceptance gates.

**Rollback:** revert the review branch. The additional nested optional Mongo fields are additive, and old conversations without gentle state remain valid. No background job or migration.

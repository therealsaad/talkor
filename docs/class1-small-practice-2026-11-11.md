# Class 1 small practice and conversation scope

## Read-only findings and intended fix

The latest app main includes #132 and the Python main includes #21/#22. The
open KG6 preview #117 and KG intro compression #133 are separate work; this
batch changes neither preview nor media. The existing Node conversation,
Sarvam/Python/Azure interfaces and progression engine are retained.

| Verified issue | Evidence and impact | Fix and verification |
| --- | --- | --- |
| High: every failed poem turn asks for both lines again | `class1-poem-teacher-guard.ts` always emits BOTH-lines retry wording. `nextRetryState` counts attempts but never reduces the requested poem range. A child saying `At at.` three times gets the same full task. | Apply an existing-lesson practice policy after the third submitted unsuccessful reply. Unit tests cover each rule and all 16 existing scenes; real HTTP/Mongo tests cover the recorded case. |
| High: an explicit conversation ID is not checked against requested curriculum scope | `MissJulieService.converse` previously looked up the ID/student, then used caller lesson/activity IDs independently. Own-student conversations could borrow another activity's goals/retries. An ID-only lesson resume built no authorized lesson context or intro check. | Inherit saved scope before context authorization; reject mixed IDs and another student's ID before a provider call or conversation mutation. Test activity/lesson mismatch, account switching and a new visit without intro. |
| Low: malformed conversation IDs cause a database cast error | The same lookup constructs `ObjectId` without checking its input. | Return a bounded validation error; regression expects 400 and no provider call. |

These findings are code-path and automated-behavior evidence. No live classroom
latency, physical microphone/speaker or provider-capacity diagnosis is inferred.

## Small deterministic practice policy

The policy uses only the authenticated current conversation's saved retry state
and the validated DB-derived `teachingContext`. It does not add another
controller, LLM call, endpoint, grade engine or Python contract version.

| Current evidence | Next teaching invitation |
| --- | --- |
| Fewer than three submitted unsuccessful turns | Existing reviewed response |
| Third unsuccessful turn | One actual current English line |
| A practised line is repeated | Next line in the same range |
| All current lines have been practised separately | Combine the same current lines |
| Three unsuccessful tries on one line | One word/short phrase extracted from that line |
| The small part is repeated | Return to its same line |
| Continued difficulty on the small part | Offer teacher assistance, keep the same word available |
| Three unsuccessful combined tries | Return to the first small line |
| Existing whole-scene evaluator accepts the current utterance | Normal final-turn and signed audio-ACK path |

"Unsuccessful" includes submitted unclear, incorrect and help-request
utterances; this is not an acoustic assessment or a diagnosis of ability.
Unsubmitted silence is handled by the existing microphone UI and still needs
physical-device verification. Unknown text, questions, negation and injected
instructions cannot advance the small practice cursor. Normalized practice
allows the existing grin/smile, hurray/hooray and I'm/I am variants.

The current complete `modelSentence` remains unchanged. Only the spoken
invitation becomes smaller, through the existing message/follow-up audio path.
English/Hindi/Marathi scaffolding retains an English repeat opportunity and a
short available explanation/answer, including volunteered home-language
translations. Long whole-poem wording is removed from a one-line invitation.
Fabricated grading fields, XP and verified memory are removed from practice
feedback. No small part itself completes a poem or saves an activity attempt.
For school actions the existing permitted single-word evidence remains valid;
this patch does not make their grading stricter or looser.

## Persistence and compatibility

An optional `retryState.practiceScaffold` subdocument stores schema version,
curriculum content fingerprint, bounded line index, LINE/WORD/JOIN stage and
bounded retry count. It contains no pupil text, name, PIN, token or audio.
It is scoped by the existing student/activity conversation and checked against
the authorized current activity key, revision, lines and vocabulary. Malformed
or stale practice state resets safely to current-line practice. Successful
whole-scene evidence clears practice through the existing retry reset.

No migration, index change, backfill, production write or curriculum staging
script is needed or was run. Old records without this field continue normally.
ID-only free talk retains its current behavior. Legacy activity-only lesson
conversations resolve their actual authorized lesson without borrowing another
lesson's state. The old Python consumer and the version-1 packet remain usable.

## Verification and measurements

The new policy and HTTP/Mongo suites run in the repository CI workflow and
`tools/run-ci-locally.mjs`. They use a disposable MongoDB, normal full-intro
endpoints with the existing test clock, real voice-session/conversation paths
and synthetic AI/Azure boundaries. The HTTP sequence verifies:

1. Three `At at.` turns offer the first grin/bell line immediately.
2. A fresh Express instance resumes the same saved practice, with no extra AI greeting.
3. Individual lines lead to combined practice without progress/XP.
4. A valid complete pair still saves no attempt until generated audio has a valid signed acknowledgement; repeated ACKs save one attempt.
5. Interleaved students/activities, forged browser state and mixed IDs cannot share or replace practice.
6. ID-only lesson resume enforces a fresh full intro; free talk remains compatible.

The local text report has **18 synthetic scene/language cases**. For the
grin/bell scene, spoken feedback changes from **125 to 51 characters in
English**, **161 to 88 in Hindi**, and **142 to 89 in Marathi**. For the full
poem the English third-retry text changes from **269 to 51 characters**.
Counts include message and follow-up, using JavaScript UTF-16 length. The
complete model remains the same. These are wording measurements, not audio
duration, microphone latency or real provider performance.

Reproduce after installing existing backend dependencies and building:

```bash
cd backend
pnpm build
pnpm exec jest --runInBand tests/unit/firstDayPracticeScaffold.test.ts tests/integration/firstDayPracticeScaffold.test.ts
node scripts/report-first-day-practice.mjs
cd ..
node tools/run-ci-locally.mjs --job backend --keep-going
node tools/run-ci-locally.mjs --job structure --keep-going
```

Machine-readable local wording result:
[`evidence/class1-practice-text-2026-11-11.json`](evidence/class1-practice-text-2026-11-11.json).
Final local and GitHub check results are recorded in the PR description.

## Review, rollback and remaining gates

Review the new shared English/Hindi/Marathi coaching wording with educators and
native speakers before school use. Real Sarvam, Qwen, Azure, physical hearing,
microphone/audio overlap, deployed revisions and school-network p50/p95 remain
unverified by these synthetic tests. Interleaved different-student isolation is
tested; this is not a load/capacity certification or a new same-student
concurrency/idempotency mechanism.

PIN authentication, full intro, server grading/progression, private audio,
signed acknowledgements, revision, publication and KG6–10 locks remain required.
No lesson, media or curriculum was published and no service was deployed.
There are no frontend/animation/voice-asset changes. Frontend build and existing
Chromium gates remain in CI.

Rollback this code change through review. The optional saved practice cursor
can be ignored by old code; student progress and existing attempts need no
rewrite or deletion. Continue with a measured Class 1 physical-device pilot
and educator-reviewed lesson packs before expanding student access.

# Class 1 curriculum data and adaptive teaching context

First Day context previously re-read a caller-supplied lesson independently of
the authorized activity, and general coaching used eight recent scores from any
activity. The AI bridge carried loose strings but no validated current-line and
support contract. This batch adds a read-only projection of the existing
Lesson/Activity data and a scoped teaching plan; it does not replace the lesson
player, grading, voice providers or progress engine.

## Scope and data

Version 1 is deliberately limited to authorized Class 1 `g01-l01` v3/v4 scenes.
KG, other grades/levels and retained v2 history retain their current paths. This
is the first reusable contract, not 110 completed or published curricula.

`StudentContextService` reuses the Activity, Lesson and Level returned by the
existing authorization service. Supplying a different `lessonId` alongside the
activity now fails with `CURRICULUM_ACCESS_DENIED`. An activity-only request
resolves its actual lesson and canonical level. Current modern First Day prompts
cannot be replaced by a stale voice-session target such as `at`.

The optional `teachingContext` body on the existing authenticated Python bridge
contains schema version, grade, canonical lesson/scene/activity keys, revision,
source citation, objective, teacher question, stable line IDs, exact model lines,
vocabulary, bilingual hints and a support plan. It contains no pupil identifier,
PIN, token, answer key, transcript, XP, publication or completion field. Existing
bridge fields remain unchanged. Source metadata missing from older records is
`null`, not guessed.

The projection reads `teacherPrompt`/`prompt`, `modelSentence`, `content.poemLines`,
`metadata.allowedVocabulary`, `hint` and `source` from authorized records.
Optional `metadata.teaching` enriches source/objective/hints:

```json
{
  "version": 1,
  "book": "English Balbharati Grade One",
  "edition": "2025",
  "chapter": "1.1",
  "objective": "Listen to and recite the current English poem lines in order.",
  "hints": { "en": null, "hi": "Reviewed Hindi hint", "mr": "Reviewed Marathi hint" }
}
```

These example hints are placeholders, not lesson content to install. The two
canonical staging scripts attach the existing source citation and the poem's
already authored Hindi/Marathi hints to **new draft records only**. Neither script
was executed. No current record, attempt, progress, approval or publication was
changed. Older v3 records with models can be projected without migration; old
v3 records lacking a model retain the existing legacy response path. Invalid
explicit authoring data or mismatched poem lines fail visibly and closed.

## Deterministic support, not grading

Only the current student's current-activity attempts and current conversation
retry state supply the new plan. Another activity or student's scores cannot
change it. Every read is fresh; no settled progress/context is cached.

| Evidence | Plan | Teaching behavior |
| --- | --- | --- |
| No evidence | MODEL | Offer a small English model |
| One failed attempt or pending retry | GUIDE | Give one current-scene hint |
| Repeated difficulty or elevated retry help | MODEL | Explain/model more explicitly |
| Successful attempt with help | PRACTISE | Keep rehearsing the same objective |
| Saved correct attempt explicitly without hints | CHECK | Invite recall on the same lines |

Unknown hint evidence never counts as independent success. Counts/levels are
bounded. These plans do not assign a grade, infer pronunciation/IQ, change the
child's class, move a cursor or award mastery/XP. The current utterance can still
need help after prior success. Node's existing evidence and signed audio ACK
remain the only progress path.

## Python consumption and speed boundaries

The companion AI change consumes the optional strict context on
`talkora-ai-starter/server.main` → `/v1/brain/respond`. It rejects root/body
grade, lesson, scene, question and vocabulary mismatches; unsupported scenes,
altered current poems, invalid versions and extra authority fields are errors.
Node also validates the projection before starting a provider timer/request.
The new packet is bounded to 6,000 serialized characters and never includes the
whole syllabus or arbitrary history.

Routine turns keep the reviewed no-Qwen path. Saved support selects scaffolding;
the English model and stored bilingual hints come from data. Novel questions
give local Qwen the compact source/objective/lines/support with the existing
1.8-second deadline and checked fallback. Student speech/history stay untrusted
data. The old tiny-word response guard cannot rewrite a validated current lesson.
Python still always returns `activityComplete: false` and no verified memory.

No new STT/TTS request, persistent coaching-audio cache, model, dependency upgrade
or new public API route is added. The existing Azure/S3, playback and receipt
pipeline is retained. Three redundant Activity/Lesson/Level reads are removed;
a real Mongo test requires one authorized read of each. This is a query-count
improvement, not a measured live speech-latency claim.

## Verification and reproduction

The identical synthetic wire fixture is checked in to both repositories:
`backend/tests/fixtures/class1-teaching-context-v1.json` and
`talkora-ai-starter/tests/fixtures/class1-teaching-context-v1.json`.

Focused Node tests cover real Mongo authorization/intro restrictions, mismatched
lessons, fresh/cross-student/activity evidence, retry state, query count, secret
answer exclusion, malformed data, all 16 model ranges and provider bounds.
Python tests use the same packet through ASGI, including `At at.`, Hindi/Marathi,
changed data models/hints, recall, injection, wrong scope, rejected outputs,
timeouts, legacy compatibility and service authentication. No real pupil data or
paid providers are used.

Local results on 2026-11-11:

| Check | Result |
| --- | --- |
| Repository backend CI runner, including TypeScript build and security/progression regressions | 52 passed; dependency install step skipped because dependencies were already installed |
| Repository structure CI runner | 4 passed |
| Focused producer and bridge unit tests | 25 passed |
| Real Mongo context integration tests, included in backend CI | 8 passed |
| Entire `talkora-ai-starter` offline suite | 234 passed, 1 existing optional seed skipped, 1 existing Starlette/httpx deprecation warning |
| Real Node provider to owned FastAPI process | 16 scenes passed |

The machine-readable local wire result is
[`evidence/class1-teaching-wire-2026-11-11.json`](evidence/class1-teaching-wire-2026-11-11.json).
Frontend code is unchanged; frontend build/browser gates remain in repository CI.

```bash
# App repository (existing pnpm 10.18.0 dependencies)
node tools/run-ci-locally.mjs --job backend --keep-going
node tools/run-ci-locally.mjs --job structure --keep-going

# AI repository / talkora-ai-starter
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 TALKORA_ENV=test python -m pytest -q tests
```

An optional two-checkout test launches only its own loopback Python process and
blocks model network calls inside that child. It uses the real Node provider,
service authentication, request schema and FastAPI teacher route. It exercises
ten school-action scenes and six poem contexts. It never accepts an external
target or database. After building the backend and installing the AI test deps:

```bash
TALKORA_AI_CHECKOUT=/path/to/talkora-ai-private \
TALKORA_TEST_PYTHON=/path/to/python \
node backend/scripts/verify-class1-teaching-wire.mjs
```

`TALKORA_TEACHING_WIRE_REPORT` optionally selects a JSON report path. This wire
check passed all 16 scenes locally; contexts were 805–1,292 characters for its
synthetic inputs. It tests protocol/teaching behavior, not microphone, Sarvam,
real Qwen inference, Azure sound, production deployment or school-network speed.
The actual Mongo fixture uses the normal intro endpoints and advances only its
disposable test clock; no runtime skip/bypass exists.

## Review, rollout and rollback

The optional contract is backward compatible: new Python accepts old Node
requests, and old Python ignores the extra field while retaining the existing
root context. Roll out the reviewed Python consumer before the Node producer to
activate the new data/support behavior. Validate both actual deployed revisions;
do not substitute the obsolete `qwen-service`. No deployment occurred here.

Review the new shared coaching wording with educators/native speakers and run
the real physical mic → Sarvam → Node/Python → Azure → speaker → saved progress
and next-PIN resume acceptance before a school release. Confirm the actual
book/edition and rights/media approvals. Existing intro, PIN, private audio,
signed ACK, idempotency, KG6–10 and unapproved Class 1 gates remain required.

Rollback the application/AI code changes as reviewed; the new optional packet can
be removed without rewriting old progress. Source metadata on a future draft
does not grant access and may remain harmlessly present. There is no database,
index, curriculum or audio rollback operation in this batch.

Next: educator-reviewed lesson data packs using the same contract, followed by
full speech timing on real devices. Broader grade support remains explicitly
disabled until its source mapping, teaching policy and release checks exist.

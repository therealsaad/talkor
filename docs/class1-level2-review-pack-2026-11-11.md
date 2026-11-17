# Class 1 Level 2 source-bound curriculum review pack

## What this batch delivers

`backend/src/curriculum/review-packs/g01-l02.json` is a reproducible review
projection of the **existing** Class 1 Level 2 authoring. It preserves all 30
staff-preview activity IDs and their order: five model-led chapter practices,
six supplementary reviews, and 19 individually numbered educator checkpoints.
It does not create new educational content or enable a student lesson.

The five practices carry the existing English target/model/question/retry,
English/Hindi/Marathi hints, stable model-line IDs, the original preview rubric
and the separate narrated-step evidence description. The 19 numbered exercises
retain their human-review rubrics. Writing, tracing, movement, peer work,
dictation and literary performance cannot be completed by five spoken words.

The reusable review schema supports canonical grade/level addresses and strict,
bounded data. A valid address is **not** evidence that its grade is implemented,
that its source is approved, or that any of the 110 levels may be published.
The live Node/Python contract remains restricted to its existing authored scope.

## Read-only findings

| Finding | Evidence and impact | Implemented response |
| --- | --- | --- |
| Level 2 has substantial authoring, but no validated transport pack | The real source contains five bilingual model scenes, six reviews and all 19 numbered tasks. Moving only the five models into AI context would lose workbook and educator evidence requirements. | Export all 30 from the original data; distinguish model practice, supplementary practice and human-only checkpoints. |
| A hand-maintained duplicate can drift from the staff preview | Models, numbered tasks, preview composition, source mapping and release flags live in separate TS files. | Read the existing AST audit, hash five canonical sources, verify the exact composition and compare the checked-in pack with a fresh projection in CI. |
| Duplicate object flags can mislead the existing source audit | Property lookup previously chose the first matching key. A later duplicate could give JavaScript a different value. | Reject duplicate selected properties and ambiguous literal objects; test false/true publication flag duplicates. |
| Local production-404 probe can hang on sandbox interface restrictions | Default Next startup hit `uv_interface_addresses`; curl had no request timeout. | Bind only the owned loopback server and bound curl requests; retain both exact 404 assertions. |

These are code-path, local-tool and regression findings. No real student,
production database, paid speech provider or physical hearing was tested.

## Source and approval truth

The pack carries the repository's existing English Balbharati Standard One
reference and chapter starts 1.2/2, 1.3/3, 1.4/5, 1.5/7 and 1.6/8. Their
numbered task counts remain 3, 3, 4, 3 and 6. The existing official reference is
<https://ebooks.ebalbharati.in/pdfs/103050001.pdf>.

This run could not re-read the official PDF because retrieval exceeded the
tool's content-size limit (12,852,103 bytes). No new edition or page verification
is claimed. The original book label is retained, separate edition is null and
`source.reviewStatus` remains `UNVERIFIED_FOR_RELEASE`. Educators must compare
the school's actual edition and every exercise before release.

Every activity has `approved:false`. The envelope requires
`status:DRAFT_REVIEW_ONLY`, `studentPlayable:false`, `syllabusVerified:false`
and pending/locked educator, language, media, runtime, physical-voice and
publication gates. It cannot carry XP, grading rules, learner records or
completion authority. There are no invented image/audio URLs or approval flags.
No installed or published Mongo records are inferred from a source-only report.

## Reproduction and authoring workflow

Use the existing pinned dependencies. The exporter reads TypeScript **as data**;
it does not import, evaluate or execute the authored TS. The same reader uses
the existing TypeScript dependency installed by either the frontend or backend
CI job. It rejects expressions, calls, getters, spreads in literal data, unsafe
keys, duplicate declarations/properties and non-finite values.

```bash
cd backend
pnpm build
node scripts/class1-level2-review-pack.mjs --check
# Review current data without writing anything:
node scripts/class1-level2-review-pack.mjs --print
```

The CLI accepts no database, service URL, apply, publish or approval option.
To propose a content edit, change the canonical authoring source first and
review it. Explicitly redirect `--print` to the review JSON on the feature
branch, then run `--check` and the tests. Editing only the JSON cannot silently
change a question, drop an exercise or invent a source digest: CI rejects the
stale projection. Source fingerprints normalize Windows CRLF to LF while
preserving real wording changes.

The format is reusable for later review packs. Each new grade/level still needs
its own actual source mapping, complete exercise audit, reviewed content/media,
runtime integration and classroom acceptance. This batch contains one Level 2
review pack; it is not a completed KG–Class 10 curriculum or a new importer.

## Verification

- Schema regressions cover false approvals/publication, incorrect addresses,
  missing/duplicate numbered tasks, human-review boundaries, malformed models,
  missing languages, whole-word targets, unsafe sources and oversized data.
- Exporter/CLI regressions cover all 30 exact records, stale prompts/digests,
  removed tasks, Windows line endings and refusal of mutation arguments.
- AST regressions prove authored expressions are never executed, duplicate
  flags are rejected and backend-only dependency resolution works.
- Existing Level 2, runtime/publishing, intro, PIN, protected audio, progression,
  build and Chromium checks remain in the repository workflow. New pack checks
  use Bash failure propagation in the local runner as well as GitHub CI.

The machine-readable source-only result is
[`evidence/class1-level2-review-pack-2026-11-11.json`](evidence/class1-level2-review-pack-2026-11-11.json).
Final executed checks, skips and GitHub results are recorded in the PR.

## Speech timing audit and remaining pilot gates

KG1–5 already expose the opt-in latency report button. The shared Class 1 player
has recording timestamps and development TTS request/play logs, but this audit
did not find a complete production-build Class 1 recording-stop → STT →
authorized AI turn → TTS/download → playback-start report. Do not infer live
mouth-to-speaker p50/p95 from this pack, the build time or synthetic requests.
Playback-start events would still not prove physical hearing.

The next performance batch should reuse the existing private, opt-in telemetry
for Class 1 and collect no PINs, tokens, names, transcripts or raw audio. A
supervised real microphone/speaker session, provider timing, login switching,
next-visit resume and educator approval remain release requirements.

No frontend lesson UI, Miss Julie asset, provider, runtime curriculum, progress,
authorization, student login or playback gate changed here. PRs #117, #133,
#134 and #135 were audited separately and their changes are not included.
KG6–10 and unapproved Class 1 material gain no access from this pack.

Rollback by reverting these offline tools/data and CI changes through review.
No migration, database rollback, progress rewrite, S3 operation, publication or
deployment is part of this batch.

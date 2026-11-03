# Staff curriculum explorer: KG–Class 10

The school and teacher portals now share a read-only curriculum explorer at `/school/curriculum-map`. It replaces the old map, class-detail preview, level-studio preview and KG preview route presentations. Student lesson engines and their guards remain separate.

## What teachers can inspect

- All 110 existing curriculum addresses, using a KG–Class 10 or all-classes filter.
- Search by level, chapter, objective or activity, plus the existing Class 1 unit assignments.
- A level map, chapter/exercise coverage, original authored activities and editorial suggestions.
- Live lesson records and their activities through the existing authenticated GET APIs. Source metadata and live publication are shown separately; a failed/forbidden request does not become a published state.
- A controlled Miss Julie teaching-flow simulation: model, listen, support/silence, retry, practice, teacher sign-off, then inspect the next level. English, Hindi and Marathi hints are scripted; no speech recording, AI inference or student assessment runs here.
- Local planning decisions/notes and an export of the visible plan review. These are isolated by school and staff account in the browser, not shared approvals.

School context comes from the authenticated account. The selector does not invent an all-schools permission or expose another school's records. The existing backend restriction on teachers reading KG live planning records remains enforced; the local KG catalog can still be inspected with live availability explicitly unavailable.

## Coverage and source limitations

The existing Class 1 draft already assigns **44 chapters across ten levels**. The explorer preserves that full-year distribution:

| Talkora level | Existing textbook assignment |
| --- | --- |
| 1 | 1.1 My First Day, alongside existing foundation activities |
| 2 | 1.2–1.6 |
| 3 | 1.7–1.10 |
| 4 | 2.1–2.4 |
| 5 | 2.5–2.8 |
| 6 | 2.9–2.12 |
| 7 | 3.1–3.5 |
| 8 | 3.6–3.11 |
| 9 | 4.1–4.6 |
| 10 | 4.7–4.11 |

The Unit One prototype's one-chapter-per-level proposal is **not** applied to the repository's curriculum. Its read-only exercise audit is attached to the existing chapter assignments: 2 numbered activities in Level 1, 19 in Level 2 and 14 in Level 3, totaling 35. This retains the rainbow lesson's articles, the name lesson's cap-making/peer task, writing, tracing, movement and other teacher-led work.

Class 1 Units Two–Four retain their chapter titles, page references, prompts and evidence criteria; their complete numbered-exercise audits are pending. KG and Classes 2–10 retain their own metadata and drafts. Empty chapter sources or activity arrays are shown as gaps, not filled with invented or supposedly verified syllabus content.

An explicit review note flags the existing Class 1 1.5 draft's `sh` model against the textbook's vowel focus. The explorer does not silently rewrite that original prompt or mark it approved.

## Reusable implementation

`client/features/curriculum-explorer/` owns the presentation and read-only adapters:

- `plan-loaders.ts`: lazy imports of configuration/activity metadata only; never imports a `LevelExperience` engine. Tests compare all 110 IDs with the canonical registry.
- `model.ts`: filters, source mapping, role checks, route validation and scoped review parsing.
- `LevelMap`, `LevelDetail`, `CoverageView`, `SchoolLessonRecords`, `PlanReview`: reusable inspection components.
- `TeachingPreview`, `teaching-flow.ts`, `JulieAvatar`: deterministic staff-controlled rehearsal. The existing approved Miss Julie animation paths are reused, with an illustrated fallback when assets are unavailable and reduced-motion support.
- `CurriculumExplorer`: loading, recoverable errors, stale-request guards, bounded deep links and existing school services.

Legacy routes remain addressable:

| URL | New behavior |
| --- | --- |
| `/school/curriculum-map?grade=1&level=2&view=coverage&unit=1` | Filtered shared explorer |
| `/school/curriculum-studio/[grade]/[level]` | That level's teaching preview |
| `/school/classes/[id]` | Resolve the existing authorized class and inspect its grade |
| `/school/kg-preview` | KG level map |
| `/school/kg-preview/level-1` through `level-5` | Corresponding KG teaching preview |
| Existing KG level 2/3/5 letter URLs | Validate the letter and select its authored sample when present |

The development-only `/classroom-preview` gate is untouched. No migrations, seeding, publication calls, progress writes, or changes to the 110 configurations/activities are part of this change.

## Validation and review

Run the same dependency-free structural checks as CI from the repository root:

```sh
node --test tools/tests/staff-preview-boundaries.test.cjs
node tools/verify-110-levels.cjs
```

The verifier follows the studio wrapper into the shared educator component and checks its live GET/response identity and read-only boundaries. All 110 server/frontend design-theme comparisons and the existing student/publication/media guards remain in the full structure check.

Run from `client/`:

```sh
node --test tests/curriculum-explorer.test.mjs tests/lesson-registry.test.mjs tests/frontend-safety-contract.test.mjs tests/ui/school-curriculum-map-page.test.mjs
pnpm exec tsc --noEmit --incremental false
pnpm build
```

The expanded regression run also covers auth hydration, school classes, the development-only preview gate, KG3 retry/video/submission logic, KG completed-level revision, KG–Class 10 sequential resume, existing Class 1 chapter coverage and the Class 1 voice-runtime contracts. No live school database or paid speech provider is needed for these checks.

The shared explorer, registry, frontend boundary, and map contracts also run in the existing frontend GitHub Actions job.

The structure job also runs negative regression cases for the shared staff boundary. Its full verifier follows the new shared component rather than expecting removed page-local API calls. Activity inventory checks compare against the imported source catalog, so new KG6–10 or Class 1 Level 2 authored drafts remain visible without a stale fixed total.

Browser verification of the integrated staff page remains incomplete: the available preview returned the unchanged educator loading screen and did not execute the existing login form's client interaction. Throwaway fixture/configuration files were removed, and no test sign-in mechanism is included in the change. Before merging, inspect the teacher and school portal flows in the normal app environment, including a class switch during an in-flight request, storage reload, a denied KG request for a teacher, and an ordinary student being redirected away.

# Frontend Test Matrix

## Existing coverage

| Area | Existing tests | Runtime evidence |
| --- | --- | --- |
| PIN hydration and lab storage | `client/tests/ui/auth-hydration-contract.test.mjs` | Static source contract |
| PIN/storage/resume guards | `client/tests/frontend-safety-contract.test.mjs` | Node tests |
| 110-level registry and draft gating | `client/tests/lesson-registry.test.mjs` | Node plus TypeScript evaluation |
| KG speech runtime | `client/tests/kg-speech-runtime.test.mjs`, `kg-voice-fallback.unit.test.mjs` | Node source/runtime contracts |
| Real KG speech browser flow | `client/tests/kg-speech-browser.test.mjs` | Puppeteer; requires app server/browser |
| KG lesson flow and registry | `client/tests/kg-level*.test.mjs`, `ui/kg-pilot-experience.test.mjs` | Node source contracts |
| Class 1 presentation | `client/tests/ui/class1-*.test.mjs` | Node source contracts |
| Student enrollment | `client/tests/ui/student-enrollment-modal.test.mjs` | Node source contracts |

## Authentication and session matrix

| Case | Desired assertion | Status |
| --- | --- | --- |
| Valid five-digit PIN | exactly five digits reaches PIN login | Covered |
| Invalid PIN | generic retry error, stored PIN cleared | Proposed browser test |
| Shared-computer persistence | token and profile in `sessionStorage`, not persistent student storage | Covered |
| Idle session expiry | voice stops, logout runs, redirects to login | Static source contract |
| Refresh with cached session | restore then validate `/auth/me`; no hydration mismatch | Covered |
| Unauthorized response | client clears session and emits invalidation | Covered partially |
| Student information exposure | login contains no roster or student identity in URL | No browser verification yet |

## Curriculum and progress matrix

| Case | Desired assertion | Status |
| --- | --- | --- |
| Correct grade | resume uses authenticated `student.grade` | Static server-authoritative contract |
| Published curriculum | current/published response controls resume | Endpoint source covered |
| Current lesson | `/students/me/next-lesson` supplies lesson ID | Covered |
| Completed lesson remains completed | backend progress is reused after refresh | Backend-dependent test needed |
| Locked lesson bypass | registry and backend reject draft/unlocked address | Registry covered; backend authorization needed |
| Progress persistence | successful attempt appears after refresh | Backend integration required |
| Refresh completion | refresh does not manufacture completion | Integration required |
| Missing curriculum | recoverable message shown | Browser integration required |
| Frontend authorization independence | UI never determines mastery or unlocks | Static boundary plus backend integration needed |

## Miss Julie speech matrix

| Case | Desired assertion | Status |
| --- | --- | --- |
| Audio starts | playback resolves on actual completion, not narration start | Runtime/source covered |
| Listening state | microphone state and UI agree | Runtime/source covered |
| Permission denial | capture never starts; retryable feedback | Browser and source planned/partial |
| Silence | silence does not advance or count correct | Runtime/source covered |
| Azure/backend failure | retryable recovery UI appears | Browser integration required |
| Duplicate request | one in-flight submission and one progress update | Runtime/source covered partially |
| Rapid clicking | lesson state cannot advance or submit twice | Runtime/source covered partially |
| Temporary failure | original submission is retained and manually retryable | Browser integration required |

## Lesson presentation matrix

| Case | Desired assertion | Status |
| --- | --- | --- |
| KG Level 1 intro gate | real mandatory video completes before lesson | Covered by existing source contracts, owner-owned behavior |
| No unauthorized skip | no in-app close/skip bypass | Existing source contract |
| Fullscreen | fullscreen request follows user action and survives required transitions where implemented | Existing source contract |
| Visual skip cannot complete | server lesson evidence controls completion | Integration required |
| Class 1 Level 1 | immersive route remains functional | Existing source contract |
| Level map | 110 canonical addresses load into isolated workspaces | Covered |

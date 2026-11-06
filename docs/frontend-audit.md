# Frontend Audit

Date: 2026-10-31

## Verified repository and runtime

- Repository remote: `https://github.com/therealsaad/talkor.git`
- QA branch: `feature/ai-frontend-qa`
- Frontend: Next.js 16.3.0, React 19, TypeScript 5.7.3, pnpm 10.18.0.
- Routing: Next.js App Router under `client/app`.
- Verification: `client/package.json`; repository and branch inspected locally.

## Confirmed frontend areas

1. **Authentication:** `/login/student` provides a five-digit PIN keypad. PIN sessions use `sessionStorage`; staff sessions use persistent storage. The auth provider restores cached state only after hydration and validates it with `/auth/me`.
2. **Shared-computer safety:** student activity times out after 20 minutes, stops voice, logs out, and redirects to student login.
3. **Resume and dashboard:** `/student/continue` asks the backend for the next lesson. KG grade 0 resumes directly through `/student/kg`; other grades are routed to lesson IDs returned by the backend.
4. **Level maps:** canonical grade/level routing covers 110 addresses (`g00-l01` through `g10-l10`) in `client/features/lessons/registry.ts`.
5. **Student curriculum and progress:** `curriculumService` calls `/students/me/curriculum`, `/students/me/curriculum/current`, and `/students/me/next-lesson`; `progressService` calls `/students/me/progress`.
6. **Lessons:** KG Level 1 uses the registered canonical workspace and has dedicated lesson UI. Class 1 Level 1 has a dedicated immersive implementation and voice integration.
7. **Miss Julie:** student and shared character components exist in `client/components/miss-julie` and `client/components/student/miss-julie`. Lesson UI includes conversation, feedback, and microphone components.
8. **Speech:** frontend voice services integrate backend speech APIs and include retry/cancellation handling. Browser tests separate mocked orchestration from hardware validation.
9. **Lesson gating:** the frontend registry rejects unapproved student workspaces when `studentPlayable`, `editorialStatus`, or `staffOnlyPreview` is not valid.
10. **Tests:** the frontend primarily uses `node:test` source-contract tests plus Puppeteer browser tests and targeted service/runtime tests. No React Testing Library stack is declared.

## Scripts and build configuration

Confirmed scripts include development, production build/start, ESLint, and targeted Node test commands. A new `test:frontend-safety` script runs the isolated Sprint 1 safety contracts.

ESLint and Next build configuration are present through the workspace scripts and Next configuration. No Jest or Playwright dependency is installed; the existing Node/Puppeteer approach is retained.

## Top risks

1. Browser tests require a running Next.js server and installed browser environment.
2. Several static contract tests describe implementation details and will become stale when an owning UI is intentionally refactored.
3. Real microphone permissions, audio output, speech recognition, and Azure availability are hardware/environment dependent and not proven by source-contract tests.
4. Broad source tests are split across overlapping filenames; duplicate old suites may encode different assumptions.
5. The current full frontend suite has stale expectations for at least the KG preview and some Class 1 routes, requiring owner review rather than blind test rewrites.
6. Frontend route guards do not replace backend authorization; this boundary must remain explicit in integration tests.
7. Network and session expiry recovery need browser-level validation beyond static contracts.
8. Dynamic lesson imports provide code splitting, but actual bundle and asset measurements are not yet established.
9. Several large lesson assets and animations may affect school laptops; performance claims should wait for measured Lighthouse/Next build evidence.
10. Accessibility ownership remains Antigravity UI code; QA should report defects without changing the design.

## Assumptions and unverified claims

- Backend route availability was inspected in frontend source but not exercised against a deployed environment.
- The effective Azure speech provider, credentials, and backend deployment configuration were not verified.
- Desktop/mobile rendering and actual contrast were not measured with a browser in this audit.
- Build and lint results are reported separately only after execution.

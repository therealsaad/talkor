# Frontend QA Report

Date: 2026-10-31

## Commands and actual results

Representative QA run:

```text
pnpm exec node --test tests/ui/auth-hydration-contract.test.mjs tests/lesson-registry.test.mjs tests/kg-speech-runtime.test.mjs
16 tests passed, 0 failed.
```

New isolated contract:

```text
pnpm test:frontend-safety
3 tests passed, 0 failed.
```

Broad frontend Node suite:

```text
pnpm exec node --test tests/*.test.mjs tests/ui/*.test.mjs
153 tests run; 139 passed; 14 failed.
```

The failures included:

- 2 stale KG preview source-contract expectations for removed `KGAlphabetMap preview previewDashboard` text.
- 8 Puppeteer browser cases blocked because Next.js was not running at `http://localhost:3000`.
- 4 additional stale presentation/preview expectations in existing Class 1/KG source-contract suites. These require ownership review before changing tests or UI.

No claim is made that the frontend passed end-to-end. Browser tests were not executable with the app server stopped.

## Build and lint status

- `pnpm build` completed successfully: production compilation, TypeScript, page-data collection, and 48 static pages completed.
- `pnpm lint` is currently blocked because `eslint` is not available on PATH and the workspace has no installed ESLint package/command in this checkout. This is a tooling configuration gap, not an ESLint result.
- Do not interpret "lint not available" as "lint passed."
- Actual hardware microphone and Azure Speech validation were not performed.
- Deployed backend routes were not exercised in this audit.

## Accessibility findings

Static findings that should be validated in a browser:

1. **Medium:** Confirm visible keyboard focus and target sizes for the PIN keypad and lesson microphone controls on school laptops.
2. **Medium:** Verify visible focus after route redirects and dialogs, especially login, lesson failure, and permission-denied states.
3. **Medium:** Confirm speaking/listening status has non-color cues and is announced with appropriate live-region semantics.
4. **Medium:** Audit reduced-motion behavior against animations and audio narration transitions.
5. **Low:** Verify the young-student PIN interface remains understandable when audio, sound, or animation is unavailable.
6. **Low:** Verify error messages are concise, read in logical order, and do not depend on decorative text.

No production UI was changed.

## Performance findings

- Dynamic lesson imports are present and are a positive boundary for code splitting.
- Actual bundle sizes, hydration timing, long tasks, network waterfalls, and memory usage are not measured.
- Browser audio tests require a server and must additionally run hardware validation before audio-memory conclusions can be made.
- Avoid performance numbers until build output and browser profiling are captured.

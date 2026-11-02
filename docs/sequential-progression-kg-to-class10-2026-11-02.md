# Talkora sequential progression — KG to Class 10 (November 2, 2026)

## Product rule (all 110 planned addresses)

For each student's **real grade**, the server decides the next **playable** lesson. Completing a level, including the last required spoken task and its persisted feedback, advances directly to the next playable level when it exists. A new student PIN login calls `/student/continue`, which derives the first unfinished lesson from MongoDB rather than from localStorage, a user-selected level, or a bookmarked URL. Where content is missing, draft, or still awaiting approval, preserve progress and show a clear waiting state; do **not** auto-unlock a placeholder.

## KG

- KG1 ABCD: complete progress unlocks student KG2; the current mandatory intro and feedback receipts remain intact.
- KG2 E–J: final correct J is committed only after the signed Miss Julie voice feedback receipt. The UI routes to `/student/continue` instead of staying at stone 2.
- KG3 K–P, KG4 Q–V and KG5 W–Z: a single **opted-in student pilot continuation** API `/api/kg-continuation/:level` derives its stage from real saved MongoDB progress, with per-student indexed cursors and immutable attempts; it requires the prior completed level before entering a new level. Full-screen introductory video, Azure TTS with Priya fallback, Sarvam-ready microphone/STT, strict server grading, after-playback feedback receipt, reload recovery and race-resistant advancement apply to each stage.
- KG map: stones 3–5 show status CURRENT/COMPLETED based on the server overview. Direct URL tricks do not unlock the next level.
- KG Levels 6–10 are **NOT student-ready**: their workspaces are draft/editorial, with unverified activities/content. They remain locked until approved real lessons are authored. Never promise a student can play levels without teachable content. The continuation engine deliberately accepts only the explicitly defined student pilot levels 3–5.
- The staff preview lesson registry and preview endpoints remain staff-only; the student pilot is a separate runtime. Grade 0 pilot authorization is still a precondition. This is not automatic academic approval of the draft syllabus.

## Classes 1–10

- The existing MongoDB `ProgressService.ensureProgress` provides one student grade-authoritative record, level completion and the next published unlock. It now **stops at a missing/unpublished level number**, so a published Level 4 cannot become available while Level 3 is draft.
- `ProgressService.assertLevelAccessible` no longer auto-unlocks a locked level. This also blocks direct attempt submission, URL deep links, and other backend API shortcuts. `StudentLessonFastService.lesson` uses that guard before loading activities, rather than silently creating/unlocking the requested level.
- Published lessons containing zero required active activities cannot count as mastered; verified historical completion timestamps remain preserved.
- `StudentLessonFastService.next` returns the next unfinished, actually accessible published lesson, or `blocked:true` if a remaining level is locked/unready, rather than announcing the entire class completed. The login resume route shows an understandable wait message in that case. All grade and level decisions are server owned.

## Verification

- `backend/tests/integration/kgContinuationSequence.test.ts`: real disposable MongoDB/Express KG2→KG3→KG4→KG5, mandatory intro, spoof-resistant permission, mocked STT/Azure feedback, signed voice receipt, no premature unlock or duplicated progress, next-login reload and Level 6 still locked.
- `backend/tests/integration/sequential110Levels.test.ts`: all ten grade values Class 1–10, real published 1→2, locked deep link and direct attempt rejection, draft Level 3 gap, published Level 4 still locked, server next-lesson and no empty-activity mastery.
- `client/tests/ui/grade0-to10-sequential-resume.test.mjs`: route and session-bound UI contract.
- GitHub Actions gates all three tests and verifies Next.js + backend TypeScript builds.

## School rollout warning

Automated tests **mock real microphone, STT and TTS providers**; they do not prove video quality, Azure audio on school laptops, Sarvam STT performance, usability with real KG pupils, or educator sign-off. Keep these new KG3–5 pilots restricted to explicitly enabled KG students until review. Video fullscreen is best-effort browser fullscreen; operating-system kiosk controls require managed devices. Finishing an intro video is client-observed plus minimum server elapsed time, not tamper-proof video-attention attestation.

**Do not mark the entire 110-level curriculum published**: draft status is meaningful and protects students from empty lessons.

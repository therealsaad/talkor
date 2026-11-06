# KG Level 1 → Level 2 student progression (2 November 2026)

## Previously broken

The genuine student screenshot showed Level 1 finished (100 XP, three stars, checked-in homework) but Level 2 remained padlocked. This was not caused by missing Mongo progress: the backend deliberately advertised `level2Available:false`, the client map locked Levels 2–10 unconditionally, and the PIN resume page always opened Level 1. The existing E–J Level 2 workspace was strictly a staff-only preview with transient attempts.

## New student pilot (keeps staff preview separate)

- **Level 1 → Level 2:** after the final Level 1 spoken homework plays, the client navigates directly to `/student/kg/level-2`. The server reports Level 2 available only after authoritative Level 1 `currentIndex === 8`; optional Level 1 homework check-in does **not** postpone learning.
- **After each new five-digit PIN login:** the existing login routes to `/student/continue`, which now fetches authenticated KG Level 1 state and Level 2 state. It loads the earliest unfinished level: `/student/kg` until Level 1 is complete, then `/student/kg/level-2` until Level 2 is complete; afterwards the garden map is shown. No localStorage/sessionStorage or user-supplied level number decides progress.
- **Map:** stone 2 unlocks as soon as the server says KG Level 1 complete. The map separately fetches persisted Level 2 progress and marks stone 2 complete only after all six letters E–J have been acknowledged. Stones 3–10 remain unavailable.
- **Level 2 teaching:** a new real student-only backend `/api/kg-level2` and frontend player sit alongside (not inside) the old `/school/kg-preview/level-2` workspace. Staff preview endpoints stay inaccessible to students. E–J lesson uses existing artwork, full-size intro video and server-authored Azure narration, automatic recorded speech, server-side grading, short Azure feedback (Priya fallback), and retry/resume.
- **Durability and anti-cheat:** new `KGLevel2Progress` and `KGLevel2Attempt` store server-authoritative currentIndex, intro ticket, immutable feedback, and acknowledgement timestamp. **Only** a correct response with a verified receipt from generated audio can progress E→F→G→H→I→J. Each step advances atomically once. Unfinished audio feedback is returned on reload without calling STT a second time. Student recordings are **not stored**. Every new learning visit requires a fresh server intro ticket; the full-video gate is present in the frontend, with a minimum elapsed server check.
- **Progress is school- and student-bound.** The existing KG alphabet student pilot authorization applies to Level 2 as well; teacher/school preview accounts cannot write student progress. Server rejects forged letters and bypassed intro.

## Validation

- `backend/tests/integration/kgLevel2StudentJourney.test.ts` exercises actual Express and disposable MongoDB: locked before Level 1 completion, unlocked after, video gate, forbidden staff preview, silent response, receipt-only progression, duplicate attempts, next-session saved progress and final J completion.
- `client/tests/ui/kg-level2-auto-resume.test.mjs` checks student PIN routing and the separation of staff preview, voice receipt and server-owned progress.
- Both tests are required by `.github/workflows/talkora-110-level-checks.yml`; backend TypeScript and frontend Next.js builds must pass.

## Remaining school release gates

This is a **student-pilot upgrade**, not a claim that the unverified editorial E–J curriculum workspace has been academically published. The staff E–J preview `config.studentPlayable` remains false and `syllabusVerified` remains false. Before broader deployment, obtain educator approval for the E–J sequence and teaching script; test actual intro video duration, audio playback/voice quality, and real microphones on target school-lab devices.

The introduction video has browser best-effort fullscreen and a server timing gate, but browsers cannot guarantee OS-level kiosk lockdown or prove the exact pixels watched. Students can still exit browser fullscreen with OS controls. The server prevents jumping directly into the speaking lesson without a valid intro ticket, but the client video-ended event itself cannot constitute cryptographic proof of video consumption.

No guarantee that network failures always resolve within one second. The transition starts immediately after completed homework audio and the next-level route loads as soon as network/media are ready.

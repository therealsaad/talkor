# Sprint 3.5 — KG PIN-to-homework pilot acceptance

**Status:** synthetic backend acceptance plus a separate human-operated, consented real-device pilot. A green CI job is not a real student test.

## Automated gate

backend/tests/integration/kgFullPilotJourney.test.ts uses Express/Supertest with a disposable MongoDB instance. It creates two synthetic, non-identifying KG students in a test school and uses the actual five-digit PIN authentication route. Real backend grading, session, receipt and homework code runs. **Sarvam, Priya, S3 and Azure are mocked** with fixed synthetic responses and bytes.

The suite checks:
- Exactly five-digit PIN login, invalid PIN denial, Grade 0 access, and no PIN/hash in the returned student profile
- The pre-intro answer gate and minimum-video-duration rejection (time is advanced only in the disposable Mongo fixture)
- Reviewed static S3 narration and local Priya prompt route
- Silence without speaking mastery, four correct independent English words, then four server-graded picture activities
- Progress remains unchanged until signed voice receipt acknowledgment; missing/tampered receipts and repeat ACKs cannot grant mastery
- Another student cannot fetch or ACK these responses, and forged student IDs/verdicts cannot change the grade
- Final 100 XP, 3 stars, one pending homework and an idempotent homework check-in
- Logout invalidates the student JWT **and any active KG intro tickets**. A new PIN login must complete a new intro
- No raw child audio is persisted in attempt rows; the test uses no real children or production database

**Not established:** an actual video watched, browser playback, microphone permission, genuine child speech, Sarvam accuracy, Qwen GPU latency, real Azure/Priya quality, internet disruptions, or managed kiosk behavior. Synthetic audio bytes are not asserted to be playable.

## Local or CI verification

From backend:

    pnpm install --frozen-lockfile
    pnpm run build
    pnpm exec jest --runInBand tests/integration/kgFullPilotJourney.test.ts

mongodb-memory-server may need a one-time MongoDB binary download. Run only on a disposable test runner. No cloud credentials or live school accounts are required.

## Physical school pilot: operator checklist

**Preflight:** authorized pilot students and written consent; teacher supervision; correct browser/kiosk mode; actual speaker/headset and microphone; working Sarvam, Qwen, Azure, Priya, and signed S3 assets. Do not save minors' voices or PINs in acceptance logs.

| Stage | Human acceptance condition | Result |
|---|---|---|
| PIN | Only the correct 5-digit PIN works, no prior student's state shown | Unverified |
| Intro | Full 63-second film audible and non-skippable inside the app | Unverified |
| First lesson | Miss Julie's narration matches the board and student sees pictures | Unverified |
| Speaking A-D | Sarvam correctly distinguishes independently spoken English words | Unverified |
| Hindi/Marathi | Bilingual scaffolding helps without awarding false speaking mastery | Unverified |
| Wrong word/silence | Safe, encouraging retry without premature progress | Unverified |
| TTS feedback | Correct voice, exact saved sentence, no clipping or overlapping audio | Unverified |
| ACK | Progress saves only after actual feedback playback ends | Unverified |
| Interruption | Offline/reload after grading recovers the same attempt after fresh intro | Unverified |
| Outages | Each provider can fail independently without awarding false completion | Unverified |
| Picture puzzle | All four picture choices are server-graded | Unverified |
| Homework | Completion, 100 XP/3 stars, spoken homework and one check-in | Unverified |
| Shared lab | Logout revokes JWT and intro ticket; different student starts clean | Unverified |
| Timing | Record measured STT/TTS/whole-turn p50 and p95; do not guess | Unverified |

### Evidence and release decision

Capture only test date, anonymized workstation ID, deployed commit SHA, provider/model versions, sanitized measured timings, pass/fail status, and supervising teacher sign-off. Do not include a student name, PIN, transcript, recording, auth token, full voice receipt, or school credentials in shared reports.

**NO-GO** if the real audio, intro or PIN isolation checks fail. Green CI verifies code behavior with mocked providers and a disposable database, not a full classroom. Deploy frontend/backend together with rollback; human approval is mandatory.

# Real KG live session + turn-by-turn latency gate (3 Nov 2026)

**Status: NOT VERIFIED ON A REAL CLASSROOM DEVICE.** This is an executable acceptance process, not a declaration that the real student spoke or that Miss Julie was audible. Automation cannot see a physical school-lab mic, hear headphones, know a child's consent status, or simulate next-day attendance. **No demo PIN, JWT, child recording or transcript belongs in GitHub or a shared report.**

## What the code measures

KG1–KG5 authenticated student *attempt* responses now emit privacy-bounded `KG turn timing` JSON lines for the attempt and the feedback-audio request, keyed only by an opaque random submission ID, with `stt`, `save`, `tts` and request `total` timing in milliseconds. KG1 additionally measures Qwen/guided feedback. KG2–5 use deterministic first-party grading and do not count fictional Qwen calls.

`scripts/report-kg-turn-latency.mjs` pairs the attempt + audio request by that random ID and reports p50/p95, count, missing pairs and cache/Qwen shares. It outputs **aggregates only**, never the input IDs or spoken words. It rejects a low sample count or a slow p95 with a nonzero exit code.

**Important:** The calculated `serverRequestSum.p95Ms` is two HTTP server request durations added together. It **does not measure end-to-end mouth-to-ear latency**: browser recording, silence timeout, transit time, network download and actual audio playback are additional. Record observed mouth-to-first-audible-reply timing during the supervised physical test.

## Operator steps, Windows PowerShell

First pull the branch after review/merge and restart BOTH backend and frontend. Use only an *authorized fixture student*, never paste its PIN:

```powershell
cd "D:\talkor\talkor\backend"
$env:KG_TURN_TIMING_LOG = "true"
$env:KG_SLOW_TURN_MS = "2500"
$env:TALKORA_E2E_STUDENT_PIN = Read-Host "Private KG fixture PIN"
node .\scripts\accept-kg-live-session.mjs --phase=before --report="D:\private\kg-before.json"
```

The normal acceptance CLI PIN login intentionally invalidates the prior lesson's intro token. **Do not run it again while a student is playing**. Restart backend with `KG_TURN_TIMING_LOG=true` to log timing; capture stdout in a **local private folder** when launching the backend:

```powershell
cd "D:\talkor\talkor\backend"
New-Item -ItemType Directory -Force "D:\private" | Out-Null
pnpm run dev 2>&1 | Tee-Object "D:\private\kg-lab-backend.log"
```

In a separate terminal, open `http://localhost:3000/login/student` on the *real classroom PC*. Fullscreen intro must be viewed in its entirety, no skip. Let Miss Julie narrate, answer using the physical microphone (with appropriate permissions), hear *all* Azure feedback to completion, and finish KG1. Observe that the map still permits completed-level revision, but no previous activity grants duplicate XP; KG2 opens automatically after the saved final feedback receipt.

After closing the browser student session, from **a new backend terminal** run:

```powershell
cd "D:\talkor\talkor\backend"
node .\scripts\accept-kg-live-session.mjs --phase=after --expect-level=2 --expect-completed=1 --expect-index=0 --report="D:\private\kg-after.json"
node .\scripts\report-kg-turn-latency.mjs --file="D:\private\kg-lab-backend.log" --min-pairs=4 --budget-p95-ms=3500 --report="D:\private\kg-latency.json"
```

Use your student's actual next-level expectation instead of hardcoding 2 if their first unfinished level was different. For KG5 completion use `--expect-level=map` (KG6–10 remain unapproved). If a power interruption means fewer paired samples were recorded, the latency report correctly returns `INSUFFICIENT_REAL_SAMPLES` instead of claiming PASS. Browser-captured real mouth-to-first-audible-voice samples should be recorded and assessed **separately**.

On the **next real school day**, independently verify PIN login again opens the same first unfinished activity with a fresh full mandatory intro. Confirm the previous browser session is gone and no other student's progress appears. Same-day simulated re-login does not certify next-day behavior.

## Stop/GO

- No GO without teacher/guardian consent, audible voice, safe microphone permissions, full intro, accurate grade, persisted completion and fresh real PIN resume on the later visit.
- No GO if the source is an unapproved KG level or textbook, a child has to repeat an already-saved turn after crash, progress advances without a correct acknowledged response, or student data leaks into reports.
- A server p95 exceeding the configured budget is a **performance concern**, not proof audio playback failed; diagnose stt vs feedback vs tts before attempting optimizations.
- The report never calls paid APIs or claims external Qwen/Azure provider health merely because the backend returned a mocked test response.

### Repeat for Class 1

Class 1 First Day v3 has its own staff-only curriculum staging and separate live voice acceptance runbook (`docs/class1-first-day-voice-acceptance.md`). Do not publish a draft or replace existing student attempts by running migration scripts. Verify the approved introductory media, real live Sarvam/Qwen/Azure call and teacher sign-off before changing its publication gate.

# Staging load test (not run in this delivery)

Requires separately installed `k6`, a private HTTPS **staging** backend and authorized **test** student accounts, not real children's accounts. The staging database should include multiple schools, class sections, and at least the expected account count. Use distinct valid test JWTs per concurrent user.

Private token file (NEVER commit):

```json
[{"token":"short-lived-test-token","grade":0}]
```

PowerShell example:

```powershell
$env:TALKORA_LOAD_TEST_ACK='STAGING'
$env:TALKORA_STAGING_URL='https://YOUR-PRIVATE-STAGING-HOST'
$env:TALKORA_APPROVED_STAGING_URL=$env:TALKORA_STAGING_URL
$env:TALKORA_TEST_TOKENS_FILE='D:\private\staging-tokens.json'
$env:TALKORA_VUS='20'
k6 run .\tools\load\k6-talkora-lab.js
```

Ramp carefully from 20 → 100 → 500 → planned concurrent lab usage, and only toward 10,000 simultaneous users with written operator approval and cloud budgets. The script reads each student's grade-specific state/recommendation; it does not synthesize speech, open 10K microphones, provision accounts, validate lesson progression, or benchmark PDF generation. VUs are *concurrency*, not total registered accounts. Measure Mongo read pressure, 429/5xx, p95/p99, STT/TTS budgets, S3 costs and errors, JS heap, network saturation, and school isolation separately. The thresholds are starting targets, not promises.

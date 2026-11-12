# Class 1 E2E fixture in the existing MongoDB `test` database

This is **not** a production shortcut or a curriculum migration. It creates an independent, development-only school and student inside the already configured `test` database, with only that test student's first six non-AI activities marked complete. The real next-lesson resolver must then select the **seventh**, guided `CONVERSATION` activity.

The fixture is intended to verify the real Node → Sarvam STT → Python/Qwen → Azure TTS → MongoDB voice-session flow without repeatedly playing the six prerequisite activities. It does not evaluate a child's intelligence, pronunciation or syllabus mastery.

## Safety boundaries

- Run only from the existing `D:\talkor\talkor\backend`. No second repo/worktree or new MongoDB database.
- This tool **refuses** any database name except exactly `test`, any `NODE_ENV` except `development`, and any draft lesson whose activity sequence has changed.
- The default command prints a preview; **no fixture records are written**. Mongoose index writes are disabled for this CLI connection.
- `--apply` also requires an explicit `TALKORA_E2E_FIXTURE_WRITE=YES`. It inserts exactly one new school, one new student and one new Progress document. It does not update existing student, teacher, school, lesson, activity or progress records.
- It creates no ActivityAttempt records for the synthetic first-six progress. That progress is **test-only**, never educational proof or a learner report.
- Do not enable `TALKORA_CLASS1_DEMO_ALL_STUDENTS=true`. Keep authorization restricted to one student ID.
- On success the test records **remain for repeatable testing**. The script has no bulk reset/cleanup command. Review them explicitly before any future cleanup. Never run `--apply` repeatedly to reuse a fixture.
- If a create operation fails, the script attempts to roll back only the documents created in that invocation. Inspect the database if the connection fails during rollback.
- No Sarvam or Azure calls are made by the fixture script.

## Preview first (zero paid speech calls)

With the existing local `.env` loaded:

```powershell
cd D:\talkor\talkor\backend
pnpm exec tsx -r dotenv/config src/scripts/prepare-class1-e2e-fixture.ts
```

Expected `database: "test"`, `guidedActivityPosition: 7`, `existingRecordsWillBeChanged: false`. The actual count of existing documents is only diagnostic: **`test` currently contains data; it is not empty**.

Do not proceed if the DB name, step sequence or demo-authorization flags do not match. Never paste MongoDB connection strings or secret keys into chat.

## Create ONE isolated student (intentional test DB write)

After verifying the preview and ensuring your `.env` uses rotated credentials:

```powershell
$env:TALKORA_E2E_FIXTURE_WRITE = 'YES'
pnpm exec tsx -r dotenv/config src/scripts/prepare-class1-e2e-fixture.ts --apply
Remove-Item Env:TALKORA_E2E_FIXTURE_WRITE
```

The command prints a new **fixture student ID** and **fixture PIN** once. Treat both as private, and do not paste them into tickets, chat, screenshots, or Git. Store them in your local terminal/session only. The generated E2E school is separate from existing school rosters.

## Start the Node backend against the created fixture

Stop the earlier Node process (`Ctrl+C`), then in its terminal **temporarily override** the one allowed demo ID. This changes no `.env` file and does not authorize every student:

```powershell
cd D:\talkor\talkor\backend
$env:TALKORA_CLASS1_DEMO_STUDENT_ID = '<new fixture student ID>'
$env:TALKORA_CLASS1_DEMO_ALL_STUDENTS = 'false'
pnpm dev
```

Keep the existing Python/Qwen service running on port 8002. In a **second** PowerShell terminal, enter the fixture PIN privately:

```powershell
cd D:\talkor\talkor\backend
$env:TALKORA_E2E_STUDENT_PIN = Read-Host 'Private fixture student PIN'
$env:TALKORA_E2E_AUDIO_FILE = '<absolute path to your actual short .wav/.m4a recording>'
pnpm exec tsx -r dotenv/config src/scripts/check-class1-ai-bridge.ts
```

Only after the free bridge test passes, the audio file exists and consent is settled, opt in to **one** paid Sarvam STT + Azure TTS pair plus one demo progress write:

```powershell
$env:TALKORA_E2E_ALLOW_PAID_SPEECH = 'YES'
$env:TALKORA_E2E_ALLOW_PROGRESS_WRITE = 'YES'
pnpm run smoke:class1-azure-voice -- --live --commit
```

The acceptance script confirms `PASS: Node voice session -> Python/Qwen -> MongoDB progress readable`. It does **not** prove the lesson is complete or that voice playback in a real browser works; those require separate supervised checks.

### Important production restrictions

Do not deploy this fixture CLI, its generated records, unreviewed QLoRA adapter, or development demo flags as a production learning flow. A production launch still requires educator syllabus review, proper per-student spending budgets, consented pupil testing, and lab-mode/session verification. Rotate all previously disclosed credentials and the student PIN before any deployment.

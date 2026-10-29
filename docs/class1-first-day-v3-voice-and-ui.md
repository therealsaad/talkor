# First Day v3 — voice and classroom rollout

This version teaches **Balbharati English Grade One 1.1 My First Day** only. The old v2 `AM/AN/AT` activity was visible because the **development MongoDB draft still serves v2**. A code merge alone does not replace student records.

## Services and responsibilities

- `3000` Next.js: responsive landscape school storybook, approved Miss Julie animation, browser microphone
- `5000` Node: authenticated PIN, lesson access, attempts, activity/progress, Sarvam and Azure proxy
- `8002` separate Python FastAPI: Class 1 Qwen teaching, only if the Python First Day PR and its feature flags are applied
- `11434` Ollama: local Qwen model behind the Python service
- `8001` separate Python AI4Bharat/Priya: **offline batch English narration generator**, *not* the primary dynamic voice provider
- Private S3: approved immutable narration, reused by students
- Sarvam: English/Hindi/Marathi listening; Azure: dynamic personalized bilingual responses

**Run one no-charge diagnostic after updating the code in your own checkout:**

```powershell
cd D:\talkor\talkor\backend
pnpm exec tsx -r dotenv/config src/scripts/doctor-class1-first-day.ts
pnpm exec tsx -r dotenv/config src/scripts/prepare-class1-first-day-only.ts
pnpm exec tsx -r dotenv/config src/scripts/generate-class1-first-day-voices.ts --check
```

Never run `--apply` if the preview reports existing attempts/progress. Create a fresh staging student/lesson, obtain review and preserve existing history. No secret, PIN or audio payload should be pasted in issues.

## All new scripts

Source: `backend/src/scripts/class1-first-day-voice-v3.json`: 10 school scenes, 30 English/Hindi/Marathi candidates, all unreviewed. The original v2 `am/an/at` audio pack must remain intact for previous attempts.

Generate **one** English sample from local 8001 after the service is healthy:

```powershell
$env:TALKORA_FIRST_DAY_GENERATE = 'YES'
pnpm exec tsx -r dotenv/config src/scripts/generate-class1-first-day-voices.ts --generate --language en-IN --sample
```

Only after listening to the sample and confirming the voice preset, generate ten fixed English clips:

```powershell
pnpm exec tsx -r dotenv/config src/scripts/generate-class1-first-day-voices.ts --generate --language en-IN --all
Remove-Item Env:TALKORA_FIRST_DAY_GENERATE
```

**Hindi and Marathi:** ordinary dynamic child responses use the configured Azure localized voices, one request per reply. Optional static bilingual lines may instead be generated **once** for S3 reuse using the same script with `--language hi-IN` or `mr-IN`; the generator refuses any paid Azure call unless `TALKORA_FIRST_DAY_GENERATE=YES` and `TALKORA_FIRST_DAY_PAID_BATCH=YES` are explicitly set. These are **20 possible paid calls for the full bilingual batch**, not free 8001 voice. Do not perform them until teacher approval.

Then preview the uploader with the generated directory and review every recording:

```powershell
pnpm exec tsx -r dotenv/config src/scripts/upload-class1-first-day-voices.ts .\tmp\class1-first-day-v3
```

The uploader can write only in development with `TALKORA_FIRST_DAY_AUDIO_REVIEWED=YES`, `TALKORA_FIRST_DAY_S3_WRITE=YES` and `--upload`. It verifies existing private S3 checksums and never overwrites a key.

## Before replacing the old draft

1. Teacher approves all 10 English recordings and the **new** 90-second video (`class1-first-day-intro-storyboard.json`). Do not reuse the previous little-word video.
2. Preview migration read-only. It refuses any existing attempts, progress, or conversations; preserve current student data.
3. Supply the reviewed video HTTPS URL to **both** backend migration (`TALKORA_FIRST_DAY_INTRO_URL`) and frontend (`NEXT_PUBLIC_TALKORA_CLASS1_INTRO_URL`), with explicit approvals.
4. Set reviewed-audio opt-ins and verify all ten English v3 S3 objects. Only then use the guarded development `--apply` on a clean staging draft.
5. Test one student speech turn in English, Hindi and Marathi. Check that the browser actually plays speech and Qwen responds to relevant questions, not just that API health succeeds.

**Status:** UI/source/test implementation only. No audio file has been generated on the developer's Windows 8001 service and no private MongoDB or S3 mutation was performed by the GitHub changes. Never describe this as verified audible production speech before a supervised device test.

## Local 8001 returned HTTP 500 (October 29)

The old generator hardcoded `miss-julie-priya-v6`, which may not be a valid ID in the live Python environment. The fixed generator first asks **the running 8001** for `ttsVoiceId` and calls `/health` to verify the installed Indic Parler imports and local snapshots. A mismatch normally produces HTTP 422, whereas HTTP 500 points to an unhandled Python exception. Never assume an HTTP 200 from `/openapi.json` proves the model can synthesize audio.

In a fresh PowerShell terminal, with the 8001 service already running:

```powershell
$health = Invoke-RestMethod http://127.0.0.1:8001/health
$health | Select-Object ttsVoiceId,parlerImport,ttsModelAvailable,ttsModelLoaded,ttsDevice,ttsStatus,cuda,gpu
```

This is **read-only and free**. If imports/models/CUDA are unavailable, inspect the Python virtual environment, installed weights, and Windows Code Integrity logs. Windows application-control policy can block unsigned PyTorch DLLs; **do not disable enterprise security policy** to work around this. Use an authorized setup, administrator-approved runtime, or a supported Linux/Colab environment.

After applying the reviewed generator fix, retry **one** local sample, not all ten:

```powershell
$env:TALKORA_FIRST_DAY_GENERATE = 'YES'
pnpm exec tsx -r dotenv/config src/scripts/generate-class1-first-day-voices.ts --generate --language en-IN --sample
Remove-Item Env:TALKORA_FIRST_DAY_GENERATE -ErrorAction SilentlyContinue
```

If it still returns 500/503, read the **terminal running Python 8001**. The traceback—not Azure or Qwen—identifies the actual problem. Do not repeat generation in a loop or download model weights indiscriminately. Do not upload audio to S3 until you have listened to the whole WAV and obtained review.

**Separate service check:** `OFFLINE node-5000` means the Express backend was not running during the doctor command. It did not cause the failed direct 8001 TTS POST, but Node must be started for the full student session. The reviewed First Day intro URL is still missing.

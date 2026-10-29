# Class 1 Level 1 — exact voice contract (v3)

The **source of truth** is the authenticated student's currently permitted `class1-l01-v3-*` activity in MongoDB. No client can choose a different grade, scene or transcript score.

| Moment | Provider | Rule |
|---|---|---|
| Opening school story and repeated scripted lines | Priya on **8001**, approved recordings in **private S3** | Batch generate once, teacher-review, then S3 reuse. A missing v3 clip blocks teaching and must not silently invoke Azure |
| Student speaks | Sarvam STT | One mic recording, short silence detection, Hindi/Marathi/English transcript + optional language code. No pronunciation/IQ claim from text |
| Child asks about school/skip/run/walk/bell/jump/play | Python/Qwen on **8002** | The actual First Day scene and approved question constrain the answer. No silent Groq or mock substitution |
| New answer, help, correction or joke | Azure Neural TTS | Exactly one ephemeral request, female voice selected for English/Hindi/Marathi. No dynamic S3 persistence or Python-8001 fallback |
| Next story | Node/Mongo progress after authenticated browser audio-ended acknowledgment | The student must finish the turn and hear the answer. On failure the scene stays recoverable, not falsely completed |

**Preconditions:** Node 5000 + Next 3000 + Qwen Python 8002. Priya 8001 is for *preparing* fixed speech, not every dynamic turn. Ollama 11434 is used only when the Python brain is configured to use that local model. Verify 8001-generated WAVs and educator approval separately. A completed FastAPI health probe is **not proof** that Qwen generated an answer or that a speaker is audible.

## Zero-cost first

```powershell
cd D:\talkor\talkor\backend
pnpm exec tsx -r dotenv/config src/scripts/doctor-class1-first-day.ts
pnpm run smoke:class1-azure-voice -- --check
pnpm exec tsx -r dotenv/config src/scripts/prepare-class1-first-day-only.ts
```

Stop if the fixture is still v2, if the reviewed First Day intro is missing, or if the ten English S3 recordings are not approved. Do **not** overwrite the populated `test` database. The migration script intentionally refuses existing attempts and progress. A safe staging lesson/fixture with its own activity IDs must be used.

## One supervised real end-to-end attempt (paid)

Only after the isolated test fixture contains a v3 conversation activity:

```powershell
$env:TALKORA_E2E_STUDENT_PIN = Read-Host 'Private test PIN'
$env:TALKORA_E2E_AUDIO_FILE = Read-Host 'Consented local recording path'
$env:TALKORA_E2E_ALLOW_PAID_SPEECH = 'YES'
$env:TALKORA_E2E_ALLOW_PROGRESS_WRITE = 'YES'
pnpm run smoke:class1-azure-voice -- --live --commit --require-first-day
Remove-Item Env:TALKORA_E2E_ALLOW_PAID_SPEECH,Env:TALKORA_E2E_ALLOW_PROGRESS_WRITE -ErrorAction SilentlyContinue
```

The CLI makes a maximum of one Sarvam STT + one Azure TTS request, and one bounded Qwen call. **It intentionally does not acknowledge that the audio was heard**, even if bytes were returned. The actual Class 1 browser session is required to test audible playback, automatic mic return, native fullscreen permissions and progress on the physical device.

The client has an authenticated `/api/voice/sessions/:sessionId/teacher-audio-played` endpoint that commits v3 mastery only once, after the audio media-ended event. It cannot cryptographically prove physical hearing; the server still validates student ownership, scene and the completed Qwen decision. Every HTTP/API failure leaves progress uncommitted and the screen unreleased.

## Expected spoken school dialogue

- Miss Julie: “Ding dong! The school bell is ringing!”
- Child: “ये घंटी क्यों बजती है?”
- Qwen on 8002: short Hindi explanation with an English phrase, e.g. “The bell tells us class starts. Say: I hear a bell.”
- **Azure hi-IN-SwaraNeural** speaks the dynamic sentence, not cached Priya.
- Child responds: “I hear a bell.” Qwen decides whether to model again or finish the scene.
- After Azure audio ends, the browser acknowledges and Node commits the scene progress. Only then does the next school animation begin.

No speech services or real database records were exercised by GitHub CI. Live production readiness requires educator approval plus supervised audio testing, and previously shared credentials should be rotated before deployment.

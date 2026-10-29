# Class 1 voice acceptance — Sarvam STT + Azure TTS (credits guarded)

Scope: one authorised Class 1 (g01-l01) student, real 5-digit PIN, a short consented recording, Node/Express, Python/Qwen, Sarvam STT + Azure TTS, MongoDB. Keep QLoRA V2 adapter OFF (13/24 checks only) and curriculum unpublished until educator sign-off.

## Setup on Windows

Start Python from talkora-ai-starter (canonical service):
~~~powershell
.\.venv\Scripts\python.exe -m uvicorn server.main:app --host 127.0.0.1 --port 8002
~~~

In the Node backend private .env use:
~~~dotenv
NODE_ENV=development
TALKORA_CLASS1_STUDENT_DEMO=true
TALKORA_CLASS1_DEMO_STUDENT_ID=<existing authorised Grade 1 demo student id>
TALKORA_CLASS1_QWEN_PILOT=true
TALKORA_CLASS1_AI_URL=http://127.0.0.1:8002
TALKORA_SERVICE_KEY=<same long secret set on Python service>
AI_PROVIDER=python
SPEECH_PROVIDER=sarvam
VOICE_PROVIDER=azure
CONVERSATION_VOICE_PROVIDER=azure
AZURE_SPEECH_KEY=<private Azure key>
AZURE_SPEECH_REGION=centralindia
SARVAM_STT_MODEL=saaras:v4
SARVAM_STT_LANGUAGE=unknown
SARVAM_STT_MODE=codemix
# Keep SARVAM_API_KEY and AZURE_SPEECH_KEY private, in this worktree's .env
VOICE_WARMUP_ENABLED=false
TALKORA_CLASS1_STATIC_AUDIO_APPROVED=false
~~~

Python must use the SAME TALKORA_SERVICE_KEY. Set TALKORA_ENV=development, TALKORA_CLASS1_HINTS_APPROVED=false, TALKORA_ENABLE_EXPERIMENTAL_CHAT=false. Never expose secrets via NEXT_PUBLIC variables. Start Node: pnpm dev.

This draft demo access is purposely development-only. Do not bypass it or publish unreviewed curriculum.


## Before running --check: start services and confirm ports

The test only connects to running services. It does **not** start Node or Python and does **not** read the .env from your other Git worktree. The separate D:\talkor\class1-azure-e2e\backend folder needs its own private .env.

Use two terminals: in the canonical talkora-ai-starter directory launch Python on 8002; in the worktree backend folder launch Node (pnpm dev) on 5000.

~~~powershell
Test-NetConnection 127.0.0.1 -Port 5000
Test-NetConnection 127.0.0.1 -Port 8002
Invoke-RestMethod http://127.0.0.1:5000/health
Invoke-RestMethod http://127.0.0.1:8002/health
~~~

Both ports must be reachable before --check. If Node fails on startup, inspect its terminal for MongoDB/auth configuration. Keep AI_PROVIDER=groq for other classes if desired: TALKORA_CLASS1_QWEN_PILOT=true selects Qwen for the authorised g01-l01 context. STT_PROVIDER is not the selector; SPEECH_PROVIDER is.

**Security:** if any secret is accidentally posted to a chat/log, revoke/rotate it at the actual provider (AWS, MongoDB, Sarvam, Azure, Groq, OpenAI, Gemini) and replace the JWT secret. Updating .env alone does not revoke leaked credentials. Never paste new credentials into a help chat.

## Test in three stages

1. **Free connectivity check.** From Node backend:

   ~~~powershell
   pnpm exec tsx src/scripts/smoke-class1-azure-voice-e2e.ts --check
   pnpm exec tsx -r dotenv/config src/scripts/check-class1-ai-bridge.ts
   ~~~

   The first verifies Node and Python health; the second verifies the protected Node-to-Python AI bridge (not student voice).

2. **Exactly one Sarvam STT and one Azure TTS call.** Record a short 1–5 second WebM/WAV audio clip yourself or with appropriate informed consent. Keep the file private.

   ~~~powershell
   $env:TALKORA_E2E_STUDENT_PIN = 'REPLACE_WITH_REAL_5_DIGIT_PIN'
   $env:TALKORA_E2E_AUDIO_FILE = 'D:\private\short-sample.webm'
   $env:TALKORA_E2E_ALLOW_PAID_SPEECH = 'YES'
   pnpm exec tsx src/scripts/smoke-class1-azure-voice-e2e.ts --live
   ~~~

   This does not create an activity attempt. It hides the transcript and PIN. No automatic expensive retries. Azure may charge for these requests.

3. **Actual student lesson → Qwen → progress.** The student's next activity must be an AI CONVERSATION, such as guided little-word review. Finish earlier tasks through the app. This call **writes one demo turn and may change progress**, as well as incurring another Sarvam STT + Azure TTS pair:

   ~~~powershell
   $env:TALKORA_E2E_ALLOW_PROGRESS_WRITE = 'YES'
   pnpm exec tsx src/scripts/smoke-class1-azure-voice-e2e.ts --live --commit
   ~~~

   The test confirms a nonempty Miss Julie reply and a readable MongoDB progress endpoint. One turn alone may not earn XP. Verify actual progression, homework, audio playback, PIN resume, and lab logout in a supervised browser session.

## Credit-saving controls now in code

- Only exact, manifest-matched Class 1 narration can share server audio, with a 5-minute bounded cache and simultaneous-request deduplication. For pre-recorded S3 playback, an educator must first set TALKORA_CLASS1_STATIC_AUDIO_APPROVED=true after reviewing files.
- Browser lesson audio caching keys on exact text, language and activity; conversation/feedback is never cached. This prevents stale audio from an earlier activity response.
- At most 18 media requests per minute per signed-in student. Unlike a per-IP limiter, it won't penalise an entire shared-IP computer lab.
- Keep VOICE_WARMUP_ENABLED=false and QLoRA hints disabled during the pilot.
- This limiter is in-memory per backend worker. It is **not a spending cap**. Before 10,000 students, add shared per-student daily budgets in MongoDB/Redis, Azure billing alerts, and Azure service quotas, then monitor the real costs.
- Avoid unnecessary STT retries when the browser VAD finds silence; the script makes one STT and one TTS request only.

Remaining production blockers: teacher syllabus/audio approval, actual real-pupil consented E2E, reliable Hindi/Marathi tests, shared budget enforcement, cross-device progress and Lab Mode, and a reachable private Node–Python URL in deployment. Local 127.0.0.1 is not a cross-service Railway address.

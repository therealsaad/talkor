# Class 1 voice acceptance — Azure credits guarded

Scope: one authorised Class 1 (g01-l01) student, real 5-digit PIN, a short consented recording, Node/Express, Python/Qwen, Azure STT/TTS, MongoDB. Keep QLoRA V2 adapter OFF (13/24 checks only) and curriculum unpublished until educator sign-off.

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
SPEECH_PROVIDER=azure
VOICE_PROVIDER=azure
CONVERSATION_VOICE_PROVIDER=azure
AZURE_SPEECH_KEY=<private Azure key>
AZURE_SPEECH_REGION=centralindia
AZURE_SPEECH_STT_LOCALE=en-IN
VOICE_WARMUP_ENABLED=false
TALKORA_CLASS1_STATIC_AUDIO_APPROVED=false
~~~

Python must use the SAME TALKORA_SERVICE_KEY. Set TALKORA_ENV=development, TALKORA_CLASS1_HINTS_APPROVED=false, TALKORA_ENABLE_EXPERIMENTAL_CHAT=false. Never expose secrets via NEXT_PUBLIC variables. Start Node: pnpm dev.

This draft demo access is purposely development-only. Do not bypass it or publish unreviewed curriculum.

## Test in three stages

1. **Free connectivity check.** From Node backend:

   ~~~powershell
   pnpm exec tsx src/scripts/smoke-class1-azure-voice-e2e.ts --check
   pnpm exec tsx -r dotenv/config src/scripts/check-class1-ai-bridge.ts
   ~~~

   The first verifies Node and Python health; the second verifies the protected Node-to-Python AI bridge (not student voice).

2. **Exactly one Azure STT and one TTS call.** Record a short 1–5 second WebM/WAV audio clip yourself or with appropriate informed consent. Keep the file private.

   ~~~powershell
   $env:TALKORA_E2E_STUDENT_PIN = 'REPLACE_WITH_REAL_5_DIGIT_PIN'
   $env:TALKORA_E2E_AUDIO_FILE = 'D:\private\short-sample.webm'
   $env:TALKORA_E2E_ALLOW_AZURE_CHARGES = 'YES'
   pnpm exec tsx src/scripts/smoke-class1-azure-voice-e2e.ts --live
   ~~~

   This does not create an activity attempt. It hides the transcript and PIN. No automatic expensive retries. Azure may charge for these requests.

3. **Actual student lesson → Qwen → progress.** The student's next activity must be an AI CONVERSATION, such as guided little-word review. Finish earlier tasks through the app. This call **writes one demo turn and may change progress**, as well as incurring another STT+TTS pair:

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

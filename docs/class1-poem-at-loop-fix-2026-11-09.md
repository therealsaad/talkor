# Class 1 — My First Day: observed "at at" regression (9 November 2026)

## Video evidence

The 83-second student recording shows My First Day, *poem scene 3/6*, with
the two active lines about a grin and the school bell. The teacher switches
to "Let us try a short English word together. Can you say at?" A later student
transcript reads "At at". That is a lesson-target mismatch, NOT an accent
or intelligence assessment.

## Root cause and code fix

1. Node knows the authenticated Activity scene key (poem-pair-3) but was
   replacing the full poem teacher prompt with a stale single-word voice
   session target. Python did not receive the authoritative key.
2. The existing Python First Day handler can miss a poem by display title,
   then fall into the obsolete Class 1 foundation-word coaching branch
   which literally says "Can you say at?". Its response guard could also
   rewrite replies using an old word-repeat prompt.
3. The poem page's "Hear again" replays last AI speech, which may itself
   be unrelated to the two lines displayed.

The fix binds the Node-authorized scene key to Python, prevents any poem
scene reaching the old word trainer, and applies a final Node-side poem
model guard even against stale Python output. Real English-line evidence
and media-ended acknowledgement remain authoritative for progress.

## Azure voice and recitation

All dynamic Class 1 v4 poem narration, including first lesson audio, now uses
Azure Neural TTS and fails visibly if it is unavailable. A "Hear these lines"
button speaks exactly the displayed two-line pair or final recital chunk.
Azure recitation has deliberate 360 ms line pauses and a gentle -14% rate.
English poem text uses en-IN-NeerjaNeural, Hindi support uses
hi-IN-SwaraNeural, and Marathi support uses mr-IN-AarohiNeural.

Azure TTS produces **rhythmic spoken recitation, not a melody-based song**.
The existing optional quiet instrumental remains separate. A true sung vocal
requires an approved recording or appropriate singing model plus permissions.

## Local verification (after BOTH reviewed PRs are merged and checked out)

The Python AI package must be the current talkora-ai-private/talkora-ai-starter,
not an old qwen-service or another folder. First inspect the Windows PID on
8002 to confirm which Uvicorn process is actually listening. Do not blindly
kill a different process. The Python 8002 process must be restarted after
updating its checkout. Node's TALKORA_CLASS1_AI_URL must point to that service;
127.0.0.1 is valid ONLY on the same machine.

Use the same TALKORA_SERVICE_KEY on Node and Python (32+ chars in production).
Enable TALKORA_CLASS1_QWEN_PILOT on both; Azure backend needs a real key and
region, never bundled in frontend code or commits.

Python offline tests from the talkora-ai-starter folder:

    python -m pytest -q tests/test_class1_first_day.py tests/test_class1_asgi_guard.py

Node mocked Azure + curriculum tests from backend:

    pnpm exec jest --runInBand tests/unit/class1PoemTeachingGuard.test.ts tests/unit/class1PoemAzureRecitation.test.ts

All automated Azure tests intercept network fetch and incur NO paid requests.

## Real student acceptance before claiming fixed

1. Open My First Day through student PIN and see poem pair 3.
2. Listen to the two lines through Azure, then respond "At at." No
   independent poem progress should be awarded; Miss Julie must stay on
   the highlighted grin/bell lines instead of asking about "at".
3. Press "Hear these lines": it must speak that pair, not an old reply.
4. Say the actual two poem lines; wait for audible feedback to finish,
   then check saved attempt and next step.
5. Ask for Hindi and Marathi help; support language must be natural while
   the English poem is spoken with the English teacher voice.
6. Refresh and sign in again: resume first unfinished scene with prior
   attempts intact. Unknown poem scene IDs fail without exposing other levels.

The code PRs do not publish a draft, alter live records, deploy either service,
prove a real audio device or verify publisher/educator permission for the poem.

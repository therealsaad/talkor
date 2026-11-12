# Class 1 Level 1 — real voice classroom verification

## Scope and status

Source: **English Balbharati Grade One**, Unit 1.1 **My First Day**, printed page 1. The new v3 development draft contains ten *original* school action conversations, not copied textbook verses or images. The frontend uses a landscape, scroll-free Miss Julie stage with no student answer buttons. **Code/CI is not proof of live audio.**

The main README is the deployment contract. Reuse the authenticated student lesson engine and current MongoDB relationships. Never put private keys into the browser. The AI repository's Class 1 First Day support must be deployed separately; a green main-repo CI does not deploy Python.

## First verify zero paid calls

On the developer laptop, start the existing services on **3000**, **5000**, **8002**, and **11434**. Port **8001** is only necessary when the Python TTS route is in use. Confirm your existing, private `backend/.env` has unique definitions for `TALKORA_CLASS1_AI_URL=http://127.0.0.1:8002`, `TALKORA_CLASS1_QWEN_PILOT=true`, `SPEECH_PROVIDER=sarvam`, `CONVERSATION_VOICE_PROVIDER=azure`, `AZURE_SPEECH_REGION`, and `AZURE_SPEECH_KEY`.

```powershell
cd D:\talkor\talkor\backend
pnpm run smoke:class1-azure-voice -- --check
pnpm exec tsx -r dotenv/config src/scripts/check-class1-ai-bridge.ts
pnpm exec tsx -r dotenv/config src/scripts/prepare-class1-first-day-only.ts
```

The last command is **PREVIEW ONLY**. Its reported `safeToReplace` must be true; otherwise **never** force a v3 migration. Existing `test` had students, activities and progress. Do not wipe or reseed to get a green status.

## Intro media and lesson approval

The previous Class 1 intro teaches `am/an/at`. **Do not reuse it for Balbharati 1.1-only**. Commission/review a new 87–93 second First Day introduction with school, walking, skipping, running, grin/smile, school bell, jumping, playing and Grade One. Keep approved Miss Julie visuals and language review. No copying of the Balbharati rhyme or illustrations.

The **frontend runtime** requires `NEXT_PUBLIC_TALKORA_CLASS1_INTRO_URL` pointing to that reviewed clip for v3; the draft migration additionally requires `TALKORA_FIRST_DAY_INTRO_URL` and `TALKORA_FIRST_DAY_INTRO_REVIEWED=YES` in the **backend script environment**. These are two separate runtime processes; setting the backend variable alone does not configure the browser.

Never run `--apply` unless teacher approval is complete, the reviewed video is available, `safeToReplace=true`, and only a disposable development draft is targeted. The script refuses known activity attempts and saved lesson progress. It does **not** copy or reset existing student history.

## One supervised paid speech turn

Record a short consented `.wav` or `.m4a` locally and supply its file path; **do not paste student PINs, recordings or secrets** into chat or GitHub.

```powershell
$env:TALKORA_E2E_AUDIO_FILE = (Read-Host "Full path to consented audio recording")
$env:TALKORA_E2E_STUDENT_PIN = Read-Host "Private fixture PIN"
$env:TALKORA_E2E_ALLOW_PAID_SPEECH = "YES"
pnpm run smoke:class1-azure-voice -- --live
Remove-Item Env:TALKORA_E2E_ALLOW_PAID_SPEECH -ErrorAction SilentlyContinue
```

This exercises **one Sarvam STT + one Azure TTS** attempt, checks auth and checks an MP3/WAV header. **It does not prove Chrome actually produced audible sound**; only the real student browser can establish that.

## Mandatory browser acceptance

After one initial Play/Fullscreen interaction, the child should not use mouse or keyboard. Open developer tools (teacher only) and watch for `[TALKORA AUDIO] AUDIO_REQUESTED`, `[Talkora AI] TTS_NETWORK`, `[Talkora AI] AUDIO_START` and `[TALKORA AUDIO] AUDIO_PLAY_ENDED`. If the teacher is silent, check network status and exact audio MIME, not just an animation labelled “speaking.” A `PLAYBACK_UNLOCKED` message confirms the unlock attempt, not that volume or physical speakers work.

In the v3 first-day scene, confirm: (1) a child's English school-action attempt produces an on-topic reply; (2) “मुझे समझ नहीं आया” gets a short Hindi explanation and an English model; (3) “मला समजत नाही” gets Marathi support; (4) a syllabus question such as “Why does the bell ring?” receives a bounded explanation; (5) a help request does not count as independent English mastery; (6) no scroll bar, child avatar or answer buttons; (7) restart/resume does not lose progress. Only after teacher review should publication be considered.

## Known limitations

- Web browsers may require a teacher's initial gesture for sound, microphone and fullscreen. Browser websites cannot guarantee F11 or prevent Escape.
- The optional Qwen free-form 1.1 question-answer path in `talkora-ai-private` remains subject to review and its feature gate. Scripted bilingual coaching is **not the same as approved generative model inference**.
- If the actual classroom is silent after streaming fixes and permission checks, investigate OS sound output, selected speaker, browser tab mute and network response completion; these cannot be diagnosed remotely from GitHub.
- Credentials previously pasted in chats should be rotated. Never expose them in logs or client bundles.

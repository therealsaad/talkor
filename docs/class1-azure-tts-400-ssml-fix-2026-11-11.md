# Class 1 Azure TTS HTTP 400 / browser 502: SSML fix and local verification

## Evidence and scope

During a real local Class 1 First Day test, the mandatory introduction `/voice/first-day/intro/start` and `/complete` succeeded (200), followed by `POST /api/voice/synthesize` (502). The Node log reports `Azure TTS returned an error` with **upstream status 400**. Open listeners on 3000, 5000, 8001, 8002, 11434 cannot confirm the remote Azure REST endpoint; the failure occurs *after* Talkora contacts Azure.

The existing `AzureVoiceProvider` generated multiline poem SSML as:
```xml
<speak ...><voice name="en-IN-NeerjaNeural"><prosody ...>See me skip.</prosody></voice><break time="360ms"/><voice name="en-IN-NeerjaNeural"><prosody ...>See me run.</prosody></voice></speak>
```
The standalone `<break>` is an invalid direct child of `<speak>` in Microsoft's supported SSML hierarchy, which permits `voice` nodes as children of `speak`. The patch moves each pause inside the following voice/prosody instead. It preserves the original poem, teaching order, one Azure request, Hindi/Marathi help and original English recitation voice. Sources:
- https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup-structure
- https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech

This is a **code-level SSML defect** consistent with the logs. It is not proof that a second problem (incorrect Azure region/key, voice, output format or resource configuration) does not exist.

## Test the patch on your existing Windows machine

Keep local, unstaged changes safe; do not run `git add .` or push to main. From the root:
```powershell
cd "D:\talkor\talkor"
git status
git fetch origin
git switch -c test-azure-ssml --track origin/fix/class1-azure-poem-ssml-break-20261111
cd backend
pnpm exec jest --runInBand tests/unit/class1PoemAzureRecitation.test.ts tests/class1-azure-audio.test.ts
pnpm build
```

Only when you intentionally want **two short paid Azure TTS requests**, in local development with the existing valid `backend/.env`:
```powershell
pnpm exec tsx -r dotenv/config src/scripts/check-azure-tts.ts --probe
```
The probe never writes raw audio, transcript, keys, body or student data. It tests a harmless English sentence followed by two familiar poem lines, and prints only PASS/FAIL. It is never auto-run by a school lesson, CI, or startup.

- **PLAIN_ENGLISH FAIL**: investigate `AZURE_SPEECH_REGION` (must match the Speech resource), `AZURE_SPEECH_KEY`, `AZURE_SPEECH_VOICE` (supported in that region) and `AZURE_SPEECH_OUTPUT_FORMAT` (recognized Azure format). The provider's redacted log preserves only the upstream numeric status. Do not paste secret keys or `.env` files to chat.
- **PLAIN_ENGLISH PASS + FIRST_DAY_POEM FAIL**: the Azure resource works for basic speech, but the poem SSML path or deployment revision still needs attention.
- **Both PASS**: restart the Node backend on the patched branch and retest the full authenticated lesson on your actual browser/speaker. A test provider success does not validate signed feedback ACK, microphone timing, hardware sound or educational publication.
- **Still 400 on actual lesson but both probes pass**: compare exact current lesson activity type/route and provider's status with the patched branch and ensure the source was rebuilt/restarted. Do not expose private lesson replies or Azure response bodies in logs.

## Regression and boundaries

`tests/unit/class1PoemAzureRecitation.test.ts` asserts that every pause is nested within an English Neural voice, no orphan `</voice><break>` remains, and the previously approved English/Hindi/Marathi poem branches remain. Another mocked Azure request returns HTTP 400 for a malformed root-level break, proving that the revised structure avoids that error path without needing network calls in CI.

The patch changes **only SSML placement**, adds focused tests and an explicit local diagnostic. No new provider fallback, second LLM call, browser changes, student transcript logging, static audio approval, generated-audio receipt bypass, curriculum publication, DB migration or production deployment. On a failed Azure turn, Class 1 remains blocked rather than awarding XP or progressing without heard audio. Rollback is a normal revert of this feature branch.

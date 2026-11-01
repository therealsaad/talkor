# Sprint 3.2 — KG rule-first bilingual voice reliability

**Scope:** Narrow KG Level 1 reliability change on top of Sprint 3.1. No new lesson unlocks, school-language setting, curriculum publication, separate KG controllers, AI-model promotion, or persistent audio storage.

## Implemented

1. **Sarvam stays the STT provider.** Its optional allowlisted language code (en-IN, hi-IN, mr-IN) is a hint for explanation and Azure voice selection, never a pronunciation score or mastery decision. Unknown/uncertain language has no inference from Devanagari: Hindi and Marathi share script.
2. **Session-scoped language stability:** the authenticated intro playback ticket identifies the current visit. The two most recent detected codes from that visit are compared with the current result. Two agreeing utterances allow a switch; one anomalous detection cannot flip an established language. Unknown results reuse the most recent known locale, or English when none exists. Code and chosen feedback locale are saved independently on the existing KG attempt so repeat submissions and audio retries preserve the exact same feedback and voice. On a fresh completed intro ticket, previous sessions are excluded. No school-level preference is required.
3. **Rule-first feedback:** correct word, known translation, touch answer, empty/unclear transcription and silence use the deterministic backend line, not Qwen. Transcribed unexpected incorrect words/questions alone reach the bounded KG Qwen service. The timeout is **1800 ms default**, constrained to **500–2500 ms** by TALKORA_KG_QWEN_TIMEOUT_MS; on failure, invalid response or rejected language, use the reviewed deterministic line. Qwen cannot mark completion or progress, and its output must include the current target word.
4. **Native explanation plus English pronunciation target:** Hindi/Marathi backend feedback is an authored short Devanagari explanation followed by a final Say [English word]. Azure emits two voice nodes (Swara/Aarohi + Neerja) within **one TTS request** when it sees this validated KG practice suffix; ordinary English and Class 1 narration preserve the previous path. No second Azure generation or provider routing based on browser input.
5. **Existing child-safety contract preserved:** server owns activity outcome and response; original 5-digit PIN, intro ticket, idempotent submission ID, audio playback acknowledgment, S3 fixed narration and non-persistence of live audio remain as before. The teacher text is persisted once in the existing attempt, not regenerated on playback retry.

## Local checks

From backend:

    pnpm install --frozen-lockfile
    pnpm exec jest --runInBand tests/unit/kgTeachingLanguage.test.ts tests/unit/kgFeedbackRouting.test.ts tests/unit/kgAzureBilingualLocale.test.ts
    pnpm exec jest --runInBand tests/integration/kgAlphabetAudio.test.ts
    pnpm run build

Integration tests use the disposable Mongo test helper, not a production/school database. Unit TTS tests mock Azure and do not require cloud credentials. Review PR CI before merge. Run one supervised consented real-microphone smoke with English, Hindi, Marathi, bilingual translation, an unexpected word, silence, two language changes, Qwen offline, Azure offline, playback retry, shared-lab student switch, and reload/resume.

**Not claimed:** no real Sarvam/Azure/Qwen GPU latency measurements, no live Azure bilingual sound-quality approval, no school trial and no production deployment have been performed solely by this branch. The total 2–3 second goal remains to be measured end-to-end, especially with STT and TTS cloud latency. No change to the separately-gated Class 1 syllabus/pedagogy release.

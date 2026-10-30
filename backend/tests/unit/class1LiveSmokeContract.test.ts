import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('Supervised Class 1 v3 live pipeline smoke', () => {
  const script = readFileSync(path.join(__dirname, '../../src/scripts/smoke-class1-azure-voice-e2e.ts'), 'utf8')

  it('rejects the old AM draft and uses the active ten-scene AI conversation', () => {
    expect(script).toContain("current.activityKey?.startsWith('class1-l01-v3-')")
    expect(script).toContain("completed.aiResponse.conversation?.id")
  })
  it('sends Sarvam language to the actual Qwen session and Azure reply', () => {
    expect(script).toContain("detectedLanguage: recognized.languageCode")
    expect(script).toContain("activityId: next.activityId")
    expect(script).toContain("language: recognized.languageCode")
    expect(script).toContain("completed.aiResponse.followUpQuestion")
    expect(script).not.toContain("completed.aiResponse.message.slice(0, 180)")
  })
  it('requires opt-in and never claims a server response proves browser speech finished', () => {
    expect(script).toContain("TALKORA_E2E_ALLOW_PAID_SPEECH")
    expect(script).toContain("TALKORA_E2E_ALLOW_PROGRESS_WRITE")
    expect(script).toContain("media-ended acknowledgement and progression are NOT simulated")
  })
})

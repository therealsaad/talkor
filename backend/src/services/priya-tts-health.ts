/**
 * Readiness inspection for local Python 8001 Priya TTS.
 * Health may be "degraded" because Qwen is offline while TTS itself is ready.
 * The model can be cold/lazy: ttsModelLoaded=false is NOT a failure.
 * Never include keys or raw returned error pages in diagnostics.
 */
export type PriyaHealth = {
  voiceId: string
  status: string
  modelAvailable: boolean
  providerImportAvailable: boolean
  modelLoaded: boolean
  ttsDevice: string
  cudaAvailable: boolean
  configuredDevice: string | null
  ttsStatus: string
}
export function parsePriyaHealth(raw: unknown): PriyaHealth {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('8001 /health did not return a JSON object; check which service owns port 8001')
  const value = raw as Record<string, unknown>
  if (typeof value.ttsVoiceId !== 'string' || !value.ttsVoiceId.trim())
    throw new Error('8001 does not expose ttsVoiceId; check the running Python service version')
  return {
    voiceId: value.ttsVoiceId.trim(),
    status: typeof value.status === 'string' ? value.status : 'unknown',
    modelAvailable: value.ttsModelAvailable === true,
    providerImportAvailable: value.parlerImport === true,
    modelLoaded: value.ttsModelLoaded === true,
    ttsDevice: typeof value.ttsDevice === 'string' ? value.ttsDevice : 'unknown',
    cudaAvailable: value.cuda === true,
    configuredDevice: typeof value.ttsConfiguredDevice === 'string' ? value.ttsConfiguredDevice : null,
    ttsStatus: typeof value.ttsStatus === 'string' ? value.ttsStatus : 'unknown',
  }
}
export function checkPriyaHealth(health: PriyaHealth): string[] {
  const problems: string[] = []
  if (!health.providerImportAvailable) problems.push('Indic Parler TTS package is not importable in the Python 8001 venv')
  if (!health.modelAvailable) problems.push('Local Indic Parler or FLAN-T5 snapshot is missing/incomplete in Python 8001 model cache')
  if ((health.configuredDevice || health.ttsDevice).startsWith('cuda') && !health.cudaAvailable)
    problems.push('Python 8001 CUDA was requested but PyTorch cannot use CUDA; check policy/driver/venv and Python terminal')
  return problems
}
export function formatPriyaHealth(health: PriyaHealth): string {
  const problems = checkPriyaHealth(health)
  return [
    'Priya voice: ' + health.voiceId,
    'TTS import: ' + (health.providerImportAvailable ? 'OK' : 'UNAVAILABLE'),
    'Local models: ' + (health.modelAvailable ? 'VISIBLE' : 'MISSING'),
    'CUDA: ' + (health.cudaAvailable ? 'AVAILABLE' : 'UNAVAILABLE'),
    'TTS device: ' + health.ttsDevice + (health.configuredDevice ? ' (configured ' + health.configuredDevice + ')' : ''),
    'TTS state: ' + health.ttsStatus + (health.modelLoaded ? ' (loaded)' : ' (cold/lazy allowed)'),
    ...problems.map(problem => 'BLOCKER: ' + problem),
  ].join('\n')
}


/**
 * Browser-local silence detector. Records/audio never leave the device through
 * this helper; audio is uploaded only by the existing consented lesson recorder.
 * No new dependency or server round-trip is required.
 */
export function watchVoiceActivity(
  stream: MediaStream,
  onSilence: () => void,
  options: { silenceMs?: number; minimumSpeechMs?: number; noSpeechTimeoutMs?: number; onSpeech?: () => void; speechThreshold?: number;
    resumeContext?: boolean; sampleIntervalMs?: number; onUnavailable?: () => void } = {},
): () => void {
  if (typeof window === 'undefined') return () => undefined
  const AudioContextClass = window.AudioContext
  if (!AudioContextClass) { options.onUnavailable?.(); return () => undefined }
  let context: AudioContext | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let clock: number | undefined
  let ended = false
  try {
    context = new AudioContextClass()
    if (options.resumeContext && context.state === 'suspended') {
      void context.resume().catch(() => { if (!ended) options.onUnavailable?.() })
    }
    source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 1024
    source.connect(analyser)
    const samples = new Float32Array(analyser.fftSize)
    const startedAt = performance.now()
    let lastVoiceAt = startedAt
    let heardVoice = false
    let noiseFloor = 0.009
    let positiveFrames = 0
    const noSpeechLimit = options.noSpeechTimeoutMs ?? 6500
    const silenceLimit = options.silenceMs ?? 1050
    const minimumSpeech = options.minimumSpeechMs ?? 550
    clock = window.setInterval(() => {
      if (ended || context?.state !== 'running') return
      analyser.getFloatTimeDomainData(samples)
      let energy = 0
      for (let i = 0; i < samples.length; i++) energy += samples[i] * samples[i]
      const rms = Math.sqrt(energy / samples.length)
      const now = performance.now()
      // Adjust the baseline only before speech, so a classroom fan won't trigger recording.
      if (!heardVoice) noiseFloor = Math.min(.06, noiseFloor * .96 + rms * .04)
      const active = rms > Math.max(options.speechThreshold ?? .024, noiseFloor * 2.7)
      if (active) {
        positiveFrames += 1
        if (positiveFrames >= 2) { if (!heardVoice) options.onSpeech?.(); heardVoice = true; lastVoiceAt = now }
      } else positiveFrames = 0
      if (heardVoice && now - startedAt >= minimumSpeech && now - lastVoiceAt > silenceLimit ||
          !heardVoice && now - startedAt > noSpeechLimit) {
        ended = true
        onSilence()
      }
    }, options.sampleIntervalMs ?? 100)
    if (options.onUnavailable) {
      const observedContext = context
      // A suspended analyser must not classify the whole recording as silence.
      void Promise.resolve().then(() => { if (!ended && observedContext.state !== 'running') options.onUnavailable?.() })
    }
  } catch {
    // Mic recording continues with its hard timeout if the Web Audio API fails.
    options.onUnavailable?.()
  }
  return () => {
    ended = true
    if (clock !== undefined) window.clearInterval(clock)
    source?.disconnect()
    if (context) void context.close().catch(() => undefined)
  }
}

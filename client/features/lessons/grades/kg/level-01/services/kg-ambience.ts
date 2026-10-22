/**
 * KG Level 1 music mixer. This is deliberately independent of the TTS/S3 audio
 * player so the microphone never captures background music from our own app.
 * The intro film provides its OWN soundtrack; this mixer is disabled during it.
 */
export type KGAmbienceMode = 'off' | 'ambient' | 'ducked' | 'silent'

export const KG_AMBIENCE_TRACK = '/lessons/kg/audio/garden-ambience-v1.mp3'
export const KG_AMBIENCE_VOLUME = 0.12
export const KG_AMBIENCE_DUCKED_VOLUME = 0.018

export function modeForKGPhase(phase: string): KGAmbienceMode {
  if (phase === 'julie' || phase === 'feedback') return 'ducked'
  if (phase === 'listening' || phase === 'checking') return 'silent'
  if (phase === 'ready' || phase === 'touch' || phase === 'finished') return 'ambient'
  return 'off' // loading, errors, mandatory intro and saving its ticket
}

export class KGAmbienceMixer {
  private readonly audio: HTMLAudioElement
  private mode: KGAmbienceMode = 'off'
  private enabled = true
  private unlocked = false
  private voiceCount = 0
  private fadeTimer: ReturnType<typeof setInterval> | null = null
  private disposed = false
  private generation = 0

  constructor(audio: HTMLAudioElement) {
    this.audio = audio
    this.audio.loop = true
    this.audio.preload = 'none' // don't download music before the compulsory intro
    this.audio.volume = 0
  }

  setMode(mode: KGAmbienceMode) {
    if (this.disposed) return
    this.mode = mode
    this.sync()
  }

  setEnabled(enabled: boolean) {
    if (this.disposed) return
    this.enabled = enabled
    this.sync()
  }

  /** Call synchronously inside a child's/teacher's Play button click. */
  unlock() {
    if (this.disposed) return
    this.unlocked = true
    this.sync()
  }

  /** Microphone acquisition must silence the music BEFORE permission/recording. */
  silenceForMicrophone() {
    if (this.disposed) return
    this.mode = 'silent'
    this.stopImmediately()
  }

  /** Voice playback can span phase changes, e.g. spoken homework at completion. */
  beginVoice(): () => void {
    if (this.disposed) return () => undefined
    this.voiceCount++
    this.sync()
    let released = false
    return () => {
      if (released || this.disposed) return
      released = true
      this.voiceCount = Math.max(0, this.voiceCount - 1)
      this.sync()
    }
  }

  /** Leave the lesson or hide the tab: require a NEW play gesture to resume. */
  suspendUntilGesture() {
    this.unlocked = false
    this.stopImmediately()
  }

  /** Stop immediately; still eligible to resume on the next non-mic phase. */
  stopImmediately() {
    this.cancelFade()
    this.generation++
    this.audio.volume = 0
    this.audio.pause()
  }

  dispose() {
    if (this.disposed) return
    this.stopImmediately()
    this.disposed = true
    this.audio.removeAttribute('src')
    this.audio.load()
  }

  private cancelFade() {
    if (this.fadeTimer !== null) clearInterval(this.fadeTimer)
    this.fadeTimer = null
  }

  private sync() {
    this.cancelFade()
    const target = !this.enabled || !this.unlocked || this.mode === 'off' || this.mode === 'silent'
      ? 0
      : this.mode === 'ducked' || this.voiceCount > 0
        ? KG_AMBIENCE_DUCKED_VOLUME
        : KG_AMBIENCE_VOLUME

    if (target === 0) {
      // No residual tail while the student answers or a microphone is open.
      this.stopImmediately()
      return
    }

    if (this.audio.paused) {
      const generation = ++this.generation
      // Playback may be blocked by a browser. Music is optional, speech is not.
      try {
        const attempt = this.audio.play()
        void attempt?.catch(() => {
          if (generation === this.generation) this.stopImmediately()
        })
      } catch { this.stopImmediately(); return }
    }

    const startingVolume = this.audio.volume
    if (Math.abs(startingVolume - target) < 0.001) { this.audio.volume = target; return }
    const startTime = Date.now()
    const fadeMs = target < startingVolume ? 130 : 480
    this.fadeTimer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startTime) / fadeMs)
      this.audio.volume = Math.max(0, Math.min(1, startingVolume + (target - startingVolume) * progress))
      if (progress >= 1) this.cancelFade()
    }, 25)
  }
}

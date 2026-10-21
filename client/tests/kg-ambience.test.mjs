import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { KGAmbienceMixer, KG_AMBIENCE_TRACK, modeForKGPhase } from '../features/lessons/grades/kg/level-01/services/kg-ambience.ts'

class FakeAudio {
  paused = true
  volume = 1
  loop = false
  preload = ''
  playCount = 0
  pauseCount = 0
  async play() { this.playCount++; this.paused = false }
  pause() { this.pauseCount++; this.paused = true }
  removeAttribute() {}
  load() {}
}

test('intro and errors are silent; speech ducks; child speaking stops soundtrack', () => {
  for (const phase of ['loading', 'intro', 'intro-playing', 'intro-paused', 'saving-intro', 'intro-error', 'error']) {
    assert.equal(modeForKGPhase(phase), 'off', phase)
  }
  assert.equal(modeForKGPhase('julie'), 'ducked')
  assert.equal(modeForKGPhase('feedback'), 'ducked')
  assert.equal(modeForKGPhase('listening'), 'silent')
  assert.equal(modeForKGPhase('checking'), 'silent')
  assert.equal(modeForKGPhase('touch'), 'ambient')
  assert.equal(modeForKGPhase('finished'), 'ambient')
})

test('soundtrack requires a gesture, loops, mutes for microphone and honours teacher toggle', () => {
  const audio = new FakeAudio()
  const mixer = new KGAmbienceMixer(audio)
  mixer.setMode('ambient')
  assert.equal(audio.playCount, 0, 'must never autoplay during intro')
  mixer.unlock()
  assert.equal(audio.playCount, 1)
  assert.equal(audio.loop, true)
  mixer.silenceForMicrophone()
  assert.equal(audio.volume, 0)
  assert.equal(audio.paused, true)
  mixer.setMode('ducked')
  assert.equal(audio.paused, false)
  mixer.setEnabled(false)
  assert.equal(audio.paused, true)
  mixer.setEnabled(true)
  assert.equal(audio.paused, false)
  mixer.suspendUntilGesture()
  mixer.setMode('ambient')
  assert.equal(audio.paused, true, 'hidden page must not restart music until an explicit gesture')
  mixer.unlock()
  assert.equal(audio.paused, false)
  mixer.dispose()
  assert.equal(audio.paused, true)
})

test('speech lock prevents full music while homework voice plays', async () => {
  const audio = new FakeAudio()
  const mixer = new KGAmbienceMixer(audio)
  mixer.setMode('ambient')
  mixer.unlock()
  const release = mixer.beginVoice()
  await new Promise(resolve => setTimeout(resolve, 170))
  assert.ok(audio.volume < .04, `voice duck volume was ${audio.volume}`)
  release()
  release() // idempotent
  await new Promise(resolve => setTimeout(resolve, 520))
  assert.ok(audio.volume >= .115, `ambient level did not resume: ${audio.volume}`)
  mixer.dispose()
})

test('lesson actually wires ambience to real speaking, recording and scene controls', async () => {
  const lesson = await readFile(new URL('../features/lessons/grades/kg/level-01/LevelExperience.tsx', import.meta.url), 'utf8')
  const hook = await readFile(new URL('../features/lessons/grades/kg/level-01/hooks/use-kg-ambience.ts', import.meta.url), 'utf8')
  assert.match(lesson, /const \{ musicEnabled, setMusicEnabled, unlockMusic, silenceForMicrophone, beginVoice, stopMusic \} = useKGAmbience\(phase\)/)
  assert.match(lesson, /const releaseDucking = beginVoice\(\)/)
  assert.match(lesson, /finally \{ releaseDucking\(\) \}/)
  assert.match(lesson, /silenceForMicrophone\(\)\s*micStartingRef\.current = true/)
  assert.match(lesson, /aria-label=\{musicEnabled \? 'Mute background music' : 'Enable background music'\}/)
  assert.match(hook, /pagehide/)
  assert.equal(KG_AMBIENCE_TRACK, '/kg/audio/garden-ambience-v1.mp3')
})

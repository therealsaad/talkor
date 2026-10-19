'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { KG_AMBIENCE_TRACK, KGAmbienceMixer, modeForKGPhase } from '@/lib/kg-ambience'

/** One mixer per mounted lesson. Never stores student preferences on shared PCs. */
export function useKGAmbience(phase: string) {
  const [musicEnabled, setMusicEnabled] = useState(true)
  const mixerRef = useRef<KGAmbienceMixer | null>(null)

  useEffect(() => {
    const audio = new Audio()
    const mixer = new KGAmbienceMixer(audio)
    audio.src = KG_AMBIENCE_TRACK
    mixerRef.current = mixer
    // If the page mounts in the middle of a lesson, still require a gesture.
    mixer.setMode(modeForKGPhase(phase))
    const stopOnHide = () => { if (document.hidden) mixer.suspendUntilGesture() }
    const stopOnPageHide = () => mixer.suspendUntilGesture()
    document.addEventListener('visibilitychange', stopOnHide)
    window.addEventListener('pagehide', stopOnPageHide)
    return () => {
      document.removeEventListener('visibilitychange', stopOnHide)
      window.removeEventListener('pagehide', stopOnPageHide)
      mixer.dispose()
      if (mixerRef.current === mixer) mixerRef.current = null
    }
  // Stable single mixer per mount; subsequent phases handled by the next effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { mixerRef.current?.setMode(modeForKGPhase(phase)) }, [phase])
  useEffect(() => { mixerRef.current?.setEnabled(musicEnabled) }, [musicEnabled])

  const unlockMusic = useCallback(() => mixerRef.current?.unlock(), [])
  const silenceForMicrophone = useCallback(() => mixerRef.current?.silenceForMicrophone(), [])
  const beginVoice = useCallback(() => mixerRef.current?.beginVoice() ?? (() => undefined), [])
  const stopMusic = useCallback(() => mixerRef.current?.suspendUntilGesture(), [])

  return { musicEnabled, setMusicEnabled, unlockMusic, silenceForMicrophone, beginVoice, stopMusic }
}

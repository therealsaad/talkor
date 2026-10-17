'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { voiceService, type VoicePlaybackResult, type VoicePlaybackState, type VoicePriority } from '@/services/voice-service'

export function useMissJulieVoice() {
  const [state, setState] = useState<VoicePlaybackState>('idle')
  const [error, setError] = useState('')
  const lastTextRef = useRef('')
  
  const onState = useCallback((nextState: VoicePlaybackState, message?: string) => {
    setState(nextState)
    setError(message || '')
  }, [])

  const speak = useCallback(async (text: string, turnId?: string, priority?: VoicePriority): Promise<VoicePlaybackResult> => {
    lastTextRef.current = text
    return voiceService.speak(text, onState, turnId, priority)
  }, [onState])

  const replay = useCallback(async (): Promise<VoicePlaybackResult> => {
    return voiceService.replay(onState)
  }, [onState])

  const stop = useCallback(() => {
    voiceService.stop()
    setState('idle')
    setError('')
  }, [])

  useEffect(() => stop, [stop])

  return {
    speak,
    replay,
    stop,
    state,
    error,
    isSpeaking: state === 'speaking',
    needsUserGesture: error.toLowerCase().includes('tap'),
    hasText: Boolean(lastTextRef.current),
  }
}

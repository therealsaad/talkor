'use client'

import { useEffect, useState } from 'react'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { voiceService } from '@/services/voice-service'

type SpeakState = 'idle' | 'permission-request' | 'ready' | 'recording' | 'processing' | 'success' | 'retry' | 'error'

export function SpeakButton({ phrase, onComplete, onTranscript }: { phrase: string; onComplete?: () => void; onTranscript?: (transcript: string) => void }) {
  const [state, setState] = useState<SpeakState>('idle')
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState('')
  const recorder = useAudioRecorder({ maxDurationMs: 10000 })

  useEffect(() => {
    if (recorder.status !== 'success' || !recorder.audioBlob) return
    let active = true
    setState('processing')
    void voiceService.transcribeAudio(recorder.audioBlob, recorder.durationMs).then((result) => {
      if (!active) return
      setTranscript(result)
      onTranscript?.(result)
      setState('success')
    }).catch((caught) => {
      if (!active) return
      setError(caught instanceof Error ? caught.message : 'I could not hear that clearly. Please try again.')
      setState('error')
    })
    return () => { active = false }
  }, [onTranscript, recorder.audioBlob, recorder.durationMs, recorder.status])

  useEffect(() => {
    if (recorder.status === 'requesting-permission') setState('permission-request')
    if (recorder.status === 'recording') setState('recording')
    if (recorder.status === 'processing') setState('processing')
    if (recorder.status === 'error') {
      setError(recorder.error)
      setState('error')
    }
  }, [recorder.error, recorder.status])

  const start = async () => {
    setState('permission-request')
    await recorder.startRecording()
  }
  const stop = () => { recorder.stopRecording(); setState('processing') }
  const label = { idle: 'Tap to speak', 'permission-request': 'Asking for microphone', ready: 'Ready when you are', recording: 'Listening...', processing: 'Miss Julie is listening...', success: 'Practice captured', retry: 'Try again', error: 'Microphone unavailable' }[state]
  return <div className={`speak-control speak-${state}`}><button className="microphone-button" type="button" onClick={state === 'recording' ? stop : start} disabled={state === 'permission-request' || state === 'processing'} aria-label={`${label}. Say ${phrase}`}><span aria-hidden="true">MIC</span><strong>{label}</strong><small>Say: “{phrase}”</small>{state === 'recording' && <i className="audio-wave" aria-hidden="true"><b /><b /><b /><b /><b /></i>}</button>{state === 'success' && <p className="voice-feedback"><strong>{transcript}</strong><span>Your speech was transcribed. Miss Julie can use it now.</span><button className="world-button" type="button" onClick={() => { setState('retry'); setTranscript(''); onComplete?.() }}>Continue practice</button></p>}{state === 'error' && <p className="context-feedback gentle"><strong>{error}</strong><button className="world-button" type="button" onClick={() => setState('idle')}>Try microphone again</button></p>}</div>
}

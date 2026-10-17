'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type AudioRecorderStatus = 'idle' | 'requesting-permission' | 'recording' | 'processing' | 'success' | 'error'

export interface AudioRecorderResult {
  audioBlob: Blob | null
  mimeType: string
  durationMs: number
}

const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']

function selectMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

function permissionMessage(error: unknown) {
  if (error instanceof DOMException && error.name === 'NotFoundError') return 'No microphone was found. Please connect one and try again.'
  if (error instanceof DOMException && error.name === 'NotReadableError') return 'Your microphone is busy. Please close other apps using it and try again.'
  if (error instanceof DOMException && error.name === 'NotAllowedError') return 'Microphone permission is needed to speak with Miss Julie. Please allow microphone access and try again.'
  return error instanceof Error ? error.message : 'I could not access your microphone. Please try again.'
}

export function useAudioRecorder({ maxDurationMs = 10000, minDurationMs = 250 } = {}) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const [status, setStatus] = useState<AudioRecorderStatus>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<AudioRecorderResult>({ audioBlob: null, mimeType: '', durationMs: 0 })

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
  }, [])

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') {
      setStatus('processing')
      recorder.stop()
    }
  }, [])

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.onstop = null
    if (recorder?.state === 'recording') recorder.stop()
    chunksRef.current = []
    cleanup()
    setResult({ audioBlob: null, mimeType: '', durationMs: 0 })
    setStatus('idle')
  }, [cleanup])

  const startRecording = useCallback(async () => {
    if (recorderRef.current?.state === 'recording') return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Voice recording is not available in this browser.')
      setStatus('error')
      return
    }
    setError('')
    setStatus('requesting-permission')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      const mimeType = selectMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      startedAtRef.current = performance.now()
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data) }
      recorder.onstop = () => {
        const durationMs = Math.round(performance.now() - startedAtRef.current)
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' })
        cleanup()
        if (!blob.size || durationMs < minDurationMs) {
          setResult({ audioBlob: null, mimeType: blob.type, durationMs })
          setError('I could not hear enough. Please try again.')
          setStatus('error')
          return
        }
        setResult({ audioBlob: blob, mimeType: blob.type, durationMs })
        setStatus('success')
      }
      recorder.start()
      setStatus('recording')
      timerRef.current = window.setTimeout(stopRecording, maxDurationMs)
    } catch (caught) {
      cleanup()
      setError(permissionMessage(caught))
      setStatus('error')
    }
  }, [cleanup, maxDurationMs, minDurationMs, stopRecording])

  useEffect(() => () => {
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
    cleanup()
  }, [cleanup])

  return { status, error, ...result, startRecording, stopRecording, cancelRecording, reset: () => { setError(''); setStatus('idle'); setResult({ audioBlob: null, mimeType: '', durationMs: 0 }) } }
}

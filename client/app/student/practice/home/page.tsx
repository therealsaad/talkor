'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Mic, Square, UsersRound } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { progressService, type HomePracticeReflection } from '@/services/progress-service'

export default function FamilyConversationPracticePage() {
  const { student } = useAuth()
  const recorder = useAudioRecorder({ maxDurationMs: 90000, minDurationMs: 1000 })
  const [audioUrl, setAudioUrl] = useState('')
  const [savedAudioBlob, setSavedAudioBlob] = useState<Blob | null>(null)
  const [savedAudioUrl, setSavedAudioUrl] = useState('')
  const [audioLoading, setAudioLoading] = useState(false)
  const [reflection, setReflection] = useState('')
  const [saved, setSaved] = useState<HomePracticeReflection | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!student?.id) return
    let alive = true
    progressService.getHomePractice().then(async (previous) => {
      if (!alive || !previous) return
      setSaved(previous)
      setReflection(previous.reflection)
      if (previous.hasAudio) {
        setAudioLoading(true)
        try {
          const blob = await progressService.getHomePracticeAudio()
          if (alive) setSavedAudioBlob(blob)
        } catch {
          if (alive) setSaveError('Your saved recording could not be loaded. Please try again later.')
        } finally {
          if (alive) setAudioLoading(false)
        }
      }
    }).catch(() => {
      if (alive) setSaveError('Your previous reflection could not be loaded. Please try again later.')
    })
    return () => { alive = false }
  }, [student?.id])

  useEffect(() => {
    if (!recorder.audioBlob) {
      setAudioUrl('')
      return
    }
    const url = URL.createObjectURL(recorder.audioBlob)
    setAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [recorder.audioBlob])

  useEffect(() => {
    if (!savedAudioBlob) {
      setSavedAudioUrl('')
      return
    }
    const url = URL.createObjectURL(savedAudioBlob)
    setSavedAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [savedAudioBlob])

  async function saveReflection() {
    if (!student?.id || (!recorder.audioBlob && !saved?.hasAudio) || !reflection.trim()) return
    setSaving(true)
    try {
      const value = await progressService.saveHomePractice(reflection.trim(), recorder.audioBlob || undefined)
      setSaved(value)
      setIsDirty(false)
      if (recorder.audioBlob) setSavedAudioBlob(recorder.audioBlob)
      setSaveError('')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Your practice could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const recording = recorder.status === 'recording'
  const busy = recorder.status === 'requesting-permission' || recorder.status === 'processing'
  const audioType = recorder.audioBlob?.type || savedAudioBlob?.type || recorder.mimeType
  const extension = audioType.includes('mp4') ? 'm4a' : audioType.includes('ogg') ? 'ogg' : 'webm'
  const currentAudioUrl = audioUrl || (recording ? '' : savedAudioUrl)
  const canSave = Boolean(recorder.audioBlob || saved?.hasAudio)

  return <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fff8df, #ecf9ff)', padding: '24px 16px 72px', color: '#18364a' }}>
    <div style={{ maxWidth: 750, margin: '0 auto' }}>
      <Link href="/student/practice" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#235270', fontWeight: 750, marginBottom: 26 }}><ArrowLeft size={18} /> Practice room</Link>
      <section style={{ background: '#fff', border: '1px solid #d9e8e5', borderRadius: 24, padding: 'clamp(20px, 5vw, 38px)', boxShadow: '0 16px 45px #24475b18' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#137d6e', fontWeight: 800, textTransform: 'uppercase', fontSize: 13, letterSpacing: '.08em' }}><UsersRound size={24} /> Level 1 home practice</div>
        <h1 style={{ fontSize: 'clamp(30px, 6vw, 44px)', lineHeight: 1.1, margin: '14px 0' }}>Talk about favourites at home</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6 }}>Ask a family member about a favourite thing and why they like it. Ask one follow-up question, then share your own favourite.</p>
        <ol style={{ lineHeight: 1.8, paddingLeft: 24 }}>
          <li>Ask permission before recording together.</li>
          <li>Tap record and have your conversation. You have up to 90 seconds.</li>
          <li>Listen, download the recording, and write what improved in your English.</li>
        </ol>

        <div style={{ background: '#f1faf7', border: '1px solid #c8e8dc', borderRadius: 18, padding: 20, marginTop: 24 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Record your conversation</h2>
          <button type="button" disabled={busy} onClick={() => recording ? recorder.stopRecording() : (setIsDirty(true), setSaveError(''), recorder.reset(), void recorder.startRecording())} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: 0, borderRadius: 14, padding: '13px 18px', background: recording ? '#a3214e' : '#ffc94c', color: recording ? '#fff' : '#18364a', fontWeight: 800, cursor: busy ? 'wait' : 'pointer' }}>
            {recording ? <Square size={19} /> : <Mic size={19} />}{recording ? 'Stop recording' : busy ? 'Preparing microphone…' : recorder.audioBlob ? 'Record again' : 'Start recording'}
          </button>
          {recording ? <p role="status" style={{ color: '#a3214e', fontWeight: 700 }}>Recording now. Tap stop when you finish.</p> : null}
          {recorder.error ? <p role="alert" style={{ color: '#a3214e' }}>{recorder.error}</p> : null}
          {audioLoading ? <p role="status">Loading your saved recording…</p> : null}
          {currentAudioUrl ? <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
            <audio controls src={currentAudioUrl} style={{ width: '100%' }} aria-label="Your family conversation recording" />
            <a href={currentAudioUrl} download={`talkora-family-conversation.${extension}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: 'fit-content', color: '#065f55', fontWeight: 800 }}><Download size={17} /> Download recording</a>
            <small>{recorder.audioBlob ? 'Save your practice below to upload this recording for your teacher and school.' : 'This recording is saved to your account and can be played by your teacher and school.'}</small>
          </div> : null}
        </div>

        <div style={{ marginTop: 28 }}>
          <label htmlFor="family-reflection" style={{ display: 'block', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>What improved in your English?</label>
          <p style={{ margin: '0 0 12px' }}>For example: “I asked a follow-up question and spoke more clearly.”</p>
          <textarea id="family-reflection" value={reflection} onChange={(event) => { setReflection(event.target.value); setIsDirty(true) }} rows={4} maxLength={1000} placeholder="I can now…" style={{ width: '100%', boxSizing: 'border-box', padding: 14, border: '1px solid #afcbc5', borderRadius: 12, font: 'inherit', resize: 'vertical' }} />
          <button type="button" onClick={() => void saveReflection()} disabled={saving || !student?.id || !canSave || !reflection.trim()} style={{ marginTop: 14, border: 0, borderRadius: 12, padding: '12px 18px', background: '#197e69', color: '#fff', fontWeight: 800, opacity: saving || !student?.id || !canSave || !reflection.trim() ? .5 : 1 }}>{saving ? 'Saving…' : 'Save my practice'}</button>
          {saveError ? <p role="alert" style={{ color: '#a3214e' }}>{saveError}</p> : null}
          {saved && !isDirty ? <p role="status" style={{ color: '#066047', fontWeight: 750 }}>Your recording and reflection are saved. Your teacher and school can listen to the recording.</p> : null}
        </div>
      </section>
    </div>
  </main>
}

'use client'

import React, { useState } from 'react'
import { getApiUrl, getStoredToken } from '@/lib/api-client'
import { Volume2, Play, Square, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'

export default function VoiceLabPage() {
  const [text, setText] = useState('Hi Aarav! Welcome back. Ready for another English adventure?')
  const [voice, setVoice] = useState('talkora-priya-v6-indian-kids-teacher')
  const [language, setLanguage] = useState('en-IN')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [cacheStatus, setCacheStatus] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [headers, setHeaders] = useState<Record<string, string>>({})

  async function handleGenerate() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setLatencyMs(null)
    setCacheStatus(null)

    const startTime = performance.now()
    try {
      const token = getStoredToken()
      const res = await fetch(getApiUrl('/voice/synthesize'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: text.trim() }),
      })

      const elapsed = Math.round(performance.now() - startTime)
      setLatencyMs(elapsed)

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`TTS synthesis failed (${res.status}): ${errorText}`)
      }

      const cacheHdr = res.headers.get('x-talkora-cache') || 'UNKNOWN'
      setCacheStatus(cacheHdr)

      const headerMap: Record<string, string> = {}
      res.headers.forEach((val, key) => {
        if (key.startsWith('x-talkora') || key === 'content-type' || key === 'content-length') {
          headerMap[key] = val
        }
      })
      setHeaders(headerMap)

      const blob = await res.blob()
      if (blob.size === 0) {
        throw new Error('Received empty audio blob')
      }

      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      const player = new Audio(url)
      player.onplay = () => setIsPlaying(true)
      player.onended = () => setIsPlaying(false)
      player.onerror = () => {
        setIsPlaying(false)
        setError('Audio playback error')
      }
      setAudioPlayer(player)
      player.play()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to synthesize speech')
    } finally {
      setLoading(false)
    }
  }

  function handlePlay() {
    if (audioPlayer) {
      audioPlayer.currentTime = 0
      audioPlayer.play()
    }
  }

  function handleStop() {
    if (audioPlayer) {
      audioPlayer.pause()
      audioPlayer.currentTime = 0
      setIsPlaying(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a192f', color: '#f8fafc', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#112240', border: '1px solid #233554', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Volume2 size={28} color="#ffd83d" />
          <h1 style={{ margin: 0, fontSize: '24px', color: '#ffd83d' }}>Talkora Development Voice Lab</h1>
        </div>
        <p style={{ color: '#8892b0', fontSize: '14px', marginBottom: '24px' }}>
          Test and verify free local Priya TTS synthesis, latency, caching headers, and audio playback.
        </p>

        {/* Input Controls */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#ccd6f6', marginBottom: '8px' }}>
            Text to Synthesize:
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            style={{ width: '100%', background: '#0a192f', border: '1px solid #233554', borderRadius: '8px', color: '#fff', padding: '12px', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box' }}
            placeholder="Type text for Miss Julie to speak..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#ccd6f6', marginBottom: '8px' }}>
              Local Voice Profile:
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              style={{ width: '100%', background: '#0a192f', border: '1px solid #233554', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '14px' }}
            >
              <option value="talkora-priya-v6-indian-kids-teacher">Miss Julie (Priya - Indian English)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#ccd6f6', marginBottom: '8px' }}>
              Language:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ width: '100%', background: '#0a192f', border: '1px solid #233554', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '14px' }}
            >
              <option value="en-IN">English (Indian Accent - en-IN)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffd83d',
              color: '#0a192f',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontWeight: 800,
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? 'Synthesizing...' : 'Generate Speech'}
          </button>

          {audioUrl && (
            <>
              <button
                onClick={handlePlay}
                disabled={isPlaying}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                }}
              >
                <Play size={16} /> Play Audio
              </button>

              <button
                onClick={handleStop}
                disabled={!isPlaying}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: !isPlaying ? 'not-allowed' : 'pointer',
                }}
              >
                <Square size={16} /> Stop
              </button>
            </>
          )}
        </div>

        {/* Results & Inspection */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '14px', color: '#fca5a5', marginBottom: '20px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {latencyMs !== null && (
          <div style={{ background: '#0a192f', border: '1px solid #233554', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#10b981' }}>
              <CheckCircle2 size={20} />
              <strong style={{ fontSize: '16px' }}>Synthesis Successful</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#112240', padding: '12px', borderRadius: '8px', border: '1px solid #233554' }}>
                <span style={{ fontSize: '11px', color: '#8892b0', textTransform: 'uppercase' }}>Total Latency</span>
                <strong style={{ display: 'block', fontSize: '20px', color: '#ffd83d', marginTop: '4px' }}>{latencyMs} ms</strong>
              </div>

              <div style={{ background: '#112240', padding: '12px', borderRadius: '8px', border: '1px solid #233554' }}>
                <span style={{ fontSize: '11px', color: '#8892b0', textTransform: 'uppercase' }}>Cache Status</span>
                <strong style={{ display: 'block', fontSize: '20px', color: cacheStatus === 'HIT' ? '#10b981' : '#38bdf8', marginTop: '4px' }}>{cacheStatus}</strong>
              </div>

              <div style={{ background: '#112240', padding: '12px', borderRadius: '8px', border: '1px solid #233554' }}>
                <span style={{ fontSize: '11px', color: '#8892b0', textTransform: 'uppercase' }}>Provider</span>
                <strong style={{ display: 'block', fontSize: '15px', color: '#e2e8f0', marginTop: '4px' }}>Python Parler TTS</strong>
              </div>
            </div>

            {Object.keys(headers).length > 0 && (
              <div>
                <span style={{ fontSize: '12px', color: '#8892b0', fontWeight: 'bold' }}>Response Headers:</span>
                <pre style={{ background: '#112240', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#a5b4fc', overflowX: 'auto', marginTop: '6px' }}>
                  {JSON.stringify(headers, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

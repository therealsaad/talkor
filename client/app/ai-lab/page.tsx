'use client'

import React, { useState } from 'react'
import { getApiUrl, getStoredToken } from '@/lib/api-client'
import { Bot, Send, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react'

export default function AILabPage() {
  const [studentMessage, setStudentMessage] = useState('My favourite sport is cricket.')
  const [grade, setGrade] = useState(4)
  const [unitTitle, setUnitTitle] = useState('My Favourite Things')
  const [activityTarget, setActivityTarget] = useState('What is your favourite sport?')
  const [stage, setStage] = useState('SPEAK')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rawResponse, setRawResponse] = useState<any>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  async function handleSend() {
    if (!studentMessage.trim()) return
    setLoading(true)
    setError('')
    setRawResponse(null)
    setLatencyMs(null)

    const startTime = performance.now()
    try {
      const token = getStoredToken()
      const res = await fetch(getApiUrl('/ai/miss-julie'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: studentMessage.trim(),
          context: stage,
          unitTitle,
          activityTarget,
          grade,
        }),
      })

      const elapsed = Math.round(performance.now() - startTime)
      setLatencyMs(elapsed)

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`AI request failed (${res.status}): ${errText}`)
      }

      const json = await res.json()
      setRawResponse(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed')
    } finally {
      setLoading(false)
    }
  }

  const aiData = rawResponse?.data || rawResponse

  return (
    <div style={{ minHeight: '100vh', background: '#0a192f', color: '#f8fafc', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: '#112240', border: '1px solid #233554', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Bot size={28} color="#38bdf8" />
          <h1 style={{ margin: 0, fontSize: '24px', color: '#38bdf8' }}>Talkora Development AI Lab</h1>
        </div>
        <p style={{ color: '#8892b0', fontSize: '14px', marginBottom: '24px' }}>
          Direct test bench for local Ollama Qwen evaluation, structured response validation, and Miss Julie conversation turns.
        </p>

        {/* Form Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#ccd6f6', marginBottom: '6px' }}>
              Student Grade:
            </label>
            <input
              type="number"
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              style={{ width: '100%', background: '#0a192f', border: '1px solid #233554', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#ccd6f6', marginBottom: '6px' }}>
              Unit / Topic:
            </label>
            <input
              type="text"
              value={unitTitle}
              onChange={(e) => setUnitTitle(e.target.value)}
              style={{ width: '100%', background: '#0a192f', border: '1px solid #233554', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#ccd6f6', marginBottom: '6px' }}>
              Stage / Context:
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              style={{ width: '100%', background: '#0a192f', border: '1px solid #233554', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '14px', boxSizing: 'border-box' }}
            >
              <option value="SPEAK">SPEAK (Guided speaking)</option>
              <option value="INTERACT">INTERACT (Multi-turn conversation)</option>
              <option value="FOLLOW_UP">FOLLOW_UP (Question & reason)</option>
              <option value="FINAL_CHALLENGE">FINAL_CHALLENGE</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#ccd6f6', marginBottom: '6px' }}>
            Current Activity Prompt / Target:
          </label>
          <input
            type="text"
            value={activityTarget}
            onChange={(e) => setActivityTarget(e.target.value)}
            style={{ width: '100%', background: '#0a192f', border: '1px solid #233554', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#ccd6f6', marginBottom: '6px' }}>
            Student Message (Utterance):
          </label>
          <textarea
            value={studentMessage}
            onChange={(e) => setStudentMessage(e.target.value)}
            rows={3}
            style={{ width: '100%', background: '#0a192f', border: '1px solid #233554', borderRadius: '8px', color: '#fff', padding: '12px', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box' }}
            placeholder="Type what the student speaks..."
          />
        </div>

        <button
          onClick={handleSend}
          disabled={loading || !studentMessage.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#38bdf8',
            color: '#0a192f',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontWeight: 800,
            fontSize: '15px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginBottom: '24px',
          }}
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
          {loading ? 'Evaluating with Ollama Qwen...' : 'Evaluate Utterance'}
        </button>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '14px', color: '#fca5a5', marginBottom: '20px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {rawResponse && (
          <div style={{ background: '#0a192f', border: '1px solid #233554', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                <CheckCircle2 size={20} />
                <strong style={{ fontSize: '16px' }}>AI Evaluation Response</strong>
              </div>
              {latencyMs && <span style={{ color: '#ffd83d', fontSize: '13px', fontWeight: 'bold' }}>Latency: {latencyMs} ms</span>}
            </div>

            {/* Miss Julie Preview Reply */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#ffd83d', fontWeight: 'bold', textTransform: 'uppercase' }}>Miss Julie Reply:</span>
              <p style={{ fontSize: '16px', color: '#ffffff', margin: '6px 0 0', lineHeight: 1.4 }}>
                {aiData?.message} {aiData?.followUpQuestion ? <em>&ldquo;{aiData.followUpQuestion}&rdquo;</em> : null}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <span style={{ background: '#0284c7', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                  Emotion: {aiData?.emotion || 'encouraging'}
                </span>
                {aiData?.shouldRetry && (
                  <span style={{ background: '#f59e0b', color: '#000', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    Retry Required
                  </span>
                )}
                {aiData?.activityComplete && (
                  <span style={{ background: '#10b981', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    Activity Complete
                  </span>
                )}
              </div>
            </div>

            {/* Structured JSON */}
            <div>
              <span style={{ fontSize: '12px', color: '#8892b0', fontWeight: 'bold' }}>Validated Structured JSON:</span>
              <pre style={{ background: '#112240', padding: '14px', borderRadius: '8px', fontSize: '12px', color: '#a5b4fc', overflowX: 'auto', marginTop: '6px' }}>
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

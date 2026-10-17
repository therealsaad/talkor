'use client'

import { useState } from 'react'
import type { AIResponse, VoiceSession } from '@/services/types'
import { mockAIProvider } from '@/services/ai'

export function MissJulieSpeechBubble({ response }: { response: AIResponse }) { return <div className="speech-bubble" aria-live="polite">{response.message}<small>Miss Julie</small></div> }
export function MissJulieVoiceAgent({ studentId, lessonId }: { studentId: string; lessonId: string }) { const [session, setSession] = useState<VoiceSession>({ id: `voice-${Date.now()}`, studentId, lessonId, state: 'idle', startedAt: new Date().toISOString() }); const [response, setResponse] = useState<AIResponse>({ message: 'Take a breath. When you are ready, say the sentence aloud.', emotion: 'welcome' }); const start = async () => { setSession((current) => ({ ...current, state: 'processing' })); const next = await mockAIProvider.respond({ message: 'ready', studentId, lessonId }); setResponse(next); setSession((current) => ({ ...current, state: 'listening' })); }; return <div className="voice-agent"><MissJulieSpeechBubble response={response} /><button className="world-button" type="button" onClick={start}>{session.state === 'listening' ? 'Listening…' : 'Start speaking'}</button></div> }

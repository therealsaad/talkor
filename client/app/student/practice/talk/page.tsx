'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowLeft,
  Send,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Flame,
  Star,
  Volume2,
} from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { aiService, type MissJulieAIResponse } from '@/services/ai-service'
import { voiceService } from '@/services/voice-service'
import { useMissJulieVoice } from '@/hooks/use-miss-julie-voice'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { MissJulieCharacter, type JulieVisualState } from '@/components/student/lesson/miss-julie-character'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { talkoraAssets } from '@/config/talkora-assets'

interface MessageTurn {
  id: string
  role: 'student' | 'missJulie'
  text: string
  emotion?: string
  correction?: {
    needed: boolean
    original: string
    corrected: string
    explanation: string
  }
  modelSentence?: string | null
  hint?: string | null
  timestamp: Date
}

export default function TalkWithMissJuliePage() {
  const router = useRouter()
  const { student, session } = useAuth()
  const julieVoice = useMissJulieVoice()
  const recorder = useAudioRecorder({ minDurationMs: 300, maxDurationMs: 12000 })

  const [conversationId, setConversationId] = useState<string>('')
  const [messages, setMessages] = useState<MessageTurn[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [julieState, setJulieState] = useState<JulieVisualState>('greeting')
  const [suggestedOptions, setSuggestedOptions] = useState<string[]>([])
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null)
  const [conversationComplete, setConversationComplete] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [connectionRetry, setConnectionRetry] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize Conversation Session on mount
  useEffect(() => {
    let alive = true

    async function initConversation() {
      try {
        setLoading(true)
        setConnectionError('')
        setConversationComplete(false)
        const startRes = await aiService.startConversation({ mode: 'FREE_TALK' })
        if (!alive) return

        setConversationId(startRes.conversationId)
        const initialTurn: MessageTurn = {
          id: `turn-init-${Date.now()}`,
          role: 'missJulie',
          text: startRes.message,
          emotion: startRes.emotion,
          timestamp: new Date(),
        }
        setMessages([initialTurn])
        if (startRes.suggestedResponses) {
          setSuggestedOptions(startRes.suggestedResponses)
        }

        setLoading(false)
        setJulieState('speaking')
        await julieVoice.speak(initialTurn.text, initialTurn.id, 'CONVERSATION')
        if (alive) setJulieState('listening')
      } catch (err) {
        console.error('Failed to start conversation session:', err)
        if (alive) {
          setConversationId('')
          setConnectionError('Miss Julie could not start this practice session. Please try again.')
          setLoading(false)
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (student) {
      void initConversation()
    }

    return () => {
      alive = false
      julieVoice.stop()
    }
  }, [student?.id, connectionRetry])

  // Handle recorded audio submission
  useEffect(() => {
    if (recorder.status === 'success' && recorder.audioBlob) {
      void handleAudioSubmit(recorder.audioBlob, recorder.durationMs)
    }
  }, [recorder.status, recorder.audioBlob, recorder.durationMs])

  const handleAudioSubmit = async (audioBlob: Blob, durationMs: number) => {
    if (conversationComplete) return
    try {
      setProcessing(true)
      setJulieState('thinking')

      // STT transcription
      const transcription = await voiceService.transcribeAudio(audioBlob, durationMs)
      const transcriptText = transcription.trim()

      if (!transcriptText) {
        setFeedbackToast('I could not hear clearly. Please try speaking again!')
        setJulieState('listening')
        setProcessing(false)
        return
      }

      // sendStudentMessage owns the processing state for the AI turn.
      setProcessing(false)
      await sendStudentMessage(transcriptText, 'MIC')
    } catch (err) {
      console.warn('Speech transcription issue:', err)
      setFeedbackToast(err instanceof Error ? err.message : 'Could not transcribe audio. Please tap the mic and try again.')
      setJulieState('listening')
      setProcessing(false)
    }
  }

  const sendStudentMessage = async (text: string, inputMode: 'MIC' | 'TEXT' | 'OPTION' = 'TEXT') => {
    if (!text.trim() || !conversationId || processing || conversationComplete) return

    const studentTurn: MessageTurn = {
      id: `turn-student-${Date.now()}`,
      role: 'student',
      text: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, studentTurn])
    setTextInput('')
    setSuggestedOptions([])
    setProcessing(true)
    setJulieState('thinking')

    try {
      const aiResponse = await aiService.sendTurn({
        conversationId,
        message: text.trim(),
        context: 'conversation',
        inputMode,
      })

      const teacherTurn: MessageTurn = {
        id: `turn-julie-${Date.now()}`,
        role: 'missJulie',
        text: [aiResponse.message, aiResponse.followUpQuestion].filter(Boolean).join(' '),
        emotion: aiResponse.emotion,
        correction: aiResponse.correction,
        modelSentence: aiResponse.modelSentence,
        hint: aiResponse.hint,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, teacherTurn])
      if (aiResponse.conversation?.complete) setConversationComplete(true)

      // Determine Julie Visual Emotion
      if (aiResponse.correction?.needed) {
        setJulieState('gentle-correction')
      } else if (aiResponse.emotion === 'celebrating' || aiResponse.emotion === 'delighted') {
        setJulieState('celebrating')
      } else if (aiResponse.emotion === 'encouraging') {
        setJulieState('encouraging')
      } else {
        setJulieState('speaking')
      }

      await julieVoice.speak(teacherTurn.text, teacherTurn.id, 'CONVERSATION')
      setJulieState('listening')
    } catch (err) {
      console.error('Conversation turn error:', err)
      setFeedbackToast('Miss Julie could not reply. Please try again.')
      setJulieState('listening')
    } finally {
      setProcessing(false)
    }
  }

  const handleEndSession = async () => {
    try {
      if (conversationId) {
        await aiService.endConversation(conversationId)
      }
    } catch {
      // safe exit
    } finally {
      router.push('/student/practice')
    }
  }

  const handleMicClick = () => {
    if (conversationComplete) return
    if (recorder.status === 'recording') {
      recorder.stopRecording()
    } else {
      recorder.reset()
      void recorder.startRecording()
      setJulieState('listening')
    }
  }

  if (loading) {
    return <TalkoraLoader message="Connecting you with Miss Julie..." />
  }

  if (connectionError) {
    return <main style={{ minHeight: '100svh', background: '#08203a', color: '#fff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div role="alert" style={{ maxWidth: 440, background: '#fff', color: '#18364a', borderRadius: 18, padding: 28, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24 }}>Practice is unavailable</h1>
        <p>{connectionError}</p>
        <button type="button" onClick={() => setConnectionRetry((value) => value + 1)} style={{ background: '#ffd84d', border: 0, borderRadius: 10, padding: '12px 18px', fontWeight: 800 }}>Try again</button>
        <p><Link href="/student/practice">Back to practice</Link></p>
      </div>
    </main>
  }

  const latestTeacherMessage = [...messages].reverse().find((m) => m.role === 'missJulie')
  const studentFirstName = student?.fullName?.split(' ')[0] || 'Explorer'

  return (
    <div className="talkora-talking-room">
      {/* Header Bar */}
      <header className="talkora-talking-header">
        <button
          type="button"
          onClick={handleEndSession}
          className="talkora-talking-back-btn"
          aria-label="Back to Practice"
        >
          <ArrowLeft size={18} />
          <span>Exit Conversation</span>
        </button>

        <div className="talkora-talking-hud-title">
          <Sparkles size={18} className="talkora-sparkle-icon" />
          <span>Talking with Miss Julie</span>
        </div>

        <button type="button" onClick={() => void julieVoice.replay()} aria-label="Listen to Miss Julie again">
          <Volume2 size={18} /> Listen again
        </button>

      </header>

      {/* Main Studio Arena */}
      <div className="talkora-talking-main">
        {/* Left: Miss Julie Character & Visual Feedback */}
        <div className="talkora-talking-character-col">
          <div className="talkora-talking-julie-wrap">
            <MissJulieCharacter
              state={julieState}
              isSpeaking={julieVoice.isSpeaking}
            />
          </div>
        </div>

        {/* Right: Conversation Stream & Interactive Controls */}
        <div className="talkora-talking-chat-col">
          <div className="talkora-talking-messages-stream">
            {messages.map((turn) => (
              <motion.div
                key={turn.id}
                className={`talkora-chat-bubble-wrap talkora-chat-bubble-wrap--${turn.role}`}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <div className={`talkora-chat-bubble talkora-chat-bubble--${turn.role}`}>
                  <div className="talkora-chat-bubble__author">
                    {turn.role === 'missJulie' ? (
                      <span className="talkora-author-tag">
                        <Sparkles size={12} /> Miss Julie
                      </span>
                    ) : (
                      <span className="talkora-author-tag talkora-author-tag--student">
                        {studentFirstName}
                      </span>
                    )}
                  </div>

                  <p className="talkora-chat-bubble__text">{turn.text}</p>

                  {/* Correction feedback highlight if present */}
                  {turn.correction?.needed && (
                    <div className="talkora-correction-box">
                      <div className="talkora-correction-box__title">
                        <CheckCircle2 size={14} /> Gentle English Tip
                      </div>
                      <p className="talkora-correction-box__explanation">
                        {turn.correction.explanation}
                      </p>
                      {turn.correction.corrected && (
                        <div className="talkora-correction-box__model">
                          <span>Try saying:</span>
                          <strong>&quot;{turn.correction.corrected}&quot;</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Model sentence prompt */}
                  {turn.modelSentence && !turn.correction?.needed && (
                    <div className="talkora-model-sentence-box">
                      <small>Example sentence:</small>
                      <strong>{turn.modelSentence}</strong>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {processing && (
              <motion.div
                className="talkora-chat-bubble-wrap talkora-chat-bubble-wrap--missJulie"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="talkora-chat-bubble talkora-chat-bubble--thinking">
                  <span className="talkora-thinking-dots">
                    <i /><i /><i />
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Miss Julie is listening & thinking...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Response Chips */}
          {suggestedOptions.length > 0 && !processing && !conversationComplete && (
            <div className="talkora-talking-options-row">
              {suggestedOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => void sendStudentMessage(opt, 'OPTION')}
                  className="talkora-suggested-chip"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Controls: Mic & Text Input */}
          {conversationComplete ? <div className="talkora-talking-session-complete" role="status">
            <CheckCircle2 size={25} />
            <div><strong>Five turns complete!</strong><p>Great practice. Your conversation is saved.</p></div>
            <Link href="/student/practice">Back to practice</Link>
            <Link href="/student/levels">Continue adventure</Link>
          </div> : <div className="talkora-talking-controls">
            {feedbackToast && (
              <div className="talkora-feedback-toast">
                <span>{feedbackToast}</span>
                <button type="button" onClick={() => setFeedbackToast(null)}>
                  ✕
                </button>
              </div>
            )}

            <div className="talkora-mic-action-area">
              <button
                type="button"
                onClick={handleMicClick}
                disabled={processing}
                className={`talkora-big-mic-btn ${
                  recorder.status === 'recording'
                    ? 'talkora-big-mic-btn--recording'
                    : ''
                }`}
                aria-label={
                  recorder.status === 'recording'
                    ? 'Stop speaking'
                    : 'Start speaking with Miss Julie'
                }
              >
                {recorder.status === 'recording' ? (
                  <MicOff size={34} />
                ) : (
                  <Mic size={34} />
                )}
                {recorder.status === 'recording' && (
                  <span className="talkora-mic-pulse" />
                )}
              </button>

              <div className="talkora-mic-status-label">
                {recorder.status === 'recording'
                  ? 'Listening to you... Tap to finish'
                  : processing
                  ? 'Miss Julie is thinking...'
                  : 'Tap the microphone & speak with Miss Julie'}
              </div>
            </div>

            {/* Optional Keyboard Fallback for quiet environments */}
            <div className="talkora-text-fallback-row">
              <button
                type="button"
                onClick={() => setShowKeyboard((prev) => !prev)}
                className="talkora-toggle-keyboard-btn"
              >
                {showKeyboard ? 'Hide Typing' : 'Prefer typing? Tap here'}
              </button>

              {showKeyboard && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void sendStudentMessage(textInput, 'TEXT')
                  }}
                  className="talkora-text-input-form"
                >
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your message to Miss Julie..."
                    className="talkora-text-input"
                    disabled={processing}
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim() || processing}
                    className="talkora-send-btn"
                  >
                    <Send size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>}
        </div>
      </div>

      <style jsx>{`
        .talkora-talking-session-complete {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          background: #eafff5;
          border: 2px solid #78d7ab;
          border-radius: 16px;
          color: #124a39;
          padding: 16px;
        }

        .talkora-talking-session-complete p { margin: 3px 0 0; }
        .talkora-talking-session-complete a {
          background: #123f4f;
          border-radius: 10px;
          color: #fff;
          font-weight: 800;
          padding: 10px 12px;
          text-decoration: none;
        }

        .talkora-talking-room {
          min-height: calc(100svh - 80px);
          display: flex;
          flex-direction: column;
          background: radial-gradient(circle at 50% 20%, #0d2847 0%, #061528 65%, #030d1b 100%);
          color: #ffffff;
          padding: 16px 24px 24px;
        }

        .talkora-talking-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .talkora-talking-back-btn,
        .talkora-talking-replay-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #e2e8f0;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 180ms ease;
        }

        .talkora-talking-back-btn:hover,
        .talkora-talking-replay-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }

        .talkora-talking-hud-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 700;
          color: #38bdf8;
        }

        .talkora-talking-main {
          flex: 1;
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 24px;
          margin-top: 16px;
          min-height: 520px;
        }

        .talkora-talking-character-col {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 24px;
        }

        .talkora-talking-julie-wrap {
          max-width: 320px;
          width: 100%;
        }

        .talkora-talking-chat-col {
          display: flex;
          flex-direction: column;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .talkora-talking-messages-stream {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 480px;
        }

        .talkora-chat-bubble-wrap {
          display: flex;
          width: 100%;
        }

        .talkora-chat-bubble-wrap--missJulie {
          justify-content: flex-start;
        }

        .talkora-chat-bubble-wrap--student {
          justify-content: flex-end;
        }

        .talkora-chat-bubble {
          max-width: 82%;
          padding: 14px 18px;
          border-radius: 20px;
          font-size: 15px;
          line-height: 1.5;
        }

        .talkora-chat-bubble--missJulie {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #f8fafc;
          border-top-left-radius: 4px;
        }

        .talkora-chat-bubble--student {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          border-top-right-radius: 4px;
        }

        .talkora-chat-bubble--thinking {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(30, 41, 59, 0.6);
        }

        .talkora-author-tag {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #38bdf8;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        }

        .talkora-author-tag--student {
          color: #bae6fd;
        }

        .talkora-correction-box {
          margin-top: 10px;
          padding: 10px 14px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 12px;
          color: #fef3c7;
          font-size: 13px;
        }

        .talkora-correction-box__title {
          font-weight: 700;
          color: #fbbf24;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .talkora-correction-box__model {
          margin-top: 6px;
          display: flex;
          gap: 6px;
          color: #ffffff;
        }

        .talkora-model-sentence-box {
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(56, 189, 248, 0.1);
          border-radius: 10px;
          font-size: 13px;
          color: #bae6fd;
        }

        .talkora-talking-options-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 8px 24px;
        }

        .talkora-suggested-chip {
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #bae6fd;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 13px;
          cursor: pointer;
          transition: all 160ms ease;
        }

        .talkora-suggested-chip:hover {
          background: rgba(56, 189, 248, 0.25);
          color: #ffffff;
        }

        .talkora-talking-controls {
          padding: 18px 24px;
          background: rgba(10, 18, 34, 0.8);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .talkora-mic-action-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .talkora-big-mic-btn {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          border: none;
          color: #ffffff;
          display: grid;
          place-items: center;
          cursor: pointer;
          position: relative;
          box-shadow: 0 0 24px rgba(2, 132, 199, 0.5);
          transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .talkora-big-mic-btn:hover:not(:disabled) {
          transform: scale(1.06);
          box-shadow: 0 0 32px rgba(2, 132, 199, 0.8);
        }

        .talkora-big-mic-btn--recording {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 0 32px rgba(239, 68, 68, 0.8);
          animation: talkora-pulse 1.4s infinite;
        }

        @keyframes talkora-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        .talkora-mic-status-label {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
        }

        .talkora-text-fallback-row {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .talkora-toggle-keyboard-btn {
          background: none;
          border: none;
          color: #64748b;
          font-size: 12px;
          text-decoration: underline;
          cursor: pointer;
        }

        .talkora-text-input-form {
          width: 100%;
          max-width: 540px;
          display: flex;
          gap: 8px;
        }

        .talkora-text-input {
          flex: 1;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 999px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
        }

        .talkora-text-input:focus {
          border-color: #38bdf8;
        }

        .talkora-send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #0284c7;
          border: none;
          color: #ffffff;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .talkora-feedback-toast {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fecaca;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .talkora-feedback-toast button {
          background: none;
          border: none;
          color: #fecaca;
          cursor: pointer;
        }

        .talkora-thinking-dots i {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #38bdf8;
          border-radius: 50%;
          margin: 0 2px;
          animation: dot-wave 1.2s infinite;
        }

        .talkora-thinking-dots i:nth-child(2) { animation-delay: 0.2s; }
        .talkora-thinking-dots i:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dot-wave {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }

        @media (max-width: 900px) {
          .talkora-talking-main {
            grid-template-columns: 1fr;
          }
          .talkora-talking-character-col {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

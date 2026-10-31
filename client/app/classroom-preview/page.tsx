'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowLeft, RefreshCw, ShieldAlert, GraduationCap, Home } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { MissJulieTeachingStage } from '@/components/student/lesson/miss-julie-teaching-stage'
import { VoiceInteractionBeacon } from '@/components/student/lesson/voice-interaction-beacon'
import {
  SmartLearningBoard,
  SAMPLE_KG_PHONICS_A,
  SAMPLE_CLASS1_VOCAB_SKIP,
  SAMPLE_CLASS1_STORY_FIRSTDAY,
  SAMPLE_CHOICES_SKIP_RUN,
  type SmartBoardMode,
} from '@/components/student/lesson/smart-learning-board'
import type { JulieVisualState } from '@/components/student/lesson/miss-julie-character'

/**
 * Isolated Preview Showcase for Sprint 1 Presentation Components:
 * - MissJulieTeachingStage
 * - SmartLearningBoard
 * - VoiceInteractionBeacon
 * 
 * SAFETY GUARDS:
 * 1. Protected from production student flows (not linked in student navigation).
 * 2. Clearly distinguishes simulated actions from actual learning.
 * 3. Never awards or displays unconfirmed XP as earned.
 * 4. Does NOT alter production lesson orchestration or touch student progress.
 */
export default function ClassroomPreviewPage() {
  const { status, role } = useAuth()
  const isStudentSession = status === 'authenticated' && role === 'STUDENT'

  const [julieState, setJulieState] = useState<JulieVisualState>('teaching')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [boardMode, setBoardMode] = useState<SmartBoardMode>('vocabulary')
  const [selectedChoice, setSelectedChoice] = useState<string>('skip')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isError, setIsError] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [teacherText, setTeacherText] = useState(
    'Look at the picture on the board! Can you say: "I skip to school"?'
  )

  function simulateTeacherSpeak() {
    setIsSpeaking(true)
    setIsRecording(false)
    setIsProcessing(false)
    setIsError(false)
    setShowFeedback(false)
    setJulieState('speaking')
    setTeacherText('See me skip, see me run! I am going to school like everyone.')
  }

  function simulateStopTeacherSpeak() {
    setIsSpeaking(false)
    setJulieState('listening')
  }

  function handleStartMic() {
    if (isSpeaking) return
    setIsRecording(true)
    setIsProcessing(false)
    setIsError(false)
    setShowFeedback(false)
    setJulieState('listening')
    setRecordSeconds(1)
  }

  function handleStopMic() {
    setIsRecording(false)
    setIsProcessing(true)
    setJulieState('thinking')
    setTimeout(() => {
      setIsProcessing(false)
      setJulieState('celebrating')
      setShowFeedback(true)
      setTeacherText('Wonderful! You spoke that with great confidence!')
    }, 1200)
  }

  function simulateErrorState() {
    setIsRecording(false)
    setIsProcessing(false)
    setIsError(true)
    setShowFeedback(false)
    setJulieState('gentle-correction')
    setTeacherText('I did not catch that clearly. Let us try together: say "skip"!')
  }

  function resetAll() {
    setIsSpeaking(false)
    setIsRecording(false)
    setIsProcessing(false)
    setIsError(false)
    setShowFeedback(false)
    setJulieState('teaching')
    setTeacherText('Look at the picture on the board! Can you say: "I skip to school"?')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 antialiased">
      {/* 1. TOP SAFETY BANNER: Explicit Staff Sandbox Disclaimer */}
      <div className="max-w-6xl mx-auto mb-4 p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-amber-400 flex-none" size={22} aria-hidden="true" />
          <div className="text-xs">
            <strong className="block text-amber-300 uppercase tracking-wider font-extrabold">
              STAFF &amp; DEVELOPER SANDBOX · NOT AN ACCREDITED LESSON
            </strong>
            <span>
              Simulated presentation demo. No student voice recordings, attempts, or XP are saved to the database.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Home size={14} /> Exit Sandbox
          </Link>
        </div>
      </div>

      {/* 2. STUDENT WARNING GUARD: If an authenticated student lands here */}
      {isStudentSession ? (
        <div className="max-w-6xl mx-auto mb-4 p-4 rounded-2xl bg-rose-500/20 border-2 border-rose-500/50 text-rose-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-rose-400 flex-none" size={24} />
            <div className="text-xs md:text-sm">
              <strong className="block text-rose-300 font-bold">You are signed in as a student!</strong>
              <span>This sandbox does not count toward your class lessons or stars. Click below to resume your real lesson.</span>
            </div>
          </div>
          <Link
            href="/student/continue"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex-none"
          >
            Resume My Lesson
          </Link>
        </div>
      ) : null}

      {/* Header bar */}
      <header className="max-w-6xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            aria-label="Back to Talkora"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-tight text-white">
                CLASSROOM PRESENTATION PREVIEW
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Sprint 1 Prototype
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Isolated visual review for Miss Julie Stage, Smart Board &amp; Voice Interaction Beacon
            </p>
          </div>
        </div>

        {/* Board Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          {(['phonics', 'vocabulary', 'storybook', 'choices'] as SmartBoardMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setBoardMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                boardMode === mode
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Miss Julie Teaching Stage */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <MissJulieTeachingStage
            state={julieState}
            isSpeaking={isSpeaking}
            teacherMessage={teacherText}
            onReplayTeacher={simulateTeacherSpeak}
          />

          {/* Interactive State Simulation Palette (Explicitly labeled as Demo) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Teacher Pose Simulator (UI Demo Only):
            </span>
            <span className="text-[11px] text-slate-400 block mb-2">
              Tests visual state transitions without making real AI calls.
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setJulieState('speaking')
                  setIsSpeaking(true)
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700"
              >
                🗣️ Speaking
              </button>
              <button
                type="button"
                onClick={() => {
                  setJulieState('listening')
                  setIsSpeaking(false)
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700"
              >
                👂 Listening
              </button>
              <button
                type="button"
                onClick={() => {
                  setJulieState('thinking')
                  setIsSpeaking(false)
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700"
              >
                🤔 Thinking
              </button>
              <button
                type="button"
                onClick={() => {
                  setJulieState('encouraging')
                  setIsSpeaking(false)
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700"
              >
                👍 Encouraging
              </button>
              <button
                type="button"
                onClick={() => {
                  setJulieState('celebrating')
                  setIsSpeaking(false)
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700"
              >
                🎉 Celebrating
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 flex items-center gap-1"
              >
                <RefreshCw size={12} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Smart Learning Board & Voice Interaction Beacon */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Smart Learning Board: Uses potentialXp (never falsely claiming +XP earned) */}
          <SmartLearningBoard
            mode={boardMode}
            title={
              boardMode === 'phonics'
                ? 'KINDERGARTEN ALPHABET GARDEN (PREVIEW)'
                : 'ENGLISH BALBHARATI · CLASS 1 (PREVIEW)'
            }
            subtitle={
              boardMode === 'phonics'
                ? 'Letter Sound Discovery · A for Apple'
                : 'Lesson 1.1 · My First Day at School'
            }
            phonics={SAMPLE_KG_PHONICS_A}
            vocabulary={SAMPLE_CLASS1_VOCAB_SKIP}
            storybook={SAMPLE_CLASS1_STORY_FIRSTDAY}
            choices={SAMPLE_CHOICES_SKIP_RUN}
            selectedChoiceId={selectedChoice}
            onSelectChoice={setSelectedChoice}
            step={{ current: 2, total: 6 }}
            potentialXp={15}
          />

          <VoiceInteractionBeacon
            isTeacherSpeaking={isSpeaking}
            isRecording={isRecording}
            isProcessing={isProcessing}
            isError={isError}
            errorMessage="Microphone did not hear speech. Tap to try again."
            seconds={recordSeconds}
            onStartMic={handleStartMic}
            onStopMic={handleStopMic}
            onRetry={handleStartMic}
          />

          {/* Test Simulation Controls (Explicitly marked as simulated) */}
          <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <span className="font-bold text-slate-400 mr-2">Beacon Simulator (Demo Only):</span>
            <button
              type="button"
              onClick={simulateTeacherSpeak}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold hover:bg-amber-500/30 cursor-pointer"
            >
              Simulate Teacher Speaks
            </button>
            <button
              type="button"
              onClick={simulateStopTeacherSpeak}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-bold hover:bg-slate-700 cursor-pointer"
            >
              Simulate Teacher Stops
            </button>
            <button
              type="button"
              onClick={simulateErrorState}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold hover:bg-rose-500/30 cursor-pointer"
            >
              Simulate Error (Demo)
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-bold hover:bg-slate-700 ml-auto cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Simulated Feedback Banner: Explicitly labeled as demo, 0 real XP awarded */}
          {showFeedback ? (
            <div className="bg-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-hidden="true">🌟</span>
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider">
                    Demo Teacher Feedback:
                  </h4>
                  <p className="text-sm font-semibold text-emerald-200">
                    "Wonderful! You spoke with great confidence!"
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Real XP is recorded only after verified backend attempts in official lessons.
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-300 bg-amber-400/15 px-3 py-1 rounded-full border border-amber-400/30 flex-none">
                Simulated Demo (0 XP Awarded)
              </span>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

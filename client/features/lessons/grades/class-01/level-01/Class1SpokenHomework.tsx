'use client'

import { useState } from 'react'
import { Mic, RotateCcw, Save, Square } from 'lucide-react'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { progressService } from '@/services/progress-service'
import { voiceService } from '@/services/voice-service'

type SavePhase = 'ready' | 'transcribing' | 'saving' | 'coaching' | 'saved' | 'error'

export function Class1SpokenHomework({
  lessonId,
  activityId,
  prompt,
  onSaved,
  onSpeak,
}: {
  lessonId: string
  activityId: string
  prompt: string
  onSaved: () => void
  onSpeak: (text: string) => void
}) {
  const recorder = useAudioRecorder({ maxDurationMs: 12000, minDurationMs: 800 })
  const [phase, setPhase] = useState<SavePhase>('ready')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [coachMessage, setCoachMessage] = useState('')
  const [coachAttempted, setCoachAttempted] = useState(false)

  async function saveRecording() {
    if (!recorder.audioBlob || phase === 'transcribing' || phase === 'saving') return
    setError('')
    let spokenWords = transcript
    let transcriptionUnavailable = false

    if (!spokenWords) {
      setPhase('transcribing')
      try {
        spokenWords = (await voiceService.transcribeAudio(recorder.audioBlob, recorder.durationMs, 'class1-home-practice', 'fast')).trim().slice(0, 850)
        if (!spokenWords) transcriptionUnavailable = true
        setTranscript(spokenWords)
      } catch (caught) {
        transcriptionUnavailable = true
        setError(caught instanceof Error ? caught.message : 'The words could not be written down. The audio will be saved for your teacher to hear.')
      }
    }

    setPhase('saving')
    const teacherReviewText = 'Recording saved for teacher review. The words were not transcribed.'
    let spokenFeedback = transcriptionUnavailable
      ? 'Thank you. I saved your voice for your teacher to hear.'
      : coachMessage || 'Thank you for telling me about school. I saved your speaking practice for your teacher to hear.'
    try {
      await progressService.saveHomePractice(
        spokenWords ? `I said: ${spokenWords}` : teacherReviewText,
        recorder.audioBlob,
        'class1-first-day',
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your practice could not be saved. Please try again.')
      setPhase('error')
      return
    }

    setPhase('saved')
    onSaved()

    if (spokenWords && !coachAttempted) {
      setCoachAttempted(true)
      setPhase('coaching')
      try {
        let timeoutId: number | undefined
        const response = await Promise.race([
          (async () => {
            const session = await voiceService.startSession({ lessonId, activityId })
            return voiceService.submitTranscript(session._id, spokenWords, 'MIC')
          })(),
          new Promise<undefined>((resolve) => { timeoutId = window.setTimeout(() => resolve(undefined), 5000) }),
        ])
        if (timeoutId !== undefined) window.clearTimeout(timeoutId)
        const teacherLine = response?.aiResponse?.message || response?.evaluation?.feedback
        if (teacherLine) {
          spokenFeedback = teacherLine.replace(/\s+/g, ' ').trim().slice(0, 180)
          setCoachMessage(spokenFeedback)
        }
      } catch {
        // The recording and transcript still belong to the learner if the optional coach is unavailable.
      }
    }

    setPhase('saved')
    if (transcriptionUnavailable) setCoachMessage(teacherReviewText)
    onSpeak(spokenFeedback)
  }

  function recordAgain() {
    recorder.reset()
    setPhase('ready')
    setTranscript('')
    setError('')
    setCoachMessage('')
    setCoachAttempted(false)
  }

  const busy = phase === 'transcribing' || phase === 'saving' || phase === 'coaching'

  return <section className="class1-homework" aria-labelledby="class1-homework-title">
    <div className="class1-homework__heading">
      <span className="class1-homework__icon" aria-hidden="true"><Mic size={23} /></span>
      <div>
        <h2 id="class1-homework-title">Tell Miss Julie about school</h2>
        <p>{prompt}</p>
      </div>
    </div>

    {phase === 'saved' ? <div className="class1-homework__saved" role="status">
      <strong>Your voice is saved!</strong>
      <span>{transcript || coachMessage || 'Your teacher can listen to your recording.'}</span>
      <button type="button" onClick={recordAgain}><RotateCcw size={17} /> Record again</button>
    </div> : <>
      {transcript ? <p className="class1-homework__transcript" aria-live="polite"><strong>I heard:</strong> {transcript}</p> : null}
      {recorder.error ? <p className="class1-homework__error" role="alert">{recorder.error}</p> : null}
      {error ? <p className="class1-homework__error" role="alert">{error}</p> : null}
      {busy ? <p className="class1-homework__status" role="status">{phase === 'transcribing' ? 'Listening to your words...' : phase === 'coaching' ? 'Your voice is saved. Miss Julie is preparing a kind reply...' : 'Saving your speaking practice...'}</p> : null}

      <div className="class1-homework__actions">
        {recorder.status === 'recording' ? <button type="button" className="class1-homework__button class1-homework__button--recording" onClick={recorder.stopRecording}>
          <Square size={17} fill="currentColor" /> Finish speaking
        </button> : null}
        {!busy && recorder.status !== 'recording' && !recorder.audioBlob ? <button type="button" className="class1-homework__button" disabled={recorder.status === 'requesting-permission'} onClick={() => { setError(''); void recorder.startRecording() }}>
          <Mic size={19} /> {recorder.status === 'requesting-permission' ? 'Allow microphone...' : 'Start speaking'}
        </button> : null}
        {!busy && recorder.audioBlob ? <>
          <button type="button" className="class1-homework__button" onClick={() => void saveRecording()}><Save size={18} /> {transcript ? 'Save my voice' : 'Transcribe and save'}</button>
          <button type="button" className="class1-homework__button class1-homework__button--quiet" onClick={recordAgain}><RotateCcw size={17} /> Try again</button>
        </> : null}
        {recorder.status === 'recording' ? <span className="class1-homework__limit">Up to 12 seconds</span> : null}
      </div>
    </>}
  </section>
}

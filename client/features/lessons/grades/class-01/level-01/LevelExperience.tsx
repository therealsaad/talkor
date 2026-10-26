'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LevelExperienceProps } from '../../../registry'
import { activities } from './activities'
import { config } from './config'

type Exercise = { id: string; prompt: string; voice: string; choices: string[]; answer: string; kind: 'choice' | 'build' | 'mic-preview' }
const exercises: Exercise[] = [
  { id: activities[0].id, prompt: 'Listen carefully. Which word is at?', voice: 'listen-at', choices: ['an', 'at', 'in'], answer: 'at', kind: 'choice' },
  { id: activities[1].id, prompt: 'Build the word at.', voice: 'build-at', choices: ['t', 'a'], answer: 'at', kind: 'build' },
  { id: activities[2].id, prompt: 'Listen carefully. Which word is in?', voice: 'listen-in', choices: ['is', 'on', 'in'], answer: 'in', kind: 'choice' },
  { id: activities[3].id, prompt: 'Build the word in.', voice: 'build-in', choices: ['n', 'i'], answer: 'in', kind: 'build' },
  { id: activities[4].id, prompt: 'Look __ me. Choose the missing word.', voice: 'look-at-me', choices: ['in', 'at', 'on'], answer: 'at', kind: 'choice' },
  { id: activities[5].id, prompt: 'Build a sentence.', voice: 'i-am-sam', choices: ['Sam.', 'am', 'I'], answer: 'I am Sam.', kind: 'build' },
  { id: activities[6].id, prompt: 'Say at, then use it with Miss Julie.', voice: 'repeat-at', choices: [], answer: '', kind: 'mic-preview' },
  { id: activities[7].id, prompt: 'Watch Miss Julie walking. Now say WALK.', voice: 'say-walk', choices: [], answer: '', kind: 'mic-preview' },
  { id: activities[8].id, prompt: 'Which picture shows a school?', voice: 'find-school', choices: ['school', 'bell', 'playground'], answer: 'school', kind: 'choice' },
  { id: activities[9].id, prompt: 'Tell Miss Julie: What do you do at school?', voice: 'school-talk', choices: [], answer: '', kind: 'mic-preview' },
]
// Public, CDN-backed S3 audio only. Never embed AWS credentials in the client.
const audioBase = (process.env.NEXT_PUBLIC_TALKORA_CLASS1_AUDIO_BASE_URL || '').replace(/\/$/, '')
function audioUrl(id: string) { return audioBase ? `${audioBase}/class-01/level-01/v1/${id}.wav` : null }

/** Authenticated student publication remains gated by registry.ts. This is a
 * fully interactive STAFF PREVIEW; preview results are intentionally not persisted. */
export default function LevelExperience({ onPreviewBack }: LevelExperienceProps) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [complete, setComplete] = useState(false)
  const [audioError, setAudioError] = useState('')
  const player = useRef<HTMLAudioElement | null>(null)
  const exercise = exercises[index]
  const play = useCallback(async (id: string) => {
    const url = audioUrl(id)
    if (!url) { setAudioError('Reviewed AI4Bharat audio has not been connected to S3 yet.'); return }
    player.current?.pause()
    const next = new Audio(url)
    player.current = next
    setAudioError('')
    try { await next.play() } catch { setAudioError('Audio unavailable. Verify the uploaded S3 object and CDN permissions.') }
  }, [])
  useEffect(() => () => { player.current?.pause() }, [])
  const current = picked.join(exercise.kind === 'build' && index === 5 ? ' ' : '')
  const submit = () => {
    if (exercise.kind === 'mic-preview') return // Only the authenticated engine can submit real STT evidence.
    if (current.trim().toLowerCase() !== exercise.answer.toLowerCase()) {
      setFeedback('Try again. Listen and look at the letters.'); void play('try-again'); return
    }
    setFeedback('Great work!'); void play('well-done')
  }
  const next = () => {
    if (index === exercises.length - 1) { setComplete(true); void play('homework-first-day'); return }
    setIndex(index + 1); setPicked([]); setFeedback(''); setAudioError('')
  }
  const correct = feedback === 'Great work!'
  return <main style={{ minHeight: '70vh', background: 'linear-gradient(#ffffff22,#ffffff22), url(/lessons/class-01/level-01/two-letter-word-meadow.webp) center / cover', color: '#183246', padding: 24, borderRadius: 24 }}>
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 18 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div><small>CLASS 1 · LEVEL 1 · STAFF PREVIEW</small><h1 style={{ fontSize: 32, fontWeight: 800 }}>{config.title} 🌼</h1></div>
        {onPreviewBack && <button type="button" onClick={onPreviewBack} style={{ padding: 12, borderRadius: 12, background: 'white' }}>Back</button>}
      </header>
      <p><strong>Student order:</strong> 90-second Miss Julie video → tiny English words → Balbharati 1.1 My First Day. The video must be rendered and uploaded before a student can start.</p>
      <p style={{ fontSize: 14 }}>This is a staff-only screen preview. Live speech, Qwen, Azure, server grading and MongoDB progress are available only through an authenticated student lesson; this preview cannot certify them.</p>
      {complete ? <section style={{ background: '#fff', padding: 28, borderRadius: 22, display: 'grid', gap: 14 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800 }}>Wonderful work! 🌟</h2>
        <p>Homework: Say “I am Sam” and “I walk to school” with a family member.</p>
        <button type="button" onClick={() => void play('homework-first-day')} style={{ padding: 14, borderRadius: 12, background: '#e6f4df' }}>🔊 Hear homework</button>
        <p style={{ fontSize: 13 }}>Staff preview only: completion is not saved to MongoDB.</p>
        <button type="button" onClick={() => { setIndex(0); setPicked([]); setFeedback(''); setComplete(false) }} style={{ padding: 14, borderRadius: 12, background: '#e6f4df' }}>Practice again</button>
      </section> : <section style={{ background: '#fff', padding: 28, borderRadius: 22, display: 'grid', gap: 20 }}>
        <div><small>Activity {index + 1} of {exercises.length}</small><div role="progressbar" aria-label="Activity progress" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={exercises.length} style={{ background: '#d6e9d2', height: 10, borderRadius: 9, marginTop: 8 }}><div style={{ background: '#53b863', width: `${((index + 1) / exercises.length) * 100}%`, height: '100%', borderRadius: 9 }}/></div></div>
        <h2 style={{ fontSize: 26, fontWeight: 750 }}>{exercise.prompt}</h2>
        <button type="button" onClick={() => void play(exercise.voice)} style={{ background: '#dff3ff', padding: 16, borderRadius: 14, fontWeight: 700 }}>🔊 Listen to Miss Julie</button>
        {audioError && <p role="status" style={{ color: '#8c4600' }}>{audioError}</p>}
        <div aria-label="Your answer" style={{ minHeight: 48, padding: 12, border: '2px dashed #53b863', borderRadius: 12, fontSize: 24 }}>{exercise.kind === 'mic-preview' ? '🎤 Real microphone assessment is available in the authenticated student lesson.' : current || 'Tap the answer below'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {exercise.choices.map((choice, choiceIndex) => <button key={`${exercise.id}-${choiceIndex}`} type="button" disabled={correct || (exercise.kind === 'build' && picked.includes(choice))} onClick={() => { setFeedback(''); setPicked(exercise.kind === 'choice' ? [choice] : [...picked, choice]) }} style={{ minWidth: 80, minHeight: 56, background: '#e8f8dd', border: '2px solid #a6d6a3', borderRadius: 14, fontSize: 23, fontWeight: 750, opacity: exercise.kind === 'build' && picked.includes(choice) ? .4 : 1 }}>{choice}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {exercise.kind !== 'mic-preview' ? <button type="button" onClick={() => { setPicked([]); setFeedback('') }} disabled={correct} style={{ padding: 14, borderRadius: 12, background: '#f0f0f0' }}>Clear</button> : null}
          {exercise.kind === 'mic-preview'
            ? <button type="button" onClick={next} style={{ padding: 14, borderRadius: 12, background: '#53b863', color: '#fff', fontWeight: 800 }}>Preview next screen (staff only) →</button>
            : !correct ? <button type="button" onClick={submit} disabled={!picked.length} style={{ padding: 14, borderRadius: 12, background: '#53b863', color: '#fff', fontWeight: 800 }}>Check answer</button> : <button type="button" onClick={next} style={{ padding: 14, borderRadius: 12, background: '#53b863', color: '#fff', fontWeight: 800 }}>{index === exercises.length - 1 ? 'Finish' : 'Continue →'}</button>}
        </div>
        <p role="status" aria-live="polite">{feedback}</p>
      </section>}
    </div>
  </main>
}

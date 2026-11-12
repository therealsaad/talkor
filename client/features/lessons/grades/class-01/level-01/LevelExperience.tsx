'use client'

import { useState } from 'react'
import type { LevelExperienceProps } from '../../../registry'
import { class1TeachingCue } from './first-day-voice-guide'
import { FirstDayClassroom } from './FirstDayClassroom'

// Staff preview deliberately uses the SAME visual scene component as the
// authenticated v3 lesson. It does not claim microphone assessment or progress.
const SCENES = [
  'hello-school', 'skip-bunny', 'run-race', 'walk-school', 'big-grin',
  'school-bell', 'jump-frog', 'play-friends', 'enter-class', 'grade-one',
] as const

export default function LevelExperience({ onPreviewBack }: LevelExperienceProps) {
  const [step, setStep] = useState(0)
  const id = SCENES[step]
  const cue = class1TeachingCue(`class1-l01-v3-${id}`)
  return <main style={{ width:'100%', minHeight:'80vh', background:'#dcf4df', color:'#214c3e', borderRadius:20, overflow:'hidden' }} aria-label="Class 1 First Day staff-only design preview">
    <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',padding:'12px 18px',gap:12,background:'#fffdf3'}}>
      <div><strong>CLASS 1 · BALBHARATI 1.1 · DESIGN PREVIEW</strong>
        <p style={{margin:'4px 0 0',fontSize:13}}>Teacher review only. Student speech, scoring, Qwen and Azure run in the authenticated lesson—not this screen.</p></div>
      {onPreviewBack ? <button type="button" onClick={onPreviewBack} style={{minHeight:44,padding:'9px 16px',background:'#e9ede6',borderRadius:12}}>Back</button> : null}
    </div>
    <div style={{height:'min(77vh,780px)',minHeight:450}}>
      <FirstDayClassroom
        sceneId={id}
        focus={cue?.storybook.focus || 'MY FIRST DAY'}
        sentence={cue?.storybook.example || 'I walk to school.'}
        teacherText={cue?.spokenGoal || 'Listen and tell me about your first day at school.'}
        teacherImage="/miss-julie/pointing.webp"
        animationUrl="/miss-julie-animations/transparent/pointing.webm"
        isSpeaking={false}
        isListening={false}
        isProcessing={false}
        isCompleted={false}
        step={step + 1}
        total={SCENES.length}
      />
    </div>
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:16,padding:12,background:'#fffdf3'}}>
      <button type="button" disabled={step === 0} onClick={() => setStep(n => Math.max(0,n-1))}
        style={{minHeight:45,padding:'10px 20px',borderRadius:13,background:'#dcebdc',fontWeight:800}}>Previous scene</button>
      <strong>{step + 1} / {SCENES.length}</strong>
      <button type="button" disabled={step === SCENES.length - 1} onClick={() => setStep(n => Math.min(SCENES.length-1,n+1))}
        style={{minHeight:45,padding:'10px 20px',borderRadius:13,background:'#2b8265',color:'#fff',fontWeight:800}}>Next scene</button>
    </div>
  </main>
}

'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { SchoolShell } from '@/components/school/school-shell'
import { RegisteredLevelExperience } from '@/features/lessons/RegisteredLevelExperience'
import { KGAlphabetMap } from '@/features/lessons/grades/kg/level-01/components/LevelMap'


/** Authorized staff preview for KG Level 1 and Level 6; no student progress is read or written. */
export default function KGAlphabetSchoolPreview() {
  const [selectedLevel, setSelectedLevel] = useState<1 | 6 | null>(null)
  const [step, setStep] = useState<number | null>(null)
  return <SchoolShell
    title={selectedLevel === 1 ? 'KG Level 1 · ABCD Preview' : selectedLevel === 6 ? 'KG Level 6 · Vowel Garden Preview' : 'KG Preview'}
    subtitle={selectedLevel === 1 ? 'Test real speech recognition and voice without modifying student progress.' : selectedLevel === 6 ? 'Watch the vowel introduction, then practise five speaking cards without saving student progress.' : 'Choose a kindergarten level to preview.'}
  >
    {selectedLevel === null ? (
      <section aria-labelledby="kg-preview-levels" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <h2 id="kg-preview-levels" style={{ gridColumn: '1 / -1', margin: 0 }}>Choose a KG preview</h2>
        <button type="button" onClick={() => setSelectedLevel(1)} style={levelButtonStyle}>
          <strong>Level 1 · ABCD</strong>
          <span>Open the existing staff lesson preview.</span>
        </button>
        <button type="button" onClick={() => {
          if (document.fullscreenEnabled) void document.documentElement.requestFullscreen().catch(() => undefined)
          setSelectedLevel(6)
        }} style={levelButtonStyle}>
          <strong>Level 6 · Vowel Garden</strong>
          <span>Watch the introduction, then practise A, E, I, O, and U.</span>
        </button>
      </section>
    ) : null}
    {selectedLevel === 1 ? (
      <>
        <section style={{ marginBottom: 14, padding: 15, borderRadius: 12, background: '#fff7e8', border: '1px solid #f0d1a1', color: '#64420e', lineHeight: 1.6 }}>
          <strong>LIVE teacher preview.</strong> Miss Julie uses Azure Speech and animated teaching gestures. Your microphone is sent to Groq STT, with child-friendly Level 1 matching instead of strict pronunciation scoring. Wrong answers receive gentle corrective feedback. This preview does not save student attempts.
          Test student progression separately: enable ABCD pilot access in <Link href="/school/students">Students</Link>, then sign in with that student's 5-digit PIN.
        </section>
        {step === null ? <KGAlphabetMap preview onPreviewPlay={setStep} /> : <Suspense fallback={<p>Opening lesson preview…</p>}><RegisteredLevelExperience key={step} grade={0} level={1} staffPreview experienceProps={{ preview: true, previewStartIndex: step, onPreviewBack: () => setStep(null) }} fallback={<p>Opening lesson preview…</p>} /></Suspense>}
      </>
    ) : null}
    {selectedLevel === 6 ? (
      <section style={{ display: 'grid', gap: 12 }}>
        <button type="button" onClick={() => setSelectedLevel(null)} style={{ justifySelf: 'start' }}>Back to KG previews</button>
        <RegisteredLevelExperience key="kg-level-6" grade={0} level={6} staffPreview experienceProps={{ preview: true }} fallback={<p>Opening Level 6 preview…</p>} />
      </section>
    ) : null}
  </SchoolShell>
}

const levelButtonStyle = {
  display: 'grid',
  gap: 8,
  minHeight: 100,
  padding: 18,
  border: '1px solid #d5dce7',
  borderRadius: 12,
  background: '#fff',
  color: '#183246',
  cursor: 'pointer',
  textAlign: 'left' as const,
}

'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { SchoolShell } from '@/components/school/school-shell'
import { RegisteredLevelExperience } from '@/features/lessons/RegisteredLevelExperience'
import { KGAlphabetMap } from '@/features/lessons/grades/kg/level-01/components/LevelMap'

/** Authorized staff live preview: real Azure/Groq behavior, but no student records are read or written. */
export default function KGAlphabetSchoolPreview() {
  const [step, setStep] = useState<number | null>(null)
  return <SchoolShell title="KG Level 1 · ABCD Preview" subtitle="Test real speech recognition and voice without modifying student progress.">
    <section style={{ marginBottom: 14, padding: 15, borderRadius: 12, background: '#fff7e8', border: '1px solid #f0d1a1', color: '#64420e', lineHeight: 1.6 }}>
      <strong>LIVE teacher preview.</strong> Miss Julie uses Azure Speech and animated teaching gestures. Your microphone is sent to Groq STT, with child-friendly Level 1 matching instead of strict pronunciation scoring. Wrong answers receive gentle corrective feedback. This preview does not save student attempts.
      Test student progression separately: enable ABCD pilot access in <Link href="/school/students">Students</Link>, then sign in with that student's 5-digit PIN.
    </section>
    {step === null ? <KGAlphabetMap preview onPreviewPlay={setStep} /> : <Suspense fallback={<p>Opening lesson preview…</p>}><RegisteredLevelExperience key={step} grade={0} level={1} staffPreview experienceProps={{ preview: true, previewStartIndex: step, onPreviewBack: () => setStep(null) }} fallback={<p>Opening lesson preview…</p>} /></Suspense>}
  </SchoolShell>
}

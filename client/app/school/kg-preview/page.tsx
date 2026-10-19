'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { SchoolShell } from '@/components/school/school-shell'
import { KGAlphabetMap } from '@/components/student/kg/kg-alphabet-map'
import { KGAlphabetLesson } from '@/app/student/kg/page'

/** Authorized staff live preview: uses real Azure voice and Groq STT, but saves NO student progress. */
export default function KGAlphabetSchoolPreview() {
  const [step, setStep] = useState<number | null>(null)
  return <SchoolShell title="KG Level 1 · ABCD Preview" subtitle="Test real speech recognition and voice without modifying student progress.">
    <section style={{ marginBottom: 14, padding: 15, borderRadius: 12, background: '#fff7e8', border: '1px solid #f0d1a1', color: '#64420e', lineHeight: 1.6 }}>
      <strong>LIVE teacher preview.</strong> The complete introduction video plays first. Then Miss Julie uses Azure Speech and your microphone is sent to Groq STT. Wrong answers receive real corrective feedback. This preview does not save student attempts.
      Test student progression separately: enable ABCD pilot access in <Link href="/school/students">Students</Link>, then sign in with that student's 5-digit PIN.
    </section>
    {step === null ? <KGAlphabetMap preview onPreviewPlay={setStep} /> : <Suspense fallback={<p>Opening lesson preview…</p>}><KGAlphabetLesson key={step} preview previewStartIndex={step} onPreviewBack={() => setStep(null)} /></Suspense>}
  </SchoolShell>
}

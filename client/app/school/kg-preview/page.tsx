'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { SchoolShell } from '@/components/school/school-shell'
import { KGAlphabetMap } from '@/components/student/kg/kg-alphabet-map'
import { KGAlphabetLesson } from '@/app/student/kg/page'

/** Authorized educator-only visual walkthrough; never uses a student's session. */
export default function KGAlphabetSchoolPreview() {
  const [step, setStep] = useState<number | null>(null)
  return <SchoolShell title="KG Level 1 · ABCD Preview" subtitle="Check the playable screens before testing with a real student PIN.">
    <section style={{ marginBottom: 14, padding: 15, borderRadius: 12, background: '#fff7e8', border: '1px solid #f0d1a1', color: '#64420e', lineHeight: 1.6 }}>
      <strong>Full lesson preview only.</strong> The complete introduction video plays first. Miss Julie uses your browser's system voice; the “I said it!” button simulates speech recognition and the picture choices are interactive.
      No student records are created or changed. For the real lesson, enable ABCD pilot access in <Link href="/school/students">Students</Link>, then sign in with that student's 5-digit PIN.
    </section>
    {step === null ? <KGAlphabetMap preview onPreviewPlay={setStep} /> : <Suspense fallback={<p>Opening lesson preview…</p>}><KGAlphabetLesson key={step} preview previewStartIndex={step} onPreviewBack={() => setStep(null)} /></Suspense>}
  </SchoolShell>
}

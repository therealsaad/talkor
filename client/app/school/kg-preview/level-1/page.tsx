'use client'

import { lazy, Suspense, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'

const KGAlphabetMap = lazy(() => import('@/features/lessons/grades/kg/level-01/components/LevelMap')
  .then(({ KGAlphabetMap: Component }) => ({ default: Component })))
const KGLevel1Experience = lazy(() => import('@/features/lessons/grades/kg/level-01/LevelExperience')
  .then(({ KGAlphabetLesson }) => ({ default: KGAlphabetLesson })))

export default function KGLevel1SchoolPreview() {
  const [step, setStep] = useState<number | null>(null)

  return (
    <SchoolShell title="KG Level 1 · ABCD Preview" subtitle="Test the existing ABCD lesson without modifying student progress.">
      <Link href="/school/kg-preview" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '14px 0', color: '#4b5563', fontWeight: 750, textDecoration: 'none' }}>
        <ArrowLeft size={17} /> Level 3 preview
      </Link>
      {step === null ? (
        <Suspense fallback={<p role="status">Opening Level 1 preview…</p>}>
          <KGAlphabetMap preview onPreviewPlay={setStep} />
        </Suspense>
      ) : (
        <Suspense fallback={<p role="status">Opening Level 1 preview…</p>}>
          <KGLevel1Experience key={step} preview previewStartIndex={step} onPreviewBack={() => setStep(null)} />
        </Suspense>
      )}
    </SchoolShell>
  )
}

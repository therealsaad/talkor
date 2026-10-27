'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { KGAlphabetMap } from '@/features/lessons/grades/kg/level-01/components/LevelMap'
import KGLevel1Experience from '@/features/lessons/grades/kg/level-01/LevelExperience'

export default function KGLevel1SchoolPreview() {
  const [step, setStep] = useState<number | null>(null)

  return (
    <SchoolShell title="KG Level 1 · ABCD Preview" subtitle="Test the existing ABCD lesson without modifying student progress.">
      <Link href="/school/kg-preview" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '14px 0', color: '#4b5563', fontWeight: 750, textDecoration: 'none' }}>
        <ArrowLeft size={17} /> Level 3 preview
      </Link>
      {step === null
        ? <KGAlphabetMap preview onPreviewPlay={setStep} />
        : <KGLevel1Experience key={step} preview previewStartIndex={step} onPreviewBack={() => setStep(null)} />}
    </SchoolShell>
  )
}

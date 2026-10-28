'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { KGAlphabetMap } from '@/features/lessons/grades/kg/level-01/components/LevelMap'
import Level4Experience from '@/features/lessons/grades/kg/level-04/LevelExperience'

export default function KGLevel4SchoolPreview() {
  const [step, setStep] = useState<number | null>(null)

  return (
    <SchoolShell title="KG Level 4 · Letters Q to V" subtitle="Staff-only draft preview. Not available to students.">
      <Link href="/school/kg-preview" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '14px 0', color: '#4b5563', fontWeight: 750, textDecoration: 'none' }}>
        <ArrowLeft size={17} /> Level selection
      </Link>
      {step === null
        ? <KGAlphabetMap preview previewLevel={4} previewLabel="Level 4" onPreviewPlay={setStep} />
        : <Level4Experience key={step} preview />}
    </SchoolShell>
  )
}

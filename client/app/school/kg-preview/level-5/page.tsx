'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import Level5Experience from '@/features/lessons/grades/kg/level-05/LevelExperience'

export default function KGLevel5SchoolPreview() {
  return <SchoolShell title="KG Level 5 · Letters W to Z" subtitle="Staff-only alphabet preview. Not available to students.">
    <Link href="/school/kg-preview" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '14px 0', color: '#4b5563', fontWeight: 750, textDecoration: 'none' }}>
      <ArrowLeft size={17} /> Level selection
    </Link>
    <Level5Experience preview previewStartLevel5Letter="W" />
  </SchoolShell>
}

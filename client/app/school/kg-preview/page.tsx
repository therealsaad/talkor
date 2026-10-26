'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SchoolShell } from '@/components/school/school-shell'
import { Level3PreviewIntro } from '@/features/lessons/grades/kg/level-03/PreviewIntro'
import { LEVEL3_INTRO_COMPLETED_KEY } from '@/features/lessons/grades/kg/level-03/level3-flow'

export default function KGAlphabetSchoolPreview() {
  const router = useRouter()

  return (
    <SchoolShell title="KG Level 3 · Letters K to P" subtitle="Staff-only draft preview. Not available to students.">
      <section style={{ marginBottom: 14, padding: 15, borderRadius: 12, background: '#fff7e8', border: '1px solid #f0d1a1', color: '#64420e', lineHeight: 1.6 }}>
        <strong>LIVE teacher preview.</strong> Watch the full introduction before choosing a letter. Miss Julie's voice activities start only after a letter is selected; the backend checks answers and does not save preview attempts.
        {' '}<Link href="/school/kg-preview/level-1">Open the existing Level 1 · ABCD preview.</Link>
      </section>
      <Level3PreviewIntro onSelectLetter={(letter) => {
        sessionStorage.setItem(LEVEL3_INTRO_COMPLETED_KEY, 'complete')
        router.push(`/school/kg-preview/level-3/${letter}`)
      }} />
    </SchoolShell>
  )
}

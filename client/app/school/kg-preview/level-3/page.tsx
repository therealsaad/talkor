'use client'

import { useRouter } from 'next/navigation'
import { SchoolShell } from '@/components/school/school-shell'
import { Level3PreviewIntro } from '@/features/lessons/grades/kg/level-03/PreviewIntro'
import { LEVEL3_INTRO_COMPLETED_KEY } from '@/features/lessons/grades/kg/level-03/level3-flow'

export default function KGLevel3SchoolPreview() {
  const router = useRouter()

  return (
    <SchoolShell title="KG Level 3 · Letters K to P" subtitle="Staff-only draft preview. Not available to students.">
      <Level3PreviewIntro
        onComplete={() => {
          sessionStorage.setItem(LEVEL3_INTRO_COMPLETED_KEY, 'complete')
          router.push('/school/kg-preview/level-3/K')
        }}
      />
    </SchoolShell>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { SchoolShell } from '@/components/school/school-shell'
import { Level2PreviewIntro } from '@/features/lessons/grades/kg/level-02/PreviewIntro'
import { LEVEL2_INTRO_COMPLETED_KEY } from '@/features/lessons/grades/kg/level-02/level2-flow'

export default function KGLevel2SchoolPreview() {
  const router = useRouter()

  return (
    <SchoolShell title="KG Level 2 · Letters E to J" subtitle="Staff-only draft preview. Not available to students.">
      <Level2PreviewIntro
        onComplete={() => {
          sessionStorage.setItem(LEVEL2_INTRO_COMPLETED_KEY, 'complete')
          router.push('/school/kg-preview/level-2/E')
        }}
      />
    </SchoolShell>
  )
}

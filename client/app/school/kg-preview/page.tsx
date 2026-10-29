'use client'

import { SchoolShell } from '@/components/school/school-shell'
import { KGAlphabetMap } from '@/features/lessons/grades/kg/level-01/components/LevelMap'

export default function KGAlphabetSchoolPreview() {
  return (
    <SchoolShell title="KG Learning Garden" subtitle="Choose a garden stone to open its staff preview." workspaceClassName="educator-workspace--kg-map">
      <KGAlphabetMap preview previewDashboard />
    </SchoolShell>
  )
}

import { SchoolShell } from '@/components/school/school-shell'
import KGLevel1Experience from '@/features/lessons/grades/kg/level-01/LevelExperience'

export default function KGLevel1SchoolPreview() {
  return (
    <SchoolShell title="KG Level 1 · ABCD Preview" subtitle="Test the existing ABCD lesson without modifying student progress.">
      <KGLevel1Experience preview />
    </SchoolShell>
  )
}

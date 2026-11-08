
import { CurriculumExplorerPage } from '@/features/curriculum-explorer/CurriculumExplorer'

/** Existing links now open the shared staff explorer; student garden routes are separate. */
export default function KGAlphabetSchoolPreview() {
  return <CurriculumExplorerPage initialGrade={0} />
}

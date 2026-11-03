import { CurriculumExplorerPage } from '@/features/curriculum-explorer/CurriculumExplorer'

export default async function ClassCurriculumPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CurriculumExplorerPage classId={id} />
}

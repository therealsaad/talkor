import { notFound } from 'next/navigation'
import { CurriculumExplorerPage } from '@/features/curriculum-explorer/CurriculumExplorer'

export default async function CurriculumStudioPage({ params }: { params: Promise<{ grade: string; level: string }> }) {
  const { grade, level } = await params
  if (!/^(?:[0-9]|10)$/.test(grade) || !/^(?:[1-9]|10)$/.test(level)) notFound()
  return <CurriculumExplorerPage initialGrade={Number(grade)} initialLevel={Number(level)} initialView="teaching" />
}

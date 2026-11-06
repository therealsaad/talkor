import { notFound } from 'next/navigation'
import { CurriculumExplorerPage } from '@/features/curriculum-explorer/CurriculumExplorer'

/** Legacy letter URLs inspect the draft; they do not start a live voice session. */
export default async function KGLevel5LetterPreview({ params }: { params: Promise<{ letter: string }> }) {
  const letter = (await params).letter.toUpperCase()
  if (!/^[W-Z]$/.test(letter)) notFound()
  return <CurriculumExplorerPage initialGrade={0} initialLevel={5} initialView="teaching" initialSample={`say-${letter.toLowerCase()}`} />
}

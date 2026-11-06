import { notFound } from 'next/navigation'
import { CurriculumExplorerPage } from '@/features/curriculum-explorer/CurriculumExplorer'

/** Legacy letter URLs inspect the draft; they do not start a live voice session. */
export default async function KGLevel3LetterPreview({ params }: { params: Promise<{ letter: string }> }) {
  const letter = (await params).letter.toUpperCase()
  if (!/^[K-P]$/.test(letter)) notFound()
  return <CurriculumExplorerPage initialGrade={0} initialLevel={3} initialView="teaching" initialSample={`say-${letter.toLowerCase()}`} />
}

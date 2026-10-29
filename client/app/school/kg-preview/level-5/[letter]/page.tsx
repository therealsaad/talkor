import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import Level5Experience from '@/features/lessons/grades/kg/level-05/LevelExperience'

const LETTERS = ['W', 'X', 'Y', 'Z'] as const

export function generateStaticParams() {
  return LETTERS.map((letter) => ({ letter }))
}

export default async function KGLevel5LetterPreview({ params }: { params: Promise<{ letter: string }> }) {
  const { letter } = await params
  const startLetter = LETTERS.find((item) => item === letter.toUpperCase()) || 'W'
  return <SchoolShell title={`KG Level 5 · Letter ${startLetter}`} subtitle="Staff-only alphabet preview. Not available to students.">
    <Link href="/school/kg-preview/level-5" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '14px 0', color: '#4b5563', fontWeight: 750, textDecoration: 'none' }}>
      <ArrowLeft size={17} /> Level 5 letters
    </Link>
    <Level5Experience preview previewStartLevel5Letter={startLetter} />
  </SchoolShell>
}

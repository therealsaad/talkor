'use client'

import { lazy, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { SchoolShell } from '@/components/school/school-shell'
import { LEVEL3_INTRO_COMPLETED_KEY, LEVEL3_LETTERS } from '@/features/lessons/grades/kg/level-03/level3-flow'

const KGLevel3Experience = lazy(async () => {
  const workspace = await import('@/features/lessons/grades/kg/level-03')
  if (workspace.config.id !== 'g00-l03' || workspace.config.grade !== 0 || workspace.config.level !== 3 ||
      workspace.config.editorialStatus !== 'draft' || workspace.config.studentPlayable ||
      !workspace.config.staffOnlyPreview) {
    throw new Error('KG Level 3 is not configured as a staff-only draft preview')
  }
  return { default: workspace.LevelExperience }
})

export default function KGLevel3LetterSchoolPreview() {
  const params = useParams<{ letter: string }>()
  const router = useRouter()
  const letter = LEVEL3_LETTERS.find((item) => item === params.letter)
  const [entryState, setEntryState] = useState<'checking' | 'allowed' | 'redirecting'>('checking')

  useEffect(() => {
    if (sessionStorage.getItem(LEVEL3_INTRO_COMPLETED_KEY) === 'complete') {
      sessionStorage.removeItem(LEVEL3_INTRO_COMPLETED_KEY)
      setEntryState('allowed')
      return
    }
    setEntryState('redirecting')
    router.replace('/school/kg-preview')
  }, [router])

  if (!letter) {
    return (
      <SchoolShell title="KG Level 3 preview" subtitle="Choose a valid letter from K to P.">
        <p role="alert">That letter is not part of this preview.</p>
        <Link href="/school/kg-preview">Return to the Level 3 introduction</Link>
      </SchoolShell>
    )
  }

  if (entryState !== 'allowed') {
    return (
      <SchoolShell title="KG Level 3 preview" subtitle="Watch the full introduction before opening a letter activity.">
        <p role={entryState === 'redirecting' ? 'alert' : 'status'}>
          {entryState === 'redirecting' ? 'Return to the introduction to watch it before starting a letter.' : 'Checking the completed introduction…'}
        </p>
        {entryState === 'redirecting' ? <Link href="/school/kg-preview">Return to the introduction</Link> : null}
      </SchoolShell>
    )
  }

  return (
    <SchoolShell title={`KG Level 3 · Letter ${letter}`} subtitle="Staff-only draft preview. Not available to students.">
      <Suspense fallback={<p role="status">Opening the letter activity…</p>}>
        <KGLevel3Experience
          preview
          previewStartLetter={letter}
          onPreviewBack={() => router.push('/school/kg-preview')}
        />
      </Suspense>
    </SchoolShell>
  )
}

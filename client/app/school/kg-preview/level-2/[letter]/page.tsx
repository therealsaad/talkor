'use client'

import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { SchoolShell } from '@/components/school/school-shell'
import {
  LEVEL2_INTRO_COMPLETED_KEY,
  LEVEL2_LETTERS,
} from '@/features/lessons/grades/kg/level-02/level2-flow'

const KGLevel2Experience = lazy(async () => {
  const workspace = await import('@/features/lessons/grades/kg/level-02')
  if (workspace.config.id !== 'g00-l02' || workspace.config.grade !== 0 || workspace.config.level !== 2 ||
      workspace.config.editorialStatus !== 'draft' || workspace.config.studentPlayable ||
      !workspace.config.staffOnlyPreview) {
    throw new Error('KG Level 2 is not configured as a staff-only draft preview')
  }
  return { default: workspace.LevelExperience }
})

export default function KGLevel2LetterSchoolPreview() {
  const params = useParams<{ letter: string }>()
  const router = useRouter()
  const letter = LEVEL2_LETTERS.find((item) => item === params.letter)
  const [entryState, setEntryState] = useState<'checking' | 'allowed' | 'redirecting'>('checking')
  const entryCheckStarted = useRef(false)

  useEffect(() => {
    if (entryCheckStarted.current) return
    entryCheckStarted.current = true

    if (letter === 'E' && sessionStorage.getItem(LEVEL2_INTRO_COMPLETED_KEY) === 'complete') {
      sessionStorage.removeItem(LEVEL2_INTRO_COMPLETED_KEY)
      setEntryState('allowed')
      return
    }
    setEntryState('redirecting')
    router.replace('/school/kg-preview/level-2')
  }, [letter, router])

  if (!letter) {
    return (
      <SchoolShell title="KG Level 2 preview" subtitle="Choose a valid letter from E to J.">
        <p role="alert">That letter is not part of this preview.</p>
        <Link href="/school/kg-preview">Return to the Level 2 introduction</Link>
      </SchoolShell>
    )
  }

  if (entryState !== 'allowed') {
    return (
      <SchoolShell title="KG Level 2 preview" subtitle="Watch the full introduction before opening the letter activity.">
        <p role={entryState === 'redirecting' ? 'alert' : 'status'}>
          {entryState === 'redirecting'
            ? 'Return to the introduction to watch it before starting at E.'
            : 'Checking the completed introduction…'}
        </p>
        {entryState === 'redirecting' ? <Link href="/school/kg-preview/level-2">Return to the introduction</Link> : null}
      </SchoolShell>
    )
  }

  return (
    <SchoolShell title={`KG Level 2 · Letter ${letter}`} subtitle="Staff-only draft preview. Not available to students.">
      <Suspense fallback={<p role="status">Opening the letter activity…</p>}>
        <KGLevel2Experience
          preview
          onPreviewBack={() => router.push('/school/kg-preview/level-2')}
        />
      </Suspense>
    </SchoolShell>
  )
}

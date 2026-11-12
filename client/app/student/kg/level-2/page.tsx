'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { Level2PreviewIntro } from '@/features/lessons/grades/kg/level-02/PreviewIntro'
import { KGLevel2StudentExperience } from '@/features/lessons/grades/kg/level-02/StudentExperience'
import { kgLevel2StudentService, type KGLevel2State } from '@/features/lessons/grades/kg/level-02/services/kg-level2-student-service'

type Stage = 'loading' | 'intro' | 'saving' | 'lesson' | 'complete' | 'error'
/** Student-pilot route: never reuses the staff-only preview or its sessionStorage bypass marker. */
export default function KGLevel2StudentPage() {
  const { student, status } = useAuth()
  const [stage, setStage] = useState<Stage>('loading')
  const [state, setState] = useState<KGLevel2State | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (status !== 'authenticated' || !student?.id) return
    let live = true
    setStage('loading')
    setError('')
    void kgLevel2StudentService.state()
      .then(async (saved) => {
        if (!live) return
        setState(saved)
        if (saved.completed) { setStage('complete'); return }
        await kgLevel2StudentService.beginIntro()
        if (live) setStage('intro')
      })
      .catch((cause: unknown) => {
        if (!live) return
        setError(cause instanceof Error ? cause.message : 'Miss Julie could not open Level 2.')
        setStage('error')
      })
    return () => { live = false }
  }, [status, student?.id, retry])

  const finish = async () => {
    setStage('saving')
    try {
      await kgLevel2StudentService.completeIntro()
      setStage('lesson')
    } catch {
      setError('Your Level 2 story could not be verified. Please replay it to continue safely.')
      setStage('error')
    }
  }

  if (stage === 'loading' || status !== 'authenticated') {
    return <TalkoraLoader message="Miss Julie is opening your next KG adventure..." />
  }
  if (stage === 'intro') return <Level2PreviewIntro onComplete={() => { void finish() }} />
  if (stage === 'lesson' && state) {
    return <KGLevel2StudentExperience key={student?.id} initial={state} />
  }
  if (stage === 'complete') {
    return <main className="kg-level2-play" style={{ placeContent: 'center', textAlign: 'center', alignItems: 'center' }}>
      <h1>Wonderful! Level 2 is complete!</h1>
      <p>Letters E through J are saved. Miss Julie is proud of you!</p>
      <Link href="/student/kg/map" className="kg-level2-play__action">Back to my garden</Link>
    </main>
  }
  return <main className="kg-level2-play" role="alert" style={{ placeContent: 'center', textAlign: 'center', alignItems: 'center' }}>
    <h1>Miss Julie needs a little help</h1>
    <p>{error}</p>
    <button type="button" className="kg-level2-play__action" onClick={() => setRetry((n) => n + 1)}>Try again</button>
    <Link href="/student/kg/map">My learning garden</Link>
  </main>
}

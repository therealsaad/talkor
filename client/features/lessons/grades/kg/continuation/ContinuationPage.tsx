'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { Level2PreviewIntro } from '../level-02/PreviewIntro'
import { KGContinuationStudentExperience } from './ContinuationExperience'
import { kgContinuationStudentService, type KGContinuationState, type KGContinuationLevel } from './continuation-service'

const INTRO_VIDEO: Record<KGContinuationLevel, string> = {
  3: '/lessons/kg/level-03/K%20to%20P%20Untitled_Scene_10-16_08_25_20_20261016142423.mp4',
  4: '/lessons/kg/level-04/animal-sounds-intro.mp4',
  5: '/lessons/kg/level-05/W%20to%20Z%20Untitled_Scene_10-16_10_07_17_20261016160313.mp4',
}
type Stage = 'loading' | 'intro' | 'saving' | 'lesson' | 'complete' | 'error'

export function KGContinuationStudentPage({ level }: { level: KGContinuationLevel }) {
  const { student, status } = useAuth()
  const [stage, setStage] = useState<Stage>('loading')
  const [state, setState] = useState<KGContinuationState | null>(null)
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (status !== 'authenticated' || !student?.id) return
    let live = true
    setStage('loading')
    setMessage('')
    void kgContinuationStudentService.state(level).then(async (saved) => {
      if (!live) return
      setState(saved)
      if (saved.completed) { setStage('complete'); return }
      await kgContinuationStudentService.beginIntro(level)
      if (live) setStage('intro')
    }).catch((cause: unknown) => {
      if (!live) return
      setMessage(cause instanceof Error ? cause.message : 'Your level could not open')
      setStage('error')
    })
    return () => { live = false }
  }, [level, retry, status, student?.id])

  const afterVideo = async () => {
    setStage('saving')
    try {
      await kgContinuationStudentService.completeIntro(level)
      setStage('lesson')
    } catch {
      setMessage('Please replay Miss Julie’s complete introduction to continue.')
      setStage('error')
    }
  }

  if (status !== 'authenticated' || stage === 'loading' || stage === 'saving') {
    return <TalkoraLoader message={'Miss Julie is getting Level ' + level + ' ready...'} />
  }
  if (stage === 'intro') {
    return <Level2PreviewIntro videoSrc={INTRO_VIDEO[level]} onComplete={() => { void afterVideo() }} />
  }
  if (stage === 'lesson' && state) {
    return <KGContinuationStudentExperience key={student?.id + ':' + level} initial={state} />
  }
  if (stage === 'complete') {
    return <main className="kg-level2-play" style={{ placeContent: 'center', textAlign: 'center', alignItems: 'center' }}>
      <h1>Wonderful! Level {level} complete!</h1>
      <p>Your learning is safely saved. Miss Julie is proud of you!</p>
      <Link href="/student/continue" className="kg-level2-play__action">Continue learning</Link>
    </main>
  }
  return <main role="alert" className="kg-level2-play" style={{ placeContent: 'center', textAlign: 'center', alignItems: 'center' }}>
    <h1>Miss Julie needs a little help</h1>
    <p>{message}</p>
    <button type="button" className="kg-level2-play__action" onClick={() => setRetry((n) => n + 1)}>Try again</button>
    <Link href="/student/kg/map">My learning garden</Link>
  </main>
}

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { kgAlphabetService, type KGAlphabetState } from '@/features/lessons/grades/kg/level-01/services/kg-alphabet-service'
import { KGAdventureMap } from '@/components/student/kg-adventure-map'

/** Lightweight Grade 0 map; avoids loading the legacy 10,000-line jungle map. */
export default function KGAlphabetMapPage() {
  const { student } = useAuth()
  const [kgLevel1State, setKgLevel1State] = useState<KGAlphabetState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const [homeworkBusy, setHomeworkBusy] = useState(false)
  const [homeworkError, setHomeworkError] = useState('')

  useEffect(() => {
    let active = true
    setKgLevel1State(null)
    setError('')
    setHomeworkError('')

    if (!student?.id) {
      setError('Your student session could not be verified. Please sign in again.')
      setLoading(false)
      return () => { active = false }
    }

    setLoading(true)
    kgAlphabetService.state()
      .then((state) => {
        if (active) setKgLevel1State(state)
      })
      .catch((cause: unknown) => {
        console.error('Failed to load KG garden progress', cause)
        if (active) {
          setError(cause instanceof Error && cause.message
            ? cause.message
            : 'Your garden could not be loaded. Please try again.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [requestVersion, student?.id])

  const checkInHomework = async () => {
    if (homeworkBusy || kgLevel1State?.homework.status !== 'pending') return
    setHomeworkBusy(true)
    setHomeworkError('')
    try {
      const state = await kgAlphabetService.completeHomework()
      setKgLevel1State(state)
    } catch {
      setHomeworkError('Practice could not be saved. Please try again when you are connected.')
    } finally {
      setHomeworkBusy(false)
    }
  }

  return (
    <KGAdventureMap
      kgLevel1State={kgLevel1State}
      loading={loading}
      error={error}
      onRetry={() => setRequestVersion((version) => version + 1)}
      onHomeworkComplete={() => void checkInHomework()}
      homeworkBusy={homeworkBusy}
      homeworkError={homeworkError}
    />
  )
}

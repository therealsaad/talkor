'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, LockKeyhole, RotateCcw } from 'lucide-react'
import { kgAlphabetService, type KGAlphabetState } from '../services/kg-alphabet-service'
import { makeKGPreviewState } from '../services/kg-alphabet-preview'
import './kg-garden-map.css'

const STONES = [
  [22.5, 34], [42.4, 31.5], [67.2, 34.5], [86.4, 46.4], [38.2, 53.7],
  [62.5, 57.2], [15.7, 66.8], [39, 75.3], [64.8, 78.3], [89, 76.5],
] as const

/** KG Level 1 map. Other levels stay locked until their actual lessons are available. */
export function KGAlphabetMap({
  preview = false,
  onPreviewPlay,
  previewLevel = 1,
  previewLabel = 'Level 1',
}: {
  preview?: boolean
  onPreviewPlay?: (index: number) => void
  previewLevel?: number
  previewLabel?: string
} = {}) {
  const [state, setState] = useState<KGAlphabetState | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (preview) {
      setState(makeKGPreviewState())
      setError('')
      return
    }

    let active = true
    setState(null)
    setError('')
    kgAlphabetService.state()
      .then((value) => { if (active) setState(value) })
      .catch(() => { if (active) setError('Could not load your garden. Please try again.') })

    return () => { active = false }
  }, [preview, attempt])

  const levelOneHref = state?.completed ? '/student/kg?replay=all' : '/student/kg'

  return (
    <main className="kg-garden" aria-label="KG learning garden">
      <div className="kg-garden__canvas">
        <Image
          src="/lessons/kg/images/kg-simple-garden.webp"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 1320px"
          alt="A simple green garden with a winding path and ten stepping stones"
          className="kg-garden__background"
        />
        {STONES.map(([x, y], index) => {
          const level = index + 1
          const style = { left: `${x}%`, top: `${y}%` }

          if (level === 1) {
            if (preview) {
              return (
                <button
                  key={level}
                  type="button"
                  style={style}
                  className="kg-garden__node kg-garden__node--ready"
                  onClick={() => onPreviewPlay?.(0)}
                  aria-label={`Preview ${previewLabel}`}
                >
                  1
                </button>
              )
            }

            if (!preview) {
              return (
              <Link
                key={level}
                style={style}
                href={levelOneHref}
                aria-label={state?.completed ? 'Replay Level 1' : 'Start or continue Level 1'}
                aria-disabled={!state}
                className={`kg-garden__node ${state ? 'kg-garden__node--ready' : 'kg-garden__node--loading'}`}
                onClick={(event) => { if (!state) event.preventDefault() }}
              >
                {state?.completed ? <Check aria-hidden="true" size={23} /> : '1'}
              </Link>
              )
            }
          }

          return (
            <span
              key={level}
              style={style}
              className="kg-garden__node kg-garden__node--locked"
              aria-label={`Level ${level} not yet available`}
              title={`Level ${level} is not yet published`}
            >
              <LockKeyhole aria-hidden="true" size={19} />
              <span className="kg-garden__locked-number">{level}</span>
            </span>
          )
        })}
      </div>
      <div className="kg-garden__status" role={error ? 'alert' : 'status'}>
        {error ? (
          <>
            <span>{error}</span>
            <button type="button" onClick={() => setAttempt((current) => current + 1)}>
              <RotateCcw size={15} aria-hidden="true" /> Retry
            </button>
          </>
        ) : !state ? (
          'Loading your garden...'
        ) : state.completed ? (
          `${previewLabel} complete! Tap the checkmark to practise again.`
        ) : previewLevel !== 1 ? (
          `${previewLabel} · Q–V — Ready to explore`
        ) : (
          `${previewLabel} · ABCD — ${Math.min(state.currentIndex, state.totalActivities)} of ${state.totalActivities} activities completed`
        )}
      </div>
    </main>
  )
}

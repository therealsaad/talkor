'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LockKeyhole, Play, RotateCcw, Sparkles } from 'lucide-react'
import { kgAlphabetService, type KGAlphabetState } from '@/services/kg-alphabet-service'
import { makeKGPreviewState } from '@/services/kg-alphabet-preview'
import './kg-alphabet.css'

/** Optional replay map. Students start at /student/kg, not here. */
export function KGAlphabetMap({ preview = false, onPreviewPlay }: { preview?: boolean; onPreviewPlay?: (index: number) => void } = {}) {
  const [state, setState] = useState<KGAlphabetState | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (preview) { setState(makeKGPreviewState()); return }
    let alive = true
    kgAlphabetService.state().then((value) => { if (alive) setState(value) })
      .catch(() => { if (alive) setError('Could not load your garden. Check the connection and try again.') })
    return () => { alive = false }
  }, [preview])

  const href = state?.completed ? '/student/kg?replay=all' : '/student/kg'
  return <main className="kg-alpha kg-story-map" aria-label="Letter Garden replay map">
    <div className="kg-story-map__art">
      <Image src="/kg/images/letter-garden-map.png" fill priority sizes="100vw"
        alt="A colorful garden with Miss Julie, dancing A B C D letters and a winding ten-level pathway" />
    </div>
    <header className="kg-story-map__header">
      <span><Sparkles size={17}/> MISS JULIE'S LETTER GARDEN</span>
      <p>Only visit the map when you want to practise an earlier level.</p>
    </header>
    <section className="kg-story-map__actions" aria-label="Choose a level to replay">
      {error ? <p role="alert">{error}</p> : !state ? <p role="status">Opening your garden…</p> : <>
        {preview ? <button className="kg-story-map__primary" onClick={() => onPreviewPlay?.(0)} type="button"><Play size={20}/> Preview Level 1</button>
          : <Link href={href} className="kg-story-map__primary"><RotateCcw size={20} /> {state.completed ? 'Replay Level 1 · ABCD' : state.currentIndex ? 'Continue Level 1 · ABCD' : 'Visit Level 1 · ABCD'}</Link>}
        <span className="kg-story-map__progress">{Math.min(state.currentIndex, 8)} / 8 activities completed</span>
        <div className="kg-story-map__locks" aria-label="Future levels are not yet published">
          {Array.from({length: 9}, (_, n) => <span key={n} title={`Level ${n+2} not yet published`}><LockKeyhole size={12} /> {n+2}</span>)}
        </div>
      </>}
    </section>
  </main>
}

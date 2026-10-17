'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, LockKeyhole, Play, RotateCw, Sparkles } from 'lucide-react'
import { kgAlphabetService, type KGAlphabetState } from '@/services/kg-alphabet-service'
import { KG_PREVIEW_AUDIO, makeKGPreviewState, playKGPreviewSpeech } from '@/services/kg-alphabet-preview'
import './kg-alphabet.css'

export function KGAlphabetMap({ preview = false, onPreviewPlay }: { preview?: boolean; onPreviewPlay?: (index: number) => void } = {}) {
  const [state, setState] = useState<KGAlphabetState | null>(null)
  const [error, setError] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const router = useRouter()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let alive = true
    if (preview) { setState(makeKGPreviewState()); return () => { alive = false } }
    kgAlphabetService.state().then((value) => { if (alive) setState(value) })
      .catch(() => { if (alive) setError('Your letter garden is taking a moment to open. Please try again.') })
    return () => { alive = false }
  }, [preview])

  if (!state && !error) return <main className="kg-alpha kg-alpha-map"><div className="kg-alpha-garden-wash" /><p className="kg-alpha-loading" role="status">A little garden magic is on its way…</p></main>

  const continueHref = state?.completed ? '/student/kg?replay=all' : '/student/kg'
  const continueText = state?.completed ? 'Play the garden again' : state?.currentIndex ? 'Continue my adventure' : 'Start Level 1'
  const unlockedThrough = Math.min(state?.currentIndex ?? 0, 3)
  const replayIntro = async () => {
    if (!state) return
    setVoiceError('')
    try {
      if (preview) await playKGPreviewSpeech(KG_PREVIEW_AUDIO['replay-intro'])
      else {
        if (!audioRef.current) audioRef.current = new Audio()
        await kgAlphabetService.play('replay-intro', audioRef.current, state.audio['replay-intro']?.url)
      }
      router.push('/student/kg?intro=replay')
    } catch {
      setVoiceError('Miss Julie could not speak just now. Tap Replay story to try again.')
    }
  }

  return <main className="kg-alpha kg-alpha-map" aria-label="My ABCD adventure map">
    <Image className="kg-alpha-garden-art" src="/kg/images/garden-story.webp" alt="" fill priority sizes="100vw" />
    <div className="kg-alpha-garden-wash" aria-hidden="true" />
    <header className="kg-map-header">
      <span className="kg-alpha-eyebrow"><Sparkles size={16} /> MISS JULIE’S PICTURE GARDEN</span>
      <h1>Follow the letter trail!</h1>
      <p>Meet A, B, C and D. Every little step opens a new flower.</p>
    </header>
    {preview ? <div className="kg-alpha-preview-tag"><Sparkles size={14} /> SCHOOL PREVIEW · no student progress is saved</div> : null}

    {error ? <div className="kg-alpha-alert" role="alert">{error}</div> : state ? <>
      <section className="kg-alpha-map-board" aria-label="Level 1 letter checkpoints">
        <div className="kg-map-track" role="list">
          {state.letters.map((item, index) => {
            const done = state.currentIndex > index
            const locked = !preview && !done && index > unlockedThrough
            const color = item.color || ['#ef9695', '#f5c764', '#9b88d8', '#6dbb96'][index]
            const letterStyle = { '--checkpoint-color': color } as CSSProperties
            const label = `${item.letter} for ${item.word}${done ? ', replay checkpoint' : locked ? ', locked until earlier letters are practiced' : ', continue Level 1'}`
            const contents = <>
              <span>{locked ? '' : item.letter}</span>
              <Image src={`/kg/pictures/level-1/${item.word}.webp`} alt="" width={160} height={150} sizes="48px" />
              {locked ? <span className="kg-map-lock"><LockKeyhole aria-hidden="true" /></span> : done ? <span className="kg-map-done"><Check size={17} /></span> : null}
            </>
            return <motion.div key={item.letter} className="kg-map-checkpoint-wrap" role="listitem" initial={reduceMotion ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .08 }}>
              {preview ? <button type="button" className={`kg-map-checkpoint ${index === 0 ? 'is-current' : ''}`} style={letterStyle} aria-label={`Preview ${label}`} onClick={() => onPreviewPlay?.(index)}>{contents}</button>
                : locked ? <button type="button" className="kg-map-checkpoint" style={letterStyle} aria-label={label} disabled>{contents}</button>
                  : <Link href={done ? `/student/kg?replay=${item.letter.toLowerCase()}` : '/student/kg'} className={`kg-map-checkpoint ${done ? 'is-done' : 'is-current'}`} style={letterStyle} aria-label={label}>{contents}</Link>}
              <strong>{item.word}</strong>
              <small>{preview ? 'preview' : done ? 'replay' : locked ? 'coming soon' : 'your next step'}</small>
            </motion.div>
          })}
        </div>
        <div className="kg-map-actions">
          {preview ? <button type="button" className="kg-map-primary" onClick={() => onPreviewPlay?.(0)}><Play size={19} fill="currentColor" /> Preview full adventure <ArrowRight size={18} /></button>
            : <Link className="kg-map-primary" href={continueHref}><Play size={19} fill="currentColor" /> {continueText} <ArrowRight size={18} /></Link>}
          {!preview ? state.introSeen
            ? <button type="button" className="kg-map-secondary" onClick={() => void replayIntro()}><RotateCw size={16} /> Replay Miss Julie’s story</button>
            : <Link className="kg-map-secondary" href="/student/kg"><RotateCw size={16} /> Watch Miss Julie’s story</Link>
            : <button type="button" className="kg-map-secondary" onClick={() => onPreviewPlay?.(0)}><RotateCw size={16} /> Preview the full story</button>}
        </div>
        <p className="kg-map-progress">{Math.min(state.currentIndex, 8)} of 8 garden adventures completed</p>
      </section>
      <div className="kg-map-next-level"><LockKeyhole size={16} /> Level 2 opens after your ABCD adventure.</div>
      {voiceError ? <p className="kg-alpha-alert" role="alert">{voiceError}</p> : null}
    </> : null}
    <div className="kg-alpha-rotate-lock" aria-hidden="true"><RotateCw size={38} /><strong>Rotate your phone</strong><span>Turn your screen sideways to explore your garden.</span></div>
  </main>
}

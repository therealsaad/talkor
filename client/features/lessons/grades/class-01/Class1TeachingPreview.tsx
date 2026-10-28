'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { LevelActivity, LevelDesignConfig } from '../../types'
import { CLASS1_BALBHARATI_DRAFTS } from './balbharati-curriculum'
import { CLASS1_DRAFT_MODELS, class1PreviewCoachLine } from './class1-preview-scaffolds'
import type { Class1PreviewLanguage, Class1PreviewScaffold } from './class1-preview-scaffolds'
import styles from './class1-teaching-preview.module.css'

type Review = { decision: 'pending' | 'revise' | 'review-ready'; note: string }

/** A staff-only, no-network storyboard. It intentionally does not ask for a
 * microphone, send Azure/Sarvam requests, or call student progress endpoints.
 * The actual authenticated voice runtime is a separate, gated implementation.
 */
export function Class1TeachingPreview({ config, activities }: { config: LevelDesignConfig; activities: LevelActivity[] }) {
  const draft = CLASS1_BALBHARATI_DRAFTS.find((item) => item.level === config.level)
  const frame = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [language, setLanguage] = useState<Class1PreviewLanguage>('en')
  const [mode, setMode] = useState<Class1PreviewScaffold>('MODEL')
  const [portrait, setPortrait] = useState(false)
  const [fullscreenError, setFullscreenError] = useState(false)
  const [reviews, setReviews] = useState<Record<string, Review>>({})

  useEffect(() => {
    const update = () => setPortrait(window.innerHeight > window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (!draft) return <p role="alert">No Class 1 chapter draft for this level.</p>
  const activity = draft.exercises[index % draft.exercises.length]
  const example = CLASS1_DRAFT_MODELS[activity.chapter]
  const review = reviews[activity.chapter] ?? { decision: 'pending', note: '' }
  const hasMissingVisual = /picture|find|look at|which (one|insect)|which of these/i.test(activity.prompt)
  const palette = config.experience.palette
  const colors = { '--class1-accent': palette.primary, '--class1-ink': palette.ink } as CSSProperties

  function nextChapter(next: number) {
    setIndex((next + draft!.exercises.length) % draft!.exercises.length)
    setMode('MODEL')
  }

  async function enterFullscreen() {
    const node = frame.current
    if (!node) return
    try {
      if (!document.fullscreenElement) await node.requestFullscreen()
      setFullscreenError(false)
    } catch {
      setFullscreenError(true)
    }
  }

  function editReview(changes: Partial<Review>) {
    setReviews((before) => ({ ...before, [activity.chapter]: { ...review, ...changes } }))
  }

  function exportReview() {
    const exportPayload = {
      format: 'talkora-class1-staff-draft-review-v1',
      experienceId: config.id,
      source: 'English Balbharati Standard One (2025; 2026 reprint)',
      publicationApproved: false,
      requiresIndependentEducatorApproval: true,
      chapterReviews: draft!.exercises.map(({ chapter, name, page, prompt, evidence }) => ({
        chapter, name, page, prompt, evidence,
        model: CLASS1_DRAFT_MODELS[chapter],
        review: reviews[chapter] ?? { decision: 'pending', note: '' },
      })),
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `class1-level-${String(config.level).padStart(2, '0')}-review-draft.json`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <section className={styles.shell} aria-label="Class 1 teacher rehearsal" style={colors}>
    <header className={styles.ribbon}>
      <span>CLASS 1 • BALBHARATI • LEVEL {config.level}</span>
      <strong>STAFF REHEARSAL · NOT STUDENT PLAYABLE</strong>
    </header>
    <div className={styles.stage} ref={frame}>
      <div className={styles.topbar}>
        <div><small>{draft.scene}</small><h2>{draft.title}</h2></div>
        <div className={styles.topActions}>
          <span>{index + 1} / {draft.exercises.length} chapters</span>
          <button type="button" onClick={() => void enterFullscreen()}>⛶ Full screen</button>
        </div>
      </div>
      <div className={styles.classroom}>
        <div className={styles.julieSide}>
          <div className={styles.julieLabel}><span aria-hidden="true">✦</span> Your teacher, Miss Julie</div>
          <img className={styles.julie} src="/miss-julie/welcome.webp" alt="Miss Julie, your virtual English teacher" />
          <div className={styles.julieSpeech} aria-live="polite">
            <span className={styles.speechLabel}>JULIE • {mode.toLowerCase()} • {language.toUpperCase()}</span>
            <p>{class1PreviewCoachLine(activity.chapter, language, mode)}</p>
          </div>
        </div>
        <div className={styles.board}>
          <span className={styles.chapter}>BALBHARATI {activity.chapter} · PAGE {activity.page} · {activity.name}</span>
          <h3>{activity.prompt}</h3>
          <div className={styles.example}><small>EXAMPLE ENGLISH RESPONSE</small><strong>{example}</strong></div>
          <div className={styles.status} role="status">
            <span aria-hidden="true">🎤</span>
            <div><strong>Student speaks to Miss Julie</strong><small>In this staff preview the microphone is intentionally OFF. Simulate a coaching decision below.</small></div>
          </div>
          <div className={styles.languages} role="group" aria-label="Preview Miss Julie explanation language">
            {([['en', 'English'], ['hi', 'हिन्दी'], ['mr', 'मराठी']] as const).map(([code, label]) => (
              <button type="button" key={code} aria-pressed={language === code} onClick={() => setLanguage(code)}>{label}</button>
            ))}
          </div>
          <div className={styles.simulator} role="group" aria-label="Preview adaptive coaching states">
            <button type="button" onClick={() => setMode('MODEL')} aria-pressed={mode === 'MODEL'}>1 · Model</button>
            <button type="button" onClick={() => setMode('GUIDE')} aria-pressed={mode === 'GUIDE'}>2 · Needs help</button>
            <button type="button" onClick={() => setMode('PRACTISE')} aria-pressed={mode === 'PRACTISE'}>3 · Practise</button>
            <button type="button" onClick={() => setMode('EXTEND')} aria-pressed={mode === 'EXTEND'}>4 · Extend</button>
          </div>
        </div>
      </div>
      <div className={styles.pager}>
        <button type="button" onClick={() => nextChapter(index - 1)}>← Previous chapter</button>
        <span>English stays the learning target • Hindi/Marathi helps explain</span>
        <button type="button" onClick={() => nextChapter(index + 1)}>Next chapter →</button>
      </div>
      {portrait && <div className={styles.rotateOverlay} role="dialog" aria-label="Landscape preview">
        <strong>↻ Turn your screen sideways</strong><p>Miss Julie teaches in landscape. Enable auto-rotate on your device.</p>
        <button type="button" onClick={() => void enterFullscreen()}>Try full screen</button>
        {fullscreenError && <small>Browser or device blocked full screen; rotate manually.</small>}
      </div>}
    </div>
    <div className={styles.reviewPanel}>
      <div><strong>Educator review • {activity.chapter}</strong><p>{activity.evidence}</p>
        {hasMissingVisual && <p className={styles.warning}>⚠ This prompt refers to a picture or choice. An original, teacher-reviewed visual is still required before student use.</p>}
        <small>Preview state is not a child assessment, transcript score or model response. No student progress is recorded.</small>
      </div>
      <div className={styles.reviewFields}>
        <label>Draft review decision
          <select value={review.decision} onChange={(event) => editReview({ decision: event.target.value as Review['decision'] })}>
            <option value="pending">Pending</option><option value="revise">Needs revision</option><option value="review-ready">Ready for independent sign-off</option>
          </select>
        </label>
        <label>Teacher notes
          <textarea rows={2} placeholder="Check teaching, imagery, target words, Hindi/Marathi, safety…" value={review.note} onChange={(event) => editReview({ note: event.target.value })} />
        </label>
        <button type="button" onClick={exportReview}>Export draft review JSON ↓</button>
      </div>
    </div>
    <p className={styles.disclaimer}>All {activities.length} original activities are editorial drafts. Independent teacher approval, asset/audio verification, backend mapping and supervised voice trials are required before publishing. This screen makes <b>zero</b> Sarvam, Azure, Qwen or MongoDB calls.</p>
  </section>
}

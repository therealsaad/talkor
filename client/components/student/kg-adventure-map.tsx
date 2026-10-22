'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronRight, LockKeyhole, Sprout } from 'lucide-react'
import type { CSSProperties } from 'react'
import { MissJulieCharacter } from '@/components/student/lesson/miss-julie-character'
import type { KGAlphabetState } from '@/features/lessons/grades/kg/level-01/services/kg-alphabet-service'
import styles from './kg-adventure-map.module.css'

const LEVEL_POSITIONS = [
  { left: 22.5, top: 34 },
  { left: 42.4, top: 31.5 },
  { left: 67.2, top: 34.5 },
  { left: 86.4, top: 46.4 },
  { left: 38.2, top: 53.7 },
  { left: 62.5, top: 57.2 },
  { left: 15.7, top: 66.8 },
  { left: 39, top: 75.3 },
  { left: 64.8, top: 78.3 },
  { left: 89, top: 76.5 },
] as const

type GardenStatus = 'CURRENT' | 'COMPLETED' | 'LOCKED'

function lessonHref(levelNumber: number, status: GardenStatus) {
  if (status === 'LOCKED') return undefined
  if (levelNumber === 1) return status === 'COMPLETED' ? '/student/kg?replay=all' : '/student/kg'
  return undefined
}

function displayStatus(status: GardenStatus) {
  if (status === 'CURRENT') return 'Ready'
  if (status === 'COMPLETED') return 'Completed'
  return 'Locked'
}

export function KGAdventureMap({
  kgLevel1State,
  loading = false,
  error,
  onRetry,
  onHomeworkComplete,
  homeworkBusy = false,
  homeworkError,
}: {
  kgLevel1State: KGAlphabetState | null
  loading?: boolean
  error?: string
  onRetry?: () => void
  onHomeworkComplete?: () => void
  homeworkBusy?: boolean
  homeworkError?: string
}) {
  const levels = LEVEL_POSITIONS.map((position, index) => {
    const number = index + 1
    const status: GardenStatus = number === 1 && kgLevel1State
      ? kgLevel1State.completed ? 'COMPLETED' : 'CURRENT'
      : 'LOCKED'
    const progress = number === 1 && kgLevel1State
      ? Math.min(100, Math.round((kgLevel1State.currentIndex / Math.max(1, kgLevel1State.totalActivities)) * 100))
      : 0

    return {
      number,
      position,
      title: number === 1 ? kgLevel1State?.title : undefined,
      status,
      progress,
      href: lessonHref(number, status),
    }
  })
  const currentLevel = levels.find((level) => level.status === 'CURRENT')
  const allLevelsComplete = levels.every((level) => level.status === 'COMPLETED')
  const completedLevelCount = levels.filter((level) => level.status === 'COMPLETED').length
  const xp = kgLevel1State?.xp ?? 0
  const stars = kgLevel1State?.stars ?? 0
  const homework = kgLevel1State?.homework

  return (
    <main className={styles.map} aria-label="Kindergarten learning garden">
      <header className={styles.welcome}>
        <div className={styles.welcomeCopy}>
          <span className={styles.kicker}>MISS JULIE&apos;S LEARNING GARDEN</span>
          <h1>Let&apos;s grow our English!</h1>
          <p>
            {currentLevel?.title
              ? `Level ${currentLevel.number} is ready: ${currentLevel.title}. Tap its glowing stone to continue.`
              : allLevelsComplete
                ? 'You finished every garden level. Hooray!'
                : completedLevelCount > 0
                  ? `You finished ${completedLevelCount} level${completedLevelCount === 1 ? '' : 's'}! More garden paths are getting ready.`
                : error
                  ? 'Your garden is taking a little rest. Try loading it again.'
                  : 'Choose a garden stone to see your next adventure.'}
          </p>
          {currentLevel?.href ? (
            <Link className={styles.continue} href={currentLevel.href}>
              Continue with Level {currentLevel.number}
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <div className={styles.julie} aria-label="Miss Julie welcomes you">
          <MissJulieCharacter state="greeting" />
        </div>
      </header>

      {kgLevel1State ? (
        <section aria-label="Your KG learning progress" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'stretch', margin: '12px 0 18px' }}>
          <div style={{ padding: '12px 18px', background: '#fff9e9', color: '#55411e', borderRadius: 16, fontWeight: 700 }} aria-label={`${xp} experience points`}>⭐ {xp} XP</div>
          <div style={{ padding: '12px 18px', background: '#fff9e9', color: '#55411e', borderRadius: 16, fontWeight: 700 }} aria-label={`${stars} stars earned`}>🌟 {stars} Stars</div>
          {homework?.status !== 'not-assigned' && homework ? (
            <div style={{ flex: '1 1 260px', padding: '12px 18px', background: '#eef9ef', color: '#244e35', borderRadius: 16 }}>
              <strong>📚 Miss Julie&apos;s homework — {homework.status === 'completed' ? 'Practised!' : 'To practise at home'}</strong>
              <p style={{ margin: '6px 0 0' }}>{homework.text}</p>
              {homework.status === 'pending' && onHomeworkComplete ? (
                <button type="button" className={styles.homeworkCheckIn} disabled={homeworkBusy} onClick={onHomeworkComplete}>
                  {homeworkBusy ? 'Saving your practice…' : 'I practised at home'}
                </button>
              ) : homework.status === 'completed' ? <p aria-live="polite">✅ Your practice is saved!</p> : null}
              {homeworkError ? <p role="alert">{homeworkError}</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}
      <figure className={styles.scene}>
        <Image
          src="/lessons/kg/images/kg-simple-garden.webp"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 96vw"
          className={styles.background}
        />

        {loading || error || !kgLevel1State ? (
          <div className={styles.message} role={error ? 'alert' : 'status'}>
            {error ? (
              <>
                <span>{error}</span>
                {onRetry ? <button type="button" onClick={onRetry}>Try again</button> : null}
              </>
            ) : (
              <span>{loading ? 'Loading your garden...' : 'Your class levels are not available yet. Please ask your teacher.'}</span>
            )}
          </div>
        ) : (
          <ol className={styles.levels} aria-label="Ten KG learning levels">
            {levels.map((level) => {
              const Icon = level.status === 'CURRENT' ? Sprout : level.status === 'COMPLETED' ? Check : LockKeyhole
              const status = displayStatus(level.status)
              const style = {
                left: `${level.position.left}%`,
                top: `${level.position.top}%`,
              } satisfies CSSProperties
              const ringStyle = {
                background: `conic-gradient(#48a66c ${level.progress}%, rgba(255, 255, 255, .88) 0)`,
              } satisfies CSSProperties
              const label = `Level ${level.number}${level.title ? `, ${level.title}` : ', not available yet'}; ${status}${level.number === 1 && kgLevel1State ? `, ${level.progress}% complete` : ''}`

              return (
                <li
                  className={`${styles.level} ${level.status === 'CURRENT' ? styles.current : ''} ${level.status === 'COMPLETED' ? styles.completed : ''} ${level.status === 'LOCKED' ? styles.locked : ''}`}
                  key={level.number}
                  style={style}
                >
                  <div className={styles.progressRing} style={ringStyle}>
                    {level.href ? (
                      <Link href={level.href} className={styles.levelButton} aria-label={label}>
                        <span className={styles.levelNumber}>{level.number}</span>
                        <span className={styles.levelStatus} aria-hidden="true"><Icon size={16} strokeWidth={2.8} /></span>
                      </Link>
                    ) : (
                      <button type="button" className={styles.levelButton} aria-label={label} disabled>
                        <span className={styles.levelNumber}>{level.number}</span>
                        <span className={styles.levelStatus} aria-hidden="true"><Icon size={16} strokeWidth={2.8} /></span>
                      </button>
                    )}
                  </div>
                  {level.status === 'CURRENT' ? <span className={styles.readyLabel}>Ready</span> : null}
                </li>
              )
            })}
          </ol>
        )}
      </figure>

      <footer className={styles.footer}>
        <span><Sprout size={15} aria-hidden="true" /> Tap a stone to explore</span>
        {kgLevel1State ? <span>{completedLevelCount} of {LEVEL_POSITIONS.length} levels complete</span> : null}
      </footer>
    </main>
  )
}

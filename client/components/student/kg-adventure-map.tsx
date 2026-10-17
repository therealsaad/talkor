'use client'

import Link from 'next/link'
import { Apple, Backpack, BookOpen, Check, ChevronRight, HeartHandshake, LockKeyhole, Palette, PawPrint, Sparkles, Sprout, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { StudentCurriculum, StudentCurriculumUnit } from '@/services/curriculum-service'
import { MissJulieCharacter } from '@/components/student/lesson/miss-julie-character'

const UNIT_ICONS: LucideIcon[] = [Sprout, Sun, Backpack, Palette, PawPrint, Apple, HeartHandshake, BookOpen]

function stateLabel(unit: StudentCurriculumUnit): string {
  if (unit.status === 'COMPLETED') return 'Done'
  if (unit.status === 'CURRENT') return 'Ready'
  return 'Locked'
}

export function KGAdventureMap({ curriculum, error }: { curriculum: StudentCurriculum | null; error?: string }) {
  const units = curriculum?.units.slice(0, 8) || []
  const canContinue = units.some((unit) => unit.status === 'CURRENT')
  const allComplete = units.length > 0 && units.every((unit) => unit.status === 'COMPLETED')

  return (
    <main className="kg-adventure-map" aria-label="Kindergarten adventure map">
      <section className="kg-adventure-welcome">
        <div className="kg-adventure-copy">
          <span className="kg-adventure-kicker"><Sparkles size={16} aria-hidden="true" /> YOUR KG ADVENTURE</span>
          <h1>Let’s learn little words!</h1>
          <p>Listen, look, and speak with Miss Julie.</p>
          {canContinue ? (
            <Link className="kg-adventure-continue" href="/student/continue">
              <span><strong>Continue Learning</strong><small>Miss Julie will open your next activity</small></span>
              <ChevronRight size={26} aria-hidden="true" />
            </Link>
          ) : allComplete ? (
            <p className="kg-adventure-status" role="status">You finished all eight adventures. Ask your teacher what comes next.</p>
          ) : error ? (
            <p className="kg-adventure-status" role="status">{error}</p>
          ) : (
            <p className="kg-adventure-status" role="status">Your next adventure is getting ready. Please ask your teacher for help.</p>
          )}
        </div>
        <div className="kg-adventure-julie" aria-label="Miss Julie welcomes you">
          <MissJulieCharacter state="greeting" />
        </div>
      </section>

      {curriculum ? (
        <section className="kg-adventure-path" aria-labelledby="kg-adventure-units">
          <div className="kg-adventure-path-heading">
            <div><span>OUR PATH</span><h2 id="kg-adventure-units">Eight little adventures</h2></div>
            <span className="kg-adventure-count">{curriculum.completedUnits} of 8 done</span>
          </div>
          <ol className="kg-adventure-units">
            {units.map((unit, index) => {
              const Icon = UNIT_ICONS[index] || BookOpen
              const isCurrent = unit.status === 'CURRENT'
              const isComplete = unit.status === 'COMPLETED'
              const progress = Math.min(100, Math.max(0, unit.progress ?? (isComplete ? 100 : 0)))
              return (
                <li className={`kg-adventure-unit kg-adventure-unit--${unit.status.toLowerCase()}`} key={unit.id}>
                  <div className="kg-adventure-unit-icon" aria-hidden="true"><Icon size={27} strokeWidth={2.2} /></div>
                  <div className="kg-adventure-unit-copy">
                    <span className="kg-adventure-unit-number">ADVENTURE {index + 1}</span>
                    <h3>{unit.title}</h3>
                    <div className="kg-adventure-unit-progress" aria-label={`${progress}% complete`}>
                      <span><i style={{ width: `${progress}%` }} /></span><small>{progress}%</small>
                    </div>
                  </div>
                  <span className="kg-adventure-unit-state">
                    {isComplete ? <Check size={16} aria-hidden="true" /> : isCurrent ? <Sparkles size={16} aria-hidden="true" /> : <LockKeyhole size={15} aria-hidden="true" />}
                    {stateLabel(unit)}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      ) : null}
      <p className="kg-adventure-footer"><span aria-hidden="true">★</span> Every little try helps you grow.</p>
    </main>
  )
}

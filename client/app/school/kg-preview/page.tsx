'use client'

import Image from 'next/image'
import Link from 'next/link'
import { SchoolShell } from '@/components/school/school-shell'
import { config as level01 } from '@/features/lessons/grades/kg/level-01/config'
import { config as level02 } from '@/features/lessons/grades/kg/level-02/config'
import { config as level03 } from '@/features/lessons/grades/kg/level-03/config'
import { config as level04 } from '@/features/lessons/grades/kg/level-04/config'
import { config as level05 } from '@/features/lessons/grades/kg/level-05/config'
import { config as level06 } from '@/features/lessons/grades/kg/level-06/config'
import { config as level07 } from '@/features/lessons/grades/kg/level-07/config'
import { config as level08 } from '@/features/lessons/grades/kg/level-08/config'
import { config as level09 } from '@/features/lessons/grades/kg/level-09/config'
import { config as level10 } from '@/features/lessons/grades/kg/level-10/config'
import './kg-preview.css'

const levels = [level01, level02, level03, level04, level05, level06, level07, level08, level09, level10]

export default function KGAlphabetSchoolPreview() {
  return (
    <SchoolShell title="KG Learning Garden" subtitle="Choose a level to explore its staff preview.">
      <main className="kg-preview-garden" aria-label="Kindergarten level selection">
        <Image
          className="kg-preview-garden__background"
          src="/lessons/kg/images/kg-simple-garden.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 100vw, 1320px"
        />
        <div className="kg-preview-garden__content">
          <header className="kg-preview-garden__heading">
            <span>YOUR LEARNING ADVENTURE</span>
            <h1>Pick a garden path!</h1>
            <p>Choose a level to see what is growing.</p>
          </header>
          <nav className="kg-preview-garden__levels" aria-label="Kindergarten levels">
            {levels.map((level) => {
              const href = level.level === 1
                ? '/school/kg-preview/level-1'
                : level.level === 2
                  ? '/school/kg-preview/level-2'
                  : level.level === 3
                    ? '/school/kg-preview/level-3'
                  : level.level === 4
                    ? '/school/kg-preview/level-4'
                    : level.level === 5
                      ? '/school/kg-preview/level-5'
                      : null
              const label = `Level ${level.level}: ${level.title}`

              return href ? (
                <Link
                  className={`kg-preview-garden__level${level.level === 3 || level.level === 4 || level.level === 5 ? ' kg-preview-garden__level--featured' : ''}`}
                  href={href}
                  key={level.id}
                  aria-label={`Open ${label}`}
                >
                  <span className="kg-preview-garden__number">{level.level}</span>
                  <span className="kg-preview-garden__details">
                    <strong>Level {level.level}</strong>
                    <span>{level.title}</span>
                    <small>Open staff preview</small>
                  </span>
                </Link>
              ) : (
                <div
                  className="kg-preview-garden__level kg-preview-garden__level--unavailable"
                  key={level.id}
                  aria-label={`${label}; not available in this preview`}
                >
                  <span className="kg-preview-garden__number">{level.level}</span>
                  <span className="kg-preview-garden__details">
                    <strong>Level {level.level}</strong>
                    <span>{level.title}</span>
                    <small>Not available in this preview</small>
                  </span>
                </div>
              )
            })}
          </nav>
          <p className="kg-preview-garden__staff-note">Staff preview only. Student lesson access is unchanged.</p>
        </div>
      </main>
    </SchoolShell>
  )
}

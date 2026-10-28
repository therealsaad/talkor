'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, RotateCw, UsersRound } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { curriculumService, type CurriculumClass } from '@/services/curriculum-service'
import { gradeLongLabel } from '@/lib/grade-label'
import './classes.css'

export default function SchoolClassesPage() {
  const [classes, setClasses] = useState<CurriculumClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    curriculumService.getClasses()
      .then((list) => { if (active) setClasses(list) })
      .catch((cause: unknown) => {
        console.error('Failed to load classes', cause)
        if (active) setError('Classes could not be loaded. Please try again.')
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [reload])

  return (
    <SchoolShell
      title="My Classes"
      subtitle="Browse the active curriculum for each grade."
    >
      <main className="school-classes" aria-label="Classes">
        <section className="school-classes__intro" aria-labelledby="school-classes-heading">
          <div className="school-classes__intro-icon" aria-hidden="true">
            <GraduationCap size={25} strokeWidth={1.8} />
          </div>
          <div>
            <span className="school-classes__eyebrow">CLASS DIRECTORY</span>
            <h2 id="school-classes-heading">Explore your classrooms</h2>
            <p>Choose a class to review its curriculum or see its students.</p>
          </div>
        </section>

        {loading ? (
          <div className="school-classes__grid" role="status" aria-label="Loading classes" aria-busy="true">
            {[0, 1, 2].map((item) => (
              <div className="school-class-skeleton" key={item}>
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : error ? (
          <section className="school-classes__message school-classes__message--error" role="alert">
            <div className="school-classes__message-icon"><BookOpen size={22} /></div>
            <div>
              <h2>We couldn’t open your classes</h2>
              <p>{error}</p>
            </div>
            <button type="button" onClick={() => setReload((value) => value + 1)}>
              <RotateCw size={16} aria-hidden="true" />
              Try again
            </button>
          </section>
        ) : classes.length === 0 ? (
          <section className="school-classes__message" role="status">
            <div className="school-classes__message-icon"><BookOpen size={22} /></div>
            <div>
              <h2>No classes to show yet</h2>
              <p>Classes will appear here when they are available for your school.</p>
            </div>
          </section>
        ) : (
          <div className="school-classes__grid" aria-label="Available classes">
            {classes.map((cls) => (
              <article className="school-class-card" key={cls.id}>
                <div className="school-class-card__top">
                  <span className="school-class-card__grade">
                    <GraduationCap size={15} aria-hidden="true" />
                    {gradeLongLabel(cls.grade)}
                  </span>
                  <span className="school-class-card__icon" aria-hidden="true">
                    <BookOpen size={20} strokeWidth={1.8} />
                  </span>
                </div>

                <div className="school-class-card__body">
                  <h2>{cls.name}</h2>
                  <p>Review the levels currently configured for this grade, with publication status and source notes where available.</p>
                </div>

                <div className="school-class-card__actions">
                  <Link className="school-class-card__secondary" href={`/school/students?grade=${cls.grade}`}>
                    <UsersRound size={16} aria-hidden="true" />
                    View students
                  </Link>
                  <Link className="school-class-card__primary" href={`/school/classes/${cls.id}`}>
                    Preview levels
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </SchoolShell>
  )
}

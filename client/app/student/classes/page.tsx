'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { curriculumService, CurriculumClass } from '@/services/curriculum-service'
import { useAuth } from '@/components/auth/auth-provider'
import { gradeLongLabel } from '@/lib/grade-label'

export default function StudentClassesPage() {
  const { student } = useAuth()
  const [classes, setClasses] = useState<CurriculumClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const list = await curriculumService.getClasses()
        setClasses(list)
      } catch (cause) {
        setError(cause instanceof Error && cause.message ? cause.message : 'Your class curriculum is not available yet. Please ask your school administrator to publish it.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const studentGrade = student?.grade ?? 4

  return (
    <div className="world-screen world-map" style={{ minHeight: '100vh', paddingBottom: '120px' }}>
      <div className="world-copy">
        <span className="world-kicker">Talkora Learning Paths</span>
        <h1>Choose Your Class</h1>
        <p>Choose your grade to explore its published adventure worlds.</p>
      </div>

      <main style={{ maxWidth: '960px', margin: '36px auto 0', padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#172554', fontWeight: 800 }}>Loading classes...</div>
        ) : (
          <>
          {error ? <div role="alert" style={{ marginBottom: 18, padding: 16, borderRadius: 12, background: '#fff7ed', color: '#9a3412', lineHeight: 1.5 }}>{error}</div> : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {classes.map((cls) => {
              const isCurrent = cls.grade === studentGrade
              return (
                <div
                  key={cls.id}
                  style={{
                    background: isCurrent ? '#ffd83d' : '#ffffff',
                    border: '4px solid #172554',
                    borderRadius: '24px',
                    boxShadow: '7px 7px 0 #172554',
                    padding: '24px',
                    position: 'relative',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  {isCurrent && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-14px',
                        right: '20px',
                        background: '#ff4fa3',
                        color: '#fff',
                        border: '2px solid #172554',
                        borderRadius: '999px',
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                      }}
                    >
                      Your Class ⭐
                    </span>
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#40527d', textTransform: 'uppercase' }}>
                    {gradeLongLabel(cls.grade)}
                  </span>
                  <h2 style={{ fontSize: '32px', margin: '8px 0', color: '#172554' }}>{cls.name}</h2>
                  <p style={{ color: '#40527d', fontWeight: 700, fontSize: '14px', marginBottom: '20px' }}>
                    Vocabulary, speaking, grammar and story adventures
                  </p>

                  <Link
                    href={`/student/levels?classId=${cls.id}&grade=${cls.grade}`}
                    className="button"
                    style={{
                      background: isCurrent ? '#ff7a3d' : '#172554',
                      color: '#ffffff',
                      border: '2px solid #172554',
                      borderRadius: '14px',
                      width: '100%',
                      textAlign: 'center',
                      display: 'block',
                      padding: '12px',
                      fontWeight: 900,
                    }}
                  >
                    Open Adventure Map →
                  </Link>
                </div>
              )
            })}
          </div>
          </>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="world-nav" aria-label="Student Navigation">
        <Link href="/student/home">Home</Link>
        <Link href="/student/levels">Adventure Map</Link>
        <Link className="learn-active" href="/student/classes">Classes</Link>
        <Link href="/student/progress">Progress</Link>
        <Link href="/student/rewards">Rewards</Link>
        <Link href="/student/profile">Profile</Link>
      </nav>
    </div>
  )
}

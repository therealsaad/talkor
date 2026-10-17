'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { SchoolShell } from '@/components/school/school-shell'
import { curriculumService, CurriculumClass } from '@/services/curriculum-service'
import { gradeLongLabel } from '@/lib/grade-label'

export default function SchoolClassesPage() {
  const [classes, setClasses] = useState<CurriculumClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const list = await curriculumService.getClasses()
        setClasses(list)
      } catch (err) {
        console.error('Failed to load classes', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <SchoolShell
      title="Classroom & Curriculum Management"
      subtitle="Browse the active curriculum for each grade."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {classes.map((cls) => (
          <div
            key={cls.id}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '18px',
              padding: '24px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', background: '#e0f2fe', padding: '4px 10px', borderRadius: '8px' }}>
                {gradeLongLabel(cls.grade)}
              </span>
              <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700 }}>Curriculum preview</span>
            </div>

            <h3 style={{ fontSize: '20px', color: '#0f172a', margin: '0 0 8px' }}>{cls.name}</h3>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.4, margin: '0 0 20px', flex: 1 }}>
              Review the levels currently configured for this grade, with publication status and source notes where available.
            </p>

            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <Link
                href={`/school/students?grade=${cls.grade}`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#0f172a',
                  textDecoration: 'none',
                }}
              >
                View Students
              </Link>
              <Link
                href={`/school/classes/${cls.id}`}
                style={{
                  background: '#ffd83d',
                  border: '1px solid #0f172a',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 900,
                  color: '#0f172a',
                  textDecoration: 'none',
                }}
              >
                Preview levels →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </SchoolShell>
  )
}

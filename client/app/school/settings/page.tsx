'use client'

import { useState } from 'react'
import { Copy, Check, ShieldCheck, UserCheck } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { useAuth } from '@/components/auth/auth-provider'

export default function SchoolSettingsPage() {
  const { session, role } = useAuth()
  const isTeacher = role === 'TEACHER'
  const [copied, setCopied] = useState(false)

  const schoolCode = session?.school?.code || ''

  const handleCopyCode = async () => {
    if (!schoolCode) return
    try {
      await navigator.clipboard.writeText(schoolCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <SchoolShell
      title={isTeacher ? 'My Account' : 'School Settings'}
      subtitle={isTeacher ? 'Your teacher profile and school account details.' : 'School profile, credentials, and student access code.'}
    >
      <div style={{ display: 'grid', gap: 24, maxWidth: 680 }}>
        {/* Profile Card */}
        <section
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 18,
            padding: '28px 32px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isTeacher ? '#f0f9ff' : '#eef2ff',
                color: isTeacher ? '#0284c7' : '#4f46e5',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {isTeacher ? <UserCheck size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isTeacher ? 'Teacher Account Profile' : 'School Profile'}
              </h2>
              <small style={{ color: '#64748b', fontSize: 12 }}>
                {isTeacher ? 'Authenticated Classroom Educator' : 'Authorized School Administration'}
              </small>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            {isTeacher && session?.user ? (
              <>
                <div>
                  <label
                    htmlFor="teacher-name"
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    Teacher Name
                  </label>
                  <input
                    id="teacher-name"
                    readOnly
                    value={session.user.name || '—'}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontWeight: 700,
                      color: '#0f172a',
                      fontSize: 14,
                    }}
                  />
                </div>

                {session.user.email ? (
                  <div>
                    <label
                      htmlFor="teacher-email"
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      Teacher Email
                    </label>
                    <input
                      id="teacher-email"
                      readOnly
                      value={session.user.email}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        fontWeight: 600,
                        color: '#0f172a',
                        fontSize: 14,
                      }}
                    />
                  </div>
                ) : null}
              </>
            ) : null}

            <div>
              <label
                htmlFor="school-name"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Affiliated School Name
              </label>
              <input
                id="school-name"
                readOnly
                value={session?.school?.name || '—'}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontWeight: 700,
                  color: '#0f172a',
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                htmlFor="school-code"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                School Code
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="school-code"
                  readOnly
                  value={schoolCode || '—'}
                  style={{
                    flex: 1,
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    color: '#0284c7',
                    fontSize: 16,
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0 16px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: copied ? '#ecfdf5' : '#ffffff',
                    color: copied ? '#059669' : '#0f172a',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <small style={{ color: '#64748b', fontSize: 12, marginTop: 6, display: 'block' }}>
                Students enter this code along with their PIN to sign in at <code>/login/student</code>.
              </small>
            </div>
          </div>
        </section>
      </div>
    </SchoolShell>
  )
}

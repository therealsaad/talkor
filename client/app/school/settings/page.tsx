'use client'

import { SchoolShell } from '@/components/school/school-shell'
import { useAuth } from '@/components/auth/auth-provider'

export default function SchoolSettingsPage() {
  const { session } = useAuth()

  return (
    <SchoolShell title="School profile" subtitle="Your school account details.">
      <section style={{ maxWidth: 640, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 30 }}>
        <h2 style={{ fontSize: 18, color: '#0f172a', margin: '0 0 20px' }}>School profile</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label htmlFor="school-name" style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>School name</label>
            <input id="school-name" readOnly value={session?.school?.name || '—'} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }} />
          </div>
          <div>
            <label htmlFor="school-code" style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>School code</label>
            <input id="school-code" readOnly value={session?.school?.code || '—'} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 900, letterSpacing: 2, color: '#0284c7' }} />
            <small style={{ color: '#64748b', fontSize: 12, marginTop: 4, display: 'block' }}>Students use this code to sign in at <code>/login/student</code>.</small>
          </div>
        </div>
      </section>
    </SchoolShell>
  )
}

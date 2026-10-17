'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Mail, Plus, Search, ShieldCheck, UserRoundCheck, Users } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { schoolService } from '@/services/school-service'

type Teacher = {
  id: string
  name: string
  email: string
  status: 'active' | 'suspended'
  createdAt: string
}

export default function TeachersPage() {
  const [items, setItems] = useState<Teacher[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  async function load() {
    setError('')
    try {
      setItems(await schoolService.listTeachers())
    } catch {
      setError("We couldn't load teachers. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await schoolService.createTeacher({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      setOpen(false)
      setForm({ name: '', email: '', password: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't add this teacher.")
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    return items.filter((item) => `${item.name} ${item.email} ${item.status}`.toLowerCase().includes(needle))
  }, [items, query])

  const activeCount = items.filter((teacher) => teacher.status === 'active').length
  const suspendedCount = items.length - activeCount

  return (
    <SchoolShell title="Teacher Directory" subtitle="Real school accounts connected to your Talkora backend.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 18 }}>
        <Stat icon={<Users size={18} />} label="Total teachers" value={items.length} />
        <Stat icon={<UserRoundCheck size={18} />} label="Active" value={activeCount} />
        <Stat icon={<ShieldCheck size={18} />} label="Suspended" value={suspendedCount} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0 12px', minWidth: 240, maxWidth: 420, flex: 1 }}>
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or status…" style={{ border: 0, outline: 0, minHeight: 46, flex: 1, width: '100%' }} />
        </label>
        <button type="button" onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 46, background: '#f7ca3e', border: '1px solid #c89f1f', borderRadius: 12, padding: '0 16px', fontWeight: 850, cursor: 'pointer' }}>
          <Plus size={16} /> Add teacher
        </button>
      </div>

      {error ? <p role="alert" style={{ background: '#fff1f0', color: '#a43b35', padding: 12, borderRadius: 10 }}>{error}</p> : null}

      <section style={{ background: '#fff', border: '1px solid #e5e8ef', borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 36px rgba(26,38,64,.06)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#69728a' }}>Loading teachers…</div>
        ) : filtered.length ? filtered.map((teacher) => (
          <article key={teacher.id} style={{ display: 'grid', gridTemplateColumns: '46px minmax(0,1fr) auto', gap: 13, alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid #eef0f4' }}>
            <span style={{ background: '#e9efff', color: '#385a91', borderRadius: 13, height: 46, display: 'grid', placeItems: 'center' }}><Users size={19} /></span>
            <div style={{ minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: 14 }}>{teacher.name}</b>
              <small style={{ display: 'flex', gap: 5, alignItems: 'center', color: '#747e92', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}><Mail size={12} />{teacher.email}</small>
              {teacher.createdAt ? <small style={{ display: 'block', color: '#9aa2b2', marginTop: 4 }}>Added {new Date(teacher.createdAt).toLocaleDateString()}</small> : null}
            </div>
            <span style={{ fontSize: 10, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '.04em', padding: '7px 10px', borderRadius: 99, background: teacher.status === 'active' ? '#eaf8f1' : '#fff0ed', color: teacher.status === 'active' ? '#18764b' : '#a33c31' }}>{teacher.status}</span>
          </article>
        )) : (
          <div style={{ padding: 44, textAlign: 'center', color: '#69728a' }}>{query ? 'No teachers match your search.' : 'No teachers have been added yet.'}</div>
        )}
      </section>

      {open ? (
        <div className="school-teacher-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(8,17,38,.55)', display: 'grid', placeItems: 'center', zIndex: 110, padding: 16 }} onMouseDown={(e) => { if (e.currentTarget === e.target && !saving) setOpen(false) }}>
          <form className="school-teacher-modal-form" onSubmit={submit} style={{ background: '#fff', borderRadius: 20, padding: 24, width: 'min(440px,100%)', boxShadow: '0 28px 70px rgba(0,0,0,.24)' }}>
            <h2 style={{ margin: '0 0 6px' }}>Add teacher</h2>
            <p style={{ color: '#69728a', margin: '0 0 16px', fontSize: 13 }}>Creates a real teacher login for this school.</p>
            {(['name', 'email', 'password'] as const).map((key) => (
              <label key={key} style={{ display: 'grid', gap: 6, fontSize: 11, fontWeight: 850, textTransform: 'capitalize', marginTop: 12 }}>
                {key}
                <input required minLength={key === 'password' ? 8 : undefined} type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} autoComplete={key === 'password' ? 'new-password' : key} style={{ minHeight: 46, border: '1px solid #d8dde6', borderRadius: 10, padding: '0 12px', outline: 0 }} />
              </label>
            ))}
            <div className="school-teacher-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 22 }}>
              <button type="button" disabled={saving} onClick={() => setOpen(false)} style={{ minHeight: 44, border: 0, borderRadius: 10, padding: '0 14px', cursor: 'pointer' }}>Cancel</button>
              <button disabled={saving} style={{ minHeight: 44, border: 0, borderRadius: 10, padding: '0 16px', background: '#0b1736', color: '#fff', fontWeight: 850, cursor: saving ? 'wait' : 'pointer', opacity: saving ? .7 : 1 }}>{saving ? 'Creating…' : 'Create teacher'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </SchoolShell>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 15px', background: '#fff', border: '1px solid #e5e8ef', borderRadius: 15 }}><span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 11, background: '#eef3ff', color: '#334f87' }}>{icon}</span><div><small style={{ display: 'block', color: '#7c8598' }}>{label}</small><strong style={{ fontSize: 20 }}>{value}</strong></div></div>
}

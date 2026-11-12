'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Mail, Plus, Search, ShieldCheck, UserRoundCheck, Users, X } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { schoolService } from '@/services/school-service'
import './teachers.css'

type Teacher = {
  id: string
  name: string
  email: string
  status: 'active' | 'suspended'
  createdAt: string
}

type StatusFilter = 'all' | Teacher['status']

const initialForm = { name: '', email: '', password: '' }

export default function TeachersPage() {
  const { role } = useAuth()
  const [items, setItems] = useState<Teacher[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await schoolService.listTeachers())
    } catch (reason) {
      console.error('Failed to load teachers', reason)
      setError("We couldn't load teachers. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function submit(event: FormEvent<HTMLFormElement>) {
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
      setForm(initialForm)
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't add this teacher.")
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return items.filter((teacher) => {
      const matchesQuery = !needle || `${teacher.name} ${teacher.email}`.toLocaleLowerCase().includes(needle)
      return matchesQuery && (statusFilter === 'all' || teacher.status === statusFilter)
    })
  }, [items, query, statusFilter])

  const activeCount = items.filter((teacher) => teacher.status === 'active').length
  const suspendedCount = items.length - activeCount
  const hasFilters = query.trim().length > 0 || statusFilter !== 'all'
  const canAddTeacher = role === 'SCHOOL_ADMIN'

  function clearFilters() {
    setQuery('')
    setStatusFilter('all')
  }

  return (
    <SchoolShell title="Teachers" subtitle="Manage the teacher accounts connected to your school.">
      <main className="school-teachers" aria-label="Teacher management">
        <section className="school-teachers__intro" aria-labelledby="school-teachers-heading">
          <div className="school-teachers__intro-icon" aria-hidden="true">
            <Users size={24} strokeWidth={1.8} />
          </div>
          <div className="school-teachers__intro-copy">
            <span className="school-teachers__eyebrow">SCHOOL TEAM</span>
            <h2 id="school-teachers-heading">Teacher directory</h2>
            <p>Find staff accounts and review their current access status.</p>
          </div>
          {canAddTeacher ? (
            <button
              className="school-teachers__add-button"
              type="button"
              onClick={() => { setError(''); setOpen(true) }}
            >
              <Plus size={17} aria-hidden="true" />
              Add teacher
            </button>
          ) : null}
        </section>

        <section className="school-teachers__stats" aria-label="Teacher account summary">
          <Stat icon={<Users size={18} />} label="Total teachers" value={items.length} />
          <Stat icon={<UserRoundCheck size={18} />} label="Active" value={activeCount} tone="active" />
          <Stat icon={<ShieldCheck size={18} />} label="Suspended" value={suspendedCount} tone="suspended" />
        </section>

        {error ? (
          <section className="school-teachers__error" role="alert">
            <p>{error}</p>
            {!open ? (
              <button type="button" onClick={() => void load()} disabled={loading}>
                {loading ? 'Retrying…' : 'Try again'}
              </button>
            ) : null}
          </section>
        ) : null}

        <section className="school-teachers__panel" aria-labelledby="school-teachers-list-heading">
          <header className="school-teachers__panel-header">
            <div className="school-teachers__panel-title">
              <h2 id="school-teachers-list-heading">All teachers</h2>
              {!loading && !error ? (
                <span className="school-teachers__result-count">
                  {filtered.length} of {items.length}
                </span>
              ) : null}
            </div>

            <div className="school-teachers__filters" aria-label="Filter teachers">
              <label className="school-teachers__search">
                <Search size={17} aria-hidden="true" />
                <span className="school-visually-hidden">Search teachers by name or email</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name or email"
                  autoComplete="off"
                />
                {query ? (
                  <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
                    <X size={15} aria-hidden="true" />
                  </button>
                ) : null}
              </label>

              <label className="school-teachers__status-filter">
                <span className="school-visually-hidden">Filter by teacher status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>

              {hasFilters ? (
                <button className="school-teachers__clear-button" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>
          </header>

          {loading ? (
            <div className="school-teachers__loading" role="status" aria-busy="true">
              <span className="school-teachers__spinner" aria-hidden="true" />
              Loading teachers…
            </div>
          ) : error ? (
            <div className="school-teachers__empty" role="status">
              Teacher accounts are unavailable until the list can be loaded.
            </div>
          ) : filtered.length ? (
            <ul className="school-teachers__list" aria-label="Teacher accounts">
              {filtered.map((teacher) => (
                <li className="school-teachers__row" key={teacher.id}>
                  <span className="school-teachers__avatar" aria-hidden="true">
                    {teacher.name.trim().slice(0, 1).toLocaleUpperCase() || <Users size={18} />}
                  </span>
                  <div className="school-teachers__identity">
                    <strong>{teacher.name}</strong>
                    <span className="school-teachers__email">
                      <Mail size={13} aria-hidden="true" />
                      {teacher.email}
                    </span>
                  </div>
                  {teacher.createdAt ? (
                    <time className="school-teachers__added" dateTime={teacher.createdAt}>
                      Added {new Date(teacher.createdAt).toLocaleDateString()}
                    </time>
                  ) : null}
                  <span className={`school-teachers__status school-teachers__status--${teacher.status}`}>
                    <span aria-hidden="true" />
                    {teacher.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="school-teachers__empty" role="status">
              <span className="school-teachers__empty-icon" aria-hidden="true"><Users size={20} /></span>
              <strong>{items.length === 0 ? 'No teachers added yet' : 'No matching teachers'}</strong>
              <p>
                {items.length === 0
                  ? 'Add a teacher to give them a Talkora account for your school.'
                  : 'Try another name or email, or adjust the status filter.'}
              </p>
              {hasFilters ? (
                <button type="button" onClick={clearFilters}>Clear search and filters</button>
              ) : null}
            </div>
          )}
        </section>
      </main>

      {open && canAddTeacher ? (
        <div
          className="school-teacher-modal-overlay"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !saving) setOpen(false)
          }}
        >
          <form
            className="school-teacher-modal-form"
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="school-teacher-modal-heading"
          >
            <div className="school-teacher-modal-header">
              <div>
                <span className="school-teachers__eyebrow">SCHOOL TEAM</span>
                <h2 id="school-teacher-modal-heading">Add a teacher</h2>
                <p>Creates a real teacher login for this school.</p>
              </div>
              <button
                className="school-teacher-modal-close"
                type="button"
                aria-label="Close add teacher dialog"
                disabled={saving}
                onClick={() => setOpen(false)}
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>

            <label className="school-teacher-modal-field">
              <span>Full name</span>
              <input
                required
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="school-teacher-modal-field">
              <span>Email address</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="school-teacher-modal-field">
              <span>Password</span>
              <input
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
              <small>Use at least 8 characters.</small>
            </label>

            <div className="school-teacher-modal-actions">
              <button className="school-teacher-modal-cancel" type="button" disabled={saving} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="school-teacher-modal-submit" type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create teacher'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </SchoolShell>
  )
}

function Stat({ icon, label, value, tone = 'default' }: { icon: React.ReactNode; label: string; value: number; tone?: 'default' | 'active' | 'suspended' }) {
  return (
    <article className={`school-teachers__stat school-teachers__stat--${tone}`}>
      <span className="school-teachers__stat-icon" aria-hidden="true">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

'use client'

import React, { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SchoolShell } from '@/components/school/school-shell'
import { schoolService, StudentListItem } from '@/services/school-service'
import { AvatarTypePicker } from '@/components/school/avatar-type-picker'
import { learnerAvatar } from '@/config/talkora-assets'
import { useAuth } from '@/components/auth/auth-provider'
import { curriculumService } from '@/services/curriculum-service'

type KgCurriculumCheck = { state: 'idle' | 'checking' | 'published' | 'unpublished' | 'error'; classId?: string }

export function StudentManagementPage({ initialAddOpen = false, initialEditStudentId, initialGradeFilter }: { initialAddOpen?: boolean; initialEditStudentId?: string; initialGradeFilter?: number } = {}) {
  const { role } = useAuth()
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; status: 'active' | 'suspended' }>>([])
  const [teacherError, setTeacherError] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState<number | undefined>(initialGradeFilter)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Add student modal
  const [isAddOpen, setIsAddOpen] = useState(initialAddOpen)
  const [fullName, setFullName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [grade, setGrade] = useState(4)
  const [kgAlphabetPilotEnabled, setKgAlphabetPilotEnabled] = useState(false)
  const [pilotUpdating, setPilotUpdating] = useState<string | null>(null)
  const [className, setClassName] = useState('4A')
  const [avatarType, setAvatarType] = useState<'BOY' | 'GIRL'>('BOY')
  const [teacherId, setTeacherId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState('')
  const [createdCredential, setCreatedCredential] = useState<{ name: string; code: string } | null>(null)
  const [kgCurriculumCheck, setKgCurriculumCheck] = useState<KgCurriculumCheck>({ state: 'idle' })

  // Edit student state
  const [editingStudent, setEditingStudent] = useState<StudentListItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editRoll, setEditRoll] = useState('')
  const [editGrade, setEditGrade] = useState(4)
  const [editClass, setEditClass] = useState('')
  const [editAvatarType, setEditAvatarType] = useState<'BOY' | 'GIRL'>('BOY')
  const [editTeacherId, setEditTeacherId] = useState('')

  useEffect(() => {
    if (role !== 'SCHOOL_ADMIN') return
    let active = true
    void schoolService.listTeachers().then((list) => {
      if (!active) return
      const available = list.filter((teacher) => teacher.status === 'active')
      setTeachers(available)
      setTeacherId((current) => current || available[0]?.id || '')
      setTeacherError('')
    }).catch(() => { if (active) setTeacherError('Teachers could not load. Reload the page before assigning a student.') })
    return () => { active = false }
  }, [role])

  useEffect(() => {
    if (!isAddOpen || grade !== 0) {
      setKgCurriculumCheck({ state: 'idle' })
      return
    }

    let active = true
    setKgCurriculumCheck({ state: 'checking' })
    void curriculumService.getClasses()
      .then(async (classes) => {
        const kgClass = classes.find((item) => item.grade === 0)
        if (!kgClass) {
          if (active) setKgCurriculumCheck({ state: 'unpublished' })
          return
        }
        const levels = await curriculumService.getLevels(kgClass.id)
        const hasPublishedLevel = levels.some((level) => level.availability === 'PUBLISHED')
        if (active) setKgCurriculumCheck({ state: hasPublishedLevel ? 'published' : 'unpublished', classId: kgClass.id })
      })
      .catch(() => {
        if (active) setKgCurriculumCheck({ state: 'error' })
      })
    return () => { active = false }
  }, [isAddOpen, grade])

  useEffect(() => {
    if (!initialEditStudentId) return
    let active = true
    void schoolService.getStudent(initialEditStudentId).then((student) => {
      if (!active) return
      setEditingStudent(student)
      setEditName(student.fullName)
      setEditRoll(student.rollNumber)
      setEditGrade(student.grade)
      setEditClass(student.className || '')
      setEditAvatarType(student.avatarType)
      setEditTeacherId(student.teacherId || '')
    }).catch((error) => { if (active) setAddError(error instanceof Error ? error.message : 'Student could not be loaded.') })
    return () => { active = false }
  }, [initialEditStudentId])

  async function fetchStudents() {
    try {
      setLoading(true)
      const data = await schoolService.listStudents({
        search: submittedSearch || undefined,
        grade: gradeFilter,
        page,
        limit: pageSize,
      })
      setStudents(data.students)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to list students', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [gradeFilter, page, submittedSearch])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') void fetchStudents()
    }
    const interval = window.setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [gradeFilter, page, submittedSearch])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    setPage(1)
    setSubmittedSearch(search)
  }

  async function handleAddStudent(e: FormEvent) {
    e.preventDefault()
    setAddError('')
    setSubmitting(true)

    try {
      const created = await schoolService.createStudent({
        fullName,
        rollNumber,
        grade,
        kgAlphabetPilotEnabled: grade === 0 && kgAlphabetPilotEnabled,
        className,
        teacherId: role === 'SCHOOL_ADMIN' ? teacherId || undefined : undefined,
        avatarType,
      })
      setIsAddOpen(false)
      setCreatedCredential({ name: fullName, code: created.studentCode })
      setFullName('')
      setRollNumber('')
      setKgAlphabetPilotEnabled(false)
      fetchStudents()
    } catch (err: any) {
      setAddError(err.message || 'Failed to create student. Please check the details.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateStudent(e: FormEvent) {
    e.preventDefault()
    if (!editingStudent) return
    setSubmitting(true)

    try {
      await schoolService.updateStudent(editingStudent.id, {
        fullName: editName,
        rollNumber: editRoll,
        grade: editGrade,
        className: editClass,
        teacherId: role === 'SCHOOL_ADMIN' ? editTeacherId || undefined : undefined,
        avatarType: editAvatarType,
      })
      setEditingStudent(null)
      fetchStudents()
    } catch (err: any) {
      alert(err.message || 'Failed to update student.')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleKGAlphabetPilot(student: StudentListItem) {
    if (pilotUpdating || role !== 'SCHOOL_ADMIN' || student.grade !== 0) return
    const enabled = !student.kgAlphabetPilotEnabled
    if (!window.confirm(`${enabled ? 'Enable' : 'Disable'} ABCD Level 1 pilot for ${student.fullName}?`)) return
    setPilotUpdating(student.id)
    try {
      await schoolService.setKGAlphabetPilot(student.id, enabled)
      setStudents((rows) => rows.map((row) => row.id === student.id ? { ...row, kgAlphabetPilotEnabled: enabled } : row))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not update KG pilot access')
    } finally { setPilotUpdating(null) }
  }

  async function handleResetCode(id: string, name: string) {
    if (!confirm(`Issue a new 5-digit PIN for ${name}?`)) return
    try {
      const res = await schoolService.resetCode(id)
      setCreatedCredential({ name, code: res.studentCode })
      fetchStudents()
    } catch (err: any) {
      alert(err.message || 'Failed to reset code.')
    }
  }

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate student profile for ${name}?`)) return
    try {
      await schoolService.deactivateStudent(id)
      fetchStudents()
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate student.')
    }
  }

  return (
    <SchoolShell
      title="Student Management"
      subtitle="View, enroll, edit, and monitor students across all grades."
    >
      {/* Top Action Bar */}
      <div className="school-student-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        {/* Search & Filter */}
        <form className="school-student-search" onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '540px' }}>
          <input
            className="school-student-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or roll number..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '14px',
            }}
          />
          <select
            className="school-student-grade-filter"
            value={gradeFilter ?? ''}
            onChange={(e) => setGradeFilter(e.target.value ? Number(e.target.value) : undefined)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            <option value="">All Grades</option>
            {Array.from({ length: 11 }, (_, i) => i).map((g) => (
              <option key={g} value={g}>
                {g === 0 ? 'Kindergarten (KG)' : `Class ${g}`}
              </option>
            ))}
          </select>
          <button
            className="school-student-search-submit"
            type="submit"
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}><Link href="/school/kg-preview" style={{ display: 'inline-flex', alignItems: 'center', background: '#f3eaff', color: '#5533a1', borderRadius: 12, padding: '12px 16px', fontWeight: 850, textDecoration: 'none' }}>▶ Preview KG Level 1</Link>
        <button
          className="school-student-enroll-button"
          type="button"
          onClick={() => setIsAddOpen(true)}
          style={{
            background: '#ffd83d',
            color: '#0f172a',
            border: '2px solid #0f172a',
            borderRadius: '12px',
            padding: '10px 20px',
            fontWeight: 900,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '3px 3px 0 #0f172a',
          }}
        >
          + Enroll New Student
        </button></div>
      </div>

      {/* Students Table Panel */}
      <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div className="school-student-table-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '16px', color: '#0f172a' }}>{students.length} Students Enrolled</strong>
          <small style={{ color: '#64748b' }}>Real-time persistence in MongoDB Atlas</small>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading students...</div>
        ) : students.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No students found matching your criteria.
          </div>
        ) : (
          <div className="school-student-table-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 800 }}>Student</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800 }}>Class / Section</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800 }}>Character</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800 }}>Accuracy</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800 }}>Levels</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const acc = student.progress?.attemptCount ? student.progress.accuracy : undefined
                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: '#ffd83d',
                              border: '1px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            <Image src={learnerAvatar(student.avatarType || 'BOY')} alt="" fill sizes="34px" style={{ objectFit: 'cover', objectPosition: 'top' }} />
                          </div>
                          <div>
                            <Link href={`/school/students/${student.id}`} style={{ fontWeight: 800, color: '#0f172a', textDecoration: 'none' }}>
                              {student.fullName}
                            </Link>
                            <small style={{ display: 'block', color: '#64748b' }}>Roll No. {student.rollNumber}</small>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#334155' }}>
                        {student.grade === 0 ? 'KG' : `Class ${student.grade}`} {student.className ? `(${student.className})` : ''}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontWeight: 800 }}>{student.avatarType === 'GIRL' ? 'Girl' : 'Boy'}</span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <strong style={{ color: acc === undefined ? '#64748b' : acc >= 75 ? '#16a34a' : '#ea580c' }}>{acc === undefined ? 'No attempts' : `${acc}%`}</strong>
                      </td>

                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#334155' }}>
                        {student.progress?.completedLevels ?? 0}/{student.progress?.totalLevels || '—'}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            background: student.status === 'active' ? '#f0fdf4' : '#fef2f2',
                            color: student.status === 'active' ? '#166534' : '#991b1b',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}
                        >
                          {student.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/school/students/${student.id}`}
                            style={{
                              background: '#f1f5f9',
                              color: '#0f172a',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 800,
                              textDecoration: 'none',
                            }}
                          >
                            Report
                          </Link>

                          {role === 'SCHOOL_ADMIN' && student.grade === 0 ? <button
                            type="button" disabled={pilotUpdating === student.id}
                            onClick={() => void toggleKGAlphabetPilot(student)}
                            title="Approve this student for the separate ABCD pilot"
                            style={{ background: student.kgAlphabetPilotEnabled ? '#d1fae5' : '#fff4d7', border: 'none', color: '#124936', padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                            {pilotUpdating === student.id ? 'Saving…' : student.kgAlphabetPilotEnabled ? 'ABCD enabled ✓' : 'Enable ABCD'}
                          </button> : null}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudent(student)
                              setEditName(student.fullName)
                              setEditRoll(student.rollNumber)
                              setEditGrade(student.grade)
                              setEditClass(student.className || '')
                              setEditAvatarType(student.avatarType || 'BOY')
                              setEditTeacherId(student.teacherId || '')
                            }}
                            style={{
                              background: '#f1f5f9',
                              border: 'none',
                              color: '#0f172a',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetCode(student.id, student.fullName)}
                            title="Issue a new 5-digit student PIN"
                            style={{
                              background: '#fef3c7',
                              border: 'none',
                              color: '#92400e',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Reset PIN
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {total > pageSize && <nav aria-label="Student pages" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}><small style={{ color: '#64748b' }}>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</small><div style={{ display: 'flex', gap: '8px' }}><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} style={{ minHeight: '44px', padding: '0 15px', borderRadius: '9px', border: '1px solid #dbe0e8', background: '#fff' }}>Previous</button><button disabled={page * pageSize >= total} onClick={() => setPage((value) => value + 1)} style={{ minHeight: '44px', padding: '0 15px', borderRadius: '9px', border: '1px solid #dbe0e8', background: '#fff' }}>Next</button></div></nav>}

      {/* Add Student Modal */}
      {isAddOpen && (
        <div
          className="school-student-modal-overlay"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setIsAddOpen(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <form
            className="school-student-enrollment-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-enrollment-title"
            onSubmit={handleAddStudent}
          >
            <header className="school-student-enrollment-header">
              <h3 id="student-enrollment-title">Enroll New Student</h3>
              <button
                type="button"
                className="school-student-enrollment-close"
                aria-label="Close enrollment form"
                onClick={() => setIsAddOpen(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <div className="school-student-enrollment-body">
              {addError && (
                <div role="alert" className="school-student-enrollment-error">
                  {addError}
                </div>
              )}

              <AvatarTypePicker value={avatarType} onChange={setAvatarType} />

              <div className="school-student-enrollment-fields">
                <label className="school-student-enrollment-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                  Full Name
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rohan Sharma"
                  />
                </label>

                <label className="school-student-enrollment-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                  Roll Number
                  <input
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 24"
                  />
                </label>

                <label className="school-student-enrollment-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                  Grade (KG–10)
                  <select
                    value={grade}
                    onChange={(e) => { const nextGrade = Number(e.target.value); setGrade(nextGrade); setClassName(nextGrade === 0 ? 'KG-A' : `${nextGrade}A`) }}
                  >
                    {Array.from({ length: 11 }, (_, i) => i).map((g) => (
                      <option key={g} value={g} disabled={g === 0 && role !== 'SCHOOL_ADMIN'}>
                        {g === 0 ? 'Kindergarten (KG)' : `Class ${g}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="school-student-enrollment-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                  Section / Class Label
                  <input
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g. 4A"
                  />
                </label>
                {grade === 0 ? <div className={`school-student-enrollment-notice ${kgCurriculumCheck.state === 'published' ? 'is-published' : ''}`} role="status" aria-live="polite">
                  {kgCurriculumCheck.state === 'checking' ? 'Checking KG curriculum availability…' : null}
                  {kgCurriculumCheck.state === 'published' ? <>Published KG curriculum found. The ABCD Level 1 pilot below still needs separate approval for the new voice-first adventure. <Link href={kgCurriculumCheck.classId ? `/school/classes/${kgCurriculumCheck.classId}` : '/school/classes'}>Preview curriculum</Link></> : null}
                  {kgCurriculumCheck.state === 'unpublished' ? <>The older KG foundation curriculum is still a draft. The new <strong>ABCD Level 1</strong> is a separate, playable pilot. Enable ABCD access below to test it with this student's PIN. <Link href="/school/kg-preview">Preview the Level 1 UI</Link>.</> : null}
                  {kgCurriculumCheck.state === 'error' ? <>The old KG curriculum status could not be checked. You can still enroll for the separate ABCD Level 1 pilot using the approval option below. <Link href="/school/kg-preview">Preview Level 1</Link>.</> : null}
                </div> : null}
                {grade === 0 && role === 'SCHOOL_ADMIN' ? <label className="school-student-enrollment-field school-student-enrollment-full-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: '#edf9f3', border: '1px solid #9edcbb', borderRadius: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={kgAlphabetPilotEnabled} onChange={(event) => setKgAlphabetPilotEnabled(event.target.checked)} style={{ marginTop: 4, width: 19, height: 19 }} />
                  <span><strong>Enable ABCD Level 1 pilot for this KG student</strong><small style={{ display: 'block', fontWeight: 500, marginTop: 4 }}>School-admin approval only. The student can then enter their 5-digit PIN to test the real voice lesson. This does not publish the older KG curriculum.</small></span>
                </label> : null}
                {role === 'SCHOOL_ADMIN' ? <label className="school-student-enrollment-field school-student-enrollment-full-row" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 800, color: '#334155' }}>
                  Assigned teacher
                  <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} disabled={Boolean(teacherError)}>
                    <option value="">Unassigned</option>
                    {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                  </select>
                  <small style={{ color: teacherError ? '#991b1b' : '#64748b', fontWeight: 500 }}>{teacherError || (teachers.length ? 'The assigned teacher can see this student’s progress.' : 'Add a teacher to show this student in a teacher dashboard.')}</small>
                </label> : null}
              </div>
            </div>

            <footer className="school-student-enrollment-actions">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Student Profile'}
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div
          className="school-student-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <form
            className="school-student-modal-form"
            onSubmit={handleUpdateStudent}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: 'calc(100dvh - 40px)',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: '20px', margin: '0 0 16px', color: '#0f172a' }}>Edit Student: {editingStudent.fullName}</h3>

            <AvatarTypePicker value={editAvatarType} onChange={setEditAvatarType} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                Full Name
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                Roll Number
                <input
                  required
                  value={editRoll}
                  onChange={(e) => setEditRoll(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </label>

              <div className="school-student-grade-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                  Grade (KG–10)
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(Number(e.target.value))}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    {Array.from({ length: 11 }, (_, i) => i).map((g) => (
                      <option key={g} value={g} disabled={g === 0 && role !== 'SCHOOL_ADMIN'}>
                        {g === 0 ? 'Kindergarten (KG)' : `Class ${g}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                  Section / Class Label
                  <input
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </label>
              </div>
              {role === 'SCHOOL_ADMIN' ? <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 800, color: '#334155' }}>
                Assigned teacher
                <select value={editTeacherId} onChange={(e) => setEditTeacherId(e.target.value)} disabled={Boolean(teacherError)} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                  <option value="">Unassigned</option>
                  {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                </select>
                <small style={{ color: teacherError ? '#991b1b' : '#64748b', fontWeight: 500 }}>{teacherError || 'The assigned teacher can see this student’s progress.'}</small>
              </label> : null}
            </div>

            <div className="school-student-modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '10px 20px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
      {createdCredential && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.62)', display: 'grid', placeItems: 'center', zIndex: 120, padding: 20 }}>
          <div role="dialog" aria-modal="true" style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 430, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.28)' }}>
            <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>Student enrolled</h3>
            <p style={{ color: '#64748b' }}>Share this 5-digit student PIN securely with {createdCredential.name}. It will not be shown in the directory.</p>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16, textAlign: 'center', fontSize: 24, fontWeight: 900, letterSpacing: 3, color: '#1d4ed8' }}>{createdCredential.code}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" onClick={() => navigator.clipboard.writeText(createdCredential.code)} style={{ padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: 9, background: '#fff', fontWeight: 800 }}>Copy PIN</button>
              <button type="button" onClick={() => setCreatedCredential(null)} style={{ padding: '10px 16px', border: 0, borderRadius: 9, background: '#0f172a', color: '#fff', fontWeight: 800 }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </SchoolShell>
  )
}

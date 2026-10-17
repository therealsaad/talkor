'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check, Search, Sparkles } from 'lucide-react'
import type { StudentProfileOption } from '@/services/auth-service'
import { learnerAvatar } from '@/config/talkora-assets'
import { cardMotion } from '@/motion/presets'
import { gradeLabel, gradeLongLabel } from '@/lib/grade-label'

export function ClassFilter({ classes, value, onChange, allLabel = 'All sections' }: { classes: string[]; value: string; onChange: (value: string) => void; allLabel?: string }) {
  if (classes.length < 2) return null
  return <div className="class-filter" aria-label="Filter by class"><button className={!value ? 'active' : ''} type="button" onClick={() => onChange('')}>{!value && <motion.i layoutId="class-tab" />}<span>{allLabel}</span></button>{classes.map((item) => <button className={value === item ? 'active' : ''} type="button" key={item} onClick={() => onChange(item)}>{value === item && <motion.i layoutId="class-tab" />}<span>{item}</span></button>)}</div>
}

export function GradeFilter({ grades, value, onChange }: { grades: number[]; value?: number; onChange: (value: number) => void }) {
  return <div className="grade-filter" aria-label="Choose grade">{grades.map((grade) => <motion.button whileTap={{ scale: .96 }} className={value === grade ? 'active' : ''} type="button" key={grade} onClick={() => onChange(grade)}>{value === grade && <motion.i layoutId="grade-tab" />}<span>{gradeLongLabel(grade)}</span></motion.button>)}</div>
}

export function StudentAvatarCard({ student, index, selected, dimmed, onSelect }: { student: StudentProfileOption; index: number; selected: boolean; dimmed: boolean; onSelect: () => void }) {
  const firstName = student.fullName.trim().split(/\s+/)[0]
  return <motion.button variants={cardMotion} initial={false} animate={{ opacity: dimmed ? 0.48 : 1, y: selected ? -10 : 0, rotate: selected ? 0 : index % 2 ? 1.2 : -1.2, scale: selected ? 1.07 : 1 }} transition={{ duration: 0.34 }} whileHover="hover" whileTap="tap" type="button" className={`student-avatar-card ${selected ? 'selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
    <span className="photo-tape" aria-hidden="true" />
    <span className="student-avatar-picture"><Image src={learnerAvatar(student.avatarType)} alt={`Talkora ${student.avatarType === 'GIRL' ? 'Girl' : 'Boy'}`} fill sizes="110px" /></span>
    <strong>{firstName}</strong><small>{student.className || gradeLabel(student.grade)}</small>{selected && <i><Check size={16} /></i>}
  </motion.button>
}

export function StudentRosterGrid({ students, selected, onSelect, classLabel, loading, page, pages, onPage }: { students: StudentProfileOption[]; selected: StudentProfileOption | null; onSelect: (student: StudentProfileOption) => void; classLabel: string; loading: boolean; page: number; pages: number; onPage: (page: number) => void }) {
  return <section className="class-photo-wall" aria-label={`Our class ${classLabel}`}>
    <span className="board-pin pin-left" aria-hidden="true" /><span className="board-pin pin-right" aria-hidden="true" />
    <header><span><Sparkles size={15} /> Our class</span><strong>{classLabel || 'All explorers'}</strong></header>
    {loading ? <div className="student-roster-grid roster-skeleton" aria-label="Searching for classmates">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div> : <div className="student-roster-grid">{students.map((student, index) => <StudentAvatarCard key={student.id} student={student} index={index} selected={selected?.id === student.id} dimmed={Boolean(selected && selected.id !== student.id)} onSelect={() => onSelect(student)} />)}</div>}
    {!loading && pages > 1 && <nav className="roster-pagination" aria-label="Classmate pages"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</button></nav>}
  </section>
}

export function RosterSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="roster-search"><Search size={18} /><span className="sr-only">Search students</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Find your name..." /></label>
}

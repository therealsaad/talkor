import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const page = await readFile(new URL('../../app/school/students/page.tsx', import.meta.url), 'utf8')
const component = await readFile(new URL('../../app/school/students/student-management-page.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../../app/school/students/students.css', import.meta.url), 'utf8')

test('Students screen preserves existing server filter and live paginated data flow', () => {
  assert.match(page, /initialGradeFilter=\{Number\.isInteger\(grade\)[\s\S]*?grade : undefined\}/)
  assert.match(component, /schoolService\.listStudents\(\{[\s\S]*?search: submittedSearch \|\| undefined,[\s\S]*?grade: gradeFilter,[\s\S]*?page,[\s\S]*?limit: pageSize/)
  assert.match(component, /setStudents\(data\.students\)/)
  assert.match(component, /setTotal\(data\.total\)/)
  assert.match(component, /onSubmit=\{handleSearchSubmit\}/)
  assert.match(component, /aria-label="Filter by grade"/)
  assert.match(component, /setPage\(\(value\) => value \+ 1\)/)
  assert.match(component, /setPage\(\(value\) => value - 1\)/)
})

test('student report, edit, PIN, and role-gated pilot actions remain wired', () => {
  assert.match(component, /href=\{`\/school\/students\/\$\{student\.id\}`\}/)
  assert.match(component, /setEditingStudent\(student\)/)
  assert.match(component, /handleResetCode\(student\.id, student\.fullName\)/)
  assert.match(component, /if \(!confirm\(`Issue a new 5-digit PIN for \$\{name\}\?`\)\) return/)
  assert.match(component, /role === 'SCHOOL_ADMIN' && student\.grade === 0/)
  assert.match(component, /toggleKGAlphabetPilot\(student\)/)
  assert.match(component, /if \(!confirm\(`Deactivate student profile for \$\{name\}\?`\)\) return/)
})

test('students list retains real fields, visible loading/error/empty states, and actions', () => {
  assert.match(component, /student\.fullName/)
  assert.match(component, /student\.rollNumber/)
  assert.match(component, /student\.avatarType/)
  assert.match(component, /student\.progress\?\.attemptCount \? student\.progress\.accuracy : undefined/)
  assert.match(component, /student\.status/)
  assert.match(component, /role="status" aria-busy="true"/)
  assert.match(component, /role="alert"/)
  assert.match(component, /No students found matching your criteria/)
  assert.match(component, /View students|Report/)
  assert.match(component, /Preview KG Level 1/)
  assert.match(component, /Enroll student/)
})

test('students presentation follows the Classes visual system and remains responsive/accessibile', () => {
  assert.match(styles, /--student-accent: #6654c7/)
  assert.match(styles, /border-radius: 18px/)
  assert.match(styles, /school-page-enter|student-page-enter/)
  assert.match(styles, /school-student-table tbody tr:hover/)
  assert.match(styles, /:focus-visible/)
  assert.match(styles, /@media \(max-width: 960px\)/)
  assert.match(styles, /@media \(max-width: 560px\)/)
  assert.match(styles, /overflow-x: auto/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(component, /scope="col"/)
})

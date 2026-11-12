import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const component = await readFile(new URL('../../../app/school/students/student-management-page.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../../../app/educator.css', import.meta.url), 'utf8')
const modalStart = component.indexOf('{/* Add Student Modal */}')
const modalEnd = component.indexOf('{/* Edit Student Modal */}', modalStart)
const modal = component.slice(modalStart, modalEnd)

test('enrollment modal keeps its title and accessible close control in the dialog header', () => {
  assert.match(modal, /role="dialog"\s+aria-modal="true"\s+aria-labelledby="student-enrollment-title"/)
  assert.match(modal, /<header className="school-student-enrollment-header">[\s\S]*?id="student-enrollment-title"[\s\S]*?Enroll New Student/)
  assert.match(modal, /className="school-student-enrollment-close"[\s\S]*?aria-label="Close enrollment form"[\s\S]*?onClick=\{\(\) => setIsAddOpen\(false\)\}/)
})

test('form body scrolls independently while the action footer stays in the dialog frame', () => {
  assert.match(modal, /<div className="school-student-enrollment-body">[\s\S]*?<footer className="school-student-enrollment-actions">/)
  assert.match(modal, /Cancel[\s\S]*?Create Student Profile/)
  assert.match(styles, /\.school-student-enrollment-body\s*\{[^}]*overflow-y:\s*auto/s)
  assert.match(styles, /\.school-student-enrollment-actions\s*\{[^}]*flex:\s*0 0 auto/s)
  assert.match(styles, /\.school-student-enrollment-form\s*\{[^}]*max-height:\s*calc\(100dvh/s)
})

test('student creation retains the Grade 0 school-admin workflow and existing PIN response', () => {
  assert.match(modal, /Array\.from\(\{ length: 11 \}/)
  assert.match(modal, /disabled=\{g === 0 && role !== 'SCHOOL_ADMIN'\}/)
  assert.match(modal, /role === 'SCHOOL_ADMIN' \? <label className="school-student-enrollment-field school-student-enrollment-full-row"/)
  assert.match(component, /schoolService\.createStudent\(\{[\s\S]*?grade,[\s\S]*?className,[\s\S]*?avatarType,[\s\S]*?\}\)/)
  assert.match(component, /code: created\.studentCode/)
  assert.match(modal, /<AvatarTypePicker value=\{avatarType\} onChange=\{setAvatarType\} \/>/)
})

test('KG enrollment explicitly offers the separate ABCD pilot with school-admin approval', () => {
  assert.match(modal, /The older KG foundation curriculum is still a draft/)
  assert.match(modal, /Enable ABCD Level 1 pilot for this KG student/)
  assert.match(modal, /grade === 0 && role === 'SCHOOL_ADMIN'/)
  assert.match(modal, /kgAlphabetPilotEnabled/)
  assert.match(modal, /href="\/school\/kg-preview\/level-1"/)
  assert.doesNotMatch(modal, /KG_PILOT_STUDENT_IDS|pilot student ids/i)
})

test('fields adapt from two columns to one column on narrow screens', () => {
  assert.match(styles, /\.school-student-enrollment-fields\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s)
  assert.match(styles, /@media\s*\(max-width:\s*560px\)[\s\S]*?\.school-student-enrollment-fields\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s)
  assert.match(styles, /\.school-student-enrollment-field input,[\s\S]*?min-height:\s*44px/)
})

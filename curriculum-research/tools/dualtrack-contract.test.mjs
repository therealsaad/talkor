import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const load = (relative) => JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'))
const bal = load('../balbharati-class1-unit1-map.json')
const meb = load('../my-english-book-class1-unit1-map.json')
const examples = load('../pm-checkpoint2-example-records.json')

test('two official Class 1 English books have distinct immutable source keys', () => {
  assert.equal(bal.schemaVersion, '1.1.0')
  assert.equal(meb.schemaVersion, '1.1.0')
  assert.equal(bal.dataset.textbookTrack.textbookId, 'ENGLISH_BALBHARATI_G01')
  assert.equal(meb.dataset.textbookTrack.textbookId, 'MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM')
  assert.equal(bal.dataset.textbookTrack.trackType, 'ENGLISH_MEDIUM')
  assert.equal(meb.dataset.textbookTrack.trackType, 'NON_ENGLISH_MEDIUM')
  assert.equal(bal.entries.length, 10)
  assert.equal(meb.entries.length, 11)
  const ids = [...bal.entries, ...meb.entries].map((e) => e.curriculumId)
  assert.equal(new Set(ids).size, 21)
  for (const entry of bal.entries) {
    assert.equal(entry.textbookId, bal.dataset.textbookTrack.textbookId)
    assert.match(entry.curriculumId, /^bal-g01-u1-c1\.\d{2}$/)
  }
  for (const entry of meb.entries) {
    assert.equal(entry.textbookId, meb.dataset.textbookTrack.textbookId)
    assert.match(entry.curriculumId, /^meb-g01-u1-c1\.\d{2}$/)
  }
  assert.ok(bal.entries.some((e) => e.chapter.code === '1.10' && e.curriculumId.endsWith('c1.10')))
  assert.ok(meb.entries.some((e) => e.chapter.code === '1.11' && e.curriculumId.endsWith('c1.11')))
})

test('curriculum content is draft only, with no fabricated audio permission or level unlock', () => {
  for (const dataset of [bal, meb]) {
    assert.match(dataset.dataset.textbookTrack.selectionModel, /school\/admin/i)
    for (const entry of dataset.entries) {
      assert.equal(entry.review.pedagogyStatus, 'DRAFT_PENDING_TEACHER_REVIEW')
      for (const mapping of entry.lesson.talkoraLevelMapping) {
        assert.equal(mapping.status, 'PROPOSED_MAPPING_PENDING_PM_APPROVAL')
        assert.match(mapping.talkoraLevelId, /^g01-l(0[1-9]|10)$/)
      }
      for (const word of entry.vocabulary || []) {
        assert.notEqual(word.audioAsset?.status, 'APPROVED', 'Official QR audio must not be presented as authorized')
      }
    }
  }
  const first = bal.entries.find((e) => e.chapter.code === '1.1')
  assert.ok(first.lesson.talkoraLevelMapping.some((m) => m.talkoraLevelId === 'g01-l01'))
})

test('checkpoint-2 roleplay is language-correct, uses one fictional name and never claims teacher approval', () => {
  assert.equal(examples.schemaVersion, '1.1.0')
  const first = examples.examples.find((e) => e.exampleId === 'tje-134')
  const second = examples.examples.find((e) => e.exampleId === 'tje-135')
  assert.ok(first && second)
  assert.equal(first.studentLanguage, 'mr')
  assert.equal(first.learnerState, 'BEGINNER_MARATHI')
  assert.match(first.missJulieTurns[0].text, /शाळा.*Marathi/)
  assert.equal(first.missJulieTurns[1].language, 'mr-en')
  assert.equal(second.studentLanguage, 'mr')
  assert.equal(second.learnerState, 'BEGINNER_MARATHI')
  assert.ok(second.missJulieTurns.some((t) => t.text.includes('Salma')))
  assert.ok(second.missJulieTurns.every((t) => !t.text.includes('Salman')))
  for (const record of examples.examples) {
    assert.notEqual(record.review.status, 'REVIEWED_BY_TEACHER')
    assert.match(record.review.note, /NOT teacher approval|NOT human teacher approval|NOT teacher-approved/i)
  }
})

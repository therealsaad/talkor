import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (name) => JSON.parse(readFileSync(new URL('../' + name, import.meta.url), 'utf8'))
const registry = read('class1-objective-registry.draft.json')
const sources = [
  read('balbharati-class1-unit1-map.json'),
  read('my-english-book-class1-unit1-map.json'),
]

test('draft objective registry retains all 84 separate source objectives and preserves book identity', () => {
  assert.equal(registry.registryVersion, 'class1-unit1-objectives-draft.v1')
  assert.equal(registry.runtimeStatus, 'NOT_AUTHORIZED_FOR_STUDENTS')
  assert.equal(registry.namespace, 'talkora.mh.english.g01')
  assert.equal(registry.books.length, 2)
  const allIds = new Set()
  let count = 0
  for (const [bookIndex, source] of sources.entries()) {
    const book = registry.books[bookIndex]
    assert.equal(book.textbookId, source.dataset.textbookTrack.textbookId)
    assert.equal(book.trackId, source.dataset.textbookTrack.trackType)
    assert.equal(book.edition, source.dataset.textbookEdition.academicYearOfFirstUse)
    assert.equal(book.chapterCount, source.entries.length)
    assert.ok((bookIndex === 0 && book.chapterCount === 10) || (bookIndex === 1 && book.chapterCount === 11))
    const expected = source.entries.flatMap((chapter, chapterIndex) =>
      chapter.learningObjectives.map((text, objectiveIndex) => ({
        objectiveId: chapter.curriculumId + '-o' + String(objectiveIndex + 1).padStart(2, '0'),
        sourceCurriculumId: chapter.curriculumId,
        sourceChapter: chapter.chapter.code,
        sourceChapterOrder: chapterIndex + 1,
        sourceObjectiveOrdinal: objectiveIndex + 1,
        sourceObjectiveText: text,
        candidateLevelIds: chapter.lesson.talkoraLevelMapping.map(x => x.talkoraLevelId),
        reviewStatus: 'DRAFT_PENDING_TEACHER_REVIEW',
        approvedRevision: null,
      }))
    )
    assert.deepEqual(book.objectives, expected)
    for (const objective of book.objectives) {
      assert.equal(allIds.has(objective.objectiveId), false, 'Cross-book objective collision')
      allIds.add(objective.objectiveId)
      assert.match(objective.objectiveId, /^(bal|meb)-g01-u1-c1\.(?:0[1-9]|1[01])-o0[1-9]$/)
      assert.equal(objective.reviewStatus, 'DRAFT_PENDING_TEACHER_REVIEW')
      assert.equal(objective.approvedRevision, null)
    }
    count += book.objectives.length
  }
  assert.equal(allIds.size, count)
  assert.equal(count, 84)
})

test('draft map cannot silently represent book 1.11 as 1.1 or authorize a saved g01-l01', () => {
  const meb = registry.books.find(b => b.trackId === 'NON_ENGLISH_MEDIUM')
  const bal = registry.books.find(b => b.trackId === 'ENGLISH_MEDIUM')
  assert.ok(meb.objectives.some(o => o.objectiveId.startsWith('meb-g01-u1-c1.11-o')))
  assert.ok(bal.objectives.some(o => o.objectiveId.startsWith('bal-g01-u1-c1.01-o')))
  assert.equal(meb.objectives.some(o => o.objectiveId.startsWith('bal-')), false)
  assert.equal(bal.objectives.some(o => o.objectiveId.startsWith('meb-')), false)
  assert.ok(registry.editorialRule.includes('No implicit approval'))
  assert.ok(registry.books.every(b => b.objectives.every(o => o.reviewStatus === 'DRAFT_PENDING_TEACHER_REVIEW')))
})

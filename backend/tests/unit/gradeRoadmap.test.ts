import { GRADE_ROADMAP, roadmapForGrade } from '../../src/curriculum/roadmap'
import { studioDesignForLevel } from '../../src/curriculum/studio-catalog'
import { reportWindow } from '../../src/services/student-report.service'

test('110 distinct, grade-specific, unpublished-safe level descriptors', () => {
  expect(GRADE_ROADMAP).toHaveLength(110)
  expect(new Set(GRADE_ROADMAP.map((value) => value.id)).size).toBe(110)
  for (let grade = 0; grade <= 10; grade++) {
    const levels = roadmapForGrade(grade)!
    expect(levels).toHaveLength(10)
    expect(levels.every((level) => level.grade === grade && level.level >= 1 && level.level <= 10)).toBe(true)
  }
  expect(GRADE_ROADMAP.filter((level) => level.status === 'IMPLEMENTED')).toHaveLength(1)
})

test('studio designs retain their lesson titles while matching the authoritative roadmap title', () => {
  for (const entry of GRADE_ROADMAP) {
    const design = studioDesignForLevel(entry.grade, entry.level)
    const roadmapTitle = design && 'roadmapTitle' in design ? design.roadmapTitle : design?.title
    expect(roadmapTitle).toBe(entry.title)
  }
  expect(studioDesignForLevel(1, 1)?.title).toBe('Little Words & My First Day')
})

test('daily, weekly, monthly windows are UTC bounded', () => {
  const fixed = new Date('2026-10-16T16:00:00Z')
  expect(reportWindow('daily', fixed).start.toISOString()).toBe('2026-10-16T00:00:00.000Z')
  expect(reportWindow('weekly', fixed).start.toISOString()).toBe('2026-10-10T00:00:00.000Z')
  expect(reportWindow('monthly', fixed).start.toISOString()).toBe('2026-09-17T00:00:00.000Z')
})

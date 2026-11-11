import fixture from '../fixtures/class1-teaching-context-v1.json'
import { buildLessonTeachingContext, lessonTeachingContextSchema, selectLessonSupport } from '../../src/services/lesson-teaching-context'
import { FIRST_DAY_SCENES } from '../../src/scripts/class1-first-day-scenes'
import { FIRST_DAY_POEM_LINES, FIRST_DAY_POEM_STEPS } from '../../src/curriculum/class1-first-day-poem'

const support = selectLessonSupport({ attempts: [] })
function poemActivity() {
  return {
    activityKey: fixture.teachingContext.activityKey, prompt: fixture.currentQuestion,
    // Deliberately stale: actual poem lines must win over this old word.
    target: 'at', modelSentence: 'at',
    content: { poemLines: fixture.teachingContext.modelLines },
    metadata: { sceneKey: fixture.sceneKey, allowedVocabulary: fixture.allowedVocabulary,
      teaching: { version: 1, book: 'English Balbharati Grade One', edition: '2025', chapter: '1.1',
        hints: fixture.teachingContext.hints } },
    source: { pdf: fixture.teachingContext.source.reference, label: fixture.teachingContext.source.label,
      pageStart: 1, pageEnd: 1 },
  }
}

test('the serialized Node contract agrees with the independently consumed Python fixture', () => {
  const context = buildLessonTeachingContext({ grade: 1, lessonKey: 'g01-l01', activity: poemActivity(),
    settings: { lessonPlanRevision: fixture.teachingContext.revision }, support })
  expect(context).toEqual(fixture.teachingContext)
  expect(context?.modelLines).toEqual(['See me grin', 'When the bell rings, I go in.'])
  expect(context?.lineIds).toEqual(['g01-l01:poem-pair-3:line-5', 'g01-l01:poem-pair-3:line-6'])
  expect(context?.modelLines).not.toContain('at')
  expect(JSON.stringify(context).length).toBeLessThan(6000)
})

test.each(FIRST_DAY_POEM_STEPS)('preserves the exact approved line range for $key', step => {
  const a = poemActivity()
  a.activityKey = 'class1-l01-v4-' + step.key
  a.metadata.sceneKey = step.key
  a.content.poemLines = FIRST_DAY_POEM_LINES.slice(step.start, step.end)
  const context = buildLessonTeachingContext({ grade: 1, lessonKey: 'g01-l01', activity: a, support })
  expect(context?.modelLines).toEqual(FIRST_DAY_POEM_LINES.slice(step.start, step.end))
  expect(context?.lineIds).toHaveLength(step.end - step.start)
})

test.each(FIRST_DAY_SCENES)('projects the authored school-action model for $key', scene => {
  const context = buildLessonTeachingContext({ grade: 1, lessonKey: 'g01-l01', support,
    activity: { activityKey: 'class1-l01-v3-' + scene.key, prompt: scene.prompt,
      modelSentence: scene.sentence, metadata: { sceneKey: scene.key, allowedVocabulary: [...scene.vocabulary] } } })
  expect(context?.modelLines).toEqual([scene.sentence])
  expect(context?.source.book).toBeNull() // Missing edition/book is never invented.
})

test('unknown scenes, altered poems, mismatched IDs and malformed authoring fail closed', () => {
  for (const a of [
    { ...poemActivity(), metadata: { sceneKey: 'poem-pair-99' } },
    { ...poemActivity(), content: { poemLines: ['Say at'] } },
    { ...poemActivity(), activityKey: 'class1-l01-v4-poem-pair-1' },
    { ...poemActivity(), metadata: { ...poemActivity().metadata, teaching: { version: 2, published: true } } },
  ]) expect(() => buildLessonTeachingContext({ grade: 1, lessonKey: 'g01-l01', activity: a, support }))
    .toThrow()
  expect(lessonTeachingContextSchema.safeParse({ ...fixture.teachingContext, xpAwarded: 999 }).success).toBe(false)
})

test('KG, other grades/levels and old tiny-word history keep their current paths', () => {
  for (const [grade, lessonKey] of [[0, 'g00-l01'], [2, 'g02-l01'], [1, 'g01-l02']] as const)
    expect(buildLessonTeachingContext({ grade, lessonKey, activity: poemActivity(), support })).toBeUndefined()
  expect(buildLessonTeachingContext({ grade: 1, lessonKey: 'g01-l01', support,
    activity: { ...poemActivity(), activityKey: 'class1-l01-v2-listen-at' } })).toBeUndefined()
})

test('support uses actual current-activity evidence without inferring a grade or mastery', () => {
  expect(selectLessonSupport({ attempts: [] })).toMatchObject({ mode: 'MODEL', reason: 'FIRST_ATTEMPT' })
  expect(selectLessonSupport({ attempts: [{ correct: false }] })).toMatchObject({ mode: 'GUIDE', reason: 'RETRY' })
  expect(selectLessonSupport({ attempts: [{ correct: false }, { correct: false }] })).toMatchObject({ mode: 'MODEL', reason: 'REPEATED_DIFFICULTY' })
  expect(selectLessonSupport({ attempts: [], retry: { waiting: true, attempt: 2 } })).toMatchObject({ mode: 'MODEL', reason: 'REPEATED_DIFFICULTY' })
  expect(selectLessonSupport({ attempts: [{ correct: true, hintsUsed: 1 }] })).toMatchObject({ mode: 'PRACTISE' })
  expect(selectLessonSupport({ attempts: [{ correct: true, hintsUsed: 0 }] })).toMatchObject({ mode: 'CHECK' })
  expect(selectLessonSupport({ attempts: [{ correct: true }] }).mode).not.toBe('CHECK')
  expect(selectLessonSupport({ attempts: [{}, {}] }).reason).toBe('FIRST_ATTEMPT')
  expect(selectLessonSupport({ attempts: [], retry: { hintLevel: 99 } }).hintLevel).toBe(3)
})

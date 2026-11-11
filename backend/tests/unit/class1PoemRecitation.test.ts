import { poemEvidence, firstDaySceneSkills } from '../../src/services/first-day-evidence'
import { FIRST_DAY_POEM_LINES, FIRST_DAY_POEM_STANZAS, FIRST_DAY_POEM_STEPS, FIRST_DAY_POEM_WORD_BANK } from '../../src/curriculum/class1-first-day-poem'
import { CLASS1_FIRST_DAY_POEM_REVISION, preferClass1FirstDayLesson, isClass1DemoActivity } from '../../src/services/class1-demo-access'

describe('English Balbharati 1.1 poem curriculum from user-provided PDF page 11',()=>{
  test('covers exactly three stanzas and ten lines, five paired stages and full recital',()=>{
    expect(FIRST_DAY_POEM_STANZAS.map(s=>s.length)).toEqual([3,3,4])
    expect(FIRST_DAY_POEM_LINES).toHaveLength(10)
    expect(FIRST_DAY_POEM_STEPS.map(s=>s.key)).toEqual([
      'poem-pair-1','poem-pair-2','poem-pair-3','poem-pair-4','poem-pair-5','poem-full',
    ])
    expect(FIRST_DAY_POEM_WORD_BANK).toEqual(
      expect.arrayContaining(['skip','everyone','grin','rings','hurray']))
  })
  test('does not complete recitation for isolated vocabulary or Hindi help',()=>{
    expect(poemEvidence('poem-pair-1','skip')).toEqual([])
    expect(poemEvidence('poem-pair-1','jump')).toEqual([])
    expect(poemEvidence('poem-pair-1','What does skip mean?')).toEqual([])
    expect(poemEvidence('poem-pair-3','grin')).toEqual([])
    expect(poemEvidence('poem-pair-3','grin bell')).toEqual([])
    expect(poemEvidence('poem-pair-1','skip run')).toEqual([])
    expect(poemEvidence('poem-pair-4','jump play')).toEqual([])
    expect(poemEvidence('poem-pair-5','grade one hurray')).toEqual([])
    expect(firstDaySceneSkills('poem-pair-1','बिल्ली')).toEqual([])
    expect(poemEvidence('poem-full','See me skip See me run')).toEqual([])
  })
  test.each([
    ['poem-pair-1','See me skip. See me run.'],
    ['poem-pair-2',"I'm going to school like everyone. See me walk."],
    ['poem-pair-3','See me grin. When the bell rings I go in.'],
    ['poem-pair-4','See me jump. See me play.'],
    ['poem-pair-5','I am in Grade One. Hip hip hurray!'],
  ])('requires both line meanings on %s', (key,said)=>{
    expect(firstDaySceneSkills(key,said)).toEqual(['first_day_english_attempt'])
  })
  test('each authored line pair passes its own checks, but no single line or word-bank item advances',()=>{
    for (const step of FIRST_DAY_POEM_STEPS.filter(step => step.key !== 'poem-full')) {
      const lines = FIRST_DAY_POEM_LINES.slice(step.start,step.end)
      expect(lines).toHaveLength(2)
      expect(poemEvidence(step.key,lines.join(' '))).toEqual(['first_day_english_attempt'])
      for (const line of lines) expect(poemEvidence(step.key,line)).toEqual([])
      for (const word of FIRST_DAY_POEM_WORD_BANK)
        expect(poemEvidence(step.key,word)).toEqual([])
      expect(poemEvidence(step.key,step.target)).toEqual([])
    }
  })
  test('the exact approved full recital passes its own check and single words do not',()=>{
    expect(poemEvidence('poem-full',FIRST_DAY_POEM_LINES.join(' ')))
      .toEqual(['first_day_english_attempt'])
    for (const word of FIRST_DAY_POEM_WORD_BANK)
      expect(poemEvidence('poem-full',word)).toEqual([])
  })
  test('full finale requires independent multi-stanza transcript evidence',()=>{
    const full='See me skip See me run I am going to school like everyone '+
      'See me walk See me grin When the bell rings I go in '+
      'See me jump See me play I am in Grade One Hip hip hurray'
    expect(firstDaySceneSkills('poem-full',full))
      .toEqual(['first_day_english_attempt'])
  })
  test('prefers additively installed poem v4 and never mutates older lesson objects',()=>{
    const v2={settings:{lessonPlanRevision:'v2'}}
    const v3={settings:{lessonPlanRevision:'class1-first-day-only-v3-parallel'}}
    const v4={settings:{lessonPlanRevision:CLASS1_FIRST_DAY_POEM_REVISION}}
    const all=[v2,v3,v4]
    expect(preferClass1FirstDayLesson(all)).toEqual([v4])
    expect(all).toHaveLength(3)
    expect(isClass1DemoActivity({status:'draft',curriculumVersion:'talkora-class1-l01-demo-draft-v1',
      activityKey:'class1-l01-v4-poem-pair-1'})).toBe(true)
  })
})

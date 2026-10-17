import { lessons, validateKGCurriculum } from '../../src/curriculum/kg/lessons'

describe('KG foundation pilot curriculum source', () => {
  it('contains eight complete Grade 0 units, 24 lessons, and playable shared-engine activities', () => {
    const result = validateKGCurriculum()

    expect(result).toEqual({
      valid: true,
      unitCount: 8,
      lessonCount: 24,
      activityCount: 168,
      errors: [],
    })
  })

  it('keeps every unit, lesson, and activity as an unapproved draft', () => {
    for (const unit of lessons) {
      expect(unit.grade).toBe(0)
      expect(unit.schoolSyllabusApproved).toBe(false)
      expect(unit.publication).toEqual({ availability: 'UPCOMING', status: 'draft' })
      expect(unit.introVideo.status).toBe('NOT_CREATED')
      expect(unit.introVideo.approvedCharacter).toBe('MISS_JULIE_NEUTRAL')
      expect(unit.introVideo.characterReference).toBe('talkora-client/public/miss-julie/miss-julie-character-sheet.png')
      for (const lesson of unit.lessons) {
        expect(lesson.status).toBe('draft')
        expect(lesson.settings.schoolSyllabusApproved).toBe(false)
        expect(lesson.activities.every((activity) => activity.status === 'draft')).toBe(true)
      }
    }
  })

  it('marks missing picture and prerecorded audio assets accurately without adding URLs', () => {
    const serialized = JSON.stringify(lessons)
    expect(serialized).not.toMatch(/https?:\/\//i)
    expect(lessons.flatMap((unit) => unit.visualAssets).every((asset) => asset.status === 'MISSING')).toBe(true)
    expect(lessons.flatMap((unit) => unit.visualAssets)).toHaveLength(51)
    expect(lessons.flatMap((unit) => unit.vocabulary)
      .every((word) => word.audio.delivery === 'RUNTIME_TTS' && word.audio.prerecordedStatus === 'NOT_CREATED')).toBe(true)
  })
})

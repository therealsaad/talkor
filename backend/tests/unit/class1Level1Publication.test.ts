import {
  class1Level1ReleaseBlockers, class1ReleaseApprovalBlockers, requiredClass1AudioKeys,
  type Class1ReleaseSnapshot,
} from '../../src/services/class1-level1-publication'
import { CLASS1_DEMO_VERSION, CLASS1_FIRST_DAY_PARALLEL_REVISION } from '../../src/services/class1-demo-access'
import { FIRST_DAY_SCENES } from '../../src/scripts/class1-first-day-scenes'

function ready(): Class1ReleaseSnapshot {
  return {
    grade: 1, classroomStatus: 'draft',
    level: { number: 1, status: 'draft', availability: 'UPCOMING', curriculumVersion: CLASS1_DEMO_VERSION },
    lesson: { status: 'draft', settings: { talkoraDemoDraft: true,
      experienceId: 'g01-l01', lessonPlanRevision: CLASS1_FIRST_DAY_PARALLEL_REVISION } },
    activities: FIRST_DAY_SCENES.map(scene => ({
      activityKey: 'class1-l01-v3-' + scene.key, status: 'draft', type: 'CONVERSATION',
      curriculumVersion: CLASS1_DEMO_VERSION, aiEnabled: true,
      voiceEnabled: true, allowMic: true, core: true, required: true,
      content: { audioKey: 'class-01/level-01/v3/' + scene.key + '-en.wav' },
    })),
    otherActiveLessons: 0, savedCompletedLevels: 0,
  }
}
describe('Class 1 Level 1 real publication integrity', () => {
  it('permits exactly the verified ten-scene draft, no student writes in this pure preflight', () => {
    expect(class1Level1ReleaseBlockers(ready())).toEqual([])
    expect(requiredClass1AudioKeys()).toHaveLength(10)
    expect(new Set(requiredClass1AudioKeys()).size).toBe(10)
  })
  it('does not publish an old two-letter draft, an incomplete lesson or missing mic/voice evidence', () => {
    const before = ready()
    before.lesson.settings!.lessonPlanRevision = 'first-day-little-words-v2'
    before.activities.splice(9)
    before.activities[0].voiceEnabled = false
    const blockers = class1Level1ReleaseBlockers(before)
    expect(blockers).toContain('WRONG_FIRST_DAY_LESSON_REVISION')
    expect(blockers).toContain('INCOMPLETE_SCENE_COUNT')
    expect(blockers).toContain('INVALID_SCENE_1')
  })
  it('refuses publishing a competing active lesson or re-crediting an already completed legacy unit', () => {
    const before = ready()
    before.otherActiveLessons = 1
    before.savedCompletedLevels = 2
    expect(class1Level1ReleaseBlockers(before)).toEqual(expect.arrayContaining([
      'COMPETING_ACTIVE_LESSON', 'COMPLETED_LEGACY_PROGRESS_NEEDS_REVIEW',
    ]))
  })
  it('rejects direct status changes that try to skip release validation', () => {
    const input = ready()
    input.level.status = 'active'
    input.level.availability = 'PUBLISHED'
    expect(class1Level1ReleaseBlockers(input)).toContain('LEVEL_NOT_A_PROTECTED_DRAFT')
  })
  it('never infers consent from existing media or a publishing button', () => {
    expect(class1ReleaseApprovalBlockers({})).toHaveLength(4)
    expect(class1ReleaseApprovalBlockers({ release: 'YES', intro: 'YES', audio: 'YES', device: 'YES' })).toEqual([])
    expect(class1ReleaseApprovalBlockers({ release: 'YES', intro: 'YES', audio: 'YES' }))
      .toContain('TALKORA_CLASS1_L01_DEVICE_TESTED_NOT_CONFIRMED')
  })
})

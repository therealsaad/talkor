import { KG_CURRICULUM_VERSION, isAuthorizedKGPilotStudent, isKGPilotLevel } from '../../src/services/kg-pilot-access'
import { presentKGPilotActivity } from '../../src/services/kg-pilot-presentation'

const studentId = '64b000000000000000000001'

describe('KG pilot authorization boundary', () => {
  it('requires an exact allowlisted Mongo ObjectId, active status, and Grade 0', () => {
    expect(isAuthorizedKGPilotStudent({ id: studentId, grade: 0, status: 'active' }, [studentId])).toBe(true)
    expect(isAuthorizedKGPilotStudent({ id: studentId, grade: 4, status: 'active' }, [studentId])).toBe(false)
    expect(isAuthorizedKGPilotStudent({ id: studentId, grade: 0, status: 'inactive' }, [studentId])).toBe(false)
    expect(isAuthorizedKGPilotStudent({ id: 'kg-tester', grade: 0, status: 'active' }, ['kg-tester'])).toBe(false)
    expect(isAuthorizedKGPilotStudent({ id: studentId, grade: 0, status: 'active' }, [])).toBe(false)
  })

  it('accepts only draft/upcoming records from the exact KG pilot version', () => {
    expect(isKGPilotLevel({ curriculumVersion: KG_CURRICULUM_VERSION, status: 'draft', availability: 'UPCOMING' })).toBe(true)
    expect(isKGPilotLevel({ curriculumVersion: 'class4-term1-v1', status: 'draft', availability: 'UPCOMING' })).toBe(false)
    expect(isKGPilotLevel({ curriculumVersion: KG_CURRICULUM_VERSION, status: 'active', availability: 'PUBLISHED' })).toBe(false)
  })

  it('marks a missing-image KG item unavailable without offering or completing a substitute task', () => {
    const presented = presentKGPilotActivity({
      type: 'PICTURE_CHOICE',
      title: 'Find a cat picture',
      prompt: 'Choose the cat picture.',
      content: { pictureMode: true, pictureAsset: { assetKey: 'kg-cat', status: 'MISSING' } },
    })

    expect(presented).toMatchObject({
      title: 'Picture activity unavailable',
      prompt: 'The picture is not available yet. Tap Continue to skip this activity.',
      choices: [],
      content: {
        pictureMode: false,
        pilotUnavailableMessage: expect.stringMatching(/does not count as completed/i),
        pictureAsset: { status: 'MISSING' },
      },
    })

    const ready = {
      type: 'PICTURE_CHOICE',
      prompt: 'Find the cat.',
      choices: ['Cat', 'Dog'],
      content: {
        pictureMode: true,
        pictureAsset: { assetKey: 'kg-cat', status: 'READY' },
        pictureOptions: [
          { word: 'Cat', assetKey: 'kg-cat', status: 'READY' },
          { word: 'Dog', assetKey: 'kg-dog', status: 'READY' },
        ],
      },
    }
    const unchanged = presentKGPilotActivity(ready)
    expect(unchanged.content?.pictureMode).toBe(true)
    const incomplete = presentKGPilotActivity({ ...ready, content: { ...ready.content, pictureOptions: undefined } }) as { content?: Record<string, unknown> }
    expect(incomplete.content?.pilotUnavailableMessage)
      .toMatch(/does not count as completed/i)
  })
})

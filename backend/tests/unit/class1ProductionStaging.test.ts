import {
  CLASS1_FIRST_DAY_INTRO_MAX_BYTES, inspectClass1ReleaseMedia,
} from '../../src/services/class1-release-media'
import {
  class1FirstDayStageBlockers, class1StageApprovalBlockers,
} from '../../src/services/class1-release-stage-guard'

const url = 'https://cdn.school.example.edu/first-day-v3-reviewed.mp4'
const videoHead = async (bytes: number, type = 'video/mp4') =>
  new Response(null, { status: 200, headers: {
    'Content-Length': String(bytes), 'Content-Type': type,
  } })
const audioHead = async (_key: string) => ({ contentLength: 25_000, contentType: 'audio/wav' })

describe('Class 1 protected production staging', () => {
  it('requires exact database identity and independent human media/staging approval', () => {
    expect(class1StageApprovalBlockers({
      database: 'school_prod', expectedDatabase: 'school_stage',
      stage: 'YES', intro: 'YES', audio: 'YES',
    })).toContain('EXPLICIT_TARGET_DATABASE_MISMATCH')
    expect(class1StageApprovalBlockers({ database: 'school_prod' })).toHaveLength(4)
    expect(class1StageApprovalBlockers({
      database: 'school_prod', expectedDatabase: 'school_prod',
      stage: 'YES', intro: 'YES', audio: 'YES',
    })).toEqual([])
  })

  it('can only add a first-day draft when no active content, conflicting version or old mastery exists', () => {
    expect(class1FirstDayStageBlockers({
      existingLevel: null, existingV3Count: 0,
      activeLessonCount: 0, completedLegacyCount: 0,
    })).toEqual([])
    expect(class1FirstDayStageBlockers({
      existingLevel: {
        status: 'active', availability: 'PUBLISHED', curriculumVersion: 'old-v2',
      }, existingV3Count: 2, activeLessonCount: 1, completedLegacyCount: 7,
    })).toEqual([
      'LEVEL1_ALREADY_ACTIVE_OR_NOT_A_REVIEWABLE_DRAFT',
      'FIRST_DAY_V3_ALREADY_EXISTS_REVIEW_BEFORE_RETRY',
      'COMPETING_ACTIVE_LESSON',
      'COMPLETED_LEGACY_PROGRESS_NEEDS_REVIEW',
    ])
  })

  it('checks exactly ten immutable Priya narrations and an optimized First Day video', async () => {
    const visited: string[] = []
    const report = await inspectClass1ReleaseMedia(url, {
      videoHead: () => videoHead(11_000_000),
      audioHead: async key => {
        visited.push(key)
        return audioHead(key)
      },
    })
    expect(report.blockers).toEqual([])
    expect(report.introBytes).toBe(11_000_000)
    expect(report.checkedAudioCount).toBe(10)
    expect(visited).toHaveLength(10)
    expect(new Set(visited).size).toBe(10)
    expect(visited.every(key => /^class-01\/level-01\/v3\/.*-en\.wav$/.test(key))).toBe(true)
  })

  it('blocks an 83 MB school intro and wrong media types instead of marking them ready', async () => {
    const tooLarge = await inspectClass1ReleaseMedia(url, {
      videoHead: () => videoHead(83_256_014),
      audioHead,
    })
    expect(83_256_014).toBeGreaterThan(CLASS1_FIRST_DAY_INTRO_MAX_BYTES)
    expect(tooLarge.blockers).toContain('FIRST_DAY_INTRO_TOO_LARGE_FOR_SCHOOL_NETWORK')
    const damaged = await inspectClass1ReleaseMedia(url, {
      videoHead: () => videoHead(7_000_000, 'text/html'),
      audioHead: async key => key.endsWith('school-bell-en.wav')
        ? { contentLength: 0, contentType: 'text/plain' } : audioHead(key),
    })
    expect(damaged.blockers).toContain('FIRST_DAY_INTRO_UNEXPECTED_MEDIA_TYPE')
    expect(damaged.blockers).toContain('FIRST_DAY_AUDIO_MISSING_OR_INVALID:class-01/level-01/v3/school-bell-en.wav')
    expect(damaged.checkedAudioCount).toBe(9)
  })

  it('rejects unreviewed placeholder URLs and handles failed HEAD requests without publishing', async () => {
    const placeholder = await inspectClass1ReleaseMedia('https://example.invalid/first-day.mp4', {
      videoHead: () => { throw Error('must never call fake video host') },
      audioHead,
    })
    expect(placeholder.blockers).toContain('FIRST_DAY_REVIEWED_HTTPS_INTRO_REQUIRED')
    const unavailable = await inspectClass1ReleaseMedia(url, {
      videoHead: () => Promise.reject(new Error('network failed')),
      audioHead: () => Promise.reject(new Error('private S3 failure')),
    })
    expect(unavailable.blockers).toContain('FIRST_DAY_INTRO_NETWORK_CHECK_FAILED')
    expect(unavailable.blockers.filter(x => x.startsWith('FIRST_DAY_AUDIO_UNAVAILABLE:'))).toHaveLength(10)
    expect(JSON.stringify(unavailable)).not.toContain('private S3 failure')
  })
})

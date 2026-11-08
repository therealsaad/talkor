import { S3Service } from './S3Service'
import { requiredClass1AudioKeys } from './class1-level1-publication'
import { isRealFirstDayIntroUrl } from '../scripts/class1-first-day-intro-url'

/** A network-readable video is not equivalent to educator-approved content.
 * These checks ONLY verify the promised release assets exist, are correctly
 * typed and fit the bandwidth budget for shared Indian school connections.
 */
export const CLASS1_FIRST_DAY_INTRO_MIN_BYTES = 1_000_000
export const CLASS1_FIRST_DAY_INTRO_MAX_BYTES = 28_000_000

type AudioHead = { contentLength?: number; contentType?: string } | null

export interface Class1MediaReport {
  blockers: string[]
  introBytes: number | null
  checkedAudioCount: number
  requiredAudioCount: number
}

export async function inspectClass1ReleaseMedia(
  introUrl: string,
  dependencies: {
    videoHead?: (url: string) => Promise<Response>
    audioHead?: (key: string) => Promise<AudioHead>
  } = {},
): Promise<Class1MediaReport> {
  const blockers: string[] = []
  const keys = requiredClass1AudioKeys()
  let introBytes: number | null = null
  let checkedAudioCount = 0
  if (!isRealFirstDayIntroUrl(introUrl)) {
    blockers.push('FIRST_DAY_REVIEWED_HTTPS_INTRO_REQUIRED')
  } else {
    try {
      const response = await (dependencies.videoHead
        ? dependencies.videoHead(introUrl)
        : fetch(introUrl, { method: 'HEAD', signal: AbortSignal.timeout(15_000) }))
      const size = Number(response.headers.get('content-length'))
      const contentType = (response.headers.get('content-type') || '').toLowerCase()
      if (!response.ok) blockers.push('FIRST_DAY_INTRO_HTTP_UNAVAILABLE')
      else if (!/^video\/(?:mp4|webm)(?:\s*;|$)/.test(contentType))
        blockers.push('FIRST_DAY_INTRO_UNEXPECTED_MEDIA_TYPE')
      else if (!Number.isSafeInteger(size) || size < CLASS1_FIRST_DAY_INTRO_MIN_BYTES)
        blockers.push('FIRST_DAY_INTRO_MISSING_SIZE_OR_TOO_SMALL')
      else if (size > CLASS1_FIRST_DAY_INTRO_MAX_BYTES)
        blockers.push('FIRST_DAY_INTRO_TOO_LARGE_FOR_SCHOOL_NETWORK')
      else introBytes = size
    } catch {
      blockers.push('FIRST_DAY_INTRO_NETWORK_CHECK_FAILED')
    }
  }

  for (const key of keys) {
    try {
      const head = dependencies.audioHead
        ? await dependencies.audioHead(key)
        : await S3Service.headAudio(key)
      if (!head || !Number.isSafeInteger(head.contentLength) || (head.contentLength || 0) < 256 ||
          !/^audio\/(?:wav|x-wav)(?:\s*;|$)/i.test(head.contentType || '')) {
        blockers.push('FIRST_DAY_AUDIO_MISSING_OR_INVALID:' + key)
      } else {
        checkedAudioCount++
      }
    } catch {
      blockers.push('FIRST_DAY_AUDIO_UNAVAILABLE:' + key)
    }
  }
  return { blockers, introBytes, checkedAudioCount, requiredAudioCount: keys.length }
}

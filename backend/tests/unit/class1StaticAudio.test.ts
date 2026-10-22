jest.mock('../../src/services/curriculum-access.service', () => ({
  CurriculumAccessService: { assertActivity: jest.fn() },
}))
jest.mock('../../src/services/S3Service', () => ({
  S3Service: { getAudio: jest.fn() },
}))

import { CurriculumAccessService } from '../../src/services/curriculum-access.service'
import { S3Service } from '../../src/services/S3Service'
import { VoiceService } from '../../src/services/voice.service'

describe('Class 1 reviewed static lesson audio', () => {
  it('serves the authorized activity S3 object before dynamic TTS', async () => {
    ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue({
      isClass1Demo: true,
      activity: { content: { audioKey: 'class-01/level-01/v1/listen-at.wav' } },
    })
    ;(S3Service.getAudio as jest.Mock).mockResolvedValue(Buffer.from('reviewed-audio'))

    const stream = await VoiceService.streamSynthesize('Listen to at.', {
      studentId: '64b000000000000000000001',
      activityId: '64b000000000000000000002',
      purpose: 'LESSON',
    })

    expect(CurriculumAccessService.assertActivity).toHaveBeenCalledWith(
      '64b000000000000000000001',
      '64b000000000000000000002',
    )
    expect(S3Service.getAudio).toHaveBeenCalledWith('class-01/level-01/v1/listen-at.wav')
    expect(stream.provider).toBe('ai4bharat-s3')
    expect(stream.contentType).toBe('audio/wav')
    expect(Buffer.from(await new Response(stream.body).arrayBuffer()).toString()).toBe('reviewed-audio')
  })
})

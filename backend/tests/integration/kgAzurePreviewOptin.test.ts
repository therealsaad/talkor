import request from 'supertest'
import { createApp } from '../../src/app'
import { signToken } from '../../src/utils/jwt'
import * as KGAzureNarration from '../../src/services/kg-azure-narration.service'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'

const app = createApp()
const staffToken = signToken({
  sub: '507f1f77bcf86cd799439011',
  schoolId: '507f1f77bcf86cd799439012',
  role: 'TEACHER',
})

afterEach(() => {
  jest.restoreAllMocks()
})

it('opt-in KG Level 2–5 fixed narration is staff-only, server-owned and never invokes live Azure', async () => {
  const previous = process.env.TALKORA_KG_FIXED_NARRATION_CACHE
  process.env.TALKORA_KG_FIXED_NARRATION_CACHE = 'true'
  try {
    const cache = jest.spyOn(KGAzureNarration, 'getKGAzureNarrationAudio')
      .mockResolvedValue({ audio: Buffer.concat([Buffer.from('ID3'), Buffer.alloc(380)]),
        contentType: 'audio/mpeg', source: 's3', storedInS3: true })
    const liveAzure = jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached')
    const cases = [
      { level: 2, id: 'letter-e', text: 'This is the letter E.' },
      { level: 3, id: 'letter-k', text: 'This is the letter K.' },
      { level: 4, id: 'letter-q', text: 'This is the letter Q.' },
      { level: 5, id: 'letter-w', text: 'This is the letter W.' },
    ]
    for (const item of cases) {
      const path = `/api/kg-level${item.level}-preview/narration/${item.id}`
      await request(app).get(path).expect(401)
      const res = await request(app).get(path + '?text=FORGED&studentId=FORGED')
        .set('Authorization', `Bearer ${staffToken}`).expect(200)
      expect(res.headers['x-talkora-cache']).toBe('S3')
      expect(res.headers['cache-control']).toBe('private, no-store')
      expect(res.headers['content-type']).toMatch(/audio\/mpeg/)
      expect(res.headers['x-content-type-options']).toBe('nosniff')
      expect(cache).toHaveBeenCalledWith({ level: item.level, id: item.id, text: item.text })
      await request(app).get(`/api/kg-level${item.level}-preview/narration/not-a-valid-id`)
        .set('Authorization', `Bearer ${staffToken}`).expect(404)
    }
    expect(cache).toHaveBeenCalledTimes(4)
    expect(liveAzure).not.toHaveBeenCalled()
  } finally {
    if (previous === undefined) delete process.env.TALKORA_KG_FIXED_NARRATION_CACHE
    else process.env.TALKORA_KG_FIXED_NARRATION_CACHE = previous
  }
})

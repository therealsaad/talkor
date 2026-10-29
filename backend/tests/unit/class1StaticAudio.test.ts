jest.mock('../../src/services/curriculum-access.service', () => ({
  CurriculumAccessService: { assertActivity: jest.fn() },
}))
jest.mock('../../src/services/S3Service', () => ({
  S3Service: { getAudio: jest.fn() },
}))
jest.mock('../../src/providers/voice/AzureVoiceProvider', () => ({
  AzureVoiceProvider: jest.fn().mockImplementation(() => ({
    synthesize: jest.fn().mockResolvedValue({
      audioBase64: Buffer.from('azure-fixed').toString('base64'),
      contentType: 'audio/mpeg',
      provider: 'azure-neerja',
    }),
    synthesizeStream: jest.fn().mockResolvedValue({
      body: new ReadableStream<Uint8Array>({
        start(controller) { controller.enqueue(Buffer.from('azure-dynamic')); controller.close() },
      }),
      contentType: 'audio/mpeg',
      provider: 'azure-neerja',
    }),
  })),
}))

import { CurriculumAccessService } from '../../src/services/curriculum-access.service'
import { S3Service } from '../../src/services/S3Service'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { VoiceService } from '../../src/services/voice.service'

const studentId = '64b000000000000000000001'
const activityId = '64b000000000000000000002'
const baseAccess = (audioKey: string) => ({
  isClass1Demo: true,
  activity: { content: { audioKey } },
})
const read = async (result: Awaited<ReturnType<typeof VoiceService.streamSynthesize>>) =>
  Buffer.from(await new Response(result.body).arrayBuffer()).toString()

describe('Class 1 immutable voice credits and narration safety', () => {
  const previous = process.env.TALKORA_CLASS1_STATIC_AUDIO_APPROVED

  beforeEach(() => {
    process.env.TALKORA_CLASS1_STATIC_AUDIO_APPROVED = 'true'
  })

  afterAll(() => {
    if (previous === undefined) delete process.env.TALKORA_CLASS1_STATIC_AUDIO_APPROVED
    else process.env.TALKORA_CLASS1_STATIC_AUDIO_APPROVED = previous
  })

  it('serves matching verified S3 audio, shared on repeat, without calling Azure', async () => {
    const key = 'class-01/level-01/v2/listen-at.wav'
    ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue(baseAccess(key))
    ;(S3Service.getAudio as jest.Mock).mockResolvedValue(Buffer.from('reviewed-at'))
    const args = { studentId, activityId, purpose: 'LESSON' as const }

    const first = await VoiceService.streamSynthesize('Listen carefully. Which word is at? At.', args)
    const again = await VoiceService.streamSynthesize('Listen carefully. Which word is at? At.', args)
    expect(await read(first)).toBe('reviewed-at')
    expect(await read(again)).toBe('reviewed-at')
    expect(first.provider).toBe('ai4bharat-s3')
    expect(S3Service.getAudio).toHaveBeenCalledTimes(1)
    expect(AzureVoiceProvider).not.toHaveBeenCalled()
  })

  it('does not play an unrelated S3 narration for a dynamic lesson sentence', async () => {
    const key = 'class-01/level-01/v2/listen-am.wav'
    ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue(baseAccess(key))
    const reply = await VoiceService.streamSynthesize('Hi Saad! You did well.', {
      studentId, activityId, purpose: 'LESSON',
    })
    expect(reply.provider).toBe('azure-neerja')
    expect(await read(reply)).toBe('azure-dynamic')
    expect(S3Service.getAudio).not.toHaveBeenCalled()
  })

  it('deduplicates fixed-line Azure fallback and never requires S3 before educator signoff', async () => {
    delete process.env.TALKORA_CLASS1_STATIC_AUDIO_APPROVED
    const key = 'class-01/level-01/v2/build-an.wav'
    ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue(baseAccess(key))
    const args = { studentId, activityId, purpose: 'LESSON' as const }
    const line = 'Let us build an. A, N, an.'
    const [one, two] = await Promise.all([
      VoiceService.streamSynthesize(line, args),
      VoiceService.streamSynthesize(line, args),
    ])
    expect(one.provider).toBe('azure-neerja')
    expect(two.provider).toBe('azure-neerja')
    expect(await read(one)).toBe('azure-fixed')
    expect(S3Service.getAudio).not.toHaveBeenCalled()
    const synthesizeCount = (AzureVoiceProvider as jest.Mock).mock.results
      .map((result) => result.value?.synthesize as jest.Mock | undefined)
      .filter(Boolean)
      .reduce((sum, method) => sum + (method?.mock.calls.length || 0), 0)
    expect(synthesizeCount).toBe(1)
  })
})

describe('First Day v3 strict source routing (no paid-call surprises)', () => {
  const studentId = '64b000000000000000000001'
  const activityId = '64b000000000000000000002'
  beforeEach(() => { process.env.TALKORA_CLASS1_STATIC_AUDIO_APPROVED = 'true' })
  it('uses a reviewed S3 Priya recording without an Azure request', async () => {
    const { CurriculumAccessService } = require('../../src/services/curriculum-access.service')
    const { S3Service } = require('../../src/services/S3Service')
    const { AzureVoiceProvider } = require('../../src/providers/voice/AzureVoiceProvider')
    const { VoiceService } = require('../../src/services/voice.service')
    const { default: manifest } = await import('../../src/scripts/class1-first-day-voice-v3.json')
    const first = manifest.lines.find((x: { language: string }) => x.language === 'en-IN')!
    ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue({
      isClass1Demo: true,
      activity: { activityKey: 'class1-l01-v3-hello-school', content: { audioKey: first.s3Key } },
    })
    ;(S3Service.getAudio as jest.Mock).mockResolvedValue(Buffer.from('approved-school-voice'))
    const result = await VoiceService.streamSynthesize(first.text, { studentId, activityId, purpose: 'LESSON' })
    expect(result.provider).toBe('ai4bharat-s3')
    expect(AzureVoiceProvider).not.toHaveBeenCalled()
  })
  it('requires Azure for a Marathi Qwen follow-up and never uses another speech vendor', async () => {
    const { CurriculumAccessService } = require('../../src/services/curriculum-access.service')
    const { S3Service } = require('../../src/services/S3Service')
    const { AzureVoiceProvider } = require('../../src/providers/voice/AzureVoiceProvider')
    const { VoiceService } = require('../../src/services/voice.service')
    ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue({
      isClass1Demo: true,
      activity: { activityKey: 'class1-l01-v3-jump-frog', content: { audioKey: 'class-01/level-01/v3/jump-frog-en.wav' } },
    })
    const reply = await VoiceService.streamSynthesize('आता इंग्रजीत म्हण: I can jump.', {
      studentId, activityId, purpose: 'CONVERSATION', language: 'mr-IN',
    })
    expect(reply.provider).toBe('azure-neerja')
    expect(S3Service.getAudio).not.toHaveBeenCalled()
    const instance = (AzureVoiceProvider as jest.Mock).mock.results.at(-1)?.value
    expect(instance.synthesizeStream).toHaveBeenCalledTimes(1)
    expect(instance.synthesizeStream).toHaveBeenCalledWith(
      'आता इंग्रजीत म्हण: I can jump.',
      expect.objectContaining({ class1Lesson: true, language: 'mr-IN' }),
    )
  })
})

import { z } from 'zod'

const supportedAudioMimeTypes = new Set([
  'audio/flac',
  'audio/m4a',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/opus',
  'audio/wav',
  'audio/wave',
  'audio/webm',
  'audio/x-m4a',
  'audio/x-wav',
])

export function isSupportedVoiceAudioMimeType(value: string): boolean {
  const mimeType = value.split(';', 1)[0]?.trim().toLowerCase() || ''
  return supportedAudioMimeTypes.has(mimeType)
}

export const startVoiceSessionSchema =
  z.object({
    body:
      z.object({
        lessonId:
          z.string().optional(),

        activityId:
          z.string().optional(),

        expectedPhrase:
          z.string()
            .trim()
            .min(1)
            .max(300)
            .optional(),
      })
      .strict(),
  })

export const submitVoiceTranscriptSchema =
  z.object({
    body:
      z.object({
        transcript:
          z.string()
            .trim()
            .min(1)
            .max(2000),

        inputMode:
          z.enum([
            'MIC',
            'TEXT',
            'OPTION',
          ])
          .optional()
          .default('MIC'),

        // Advisory Sarvam detection; never used as evidence of correctness.
        // Old clients may omit it. Other language values are rejected.
        detectedLanguage:
          z.enum(['en-IN', 'hi-IN', 'mr-IN'])
            .optional(),
      })
      .strict(),

    params:
      z.object({
        sessionId:
          z.string(),
      }),
  })

export const synthesizeVoiceSchema =
  z.object({
    body:
      z.object({
        text:
          z.string()
            .trim()
            .min(1)
            .max(2000),

        purpose:
          z.enum([
            'PAGE_GUIDANCE',
            'LESSON',
            'CONVERSATION',
            'FEEDBACK',
          ])
          .optional(),

        language:
          z.string()
            .trim()
            .min(2)
            .max(16)
            .optional(),

        activityId:
          z.string()
            .regex(/^[a-f0-9]{24}$/i)
            .optional(),
      })
      .strict(),
  })

export const transcribeVoiceSchema =
  z.object({
    body:
      z.object({
        audioBase64:
          z.string()
            .min(1)
            .max(8_000_000)
            .optional(),

        mimeType:
          z.string()
            .max(80)
            .optional()
            .refine((value) => value === undefined || isSupportedVoiceAudioMimeType(value), 'Unsupported audio type'),

        durationMs:
          z.coerce
            .number()
            .int()
            .min(250)
            .max(12_000)
            .optional(),

        mode:
          z.enum([
            'fast',
            'accurate',
          ])
          .optional(),
      }),
  })

import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is missing`)
  return value
}

export class S3Service {
  private static instance: S3Client | null = null

  private static client(): S3Client {
    if (!this.instance) {
      this.instance = new S3Client({
        region: required('AWS_REGION'),
        credentials: {
          accessKeyId: required('AWS_ACCESS_KEY_ID'),
          secretAccessKey: required('AWS_SECRET_ACCESS_KEY'),
        },
      })
    }
    return this.instance
  }

  private static bucket(): string {
    return required('AWS_S3_BUCKET')
  }

  static async putAudio(
    key: string,
    body: Buffer,
    contentType = 'audio/wav',
    metadata: Record<string, string> = {},
    ifNoneMatch?: '*',
  ): Promise<void> {
    await this.client().send(
      new PutObjectCommand({
        Bucket: this.bucket(),
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'private, max-age=31536000, immutable',
        ServerSideEncryption: 'AES256',
        Metadata: metadata,
        IfNoneMatch: ifNoneMatch,
      }),
    )
  }

  static async headAudio(key: string): Promise<{
    contentLength: number | null
    contentType: string | null
    cacheControl: string | null
    serverSideEncryption: string | null
    sha256: string | null
  } | null> {
    try {
      const result = await this.client().send(
        new HeadObjectCommand({ Bucket: this.bucket(), Key: key }),
      )
      return {
        contentLength: result.ContentLength ?? null,
        contentType: result.ContentType ?? null,
        cacheControl: result.CacheControl ?? null,
        serverSideEncryption: result.ServerSideEncryption ?? null,
        sha256: result.Metadata?.sha256 ?? null,
      }
    } catch (error: unknown) {
      const s3Error = error as { $metadata?: { httpStatusCode?: number }; name?: string; Code?: string }
      if (s3Error.$metadata?.httpStatusCode === 404 || s3Error.name === 'NoSuchKey' || s3Error.Code === 'NotFound') return null
      throw error
    }
  }

  static async getAudio(key: string): Promise<Buffer | null> {
    try {
      const result = await this.client().send(
        new GetObjectCommand({ Bucket: this.bucket(), Key: key }),
      )
      if (!result.Body) return null
      const bytes = await result.Body.transformToByteArray()
      return Buffer.from(bytes)
    } catch (error: any) {
      const status = error?.$metadata?.httpStatusCode
      const code = error?.name || error?.Code
      if (status === 404 || code === 'NoSuchKey' || code === 'NotFound') return null
      throw error
    }
  }
}

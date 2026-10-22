import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { auditKGPictureAssetDirectory, buildKGPictureAssetManifest, hasWebpSignature } from '../../src/curriculum/kg/picture-assets'

describe('KG picture asset manifest and audit', () => {
  it('covers every unique source visual and picture-choice option with stable WebP names', () => {
    const manifest = buildKGPictureAssetManifest()
    expect(manifest).toHaveLength(51)
    expect(new Set(manifest.map((item) => item.assetKey)).size).toBe(51)
    expect(manifest.every((item) => item.relativePath === `${item.assetKey}.webp` && item.publicPath === `/lessons/kg/pictures/${item.assetKey}.webp`)).toBe(true)
    expect(manifest.some((item) => item.assetKey === 'kg-g0-u1-apple')).toBe(true)
  })

  it('reports missing files and recognizes WebP signatures without modifying curriculum data', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'talkora-kg-assets-'))
    try {
      const manifest = buildKGPictureAssetManifest()
      const emptyAudit = await auditKGPictureAssetDirectory(directory, manifest)
      expect(emptyAudit.every((item) => item.status === 'MISSING')).toBe(true)

      const signature = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
      expect(hasWebpSignature(signature)).toBe(true)
      expect(hasWebpSignature(Buffer.from('not webp'))).toBe(false)
      await writeFile(path.join(directory, manifest[0].relativePath), signature)
      const audit = await auditKGPictureAssetDirectory(directory, manifest)
      expect(audit.filter((item) => item.status === 'READY')).toHaveLength(1)
      expect(audit.filter((item) => item.status === 'MISSING')).toHaveLength(50)
      expect(audit.filter((item) => item.status === 'INVALID')).toHaveLength(0)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})

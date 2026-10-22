import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type { KGCurriculumUnit } from '../types'
import { lessons } from './lessons'

export interface KGPictureAssetManifestItem {
  assetKey: string
  altText: string
  relativePath: string
  publicPath: string
}

export interface KGPictureAssetAuditItem extends KGPictureAssetManifestItem {
  status: 'READY' | 'MISSING' | 'INVALID'
}

export function buildKGPictureAssetManifest(units: readonly KGCurriculumUnit[] = lessons): KGPictureAssetManifestItem[] {
  const items = new Map<string, KGPictureAssetManifestItem>()
  const add = (assetKey: string, word: string) => {
    if (!/^kg-g0-u[1-8]-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(assetKey)) return
    if (!items.has(assetKey)) {
      items.set(assetKey, {
        assetKey,
        altText: `Child-friendly cartoon illustration of ${word.toLowerCase()}`,
        relativePath: `${assetKey}.webp`,
        publicPath: `/lessons/kg/pictures/${assetKey}.webp`,
      })
    }
  }

  for (const unit of units) {
    for (const asset of unit.visualAssets) {
      const word = unit.vocabulary.find((entry) => entry.assetKey === asset.assetKey)?.word || asset.altText.replace(/^Child-friendly picture of /, '')
      add(asset.assetKey, word)
    }
    for (const lesson of unit.lessons) {
      for (const activity of lesson.activities) {
        if (activity.type !== 'PICTURE_CHOICE') continue
        const content = activity.content || {}
        const targetAsset = content.pictureAsset as { assetKey?: unknown } | undefined
        if (typeof targetAsset?.assetKey === 'string') add(targetAsset.assetKey, activity.target || 'a KG vocabulary word')
        const optionAssets = content.pictureOptions as Array<{ word?: unknown; assetKey?: unknown }> | undefined
        for (const option of Array.isArray(optionAssets) ? optionAssets : []) {
          if (typeof option.assetKey === 'string') add(option.assetKey, typeof option.word === 'string' ? option.word : 'a KG vocabulary word')
        }
      }
    }
  }
  return [...items.values()].sort((left, right) => left.assetKey.localeCompare(right.assetKey))
}

export function hasWebpSignature(bytes: Uint8Array): boolean {
  return bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
}

export async function auditKGPictureAssetDirectory(
  assetDirectory: string,
  manifest: readonly KGPictureAssetManifestItem[] = buildKGPictureAssetManifest(),
): Promise<KGPictureAssetAuditItem[]> {
  return Promise.all(manifest.map(async (item) => {
    const filePath = path.join(assetDirectory, item.relativePath)
    try {
      const [info, bytes] = await Promise.all([stat(filePath), readFile(filePath)])
      return { ...item, status: info.isFile() && hasWebpSignature(bytes) ? 'READY' as const : 'INVALID' as const }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { ...item, status: 'MISSING' as const }
      throw error
    }
  }))
}

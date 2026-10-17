import path from 'node:path'
import { auditKGPictureAssetDirectory, buildKGPictureAssetManifest } from '../curriculum/kg/picture-assets'

async function main() {
  const assetDirectory = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), '../talkora-client/public/kg/pictures')
  const manifest = buildKGPictureAssetManifest()
  const audit = await auditKGPictureAssetDirectory(assetDirectory, manifest)
  const ready = audit.filter((item) => item.status === 'READY')
  const missing = audit.filter((item) => item.status === 'MISSING')
  const invalid = audit.filter((item) => item.status === 'INVALID')
  console.log(`KG picture asset directory: ${assetDirectory}`)
  console.log(`Required unique illustrations: ${manifest.length}`)
  console.log(`Verified WebP files: ${ready.length}`)
  console.log(`Missing files: ${missing.length}`)
  console.log(`Invalid WebP files: ${invalid.length}`)
  if (missing.length) console.log(`Missing asset keys: ${missing.map((item) => item.assetKey).join(', ')}`)
  if (invalid.length) console.log(`Invalid asset keys: ${invalid.map((item) => item.assetKey).join(', ')}`)
  if (process.argv.includes('--strict') && (missing.length || invalid.length)) process.exitCode = 1
}

void main().catch((error) => {
  console.error('KG asset audit failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})

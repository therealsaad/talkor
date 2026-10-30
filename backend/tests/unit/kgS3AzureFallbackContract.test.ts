import { readFileSync } from 'node:fs'
import path from 'node:path'

it('KG static S3 fallback only uses the approved server manifest, never arbitrary student audio', () => {
  const text=readFileSync(path.resolve(__dirname,'../../src/controllers/kg-alphabet.controller.ts'),'utf8')
  const staticSource=text.split('async function sendManifestAudio(')[1]?.split('function validatedAudioId(')[0]
  expect(staticSource).toBeTruthy()
  expect(staticSource).toContain('getApprovedStaticClip(id)')
  expect(staticSource).toContain("'KG_AUDIO_MISSING'")
  expect(staticSource).toContain("'KG_AUDIO_STORAGE_UNAVAILABLE'")
  expect(staticSource).not.toContain("'KG_AUDIO_STORAGE_ACCESS_DENIED'")
  expect(staticSource).toContain('synthesizeUncached(line.text)')
  expect(staticSource).toContain('hasExpectedAudioHeader')
  expect(staticSource).toContain("'private, no-store'")
  expect(staticSource).not.toContain('S3Service.putAudio')
})

import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { KGSpeechService } from '../services/kg-speech.service'
import { evaluateKGSpeech, type Letter } from '../kg/alphabet-content'

async function main() {
  const args = process.argv.slice(2)
  const option = (name: string) => args[args.indexOf(name) + 1]
  const path = args.includes('--audio') ? option('--audio') : undefined
  const letter = (args.includes('--letter') ? option('--letter') : '').toUpperCase() as Letter
  if (!path || !['A', 'B', 'C', 'D'].includes(letter)) throw new Error('Usage: npm run kg:speech:check -- --audio <short-test-clip> --letter A [--expect correct|incorrect|unclear]')
  const mimeTypes: Record<string, string> = { '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'audio/mp4', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.webm': 'audio/webm' }
  const mimeType = mimeTypes[extname(path).toLowerCase()]
  const bytes = await readFile(resolve(path))
  if (!mimeType || !bytes.length || bytes.length > 8_000_000) throw new Error('Use a non-empty short audio fixture under 8 MB in a supported format')
  const result = await KGSpeechService.transcribe({ audioBase64: bytes.toString('base64'), mimeType, durationMs: 4000 })
  if (!result.available) throw new Error('STT provider is unavailable')
  const confidence = 'confidence' in result ? result.confidence : undefined
  const uncertain = ('uncertain' in result && result.uncertain === true) ||
    (confidence !== undefined && (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0.5 || confidence > 1))
  const outcome = uncertain ? 'unclear' : evaluateKGSpeech(result.transcript || '', letter, 'word')
  console.log(JSON.stringify({ provider: result.provider, transcript: result.transcript, outcome, qualityUncertain: uncertain, databaseWrites: false, audioStored: false }, null, 2))
  if (args.includes('--expect') && option('--expect') !== outcome) process.exitCode = 1
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'KG speech check failed'); process.exitCode = 1 })

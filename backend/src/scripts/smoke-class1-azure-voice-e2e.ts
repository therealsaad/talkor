/**
 * Supervised Class 1 voice acceptance test: --check (free HTTP only),
 * --live (exactly one Azure STT + TTS), --live --commit (also one Qwen turn).
 * PowerShell examples are in docs/class1-azure-voice-e2e.md.
 * Never print student PIN, transcript, tokens, or record audio to outputs.
 */
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

type Envelope<T> = { success: boolean; data: T }
const apiUrl = (process.env.TALKORA_E2E_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '')
const pythonUrl = (process.env.TALKORA_E2E_PYTHON_URL || 'http://127.0.0.1:8002').replace(/\/$/, '')
const args = new Set(process.argv.slice(2))
const live = args.has('--live')
const commit = args.has('--commit')
const mimeByExtension: Record<string, string> = {
  '.webm': 'audio/webm', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/x-m4a', '.mp4': 'audio/mp4',
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(25_000) })
  if (!response.ok) {
    // Upstream errors may contain pupil speech or credentials: don't log bodies.
    throw new Error(new URL(url).pathname + ' returned HTTP ' + response.status)
  }
  return response.json() as Promise<T>
}

async function api<T>(route: string, token: string, init: RequestInit = {}): Promise<T> {
  const envelope = await request<Envelope<T>>(apiUrl + '/api' + route, {
    ...init,
    headers: { Authorization: 'Bearer ' + token, ...(init.headers || {}) },
  })
  if (!envelope.success) throw new Error(route + ' returned unsuccessful response')
  return envelope.data
}

async function main() {
  if (commit && !live) throw new Error('--commit requires --live')
  console.log('Class 1 E2E: connectivity check (zero Azure speech calls)')
  const backend = await request<{ status: string }>(apiUrl + '/health')
  await request<{ status?: string }>(pythonUrl + '/health')
  if (backend.status !== 'ok') throw new Error('Node backend unhealthy')
  console.log('PASS: Node and Python HTTP health endpoints are reachable')
  console.log('NOTE: Health does not prove service-key authentication.')

  if (!live) {
    console.log('No Azure calls or progress writes. Use --live for one STT+TTS pair.')
    return
  }
  if (process.env.TALKORA_E2E_ALLOW_AZURE_CHARGES !== 'YES') {
    throw new Error('Set TALKORA_E2E_ALLOW_AZURE_CHARGES=YES before --live')
  }
  if (commit && process.env.TALKORA_E2E_ALLOW_PROGRESS_WRITE !== 'YES') {
    throw new Error('Set TALKORA_E2E_ALLOW_PROGRESS_WRITE=YES before --commit')
  }
  const pin = process.env.TALKORA_E2E_STUDENT_PIN || ''
  const file = process.env.TALKORA_E2E_AUDIO_FILE || ''
  if (!/^\d{5}$/.test(pin)) throw new Error('Provide a demo PIN in TALKORA_E2E_STUDENT_PIN')
  if (!file) throw new Error('Provide a consented short audio file in TALKORA_E2E_AUDIO_FILE')
  const mimeType = mimeByExtension[path.extname(file).toLowerCase()]
  if (!mimeType) throw new Error('Audio must be .webm, .wav, .ogg, .mp3, .m4a or .mp4')
  const metadata = await stat(file)
  if (metadata.size < 1024 || metadata.size > 2 * 1024 * 1024) {
    throw new Error('Use a short non-empty audio file under 2 MiB')
  }

  const login = await request<Envelope<{ token: string; student: { grade: number } }>>(
    apiUrl + '/api/auth/student/pin-login',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) },
  )
  if (!login.success || !login.data?.token || login.data.student.grade !== 1) {
    throw new Error('Authenticated demo student must be in Class 1')
  }
  const token = login.data.token
  const next = await api<{ grade: number; activityId: string | null; lessonId: string | null; complete: boolean }>(
    '/students/me/next-lesson', token,
  )
  if (next.grade !== 1 || next.complete || !next.activityId || !next.lessonId) {
    throw new Error('No accessible Class 1 lesson. Check demo flags and student progress.')
  }
  console.log('PASS: 5-digit PIN authenticated; Class 1 next lesson resolved')

  // Exactly one audio upload, no silent automatic retries that drain credits.
  const upload = new FormData()
  upload.append('audio', new Blob([await readFile(file)], { type: mimeType }), path.basename(file))
  upload.append('mode', 'fast')
  const recognized = await api<{ transcript: string | null; provider?: string }>(
    '/voice/transcribe', token, { method: 'POST', body: upload },
  )
  if (!recognized.transcript?.trim()) throw new Error('Azure returned no speech; stop rather than retry')
  if (!recognized.provider?.includes('azure')) {
    throw new Error('Expected Azure STT: set SPEECH_PROVIDER=azure in backend/.env')
  }
  console.log('PASS: Azure STT recognized an utterance (transcript hidden)')

  let teacherLine = 'Let us learn English together.'
  if (commit) {
    const lesson = await api<{ activities: Array<{ id: string; type: string; aiEnabled?: boolean }> }>(
      '/students/me/lessons/' + next.lessonId, token,
    )
    const current = lesson.activities.find((item) => item.id === next.activityId)
    if (!current?.aiEnabled || current.type !== 'CONVERSATION') {
      throw new Error('Next activity must be an AI CONVERSATION; finish earlier activities first.')
    }
    const session = await api<{ _id: string }>('/voice/sessions', token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: next.lessonId, activityId: next.activityId }),
    })
    const completed = await api<{ status: string; aiResponse?: { message?: string } }>(
      '/voice/sessions/' + session._id + '/transcript', token, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: recognized.transcript, inputMode: 'MIC' }),
      },
    )
    if (completed.status !== 'completed' || !completed.aiResponse?.message) {
      throw new Error('Voice session did not return a Class 1 teacher reply')
    }
    teacherLine = completed.aiResponse.message.slice(0, 180)
    await api('/students/me/progress', token)
    console.log('PASS: Node voice session -> Python/Qwen -> MongoDB progress readable')
    console.log('NOTE: One turn may not complete the activity; progress requires pedagogy thresholds.')
  }

  const audioResponse = await fetch(apiUrl + '/api/voice/synthesize', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: teacherLine, purpose: 'CONVERSATION' }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!audioResponse.ok || !(audioResponse.headers.get('content-type') || '').startsWith('audio/')) {
    throw new Error('Azure TTS failed (HTTP ' + audioResponse.status + ')')
  }
  const bytes = (await audioResponse.arrayBuffer()).byteLength
  if (bytes < 256) throw new Error('TTS returned too little audio')
  if (!(audioResponse.headers.get('x-voice-provider') || '').includes('azure')) {
    throw new Error('Expected Azure TTS; check provider configuration/fallback')
  }
  console.log('PASS: Azure TTS received (' + bytes + ' bytes); no student audio/text logged')
  console.log('RESULT: one STT + one TTS request. Supervised browser listening still required.')
}

main().catch((error: unknown) => {
  console.error('CLASS1_VOICE_E2E_FAILED:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

function read(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

const auth = read('../../components/auth/auth-provider.tsx')
const school = read('../../app/school/layout.tsx')
const student = read('../../app/student/layout.tsx')
const shell = read('../../components/school/school-shell.tsx')

test('first auth render is identical on server and client', () => {
  const component = auth.split('export function AuthProvider({ children }')[1]
  assert.ok(component, 'AuthProvider must exist')
  const beforeEffect = component.split('  useEffect(() => {')[0]
  // Check the initializer expressions, not comments documenting browser
  // storage. The mismatch occurs only if storage is read during render.
  const initializers = beforeEffect.split('\n').filter(line =>
    line.includes('useState<AuthStatus>') ||
    line.includes('useState<AuthSession | null>'),
  ).join('\n')
  assert.match(initializers, /useState<AuthStatus>\('loading'\)/)
  assert.match(initializers, /useState<AuthSession \| null>\(null\)/)
  assert.doesNotMatch(initializers, /typeof window|getStoredToken\(|getStoredUser\(|localStorage|sessionStorage/)
  assert.doesNotMatch(auth, /suppressHydrationWarning/)
})

test('after hydration, cached sessions are restored then validated via backend', () => {
  const effect = auth.split('  useEffect(() => {')[1].split('    const invalidate')[0]
  assert.match(effect, /getStoredToken\(\) \? getStoredUser<AuthSession>\(\) : null/)
  assert.match(effect, /sessionRef\.current = cached/)
  assert.match(effect, /setSession\(cached\)/)
  assert.match(effect, /setStatus\('authenticated'\)/)
  assert.match(effect, /void restore\(\)/)
  assert.ok(effect.indexOf("setStatus('authenticated')") < effect.indexOf('void restore()'))
  assert.match(auth, /await authService\.getMe\(\)/)
  assert.match(auth, /clearSession\(\)/)
})

test('role-gated educator and student layouts remain protected', () => {
  assert.match(school, /status !== 'authenticated' \|\| !isEducator \|\| teacherOnAdminOnlyRoute/)
  assert.match(school, /role === 'SCHOOL_ADMIN' \|\| role === 'TEACHER'/)
  assert.match(student, /status !== 'authenticated' \|\| role !== 'STUDENT' \|\| !student/)
  assert.match(shell, /const \{ session, logout \} = useAuth\(\)/)
  assert.doesNotMatch(shell, /suppressHydrationWarning/)
})

test('the hydration change never persists shared-computer PIN sessions', () => {
  const service = read('../../services/auth-service.ts')
  const api = read('../../lib/api-client.ts')
  assert.match(service, /async loginStudentByPin\(pin: string\)/)
  assert.match(service, /setStoredToken\(data\.token, true\)/)
  assert.match(api, /const storage = labSession \? window\.sessionStorage : window\.localStorage/)
  assert.match(api, /window\.sessionStorage\.getItem\(TOKEN_KEY\)/)
  assert.match(api, /window\.localStorage\.removeItem\(TOKEN_KEY\)/)
  assert.match(auth, /const MAX_IDLE_MS = 20 \* 60 \* 1000/)
  assert.match(auth, /window\.location\.replace\('\/login\/student'\)/)
})

test('auth restore keeps the existing unauthenticated and outage behavior', () => {
  const service = read('../../services/auth-service.ts')
  assert.match(service, /if \(!token\) \{\s*clearStoredToken\(\)\s*return null/)
  assert.match(auth, /if \(!next\) \{\s*clearSession\(\)/)
  assert.match(auth, /if \(hadSession\) \{\s*setStatus\('authenticated'\)/)
  assert.match(service, /error\.status === 401/)
})


function authClientHarness() {
  const apiSource = read('../../lib/api-client.ts')
  const compiled = ts.transpileModule(apiSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const session = new Map([['talkora_token', 'student-A']])
  const persisted = new Map()
  const storage = (values) => ({
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, String(value)),
    removeItem: (name) => values.delete(name),
  })
  const requests = []
  const invalidations = []
  const browser = {
    sessionStorage: storage(session),
    localStorage: storage(persisted),
    dispatchEvent: (event) => invalidations.push(event.type),
  }
  const exports = {}
  vm.runInNewContext(compiled, {
    exports,
    module: { exports },
    process: { env: { NEXT_PUBLIC_API_URL: 'http://localhost:5000/api' } },
    window: browser,
    Event: class { constructor(type) { this.type = type } },
    fetch: (url, options) => new Promise((resolve) => requests.push({ url, options, resolve })),
    Headers,
    Blob,
    console,
  }, { filename: 'api-client.cjs' })
  return {
    api: exports,
    requests,
    invalidations,
    setToken: (token) => {
      if (token === null) session.delete('talkora_token')
      else session.set('talkora_token', token)
    },
    token: () => browser.sessionStorage.getItem('talkora_token'),
  }
}

function expiredResponse() {
  return {
    ok: false, status: 401,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Session expired' } }),
    text: async () => '',
  }
}

test('late API 401 from student A never signs out student B', async () => {
  const h = authClientHarness()
  const old = h.api.apiClient('/kg-alphabet/state')
  assert.match(h.requests[0].options.headers.Authorization, /student-A/)
  h.setToken('student-B')
  h.requests[0].resolve(expiredResponse())
  await assert.rejects(old, /Session expired/)
  assert.equal(h.token(), 'student-B')
  assert.deepEqual(h.invalidations, [])
})

test('the current login still signs out on a real API 401', async () => {
  const h = authClientHarness()
  const current = h.api.apiClient('/kg-alphabet/state')
  h.requests[0].resolve(expiredResponse())
  await assert.rejects(current, /Session expired/)
  assert.equal(h.token(), null)
  assert.deepEqual(h.invalidations, ['talkora:auth-invalidated'])
})

test('a pre-login anonymous 401 never invalidates a newly authenticated student', async () => {
  const h = authClientHarness()
  h.setToken(null)
  const anonymous = h.api.apiClient('/auth/me')
  h.setToken('student-B')
  h.requests[0].resolve(expiredResponse())
  await assert.rejects(anonymous, /Session expired/)
  assert.equal(h.token(), 'student-B')
  assert.deepEqual(h.invalidations, [])
})

test('late binary audio 401 cannot invalidate a different student session', async () => {
  const h = authClientHarness()
  const old = h.api.apiClientBlob('/kg-alphabet/audio/v1/say-a')
  h.setToken('student-B')
  h.requests[0].resolve(expiredResponse())
  await assert.rejects(old, /Session expired/)
  assert.equal(h.token(), 'student-B')
  assert.deepEqual(h.invalidations, [])
})

test('other direct-fetch callers bind unauthorized responses to the initiating token', () => {
  assert.match(read('../../services/school-service.ts'), /handleUnauthorizedResponse\(response\.status, token\)/)
  assert.match(read('../../components/school/report-csv-download.tsx'), /handleUnauthorizedResponse\(response\.status, token\)/)
  const kgLesson = read('../../features/lessons/grades/kg/level-01/LevelExperience.tsx')
  assert.match(kgLesson, /if \(getStoredToken\(\) !== sessionToken\) return/)
  assert.match(kgLesson, /handleUnauthorizedResponse\(401, sessionToken\)/)
})

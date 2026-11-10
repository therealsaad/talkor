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

// Execute the real service and provider callbacks with deferred requests. These
// races are not covered by the lower-level apiClient 401 ownership tests above.
function restoreHarness() {
  let token = 'student-A'
  let user = null
  const requests = []
  const writes = []
  const values = ['loading', null]
  const effects = []
  class ApiError extends Error { constructor(status) { super('Expired'); this.status = status } }
  const api = {
    ApiError,
    getStoredToken: () => token,
    getStoredUser: () => user,
    clearStoredToken: () => { token = null; user = null; writes.push('clear') },
    setStoredToken: next => { token = next },
    setStoredUser: next => { user = next; writes.push(next.token) },
    apiClient: path => new Promise((resolve, reject) => requests.push({ path, token, resolve, reject })),
  }
  function evaluate(source, imports) {
    const exports = {}
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText, { exports, module: { exports }, require: id => {
      if (!(id in imports)) throw Error('Unexpected import ' + id)
      return imports[id]
    }, AbortSignal, window: { dispatchEvent() {} }, Event, console })
    return exports
  }
  const { authService: service } = evaluate(read('../../services/auth-service.ts'), { '@/lib/api-client': api })
  let slot = 0
  const react = {
    createContext: () => ({ Provider: 'provider' }), useCallback: f => f,
    useMemo: f => f(), useRef: value => ({ current: value }),
    useState: initial => { const index = slot++; return [initial, next => { values[index] = next }] },
    useEffect: f => effects.push(f),
  }
  const { AuthProvider } = evaluate(auth, {
    react, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    '@/lib/api-client': api, '@/lib/kg-microphone': { KG_SESSION_END_EVENT: 'session-end' },
    '@/services/auth-service': { authService: service }, '@/services/voice-service': { voiceService: { stop() {} } },
  })
  const provider = AuthProvider({ children: null }).props.value
  const session = id => ({ role: 'STUDENT', token: id,
    student: { id, fullName: 'Synthetic learner', grade: 0 }, school: { id: 'school', name: 'Fixture' } })
  const response = id => ({ role: 'STUDENT', student: session(id).student, school: session(id).school })
  return { service, provider, requests, writes, values, ApiError, response, session,
    token: () => token, user: () => user, setToken: next => { token = next } }
}

test('auth restore shares concurrent reads only for the current token and always reads fresh after settling', async () => {
  const h = restoreHarness()
  const a = h.service.getMe()
  assert.strictEqual(a, h.service.getMe())
  h.setToken('student-B')
  const b = h.service.getMe()
  assert.equal(h.requests.length, 2)
  h.requests[0].resolve(h.response('student-A'))
  await assert.rejects(a, /previous login/)
  assert.strictEqual(b, h.service.getMe(), 'old cleanup cannot erase B in-flight')
  h.requests[1].resolve(h.response('student-B'))
  assert.equal((await b).student.id, 'student-B')
  assert.deepEqual(h.writes, ['student-B'])
  const fresh = h.service.getMe()
  assert.equal(h.requests.length, 3)
  h.requests[2].resolve(h.response('student-B'))
  await fresh
})

for (const result of ['success', '401', 'network']) {
  test(`late restore ${result} cannot mutate B credentials or React auth state`, async () => {
    const h = restoreHarness()
    const old = h.provider.restore()
    const login = h.provider.loginStudentByPin('00000')
    h.requests[1].resolve({ ...h.response('student-B'), token: 'student-B' })
    await login
    if (result === 'success') h.requests[0].resolve(h.response('student-A'))
    else h.requests[0].reject(result === '401' ? new h.ApiError(401) : Error('Offline'))
    await old
    assert.equal(h.token(), 'student-B')
    assert.equal(h.user().student.id, 'student-B')
    assert.equal(h.values[0], 'authenticated')
    assert.equal(h.values[1].student.id, 'student-B')
    assert.deepEqual(h.writes, ['student-B'])
  })
}

test('same-session restore 401 still clears login; a network failure can be retried', async () => {
  const h = restoreHarness()
  const failed = h.service.getMe()
  h.requests[0].reject(Error('Offline'))
  await assert.rejects(failed, /Offline/)
  assert.equal(h.token(), 'student-A')
  const retry = h.service.getMe()
  h.requests[1].reject(new h.ApiError(401))
  assert.equal(await retry, null)
  assert.equal(h.token(), null)
})

test('restore handles a current 401 already cleared by apiClient', async () => {
  const h = restoreHarness()
  const current = h.provider.restore()
  h.setToken(null)
  h.requests[0].reject(new h.ApiError(401))
  assert.equal(await current, null)
  assert.equal(h.values[0], 'unauthenticated')
})

test('delayed logout cannot clear the next student credentials or React session', async () => {
  const h = restoreHarness()
  const old = h.provider.logout()
  const login = h.provider.loginStudentByPin('00000')
  h.requests[1].resolve({ ...h.response('student-B'), token: 'student-B' })
  await login
  h.requests[0].resolve({})
  await old
  assert.equal(h.token(), 'student-B')
  assert.equal(h.values[0], 'authenticated')
  assert.equal(h.values[1].student.id, 'student-B')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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
